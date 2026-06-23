import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PurchaseReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generateReturnNumber(branchId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const key = `PR-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `PR-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  async create(dto: CreatePurchaseReturnDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: {
          items: true,
          supplier: { select: { id: true, name: true, balance: true } },
        },
      });
      if (!order) throw new NotFoundException('Purchase order not found');

      // Validate items
      for (const returnItem of dto.items) {
        const orderItem = order.items.find(i => i.id === returnItem.purchaseOrderItemId);
        if (!orderItem) {
          throw new BadRequestException(`Item ${returnItem.purchaseOrderItemId} not found in order`);
        }

        const returnedAgg = await tx.purchaseReturnItem.aggregate({
          where: {
            purchaseOrderItemId: returnItem.purchaseOrderItemId,
            return: { status: { not: 'REJECTED' } },
          },
          _sum: { quantity: true },
        });
        const alreadyReturned = Number(returnedAgg._sum.quantity || 0);

        if (alreadyReturned + returnItem.quantity > Number(orderItem.receivedQty || 0)) {
          throw new BadRequestException(
            `Cannot return ${returnItem.quantity}. Already returned: ${alreadyReturned}, Received: ${orderItem.receivedQty}`,
          );
        }
      }

      const returnNumber = await this.generateReturnNumber(dto.branchId);

      let totalCredit = 0;
      const processedItems = [];
      for (const item of dto.items) {
        const orderItem = order.items.find(i => i.id === item.purchaseOrderItemId);
        const creditCost = item.creditCost || Number(orderItem?.unitCost || 0);
        const lineCredit = item.quantity * creditCost;
        totalCredit += lineCredit;

        processedItems.push({
          purchaseOrderItemId: item.purchaseOrderItemId,
          productId: item.productId,
          quantity: item.quantity,
          creditCost,
          lineTotal: lineCredit,
          reason: item.reason,
        });
      }

      const purchaseReturn = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          purchaseOrderId: dto.purchaseOrderId,
          purchaseInvoiceId: dto.purchaseInvoiceId,
          supplierId: dto.supplierId || order.supplierId,
          branchId: dto.branchId,
          warehouseId: dto.warehouseId,
          returnDate: dto.returnDate ? new Date(dto.returnDate) : new Date(),
          totalCreditAmount: totalCredit,
          status: 'DRAFT',
          refundMethod: dto.refundMethod || 'AP_CREDIT',
          reason: dto.reason,
          notes: dto.notes,
          items: { create: processedItems },
          createdById: userId,
        },
        include: {
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          supplier: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, orderNumber: true } },
        },
      });

      await this.audit.log({
        action: 'PURCHASE_RETURN.CREATE',
        userId,
        entityId: purchaseReturn.id,
        entityType: 'PurchaseReturn',
        details: { returnNumber, totalCredit, purchaseOrderId: dto.purchaseOrderId },
      });

      return purchaseReturn;
    });
  }

  async findAll(filter: any) {
    const where: Prisma.PurchaseReturnWhereInput = {};
    if (filter.status) where.status = filter.status;
    if (filter.supplierId) where.supplierId = filter.supplierId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.purchaseOrderId) where.purchaseOrderId = filter.purchaseOrderId;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.purchaseReturn.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          supplier: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, orderNumber: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        },
      }),
      this.prisma.purchaseReturn.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const ret = await this.prisma.purchaseReturn.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true } },
        purchaseOrder: { select: { id: true, orderNumber: true } },
        items: {
          include: {
            product: { select: { id: true, sku: true, name: true } },
            purchaseOrderItem: true,
          },
        },
      },
    });

    if (!ret) throw new NotFoundException(`Purchase return '${id}' not found`);
    return ret;
  }

  async approve(id: string, userId: string, reason?: string) {
    const ret = await this.findOne(id);
    if (ret.status !== 'DRAFT') {
      throw new BadRequestException(`Return must be in DRAFT status. Current: ${ret.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Deduct inventory
      for (const item of ret.items) {
        const warehouseId = ret.warehouseId;
        if (warehouseId) {
          await tx.warehouseInventory.updateMany({
            where: { warehouseId, productId: item.productId },
            data: { quantity: { decrement: Number(item.quantity) } },
          });

          await tx.inventoryMovement.create({
            data: {
              productId: item.productId,
              warehouseId,
              type: 'RETURN_OUT',
              quantity: Number(item.quantity),
              referenceId: ret.id,
              referenceType: 'PURCHASE_RETURN',
              notes: `Return ${ret.returnNumber} - sent to supplier`,
              createdById: userId,
            },
          });
        }

        // Update PO item returned qty
        await tx.purchaseOrderItem.update({
          where: { id: item.purchaseOrderItemId },
          data: { returnedQty: { increment: Number(item.quantity) } },
        });
      }

      const updated = await tx.purchaseReturn.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById: userId,
          approvedAt: new Date(),
          approvalNotes: reason,
        },
      });

      await this.audit.log({
        action: 'PURCHASE_RETURN.APPROVED',
        userId,
        entityId: id,
        entityType: 'PurchaseReturn',
      });

      return updated;
    });
  }

  async processCredit(id: string, userId: string) {
    const ret = await this.findOne(id);
    if (ret.status !== 'APPROVED') {
      throw new BadRequestException(`Return must be APPROVED for credit. Current: ${ret.status}`);
    }

    return this.prisma.$transaction(async (tx) => {
      const creditAmount = Number(ret.totalCreditAmount);

      if (ret.refundMethod === 'AP_CREDIT') {
        // Reduce AP / supplier balance
        await tx.supplier.update({
          where: { id: ret.supplierId },
          data: { balance: { decrement: creditAmount } },
        });

        // Create AP debit journal entry (reducing AP)
        await tx.generalLedgerEntry.create({
          data: {
            date: new Date(),
            reference: ret.returnNumber,
            description: `Purchase Return AP Credit - ${ret.returnNumber}`,
            branchId: ret.branchId,
            entries: {
              create: [
                {
                  accountId: await this.getAccountId(tx, 'ACCOUNTS_PAYABLE'),
                  debit: creditAmount,
                  credit: 0,
                  description: `AP reduction - ${ret.returnNumber}`,
                },
                {
                  accountId: await this.getAccountId(tx, 'INVENTORY'),
                  debit: 0,
                  credit: creditAmount,
                  description: `Inventory out - return to supplier`,
                },
              ],
            },
            createdById: userId,
          },
        });
      } else if (ret.refundMethod === 'CASH_REFUND') {
        await tx.generalLedgerEntry.create({
          data: {
            date: new Date(),
            reference: ret.returnNumber,
            description: `Cash Refund - Purchase Return ${ret.returnNumber}`,
            branchId: ret.branchId,
            entries: {
              create: [
                {
                  accountId: await this.getAccountId(tx, 'CASH'),
                  debit: creditAmount,
                  credit: 0,
                  description: `Cash refund received`,
                },
                {
                  accountId: await this.getAccountId(tx, 'INVENTORY'),
                  debit: 0,
                  credit: creditAmount,
                  description: `Inventory out - return to supplier`,
                },
              ],
            },
            createdById: userId,
          },
        });
      }

      const updated = await tx.purchaseReturn.update({
        where: { id },
        data: { status: 'CREDITED', creditedAt: new Date() },
      });

      await this.audit.log({
        action: 'PURCHASE_RETURN.CREDITED',
        userId,
        entityId: id,
        entityType: 'PurchaseReturn',
        details: { creditAmount, method: ret.refundMethod },
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
