import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierFilterDto } from './dto/supplier-filter.dto';
import { SupplierStatementDto, SupplierStatementItemDto } from './dto/supplier-statement.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateSupplierDto, userId: string) {
    const existing = await this.prisma.supplier.findUnique({
      where: { supplierCode: dto.supplierCode },
    });
    if (existing) {
      throw new BadRequestException(`Supplier code '${dto.supplierCode}' already exists`);
    }

    const supplier = await this.prisma.supplier.create({
      data: {
        supplierCode: dto.supplierCode,
        name: dto.name,
        contactPerson: dto.contactPerson,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        fax: dto.fax,
        website: dto.website,
        taxNumber: dto.taxNumber,
        billingAddress: dto.billingAddress,
        shippingAddress: dto.shippingAddress,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        postalCode: dto.postalCode,
        creditLimit: dto.creditLimit ?? 0,
        paymentTerms: dto.paymentTerms ?? 30,
        currencyCode: dto.currencyCode ?? 'USD',
        branchId: dto.branchId,
        isActive: dto.isActive ?? true,
        notes: dto.notes,
        rating: dto.rating,
        leadTimeDays: dto.leadTimeDays,
        minOrderAmount: dto.minOrderAmount,
        categories: dto.categories,
        balance: 0,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'SUPPLIER.CREATE',
      userId,
      entityId: supplier.id,
      entityType: 'Supplier',
      details: { supplierCode: dto.supplierCode, name: dto.name },
    });

    return supplier;
  }

  async findAll(filter: SupplierFilterDto) {
    const where: Prisma.SupplierWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
        { supplierCode: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.city) where.city = { contains: filter.city, mode: 'insensitive' };
    if (filter.country) where.country = { contains: filter.country, mode: 'insensitive' };
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.minRating) where.rating = { gte: filter.minRating };

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.SupplierOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.supplier.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          branch: { select: { id: true, name: true } },
          _count: { select: { purchaseOrders: true } },
        },
      }),
      this.prisma.supplier.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        branch: { select: { id: true, name: true } },
        purchaseOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
      },
    });

    if (!supplier) throw new NotFoundException(`Supplier with ID '${id}' not found`);
    return supplier;
  }

  async update(id: string, dto: UpdateSupplierDto, userId: string) {
    await this.findOne(id);

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'SUPPLIER.UPDATE',
      userId,
      entityId: id,
      entityType: 'Supplier',
      details: dto,
    });

    return supplier;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    const orderCount = await this.prisma.purchaseOrder.count({ where: { supplierId: id } });
    if (orderCount > 0) {
      throw new BadRequestException('Cannot delete supplier with existing purchase orders. Deactivate instead.');
    }

    await this.prisma.supplier.delete({ where: { id } });

    await this.audit.log({
      action: 'SUPPLIER.DELETE',
      userId,
      entityId: id,
      entityType: 'Supplier',
    });

    return { message: 'Supplier deleted successfully' };
  }

  async search(query: string, branchId?: string, limit = 20) {
    const where: Prisma.SupplierWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { supplierCode: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.supplier.findMany({
      where,
      take: limit,
      select: {
        id: true, supplierCode: true, name: true, phone: true, email: true,
        creditLimit: true, balance: true, currencyCode: true, rating: true, leadTimeDays: true,
      },
    });
  }

  async getStatement(dto: SupplierStatementDto): Promise<{ items: SupplierStatementItemDto[]; openingBalance: number }> {
    const supplier = await this.prisma.supplier.findUnique({ where: { id: dto.supplierId } });
    if (!supplier) throw new NotFoundException('Supplier not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date('2000-01-01');
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: { supplierId: dto.supplierId, invoiceDate: { gte: startDate, lte: endDate } },
      select: { id: true, invoiceNumber: true, invoiceDate: true, totalAmount: true, amountPaid: true },
      orderBy: { invoiceDate: 'asc' },
    });

    const payments = await this.prisma.paymentSent.findMany({
      where: { supplierId: dto.supplierId, paymentDate: { gte: startDate, lte: endDate } },
      select: { id: true, reference: true, paymentDate: true, amount: true },
      orderBy: { paymentDate: 'asc' },
    });

    const openingBalance = Number(supplier.balance);
    const items: SupplierStatementItemDto[] = [];
    let runningBalance = 0;

    for (const inv of invoices) {
      items.push({
        date: inv.invoiceDate,
        transactionType: 'INVOICE',
        reference: inv.invoiceNumber,
        description: `Invoice ${inv.invoiceNumber}`,
        debit: Number(inv.totalAmount),
        credit: Number(inv.amountPaid),
        balance: 0,
      });
    }

    for (const pmt of payments) {
      items.push({
        date: pmt.paymentDate,
        transactionType: 'PAYMENT',
        reference: pmt.reference || pmt.id,
        description: `Payment ${pmt.reference || pmt.id}`,
        debit: 0,
        credit: Number(pmt.amount),
        balance: 0,
      });
    }

    items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    for (const item of items) {
      runningBalance += item.debit - item.credit;
      item.balance = runningBalance;
    }

    return { items, openingBalance };
  }

  async getTopSuppliers(branchId?: string, limit = 10) {
    return this.prisma.supplier.findMany({
      where: branchId ? { branchId } : undefined,
      take: limit,
      orderBy: { balance: 'desc' },
      select: {
        id: true, supplierCode: true, name: true,
        balance: true, creditLimit: true, rating: true,
        _count: { select: { purchaseOrders: true } },
      },
    });
  }

  async updateRating(id: string, rating: number, userId: string) {
    if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be between 1 and 5');
    await this.findOne(id);

    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: { rating, updatedAt: new Date() },
    });

    await this.audit.log({
      action: 'SUPPLIER.RATE',
      userId,
      entityId: id,
      entityType: 'Supplier',
      details: { rating },
    });

    return supplier;
  }

  async updateBalance(supplierId: string, amount: number) {
    await this.prisma.supplier.update({
      where: { id: supplierId },
      data: { balance: { increment: amount } },
    });
  }
}
