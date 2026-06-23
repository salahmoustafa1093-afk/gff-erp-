import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { ApproveReturnDto } from './dto/approve-return.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SalesReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generateReturnNumber(branchId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const key = `SR-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `SR-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  async create(dto: CreateSalesReturnDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.salesOrder.findUnique({
        where: { id: dto.salesOrderId },
        include: {
          items: true,
          customer: { select: { id: true, name: true, balance: true } },
        },
      });
      if (!order) throw new NotFoundException('Sales order not found');

      // Validate items against original order
      for (const returnItem of dto.items) {
        const orderItem = order.items.find(i => i.id === returnItem.salesOrderItemId);
        if (!orderItem) {
          throw new BadRequestException(`Item ${returnItem.salesOrderItemId} not found in order`);
        }

        // Check already returned quantity
        const returnedAgg = await tx.salesReturnItem.aggregate({
          where: { salesOrderItemId: returnItem.salesOrderItemId, return: { status: { not: 'REJECTED' } } },
          _sum: { quantity: true },
        });
        const alreadyReturned = Number(returnedAgg._sum.quantity || 0);

        if (alreadyReturned + returnItem.quantity > Number(orderItem.quantity)) {
          throw new BadRequestException(
            `Cannot return ${returnItem.quantity} of item ${orderItem.productId}. Already returned: ${alreadyReturned}, Original qty: ${orderItem.quantity}`,
          );
        }
      }

      const returnNumber = await this.generateReturnNumber(dto.branchId);

      // Calculate totals
      let totalRefund = 0;
      const processedItems = [];
      for (const item of dto.items) {
        const orderItem = order.items.find(i => i.id === item.salesOrderItemId);
        const refundPrice = item.refundPrice || Number(orderItem?.unitPrice || 0);
        const lineRefund = item.quantity * refundPrice;
        totalRefund += lineRefund;

        processedItems.push({
          salesOrderItemId: item.salesOrderItemId,
          productId: item.productId,
          quantity: item.quantity,
          refundPrice,
          lineTotal: lineRefund,
          reason: item.reason,
          condition: item.condition || 'GOOD',
        });
      }

      const salesReturn = await tx.salesReturn.create({
        data: {
          returnNumber,
          salesOrderId: dto.salesOrderId,
          salesInvoiceId: dto.salesInvoiceId,
          customerId: order.customerId,
          branchId: dto.branchId,
          warehouseId: dto.warehouseId,
          returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
          totalRefundAmount: totalRefund,
          status: 'DRAFT',
          refundMethod: dto.refundMethod || 'CREDIT_NOTE',
          reason: dto.reason,
          notes: dto.notes,
          items: { create: processedItems },
          createdById: userId,
        },
        include: {
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          customer: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
        },
      });

      await this.audit.log({
        action: 'SALES_RETURN.CREATE',
        userId,
        entityId: salesReturn.id,
        entityType: 'SalesReturn',
        details: { returnNumber, totalRefund, salesOrderId: dto.salesOrderId },
      });

      return salesReturn;
    });
  }

  async findAll(filter: any) {
    const where: Prisma.SalesReturnWhereInput = {};

    if (filter.search) {
      where.OR = [
        { returnNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.status) where.status = filter.status;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.salesOrderId) where.salesOrderId = filter.salesOrderId;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.salesReturn.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        },
      }),
      this.prisma.salesReturn.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const ret = await this.prisma.salesReturn.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, customerCode: true } },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
        salesInvoice: { select: { id: true, invoiceNumber: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
            salesOrderItem: true,
          },
        },
        approvedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!ret) throw new NotFoundException(`Sales return '${id}' not found`);
    return ret;
  }

  async approve(id: string, dto: ApproveReturnDto, userId: string) {
    const ret = await this.findOne(id);
    if (ret.status !== 'DRAFT') {
      throw new BadRequestException(`Return must be in DRAFT status to approve. Current: ${ret.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.action === 'REJECT') {
        const updated = await tx.salesReturn.update({
          where: { id },
          data: {
            status: 'REJECTED',
            approvedById: userId,
            approvedAt: new Date(),
            approvalNotes: dto.reason,
          },
        });

        await this.audit.log({
          action: 'SALES_RETURN.REJECTED',
          userId,
          entityId: id,
          entityType: 'SalesReturn',
          details: { reason: dto.reason },
        });

        return updated;
      }

      // Apply restocking fee
      let restockingFee = 0;
      if (dto.restockingFeePercent && dto.restockingFeePercent > 0) {
        restockingFee = Number(ret.totalRefundAmount) * (dto.restockingFeePercent / 100);
      }
      const netRefund = Number(ret.totalRefundAmount) - restockingFee;

      const updated = await tx.salesReturn.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
          approvalNotes: dto.reason,
          restockingFee,
          netRefundAmount: netRefund,
        },
      });

      await this.audit.log({
        action: 'SALES_RETURN.APPROVED',
        userId,
        entityId: id,
        entityType: 'SalesReturn',
        details: { netRefund, restockingFee },
      });

      return updated;
    });
  }

  async receiveGoods(id: string, userId: string) {
    const ret = await this.findOne(id);
    if (ret.status !== 'APPROVED') {
      throw new BadRequestException(`Return must be APPROVED before receiving goods. Current: ${ret.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of ret.items) {
        const warehouseId = ret.warehouseId;
        if (warehouseId) {
          // Add inventory back
          await tx.warehouseInventory.updateMany({
            where: { warehouseId, productId: item.productId },
            data: { quantity: { increment: Number(item.quantity) } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              warehouseId,
              type: 'RETURN_IN',
              quantity: Number(item.quantity),
              referenceId: ret.id,
              referenceType: 'SALES_RETURN',
              notes: `Return ${ret.returnNumber} - goods received`,
              createdById: userId,
            },
          });

          // If good condition, create new batch entry
          if (item.condition === 'GOOD') {
            const orderItem = await tx.salesOrderItem.findUnique({
              where: { id: item.salesOrderItemId },
            });
            await tx.inventoryBatch.create({
              data: {
                productId: item.productId,
                warehouseId,
                quantity: Number(item.quantity),
                remainingQty: Number(item.quantity),
                unitCost: orderItem?.cogsAmount
                  ? Number(orderItem.cogsAmount) / Number(orderItem.quantity)
                  : 0,
                reference: ret.returnNumber,
                receivedDate: new Date(),
              },
            });
          }
        }
      }

      const updated = await tx.salesReturn.update({
        where: { id },
        data: {
          status: 'RECEIVED',
          receivedAt: new Date(),
          receivedById: userId,
        },
      });

      await this.audit.log({
        action: 'SALES_RETURN.RECEIVED',
        userId,
        entityId: id,
        entityType: 'SalesReturn',
      });

      return updated;
    });
  }

  async processRefund(id: string, userId: string) {
    const ret = await this.findOne(id);
    if (ret.status !== 'RECEIVED' && ret.status !== 'APPROVED') {
      throw new BadRequestException(`Return must be RECEIVED or APPROVED for refund. Current: ${ret.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const netRefund = Number(ret.netRefundAmount || ret.totalRefundAmount);

      if (ret.refundMethod === 'CREDIT_NOTE') {
        // Create credit note / reduce AR
        await tx.customer.update({
          where: { id: ret.customerId },
          data: { balance: { decrement: netRefund } },
        });

        // Create AR credit journal entry
        await tx.generalLedgerEntry.create({
          data: {
            date: new Date(),
            reference: ret.returnNumber,
            description: `Sales Return Credit Note - ${ret.returnNumber}`,
            branchId: ret.branchId,
            entries: {
              create: [
                {
                  accountId: await this.getAccountId(tx, 'SALES_REVENUE'),
                  debit: netRefund,
                  credit: 0,
                  description: `Reversal for return ${ret.returnNumber}`,
                },
                {
                  accountId: await this.getAccountId(tx, 'ACCOUNTS_RECEIVABLE'),
                  debit: 0,
                  credit: netRefund,
                  description: `AR Credit - ${ret.returnNumber}`,
                },
              ],
            },
            createdById: userId,
          },
        });
      } else if (ret.refundMethod === 'CASH_REFUND') {
        // Cash refund
        await tx.generalLedgerEntry.create({
          data: {
            date: new Date(),
            reference: ret.returnNumber,
            description: `Cash Refund - ${ret.returnNumber}`,
            branchId: ret.branchId,
            entries: {
              create: [
                {
                  accountId: await this.getAccountId(tx, 'SALES_REVENUE'),
                  debit: netRefund,
                  credit: 0,
                  description: `Reversal for return ${ret.returnNumber}`,
                },
                {
                  accountId: await this.getAccountId(tx, 'CASH'),
                  debit: 0,
                  credit: netRefund,
                  description: `Cash refund - ${ret.returnNumber}`,
                },
              ],
            },
            createdById: userId,
          },
        });
      }

      // REPLICATE: also reverse COGS
      for (const item of ret.items) {
        const orderItem = await tx.salesOrderItem.findUnique({
          where: { id: item.salesOrderItemId },
        });
        const cogsToReverse = orderItem?.cogsAmount
          ? (Number(orderItem.cogsAmount) / Number(orderItem.quantity)) * Number(item.quantity)
          : 0;

        if (cogsToReverse > 0) {
          await tx.generalLedgerEntry.create({
            data: {
              date: new Date(),
              reference: ret.returnNumber,
              description: `COGS Reversal - ${ret.returnNumber}`,
              branchId: ret.branchId,
              entries: {
                create: [
                  {
                    accountId: await this.getAccountId(tx, 'INVENTORY'),
                    debit: cogsToReverse,
                    credit: 0,
                    description: `COGS reversal for return`,
                  },
                  {
                    accountId: await this.getAccountId(tx, 'COST_OF_GOODS_SOLD'),
                    debit: 0,
                    credit: cogsToReverse,
                    description: `COGS reversal for return`,
                  },
                ],
              },
              createdById: userId,
            },
          });
        }
      }

      const updated = await tx.salesReturn.update({
        where: { id },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      await this.audit.log({
        action: 'SALES_RETURN.REFUNDED',
        userId,
        entityId: id,
        entityType: 'SalesReturn',
        details: { refundAmount: netRefund, method: ret.refundMethod },
      });

      return updated;
    });
  }

  private async getAccountId(tx: Prisma.TransactionClient, accountType: string): Promise<string> {
    const account = await tx.account.findFirst({
      where: { type: accountType, isSystem: true },
      select: { id: true },
    });
    if (!account) throw new NotFoundException(`System account '${accountType}' not found`);
    return account.id;
  }
}
