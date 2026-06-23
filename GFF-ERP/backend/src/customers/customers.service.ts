import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { CustomerStatementDto, CustomerStatementItemDto, CustomerAgingItemDto } from './dto/customer-statement.dto';
import { CustomerType, Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateCustomerDto, userId: string) {
    const existing = await this.prisma.customer.findUnique({
      where: { customerCode: dto.customerCode },
    });
    if (existing) {
      throw new BadRequestException(`Customer code '${dto.customerCode}' already exists`);
    }

    const customer = await this.prisma.customer.create({
      data: {
        customerCode: dto.customerCode,
        name: dto.name,
        contactPerson: dto.contactPerson,
        customerType: dto.customerType,
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
        discountPercent: dto.discountPercent ?? 0,
        priceListId: dto.priceListId,
        salesRepId: dto.salesRepId,
        branchId: dto.branchId,
        currencyCode: dto.currencyCode ?? 'USD',
        isActive: dto.isActive ?? true,
        notes: dto.notes,
        latitude: dto.latitude,
        longitude: dto.longitude,
        category: dto.category,
        industry: dto.industry,
        balance: 0,
      },
      include: {
        salesRep: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'CUSTOMER.CREATE',
      userId,
      entityId: customer.id,
      entityType: 'Customer',
      details: { customerCode: dto.customerCode, name: dto.name },
    });

    return customer;
  }

  async findAll(filter: CustomerFilterDto) {
    const where: Prisma.CustomerWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
        { customerCode: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    if (filter.customerType) where.customerType = filter.customerType;
    if (filter.city) where.city = { contains: filter.city, mode: 'insensitive' };
    if (filter.country) where.country = { contains: filter.country, mode: 'insensitive' };
    if (filter.salesRepId) where.salesRepId = filter.salesRepId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;
    if (filter.category) where.category = filter.category;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.CustomerOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          salesRep: { select: { id: true, name: true, email: true } },
          branch: { select: { id: true, name: true } },
          priceList: { select: { id: true, name: true } },
          _count: { select: { salesOrders: true } },
        },
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        salesRep: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
        salesOrders: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, orderNumber: true, status: true, totalAmount: true, createdAt: true },
        },
      },
    });

    if (!customer) throw new NotFoundException(`Customer with ID '${id}' not found`);
    return customer;
  }

  async update(id: string, dto: UpdateCustomerDto, userId: string) {
    await this.findOne(id);

    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      include: {
        salesRep: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        priceList: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'CUSTOMER.UPDATE',
      userId,
      entityId: id,
      entityType: 'Customer',
      details: dto,
    });

    return customer;
  }

  async remove(id: string, userId: string) {
    await this.findOne(id);

    const orderCount = await this.prisma.salesOrder.count({ where: { customerId: id } });
    if (orderCount > 0) {
      throw new BadRequestException('Cannot delete customer with existing sales orders. Deactivate instead.');
    }

    await this.prisma.customer.delete({ where: { id } });

    await this.audit.log({
      action: 'CUSTOMER.DELETE',
      userId,
      entityId: id,
      entityType: 'Customer',
    });

    return { message: 'Customer deleted successfully' };
  }

  async search(query: string, branchId?: string, limit = 20) {
    const where: Prisma.CustomerWhereInput = {
      isActive: true,
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query, mode: 'insensitive' } },
        { customerCode: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
      ],
    };
    if (branchId) where.branchId = branchId;

    return this.prisma.customer.findMany({
      where,
      take: limit,
      select: {
        id: true, customerCode: true, name: true, phone: true, email: true,
        creditLimit: true, balance: true, discountPercent: true, currencyCode: true,
        customerType: true, salesRepId: true, paymentTerms: true,
      },
    });
  }

  async getStatement(dto: CustomerStatementDto): Promise<{ items: CustomerStatementItemDto[]; openingBalance: number }> {
    const customer = await this.prisma.customer.findUnique({ where: { id: dto.customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date('2000-01-01');
    const endDate = dto.endDate ? new Date(dto.endDate) : new Date();

    const invoices = await this.prisma.salesInvoice.findMany({
      where: { customerId: dto.customerId, invoiceDate: { gte: startDate, lte: endDate } },
      select: { id: true, invoiceNumber: true, invoiceDate: true, totalAmount: true, amountPaid: true },
      orderBy: { invoiceDate: 'asc' },
    });

    const payments = await this.prisma.paymentReceived.findMany({
      where: { customerId: dto.customerId, paymentDate: { gte: startDate, lte: endDate } },
      select: { id: true, reference: true, paymentDate: true, amount: true },
      orderBy: { paymentDate: 'asc' },
    });

    const openingBalance = customer.balance;

    const items: CustomerStatementItemDto[] = [];
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

  async getAgingReport(customerId?: string, branchId?: string): Promise<CustomerAgingItemDto[]> {
    const where: Prisma.SalesInvoiceWhereInput = {
      status: { notIn: ['PAID', 'CANCELLED'] },
    };
    if (customerId) where.customerId = customerId;
    if (branchId) where.branchId = branchId;

    const invoices = await this.prisma.salesInvoice.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, paymentTerms: true } },
      },
    });

    const now = new Date();
    const agingItems: CustomerAgingItemDto[] = [];

    for (const inv of invoices) {
      const dueDate = new Date(inv.invoiceDate);
      dueDate.setDate(dueDate.getDate() + (inv.customer.paymentTerms || 30));
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)));
      const outstanding = Number(inv.totalAmount) - Number(inv.amountPaid);

      agingItems.push({
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate,
        dueDate,
        originalAmount: Number(inv.totalAmount),
        outstandingAmount: outstanding,
        daysOverdue,
        current: daysOverdue === 0 ? outstanding : 0,
        days1to30: daysOverdue >= 1 && daysOverdue <= 30 ? outstanding : 0,
        days31to60: daysOverdue >= 31 && daysOverdue <= 60 ? outstanding : 0,
        days61to90: daysOverdue >= 61 && daysOverdue <= 90 ? outstanding : 0,
        daysOver90: daysOverdue > 90 ? outstanding : 0,
      });
    }

    return agingItems;
  }

  async getTopCustomers(branchId?: string, limit = 10, period?: { start: string; end: string }) {
    const where: Prisma.SalesOrderWhereInput = { status: { not: 'CANCELLED' } };
    if (branchId) where.branchId = branchId;
    if (period) {
      where.createdAt = {
        gte: new Date(period.start),
        lte: new Date(period.end),
      };
    }

    return this.prisma.customer.findMany({
      where: branchId ? { branchId } : undefined,
      take: limit,
      orderBy: { balance: 'desc' },
      select: {
        id: true, customerCode: true, name: true, customerType: true,
        balance: true, creditLimit: true, salesRepId: true,
        _count: { select: { salesOrders: true } },
      },
    });
  }

  async checkCreditLimit(customerId: string, additionalAmount: number): Promise<{ allowed: boolean; availableCredit: number; currentBalance: number }> {
    const customer = await this.prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) throw new NotFoundException('Customer not found');

    const currentBalance = Number(customer.balance);
    const creditLimit = Number(customer.creditLimit);
    const availableCredit = Math.max(0, creditLimit - currentBalance);
    const allowed = currentBalance + additionalAmount <= creditLimit;

    return { allowed, availableCredit, currentBalance };
  }

  async updateBalance(customerId: string, amount: number) {
    await this.prisma.customer.update({
      where: { id: customerId },
      data: { balance: { increment: amount } },
    });
  }
}
