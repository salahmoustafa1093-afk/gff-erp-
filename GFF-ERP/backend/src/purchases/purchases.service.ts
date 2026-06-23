import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseFilterDto } from './dto/purchase-filter.dto';
import { CreateGrnDto } from './dto/grn.dto';
import { ApprovePurchaseDto } from './dto/approve-purchase.dto';
import { PurchaseOrderStatus, Prisma } from '@prisma/client';

const PO_STATUS_FLOW: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
  DRAFT: ['SENT', 'CANCELLED'],
  SENT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PARTIAL', 'RECEIVED', 'CANCELLED'],
  PARTIAL: ['RECEIVED'],
  RECEIVED: ['INVOICED'],
  INVOICED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

const PO_APPROVAL_THRESHOLD = 5000;

@Injectable()
export class PurchasesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generatePONumber(branchId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const key = `PO-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `PO-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  async generateGrnNumber(branchId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const key = `GRN-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `GRN-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  async generatePINumber(branchId?: string): Promise<string> {
    const year = new Date().getFullYear();
    const key = `PI-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `PI-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  // ──────────────── CALCULATIONS ────────────────

  private calculateTotals(items: CreatePurchaseDto['items'], globalDiscountPercent?: number, globalDiscountAmount?: number, shippingCost?: number) {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const qty = item.quantity;
      const cost = item.unitCost;
      const lineTotal = qty * cost;

      const discPct = item.discountPercent ?? 0;
      const discAmt = item.discountAmount ?? 0;
      const lineDiscount = discAmt > 0 ? discAmt : lineTotal * (discPct / 100);
      const lineNet = lineTotal - lineDiscount;
      const taxPct = item.taxPercent ?? 0;
      const lineTax = lineNet * (taxPct / 100);

      subTotal += lineTotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;

      processedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: qty,
        uom: item.uom,
        unitCost: cost,
        discountPercent: discPct,
        discountAmount: lineDiscount,
        taxPercent: taxPct,
        taxAmount: lineTax,
        lineTotal: lineNet,
        lineTotalWithTax: lineNet + lineTax,
        expectedDeliveryDate: item.expectedDeliveryDate ? new Date(item.expectedDeliveryDate) : null,
        notes: item.notes,
        receivedQty: 0,
      });
    }

    let grandDiscount = globalDiscountAmount ?? 0;
    if (globalDiscountPercent && globalDiscountPercent > 0) {
      grandDiscount = (subTotal - totalDiscount) * (globalDiscountPercent / 100);
    }

    const netTotal = subTotal - totalDiscount - grandDiscount;
    const totalAmount = netTotal + totalTax + (shippingCost ?? 0);

    return { subTotal, totalDiscount: totalDiscount + grandDiscount, totalTax, totalAmount, items: processedItems };
  }

  // ──────────────── CREATE ────────────────

  async create(dto: CreatePurchaseDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const supplier = await tx.supplier.findUnique({
        where: { id: dto.supplierId },
        select: { id: true, name: true, paymentTerms: true, currencyCode: true, balance: true, creditLimit: true },
      });
      if (!supplier) throw new NotFoundException('Supplier not found');

      const orderNumber = await this.generatePONumber(dto.branchId);

      const totals = this.calculateTotals(
        dto.items, dto.globalDiscountPercent, dto.globalDiscountAmount, dto.shippingCost,
      );

      const order = await tx.purchaseOrder.create({
        data: {
          orderNumber,
          supplierId: dto.supplierId,
          branchId: dto.branchId,
          warehouseId: dto.warehouseId,
          referenceNumber: dto.referenceNumber,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          currencyCode: dto.currencyCode || supplier.currencyCode || 'USD',
          exchangeRate: dto.exchangeRate ?? 1,
          subTotal: totals.subTotal,
          totalDiscount: totals.totalDiscount,
          totalTax: totals.totalTax,
          shippingCost: dto.shippingCost ?? 0,
          totalAmount: totals.totalAmount,
          status: PurchaseOrderStatus.DRAFT,
          approvalStatus: Number(totals.totalAmount) >= PO_APPROVAL_THRESHOLD ? 'PENDING' : 'AUTO_APPROVED',
          notes: dto.notes,
          terms: dto.terms,
          requestedById: dto.requestedById || userId,
          requisitionId: dto.requisitionId,
          paymentTermsDays: supplier.paymentTerms || 30,
          items: { create: totals.items },
          createdById: userId,
        },
        include: {
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          supplier: { select: { id: true, name: true, supplierCode: true } },
        },
      });

      await this.audit.log({
        action: 'PURCHASE_ORDER.CREATE',
        userId,
        entityId: order.id,
        entityType: 'PurchaseOrder',
        details: { orderNumber, totalAmount: totals.totalAmount, supplierId: dto.supplierId },
      });

      return order;
    });
  }

  // ──────────────── READ ────────────────

  async findAll(filter: PurchaseFilterDto) {
    const where: Prisma.PurchaseOrderWhereInput = {};

    if (filter.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.status) where.status = filter.status;
    if (filter.supplierId) where.supplierId = filter.supplierId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.warehouseId) where.warehouseId = filter.warehouseId;
    if (filter.startDate || filter.endDate) {
      where.orderDate = {};
      if (filter.startDate) where.orderDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.orderDate.lte = new Date(filter.endDate);
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.PurchaseOrderOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where, skip, take: limit, orderBy,
        include: {
          supplier: { select: { id: true, name: true, supplierCode: true } },
          branch: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          grns: { select: { id: true, grnNumber: true, status: true } },
          invoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
        },
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true, supplierCode: true, paymentTerms: true, balance: true } },
        branch: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true } } },
        },
        grns: {
          include: {
            items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          },
        },
        invoices: { include: { payments: true } },
        requestedBy: { select: { id: true, name: true } },
        approvedBy: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!order) throw new NotFoundException(`Purchase order '${id}' not found`);
    return order;
  }

  // ──────────────── UPDATE ────────────────

  async update(id: string, dto: UpdatePurchaseDto, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== PurchaseOrderStatus.DRAFT && order.status !== PurchaseOrderStatus.SENT) {
      throw new BadRequestException(`Cannot update order in '${order.status}' status`);
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
      },
    });

    await this.audit.log({
      action: 'PURCHASE_ORDER.UPDATE',
      userId,
      entityId: id,
      entityType: 'PurchaseOrder',
      details: dto,
    });

    return updated;
  }

  // ──────────────── STATUS WORKFLOW ────────────────

  async transitionStatus(id: string, newStatus: PurchaseOrderStatus, userId: string) {
    const order = await this.findOne(id);

    if (!PO_STATUS_FLOW[order.status]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid transition from '${order.status}' to '${newStatus}'`);
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: newStatus, updatedAt: new Date() },
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
      },
    });

    await this.audit.log({
      action: 'PURCHASE_ORDER.STATUS_CHANGE',
      userId,
      entityId: id,
      entityType: 'PurchaseOrder',
      details: { from: order.status, to: newStatus },
    });

    return updated;
  }

  // ──────────────── APPROVAL ────────────────

  async processApproval(id: string, dto: ApprovePurchaseDto, userId: string) {
    const order = await this.findOne(id);
    if (order.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Order is not pending approval');
    }

    if (dto.action === 'REJECT') {
      const updated = await this.prisma.purchaseOrder.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          approvedById: userId,
          approvedAt: new Date(),
          status: PurchaseOrderStatus.CANCELLED,
        },
      });

      await this.audit.log({
        action: 'PURCHASE_ORDER.REJECTED',
        userId,
        entityId: id,
        entityType: 'PurchaseOrder',
        details: { reason: dto.reason },
      });

      return updated;
    }

    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    await this.audit.log({
      action: 'PURCHASE_ORDER.APPROVED',
      userId,
      entityId: id,
      entityType: 'PurchaseOrder',
    });

    return updated;
  }

  // ──────────────── GRN ────────────────

  async createGrn(dto: CreateGrnDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: dto.purchaseOrderId },
        include: {
          items: true,
          supplier: { select: { id: true, name: true } },
        },
      });
      if (!order) throw new NotFoundException('Purchase order not found');
      if (order.status === PurchaseOrderStatus.CANCELLED || order.status === PurchaseOrderStatus.DRAFT) {
        throw new BadRequestException(`Cannot create GRN for order in '${order.status}' status`);
      }

      const grnNumber = await this.generateGrnNumber(order.branchId);

      // Validate received quantities
      for (const item of dto.items) {
        const orderItem = order.items.find(i => i.id === item.purchaseOrderItemId);
        if (!orderItem) {
          throw new BadRequestException(`Item ${item.purchaseOrderItemId} not found in order`);
        }

        const alreadyReceived = Number(orderItem.receivedQty || 0);
        if (alreadyReceived + item.quantityReceived > Number(orderItem.quantity)) {
          throw new BadRequestException(
            `Cannot receive ${item.quantityReceived} of item ${item.productId}. Already received: ${alreadyReceived}, Ordered: ${orderItem.quantity}`,
          );
        }
      }

      const grn = await tx.goodsReceiptNote.create({
        data: {
          grnNumber,
          purchaseOrderId: dto.purchaseOrderId,
          supplierId: order.supplierId,
          branchId: order.branchId,
          warehouseId: order.warehouseId,
          grnDate: dto.grnDate ? new Date(dto.grnDate) : new Date(),
          supplierInvoiceRef: dto.supplierInvoiceRef,
          status: 'RECEIVED',
          receivedById: dto.receivedById || userId,
          notes: dto.notes,
          items: {
            create: dto.items.map(item => ({
              purchaseOrderItemId: item.purchaseOrderItemId,
              productId: item.productId,
              quantityReceived: item.quantityReceived,
              batchNumber: item.batchNumber,
              expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
              unitCost: item.unitCost,
              notes: item.notes,
            })),
          },
          createdById: userId,
        },
        include: {
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          supplier: { select: { id: true, name: true } },
        },
      });

      // Update inventory and order items
      for (const item of dto.items) {
        const warehouseId = order.warehouseId;
        if (!warehouseId) continue;

        const orderItem = order.items.find(i => i.id === item.purchaseOrderItemId);
        const unitCost = item.unitCost || Number(orderItem?.unitCost || 0);

        // Add to inventory
        await tx.warehouseInventory.updateMany({
          where: { warehouseId, productId: item.productId },
          data: { quantity: { increment: item.quantityReceived } },
        });

        // Create inventory movement
        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            warehouseId,
            type: 'IN',
            quantity: item.quantityReceived,
            unitCost,
            referenceId: grn.id,
            referenceType: 'GRN',
            notes: `GRN ${grnNumber} - PO ${order.orderNumber}`,
            createdById: userId,
          },
        });

        // Create inventory batch
        await tx.inventoryBatch.create({
          data: {
            productId: item.productId,
            warehouseId,
            quantity: item.quantityReceived,
            remainingQty: item.quantityReceived,
            unitCost,
            reference: grnNumber,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
            receivedDate: new Date(),
          },
        });

        // Update received qty on order item
        await tx.purchaseOrderItem.update({
          where: { id: item.purchaseOrderItemId },
          data: { receivedQty: { increment: item.quantityReceived } },
        });
      }

      // Check if fully received
      const updatedItems = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: order.id },
      });
      const allReceived = updatedItems.every(i => Number(i.receivedQty) >= Number(i.quantity));
      const anyReceived = updatedItems.some(i => Number(i.receivedQty) > 0);

      let newStatus = order.status;
      if (allReceived) {
        newStatus = PurchaseOrderStatus.RECEIVED;
      } else if (anyReceived && order.status !== PurchaseOrderStatus.PARTIAL) {
        newStatus = PurchaseOrderStatus.PARTIAL;
      }

      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: newStatus },
      });

      await this.audit.log({
        action: 'PURCHASE.GRN_CREATED',
        userId,
        entityId: grn.id,
        entityType: 'GoodsReceiptNote',
        details: { grnNumber, purchaseOrderId: order.id },
      });

      return grn;
    });
  }

  // ──────────────── INVOICE ────────────────

  async createInvoiceFromGrn(purchaseOrderId: string, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.purchaseOrder.findUnique({
        where: { id: purchaseOrderId },
        include: {
          items: { include: { product: { select: { id: true, name: true } } } },
          grns: { include: { items: true } },
          supplier: { select: { id: true, name: true, paymentTerms: true } },
        },
      });
      if (!order) throw new NotFoundException('Purchase order not found');
      if (order.status !== PurchaseOrderStatus.RECEIVED && order.status !== PurchaseOrderStatus.PARTIAL) {
        throw new BadRequestException('Items must be received before invoicing');
      }

      const invoiceNumber = await this.generatePINumber(order.branchId);
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + (order.supplier.paymentTerms || 30));

      const invoice = await tx.purchaseInvoice.create({
        data: {
          invoiceNumber,
          purchaseOrderId: order.id,
          supplierId: order.supplierId,
          branchId: order.branchId,
          invoiceDate: new Date(),
          dueDate,
          subTotal: order.subTotal,
          totalDiscount: order.totalDiscount,
          totalTax: order.totalTax,
          shippingCost: order.shippingCost,
          totalAmount: order.totalAmount,
          amountPaid: 0,
          currencyCode: order.currencyCode,
          exchangeRate: order.exchangeRate,
          status: 'UNPAID',
          items: {
            create: order.items.map(item => ({
              productId: item.productId,
              description: item.notes || item.product?.name,
              quantity: Number(item.quantity),
              uom: item.uom,
              unitCost: item.unitCost,
              discountPercent: item.discountPercent,
              discountAmount: item.discountAmount,
              taxPercent: item.taxPercent,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              lineTotalWithTax: item.lineTotalWithTax,
            })),
          },
          createdById: userId,
        },
      });

      // Create AP journal entry
      await tx.generalLedgerEntry.create({
        data: {
          date: new Date(),
          reference: invoiceNumber,
          description: `Purchase Invoice ${invoiceNumber} - PO ${order.orderNumber}`,
          branchId: order.branchId,
          entries: {
            create: [
              {
                accountId: await this.getAccountId(tx, 'INVENTORY'),
                debit: Number(order.subTotal) - Number(order.totalDiscount),
                credit: 0,
                description: `Inventory received - PO ${order.orderNumber}`,
              },
              {
                accountId: await this.getAccountId(tx, 'ACCOUNTS_PAYABLE'),
                debit: 0,
                credit: order.totalAmount,
                description: `AP - Invoice ${invoiceNumber}`,
              },
            ],
          },
          createdById: userId,
        },
      });

      // Update supplier balance
      await tx.supplier.update({
        where: { id: order.supplierId },
        data: { balance: { increment: order.totalAmount } },
      });

      // Update PO status
      await tx.purchaseOrder.update({
        where: { id: order.id },
        data: { status: PurchaseOrderStatus.INVOICED },
      });

      await this.audit.log({
        action: 'PURCHASE.INVOICE_CREATED',
        userId,
        entityId: invoice.id,
        entityType: 'PurchaseInvoice',
        details: { invoiceNumber, totalAmount: order.totalAmount },
      });

      return invoice;
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

  // ──────────────── REPORTS ────────────────

  async getPurchaseReport(branchId?: string, supplierId?: string, startDate?: string, endDate?: string) {
    const where: Prisma.PurchaseOrderWhereInput = {
      status: { not: PurchaseOrderStatus.CANCELLED },
    };
    if (branchId) where.branchId = branchId;
    if (supplierId) where.supplierId = supplierId;
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) where.orderDate.gte = new Date(startDate);
      if (endDate) where.orderDate.lte = new Date(endDate);
    }

    return this.prisma.purchaseOrder.groupBy({
      by: ['supplierId'],
      where,
      _sum: { totalAmount: true, subTotal: true },
      _count: { id: true },
    });
  }

  async getPurchaseByProduct(branchId?: string, startDate?: string, endDate?: string) {
    const where: Prisma.PurchaseOrderItemWhereInput = {
      order: { status: { not: PurchaseOrderStatus.CANCELLED } },
    };
    if (branchId) where.order = { ...where.order, branchId };
    if (startDate || endDate) {
      where.order = { ...where.order, orderDate: {} };
      if (startDate) where.order.orderDate = { gte: new Date(startDate) };
      if (endDate) where.order.orderDate = { lte: new Date(endDate) };
    }

    return this.prisma.purchaseOrderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, lineTotal: true },
      _count: { id: true },
    });
  }

  // ──────────────── DELETE ────────────────

  async remove(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== PurchaseOrderStatus.DRAFT && order.status !== PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Only DRAFT or CANCELLED orders can be deleted');
    }

    await this.prisma.purchaseOrder.delete({ where: { id } });

    await this.audit.log({
      action: 'PURCHASE_ORDER.DELETE',
      userId,
      entityId: id,
      entityType: 'PurchaseOrder',
    });

    return { message: 'Purchase order deleted successfully' };
  }
}
