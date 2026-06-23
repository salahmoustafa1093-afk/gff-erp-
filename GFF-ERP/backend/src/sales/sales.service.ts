import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesFilterDto } from './dto/sales-filter.dto';
import { SalesReportDto, SalesReportItemDto } from './dto/sales-report.dto';
import { ApproveSalesDto } from './dto/approve-sales.dto';
import { SalesOrderStatus, Prisma } from '@prisma/client';

const STATUS_FLOW: Record<SalesOrderStatus, SalesOrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'INVOICED'],
  DELIVERED: ['INVOICED'],
  INVOICED: ['PAID'],
  PAID: [],
  CANCELLED: [],
};

const APPROVAL_THRESHOLD = 10000;

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ──────────────── NUMBER SEQUENCE ────────────────

  async generateOrderNumber(branchId?: string): Promise<string> {
    const prefix = 'SO';
    const year = new Date().getFullYear();
    const key = `SO-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `${prefix}-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  async generateInvoiceNumber(branchId?: string): Promise<string> {
    const prefix = 'INV';
    const year = new Date().getFullYear();
    const key = `INV-${year}-${branchId || 'DEFAULT'}`;

    const seq = await this.prisma.numberSequence.upsert({
      where: { key },
      update: { lastNumber: { increment: 1 } },
      create: { key, prefix: `${prefix}-${year}-`, lastNumber: 1, branchId },
    });

    return `${seq.prefix}${String(seq.lastNumber).padStart(6, '0')}`;
  }

  // ──────────────── ORDER CALCULATIONS ────────────────

  private calculateOrderTotals(
    items: CreateSalesOrderDto['items'],
    globalDiscountPercent?: number,
    globalDiscountAmount?: number,
    shippingCost?: number,
  ) {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    const processedItems = [];

    for (const item of items) {
      const qty = item.quantity;
      const price = item.unitPrice ?? 0;
      const lineTotal = qty * price;

      const discPct = item.discountPercent ?? 0;
      const discAmt = item.discountAmount ?? 0;
      const lineDiscount = discAmt > 0 ? discAmt : lineTotal * (discPct / 100);
      const lineNet = lineTotal - lineDiscount;
      const taxPct = item.taxPercent ?? 0;
      const lineTax = lineNet * (taxPct / 100);
      const lineTotalWithTax = lineNet + lineTax;

      subTotal += lineTotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;

      processedItems.push({
        productId: item.productId,
        variantId: item.variantId,
        quantity: qty,
        uom: item.uom,
        unitPrice: price,
        discountPercent: discPct,
        discountAmount: lineDiscount,
        taxPercent: taxPct,
        taxAmount: lineTax,
        lineTotal: lineNet,
        lineTotalWithTax,
        description: item.description,
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

  async create(dto: CreateSalesOrderDto, userId: string) {
    return this.prisma.$transaction(async (tx) => {
      const customer = await tx.customer.findUnique({
        where: { id: dto.customerId },
        select: {
          id: true, creditLimit: true, balance: true, discountPercent: true,
          priceListId: true, paymentTerms: true, salesRepId: true, currencyCode: true,
        },
      });
      if (!customer) throw new NotFoundException('Customer not found');

      const orderNumber = await this.generateOrderNumber(dto.branchId);

      // Apply customer defaults
      const priceListId = dto.priceListId || customer.priceListId;
      const paymentTerms = dto.paymentTermsDays || customer.paymentTerms || 30;
      const salesRepId = dto.salesRepId || customer.salesRepId;
      const currencyCode = dto.currencyCode || customer.currencyCode || 'USD';

      // Resolve prices from price list if applicable
      const resolvedItems = await this.resolveItemPrices(tx, dto.items, priceListId);

      const totals = this.calculateOrderTotals(
        resolvedItems,
        dto.globalDiscountPercent,
        dto.globalDiscountAmount,
        dto.shippingCost,
      );

      // Check credit limit
      if (totals.totalAmount > 0) {
        const currentBalance = Number(customer.balance);
        const creditLimit = Number(customer.creditLimit);
        if (creditLimit > 0 && currentBalance + totals.totalAmount > creditLimit) {
          throw new ForbiddenException(
            `Credit limit exceeded. Available: ${creditLimit - currentBalance}, Required: ${totals.totalAmount}`,
          );
        }
      }

      const order = await tx.salesOrder.create({
        data: {
          orderNumber,
          customerId: dto.customerId,
          branchId: dto.branchId,
          warehouseId: dto.warehouseId,
          referenceNumber: dto.referenceNumber,
          orderDate: dto.orderDate ? new Date(dto.orderDate) : new Date(),
          expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : null,
          currencyCode,
          exchangeRate: dto.exchangeRate ?? 1,
          subTotal: totals.subTotal,
          totalDiscount: totals.totalDiscount,
          totalTax: totals.totalTax,
          shippingCost: dto.shippingCost ?? 0,
          totalAmount: totals.totalAmount,
          globalDiscountPercent: dto.globalDiscountPercent ?? 0,
          globalDiscountAmount: dto.globalDiscountAmount ?? 0,
          status: SalesOrderStatus.DRAFT,
          notes: dto.notes,
          internalNotes: dto.internalNotes,
          terms: dto.terms,
          priceListId,
          salesRepId,
          paymentTermsDays: paymentTerms,
          createdById: userId,
          items: {
            create: totals.items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
              uom: item.uom,
              unitPrice: item.unitPrice,
              discountPercent: item.discountPercent,
              discountAmount: item.discountAmount,
              taxPercent: item.taxPercent,
              taxAmount: item.taxAmount,
              lineTotal: item.lineTotal,
              lineTotalWithTax: item.lineTotalWithTax,
              description: item.description,
            })),
          },
        },
        include: {
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          customer: { select: { id: true, name: true, customerCode: true } },
          salesRep: { select: { id: true, name: true } },
        },
      });

      await this.audit.log({
        action: 'SALES_ORDER.CREATE',
        userId,
        entityId: order.id,
        entityType: 'SalesOrder',
        details: { orderNumber, totalAmount: totals.totalAmount, customerId: dto.customerId },
      });

      return order;
    });
  }

  private async resolveItemPrices(tx: Prisma.TransactionClient, items: CreateSalesOrderDto['items'], priceListId?: string) {
    if (!priceListId) return items;

    const resolved = [];
    for (const item of items) {
      if (item.unitPrice && item.unitPrice > 0) {
        resolved.push(item);
        continue;
      }

      const priceEntry = await tx.priceListItem.findFirst({
        where: { priceListId, productId: item.productId },
        select: { price: true },
      });

      resolved.push({
        ...item,
        unitPrice: priceEntry?.price ? Number(priceEntry.price) : item.unitPrice ?? 0,
      });
    }
    return resolved;
  }

  // ──────────────── READ ────────────────

  async findAll(filter: SalesFilterDto) {
    const where: Prisma.SalesOrderWhereInput = {};

    if (filter.search) {
      where.OR = [
        { orderNumber: { contains: filter.search, mode: 'insensitive' } },
        { referenceNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.status) where.status = filter.status;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.salesRepId) where.salesRepId = filter.salesRepId;
    if (filter.warehouseId) where.warehouseId = filter.warehouseId;
    if (filter.startDate || filter.endDate) {
      where.orderDate = {};
      if (filter.startDate) where.orderDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.orderDate.lte = new Date(filter.endDate);
    }
    if (filter.minAmount !== undefined) where.totalAmount = { ...(where.totalAmount as object || {}), gte: filter.minAmount };
    if (filter.maxAmount !== undefined) where.totalAmount = { ...(where.totalAmount as object || {}), lte: filter.maxAmount };

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.SalesOrderOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.salesOrder.findMany({
        where, skip, take: limit, orderBy,
        include: {
          customer: { select: { id: true, name: true, customerCode: true } },
          salesRep: { select: { id: true, name: true } },
          branch: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
          invoices: { select: { id: true, invoiceNumber: true, status: true, totalAmount: true } },
        },
      }),
      this.prisma.salesOrder.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, customerCode: true, creditLimit: true, balance: true, paymentTerms: true },
        },
        salesRep: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, sku: true, name: true, unitPrice: true } } },
        },
        invoices: {
          include: { payments: true },
        },
        deliveries: true,
        returns: true,
      },
    });

    if (!order) throw new NotFoundException(`Sales order '${id}' not found`);
    return order;
  }

  // ──────────────── UPDATE ────────────────

  async update(id: string, dto: UpdateSalesOrderDto, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException(`Cannot update order in '${order.status}' status. Only DRAFT orders can be edited.`);
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        customer: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, sku: true, name: true } } } },
      },
    });

    await this.audit.log({
      action: 'SALES_ORDER.UPDATE',
      userId,
      entityId: id,
      entityType: 'SalesOrder',
      details: dto,
    });

    return updated;
  }

  // ──────────────── STATUS WORKFLOW ────────────────

  async transitionStatus(id: string, newStatus: SalesOrderStatus, userId: string) {
    const order = await this.findOne(id);

    if (!STATUS_FLOW[order.status]?.includes(newStatus)) {
      throw new BadRequestException(`Invalid transition from '${order.status}' to '${newStatus}'`);
    }

    return this.prisma.$transaction(async (tx) => {
      // Confirm: reserve inventory
      if (newStatus === SalesOrderStatus.CONFIRMED) {
        await this.reserveInventory(tx, order, userId);
      }

      // Shipped: create delivery note
      if (newStatus === SalesOrderStatus.SHIPPED) {
        await this.createDeliveryNote(tx, order, userId);
      }

      // Delivered: create COGS entries
      if (newStatus === SalesOrderStatus.DELIVERED) {
        await this.createCogsEntries(tx, order, userId);
      }

      // Invoiced: create sales invoice + AR entry
      if (newStatus === SalesOrderStatus.INVOICED) {
        await this.createInvoice(tx, order, userId);
      }

      // Cancelled: release reserved inventory
      if (newStatus === SalesOrderStatus.CANCELLED) {
        await this.releaseInventory(tx, order, userId);
      }

      const updated = await tx.salesOrder.update({
        where: { id },
        data: { status: newStatus, updatedAt: new Date() },
        include: {
          customer: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, sku: true, name: true } } } },
        },
      });

      await this.audit.log({
        action: 'SALES_ORDER.STATUS_CHANGE',
        userId,
        entityId: id,
        entityType: 'SalesOrder',
        details: { from: order.status, to: newStatus },
      });

      return updated;
    });
  }

  // ──────────────── INVENTORY OPERATIONS ────────────────

  private async reserveInventory(tx: Prisma.TransactionClient, order: any, userId: string) {
    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { trackInventory: true },
      });
      if (!product?.trackInventory) continue;

      const warehouseId = order.warehouseId;
      if (!warehouseId) continue;

      // Create inventory reservation
      await tx.inventoryReservation.create({
        data: {
          productId: item.productId,
          variantId: item.variantId,
          warehouseId,
          quantity: item.quantity,
          salesOrderId: order.id,
          status: 'RESERVED',
        },
      });

      // Update available quantity
      await tx.warehouseInventory.updateMany({
        where: { warehouseId, productId: item.productId },
        data: { reservedQuantity: { increment: item.quantity } },
      });

      // Create movement record
      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId,
          type: 'RESERVATION',
          quantity: item.quantity,
          referenceId: order.id,
          referenceType: 'SALES_ORDER',
          notes: `Reservation for SO ${order.orderNumber}`,
          createdById: userId,
        },
      });
    }
  }

  private async releaseInventory(tx: Prisma.TransactionClient, order: any, userId: string) {
    // Release any existing reservations
    const reservations = await tx.inventoryReservation.findMany({
      where: { salesOrderId: order.id, status: 'RESERVED' },
    });

    for (const res of reservations) {
      await tx.warehouseInventory.updateMany({
        where: { warehouseId: res.warehouseId, productId: res.productId },
        data: { reservedQuantity: { decrement: res.quantity } },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: res.productId,
          warehouseId: res.warehouseId,
          type: 'RELEASE',
          quantity: res.quantity,
          referenceId: order.id,
          referenceType: 'SALES_ORDER',
          notes: `Released reservation for cancelled SO ${order.orderNumber}`,
          createdById: userId,
        },
      });
    }

    await tx.inventoryReservation.updateMany({
      where: { salesOrderId: order.id },
      data: { status: 'RELEASED' },
    });
  }

  private async createDeliveryNote(tx: Prisma.TransactionClient, order: any, userId: string) {
    const dnNumber = `DN-${order.orderNumber}`;

    await tx.deliveryNote.create({
      data: {
        deliveryNumber: dnNumber,
        salesOrderId: order.id,
        customerId: order.customerId,
        branchId: order.branchId,
        warehouseId: order.warehouseId,
        status: 'SHIPPED',
        deliveryDate: new Date(),
        items: {
          create: order.items.map((item: any) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            uom: item.uom,
            description: item.description,
          })),
        },
        createdById: userId,
      },
    });

    // Deduct reserved quantities
    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { trackInventory: true },
      });
      if (!product?.trackInventory) continue;

      await tx.warehouseInventory.updateMany({
        where: { warehouseId: order.warehouseId, productId: item.productId },
        data: {
          quantity: { decrement: item.quantity },
          reservedQuantity: { decrement: item.quantity },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          warehouseId: order.warehouseId,
          type: 'OUT',
          quantity: item.quantity,
          referenceId: order.id,
          referenceType: 'DELIVERY_NOTE',
          notes: `Shipped for SO ${order.orderNumber}`,
          createdById: userId,
        },
      });
    }
  }

  // ──────────────── COGS CALCULATION ────────────────

  private async createCogsEntries(tx: Prisma.TransactionClient, order: any, userId: string) {
    const cogsMethod = 'FIFO'; // or 'WEIGHTED_AVERAGE' - configurable per product

    for (const item of order.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { trackInventory: true, name: true },
      });
      if (!product?.trackInventory) continue;

      const cogsAmount = await this.calculateCogs(tx, item.productId, item.quantity, cogsMethod);

      // Create COGS journal entry
      await tx.generalLedgerEntry.create({
        data: {
          date: new Date(),
          reference: order.orderNumber,
          description: `COGS - ${product.name} (SO ${order.orderNumber})`,
          branchId: order.branchId,
          entries: {
            create: [
              {
                accountId: await this.getAccountId(tx, 'COST_OF_GOODS_SOLD'),
                debit: cogsAmount,
                credit: 0,
                description: `COGS for ${product.name}`,
              },
              {
                accountId: await this.getAccountId(tx, 'INVENTORY'),
                debit: 0,
                credit: cogsAmount,
                description: `Inventory out for ${product.name}`,
              },
            ],
          },
          createdById: userId,
        },
      });

      // Update order item COGS
      await tx.salesOrderItem.update({
        where: { id: item.id },
        data: { cogsAmount },
      });
    }
  }

  private async calculateCogs(
    tx: Prisma.TransactionClient,
    productId: string,
    quantity: number,
    method: 'FIFO' | 'WEIGHTED_AVERAGE',
  ): Promise<number> {
    if (method === 'FIFO') {
      const batches = await tx.inventoryBatch.findMany({
        where: { productId, remainingQty: { gt: 0 } },
        orderBy: { receivedDate: 'asc' },
      });

      let remainingQty = quantity;
      let totalCost = 0;

      for (const batch of batches) {
        if (remainingQty <= 0) break;
        const take = Math.min(remainingQty, Number(batch.remainingQty));
        totalCost += take * Number(batch.unitCost);
        remainingQty -= take;

        await tx.inventoryBatch.update({
          where: { id: batch.id },
          data: { remainingQty: { decrement: take } },
        });
      }

      if (remainingQty > 0) {
        // Not enough inventory - use current average cost for remainder
        const avgCost = batches.length > 0
          ? batches.reduce((sum, b) => sum + Number(b.unitCost), 0) / batches.length
          : 0;
        totalCost += remainingQty * avgCost;
      }

      return totalCost;
    } else {
      // WEIGHTED_AVERAGE
      const inventory = await tx.warehouseInventory.findFirst({
        where: { productId },
        select: { averageCost: true },
      });
      const avgCost = inventory?.averageCost ? Number(inventory.averageCost) : 0;
      return quantity * avgCost;
    }
  }

  private async getAccountId(tx: Prisma.TransactionClient, accountType: string): Promise<string> {
    const account = await tx.account.findFirst({
      where: { type: accountType, isSystem: true },
      select: { id: true },
    });
    if (!account) throw new NotFoundException(`System account '${accountType}' not found`);
    return account.id;
  }

  // ──────────────── INVOICE CREATION ────────────────

  private async createInvoice(tx: Prisma.TransactionClient, order: any, userId: string) {
    const invoiceNumber = await this.generateInvoiceNumber(order.branchId);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (order.paymentTermsDays || 30));

    const invoice = await tx.salesInvoice.create({
      data: {
        invoiceNumber,
        salesOrderId: order.id,
        customerId: order.customerId,
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
        notes: order.notes,
        items: {
          create: order.items.map((item: any) => ({
            productId: item.productId,
            description: item.description || item.product?.name,
            quantity: item.quantity,
            uom: item.uom,
            unitPrice: item.unitPrice,
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

    // Create AR journal entry
    await tx.generalLedgerEntry.create({
      data: {
        date: new Date(),
        reference: invoiceNumber,
        description: `Sales Invoice ${invoiceNumber} - ${order.orderNumber}`,
        branchId: order.branchId,
        entries: {
          create: [
            {
              accountId: await this.getAccountId(tx, 'ACCOUNTS_RECEIVABLE'),
              debit: order.totalAmount,
              credit: 0,
              description: `AR - Invoice ${invoiceNumber}`,
            },
            {
              accountId: await this.getAccountId(tx, 'SALES_REVENUE'),
              debit: 0,
              credit: order.subTotal,
              description: `Revenue - SO ${order.orderNumber}`,
            },
            ...(order.totalTax > 0 ? [{
              accountId: await this.getAccountId(tx, 'SALES_TAX_PAYABLE'),
              debit: 0,
              credit: order.totalTax,
              description: `Tax - Invoice ${invoiceNumber}`,
            }] : []),
          ],
        },
        createdById: userId,
      },
    });

    // Update customer balance
    await tx.customer.update({
      where: { id: order.customerId },
      data: { balance: { increment: order.totalAmount } },
    });

    return invoice;
  }

  // ──────────────── APPROVAL WORKFLOW ────────────────

  async requestApproval(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== SalesOrderStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT orders can be submitted for approval');
    }

    const needsApproval = Number(order.totalAmount) >= APPROVAL_THRESHOLD;
    if (!needsApproval) {
      // Auto-approve if below threshold
      return this.transitionStatus(id, SalesOrderStatus.CONFIRMED, userId);
    }

    const updated = await this.prisma.salesOrder.update({
      where: { id },
      data: {
        approvalStatus: 'PENDING',
        submittedForApprovalAt: new Date(),
        submittedById: userId,
      },
    });

    await this.audit.log({
      action: 'SALES_ORDER.APPROVAL_REQUEST',
      userId,
      entityId: id,
      entityType: 'SalesOrder',
      details: { totalAmount: order.totalAmount },
    });

    return updated;
  }

  async processApproval(id: string, dto: ApproveSalesDto, userId: string) {
    const order = await this.findOne(id);
    if (order.approvalStatus !== 'PENDING') {
      throw new BadRequestException('Order is not pending approval');
    }

    if (dto.action === 'REJECT') {
      const updated = await this.prisma.salesOrder.update({
        where: { id },
        data: {
          approvalStatus: 'REJECTED',
          approvedById: userId,
          approvedAt: new Date(),
          approvalNotes: dto.reason,
        },
      });

      await this.audit.log({
        action: 'SALES_ORDER.REJECTED',
        userId,
        entityId: id,
        entityType: 'SalesOrder',
        details: { reason: dto.reason },
      });

      return updated;
    }

    // Approve
    await this.prisma.salesOrder.update({
      where: { id },
      data: {
        approvalStatus: 'APPROVED',
        approvedById: userId,
        approvedAt: new Date(),
        approvalNotes: dto.reason,
      },
    });

    await this.audit.log({
      action: 'SALES_ORDER.APPROVED',
      userId,
      entityId: id,
      entityType: 'SalesOrder',
      details: { totalAmount: order.totalAmount },
    });

    return this.transitionStatus(id, SalesOrderStatus.CONFIRMED, userId);
  }

  // ──────────────── REPORTS ────────────────

  async getSalesReport(filter: SalesReportDto): Promise<{ data: SalesReportItemDto[]; summary: any }> {
    const where: Prisma.SalesOrderWhereInput = {
      status: { notIn: [SalesOrderStatus.DRAFT, SalesOrderStatus.CANCELLED] },
    };

    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.salesRepId) where.salesRepId = filter.salesRepId;
    if (filter.startDate || filter.endDate) {
      where.orderDate = {};
      if (filter.startDate) where.orderDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.orderDate.lte = new Date(filter.endDate);
    }

    const orders = await this.prisma.salesOrder.findMany({
      where,
      include: {
        items: true,
        invoices: true,
      },
      orderBy: { orderDate: 'asc' },
    });

    const groupBy = filter.groupBy || 'month';
    const grouped = new Map<string, SalesReportItemDto>();

    for (const order of orders) {
      const date = new Date(order.orderDate);
      let period: string;

      switch (groupBy) {
        case 'day': period = date.toISOString().split('T')[0]; break;
        case 'week': {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = weekStart.toISOString().split('T')[0];
          break;
        }
        case 'month': period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`; break;
        case 'quarter': {
          const q = Math.floor(date.getMonth() / 3) + 1;
          period = `${date.getFullYear()}-Q${q}`;
          break;
        }
        case 'year': period = `${date.getFullYear()}`; break;
      }

      if (!grouped.has(period)) {
        grouped.set(period, {
          period, totalOrders: 0, totalQuantity: 0,
          grossAmount: 0, totalDiscounts: 0, totalTax: 0,
          netAmount: 0, totalCogs: 0, grossProfit: 0, grossProfitMargin: 0,
        });
      }

      const item = grouped.get(period)!;
      item.totalOrders++;
      item.grossAmount += Number(order.subTotal);
      item.totalDiscounts += Number(order.totalDiscount);
      item.totalTax += Number(order.totalTax);
      item.netAmount += Number(order.totalAmount);

      for (const line of order.items) {
        item.totalQuantity += Number(line.quantity);
        item.totalCogs += Number(line.cogsAmount || 0);
      }
    }

    const data = Array.from(grouped.values()).map((item) => {
      item.grossProfit = item.netAmount - item.totalCogs;
      item.grossProfitMargin = item.netAmount > 0 ? (item.grossProfit / item.netAmount) * 100 : 0;
      return item;
    });

    const summary = {
      totalOrders: data.reduce((s, i) => s + i.totalOrders, 0),
      totalQuantity: data.reduce((s, i) => s + i.totalQuantity, 0),
      grossAmount: data.reduce((s, i) => s + i.grossAmount, 0),
      totalDiscounts: data.reduce((s, i) => s + i.totalDiscounts, 0),
      totalTax: data.reduce((s, i) => s + i.totalTax, 0),
      netAmount: data.reduce((s, i) => s + i.netAmount, 0),
      totalCogs: data.reduce((s, i) => s + i.totalCogs, 0),
      grossProfit: data.reduce((s, i) => s + i.grossProfit, 0),
      avgOrderValue: data.length > 0 ? data.reduce((s, i) => s + i.netAmount, 0) / data.length : 0,
    };

    return { data, summary };
  }

  async getSalesByProduct(filter: SalesReportDto) {
    const where: Prisma.SalesOrderItemWhereInput = {
      order: { status: { notIn: [SalesOrderStatus.DRAFT, SalesOrderStatus.CANCELLED] } },
    };

    if (filter.branchId) where.order = { ...where.order, branchId: filter.branchId };
    if (filter.startDate || filter.endDate) {
      where.order = { ...where.order, orderDate: {} };
      if (filter.startDate) where.order.orderDate = { gte: new Date(filter.startDate) };
      if (filter.endDate) where.order.orderDate = { lte: new Date(filter.endDate) };
    }
    if (filter.productId) where.productId = filter.productId;

    return this.prisma.salesOrderItem.groupBy({
      by: ['productId'],
      where,
      _sum: { quantity: true, lineTotal: true, lineTotalWithTax: true },
      _count: { id: true },
    });
  }

  async getSalesByCustomer(filter: SalesReportDto) {
    const where: Prisma.SalesOrderWhereInput = {
      status: { notIn: [SalesOrderStatus.DRAFT, SalesOrderStatus.CANCELLED] },
    };

    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.startDate || filter.endDate) {
      where.orderDate = {};
      if (filter.startDate) where.orderDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.orderDate.lte = new Date(filter.endDate);
    }

    return this.prisma.salesOrder.groupBy({
      by: ['customerId'],
      where,
      _sum: { totalAmount: true, subTotal: true },
      _count: { id: true },
    });
  }

  async getSalesBySalesRep(filter: SalesReportDto) {
    const where: Prisma.SalesOrderWhereInput = {
      status: { notIn: [SalesOrderStatus.DRAFT, SalesOrderStatus.CANCELLED] },
      salesRepId: { not: null },
    };

    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.startDate || filter.endDate) {
      where.orderDate = {};
      if (filter.startDate) where.orderDate.gte = new Date(filter.startDate);
      if (filter.endDate) where.orderDate.lte = new Date(filter.endDate);
    }

    return this.prisma.salesOrder.groupBy({
      by: ['salesRepId'],
      where,
      _sum: { totalAmount: true },
      _count: { id: true },
    });
  }

  // ──────────────── DELETE ────────────────

  async remove(id: string, userId: string) {
    const order = await this.findOne(id);
    if (order.status !== SalesOrderStatus.DRAFT && order.status !== SalesOrderStatus.CANCELLED) {
      throw new BadRequestException('Only DRAFT or CANCELLED orders can be deleted');
    }

    await this.prisma.salesOrder.delete({ where: { id } });

    await this.audit.log({
      action: 'SALES_ORDER.DELETE',
      userId,
      entityId: id,
      entityType: 'SalesOrder',
    });

    return { message: 'Sales order deleted successfully' };
  }
}
