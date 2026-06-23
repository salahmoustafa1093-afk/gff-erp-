import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { LeadStatus, Prisma } from '@prisma/client';

const LEAD_STATUS_PIPELINE: LeadStatus[] = [
  LeadStatus.NEW,
  LeadStatus.CONTACTED,
  LeadStatus.QUALIFIED,
  LeadStatus.PROPOSAL,
  LeadStatus.NEGOTIATION,
];

@Injectable()
export class LeadsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateLeadDto, userId: string) {
    const lead = await this.prisma.lead.create({
      data: {
        name: dto.name,
        companyName: dto.companyName,
        jobTitle: dto.jobTitle,
        email: dto.email,
        phone: dto.phone,
        mobile: dto.mobile,
        website: dto.website,
        address: dto.address,
        city: dto.city,
        country: dto.country,
        industry: dto.industry,
        source: dto.source,
        sourceDetail: dto.sourceDetail,
        estimatedValue: dto.estimatedValue ?? 0,
        assignedToId: dto.assignedToId,
        branchId: dto.branchId,
        notes: dto.notes,
        tags: dto.tags,
        status: LeadStatus.NEW,
        score: 0,
        isConverted: false,
        createdById: userId,
      },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'LEAD.CREATE',
      userId,
      entityId: lead.id,
      entityType: 'Lead',
      details: { name: dto.name, companyName: dto.companyName, source: dto.source },
    });

    return lead;
  }

  async findAll(filter: LeadFilterDto) {
    const where: Prisma.LeadWhereInput = {};

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { companyName: { contains: filter.search, mode: 'insensitive' } },
        { email: { contains: filter.search, mode: 'insensitive' } },
        { phone: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.status) where.status = filter.status;
    if (filter.source) where.source = filter.source;
    if (filter.assignedToId) where.assignedToId = filter.assignedToId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.industry) where.industry = filter.industry;
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.LeadOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder ?? 'asc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const [data, total] = await Promise.all([
      this.prisma.lead.findMany({
        where, skip, take: limit, orderBy,
        include: {
          assignedTo: { select: { id: true, name: true, email: true } },
          branch: { select: { id: true, name: true } },
          customer: { select: { id: true, customerCode: true, name: true } },
          _count: { select: { activities: true } },
        },
      }),
      this.prisma.lead.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { id: true, name: true, email: true } },
        branch: { select: { id: true, name: true } },
        customer: { select: { id: true, customerCode: true, name: true } },
        activities: {
          orderBy: { scheduledAt: 'desc' },
          include: {
            assignedTo: { select: { id: true, name: true } },
          },
        },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!lead) throw new NotFoundException(`Lead '${id}' not found`);
    return lead;
  }

  async update(id: string, dto: UpdateLeadDto, userId: string) {
    await this.findOne(id);

    const lead = await this.prisma.lead.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        assignedTo: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'LEAD.UPDATE',
      userId,
      entityId: id,
      entityType: 'Lead',
      details: dto,
    });

    return lead;
  }

  async updateStatus(id: string, status: LeadStatus, userId: string) {
    const lead = await this.findOne(id);
    if (lead.isConverted) {
      throw new BadRequestException('Cannot change status of a converted lead');
    }
    if (status === LeadStatus.WON || status === LeadStatus.LOST) {
      throw new BadRequestException('Use convert endpoint for WON or use LOST endpoint');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: { status, updatedAt: new Date() },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'LEAD.STATUS_CHANGE',
      userId,
      entityId: id,
      entityType: 'Lead',
      details: { from: lead.status, to: status },
    });

    return updated;
  }

  async markLost(id: string, reason: string, userId: string) {
    const lead = await this.findOne(id);
    if (lead.isConverted) {
      throw new BadRequestException('Lead is already converted');
    }

    const updated = await this.prisma.lead.update({
      where: { id },
      data: {
        status: LeadStatus.LOST,
        lostReason: reason,
        lostAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'LEAD.LOST',
      userId,
      entityId: id,
      entityType: 'Lead',
      details: { reason },
    });

    return updated;
  }

  // ──────────────── CONVERSION ────────────────

  async convert(id: string, dto: ConvertLeadDto, userId: string) {
    const lead = await this.findOne(id);
    if (lead.isConverted) {
      throw new BadRequestException('Lead is already converted');
    }
    if (lead.status === LeadStatus.LOST) {
      throw new BadRequestException('Cannot convert a lost lead');
    }

    return this.prisma.$transaction(async (tx) => {
      // Generate customer code if not provided
      let customerCode = dto.customerCode;
      if (!customerCode) {
        const year = new Date().getFullYear();
        const seq = await tx.numberSequence.upsert({
          where: { key: `CUST-${year}` },
          update: { lastNumber: { increment: 1 } },
          create: { key: `CUST-${year}`, prefix: `C-${year}-`, lastNumber: 1 },
        });
        customerCode = `${seq.prefix}${String(seq.lastNumber).padStart(5, '0')}`;
      }

      // Check code uniqueness
      const existing = await tx.customer.findUnique({ where: { customerCode } });
      if (existing) throw new BadRequestException(`Customer code '${customerCode}' already exists`);

      // Create customer
      const customer = await tx.customer.create({
        data: {
          customerCode,
          name: dto.customerName || lead.name,
          contactPerson: lead.name,
          customerType: 'COMPANY',
          email: lead.email,
          phone: lead.phone,
          mobile: lead.mobile,
          website: lead.website,
          billingAddress: lead.address,
          city: lead.city,
          country: lead.country,
          industry: lead.industry,
          branchId: dto.branchId || lead.branchId,
          salesRepId: dto.salesRepId || lead.assignedToId,
          priceListId: dto.priceListId,
          paymentTerms: dto.paymentTerms ?? 30,
          creditLimit: dto.creditLimit ?? 0,
          currencyCode: 'USD',
          isActive: true,
          balance: 0,
          notes: `Converted from lead: ${lead.name}\n${lead.notes || ''}`,
        },
      });

      // Update lead
      const updatedLead = await tx.lead.update({
        where: { id },
        data: {
          status: LeadStatus.WON,
          isConverted: true,
          convertedAt: new Date(),
          convertedById: userId,
          customerId: customer.id,
          updatedAt: new Date(),
        },
      });

      // Create activity for conversion
      await tx.activity.create({
        data: {
          activityType: 'NOTE',
          subject: 'Lead Converted to Customer',
          description: `Lead ${lead.name} converted to customer ${customerCode}`,
          leadId: id,
          customerId: customer.id,
          status: 'COMPLETED',
          result: 'Converted successfully',
          createdById: userId,
        },
      });

      await this.audit.log({
        action: 'LEAD.CONVERT',
        userId,
        entityId: id,
        entityType: 'Lead',
        details: { customerId: customer.id, customerCode },
      });

      return { lead: updatedLead, customer };
    });
  }

  // ──────────────── PIPELINE ────────────────

  async getPipeline(branchId?: string, assignedToId?: string) {
    const where: Prisma.LeadWhereInput = {
      isConverted: false,
      status: { not: LeadStatus.LOST },
    };
    if (branchId) where.branchId = branchId;
    if (assignedToId) where.assignedToId = assignedToId;

    const leads = await this.prisma.lead.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true, name: true, companyName: true, status: true,
        estimatedValue: true, source: true, assignedToId: true,
        createdAt: true, updatedAt: true, priority: true,
      },
    });

    const grouped: Record<string, typeof leads> = {};
    for (const status of LEAD_STATUS_PIPELINE) {
      grouped[status] = leads.filter(l => l.status === status);
    }

    const summary = {
      total: leads.length,
      totalValue: leads.reduce((s, l) => s + Number(l.estimatedValue), 0),
      byStatus: LEAD_STATUS_PIPELINE.map(status => ({
        status,
        count: grouped[status]?.length || 0,
        value: grouped[status]?.reduce((s, l) => s + Number(l.estimatedValue), 0) || 0,
      })),
    };

    return { stages: LEAD_STATUS_PIPELINE, data: grouped, summary };
  }

  async moveInPipeline(id: string, direction: 'forward' | 'backward', userId: string) {
    const lead = await this.findOne(id);
    if (lead.isConverted) throw new BadRequestException('Lead already converted');

    const currentIndex = LEAD_STATUS_PIPELINE.indexOf(lead.status);
    if (currentIndex === -1) throw new BadRequestException('Invalid current status');

    let newIndex: number;
    if (direction === 'forward') {
      newIndex = Math.min(currentIndex + 1, LEAD_STATUS_PIPELINE.length - 1);
    } else {
      newIndex = Math.max(currentIndex - 1, 0);
    }

    const newStatus = LEAD_STATUS_PIPELINE[newIndex];
    return this.updateStatus(id, newStatus, userId);
  }

  // ──────────────── REPORTING ────────────────

  async getConversionReport(branchId?: string, startDate?: string, endDate?: string) {
    const where: Prisma.LeadWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [total, converted, won, lost] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.count({ where: { ...where, isConverted: true } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.WON } }),
      this.prisma.lead.count({ where: { ...where, status: LeadStatus.LOST } }),
    ]);

    // By source
    const bySource = await this.prisma.lead.groupBy({
      by: ['source'],
      where,
      _count: { id: true },
    });

    const convertedBySource = await this.prisma.lead.groupBy({
      by: ['source'],
      where: { ...where, isConverted: true },
      _count: { id: true },
    });

    return {
      total,
      converted,
      won,
      lost,
      conversionRate: total > 0 ? (converted / total) * 100 : 0,
      bySource: bySource.map(s => ({
        source: s.source,
        total: s._count.id,
        converted: convertedBySource.find(c => c.source === s.source)?._count.id || 0,
      })),
    };
  }

  async getTopLeads(branchId?: string, limit = 10) {
    return this.prisma.lead.findMany({
      where: {
        isConverted: false,
        status: { not: LeadStatus.LOST },
        ...(branchId ? { branchId } : {}),
      },
      take: limit,
      orderBy: { estimatedValue: 'desc' },
      include: {
        assignedTo: { select: { id: true, name: true } },
        _count: { select: { activities: true } },
      },
    });
  }

  // ──────────────── DELETE ────────────────

  async remove(id: string, userId: string) {
    const lead = await this.findOne(id);
    if (lead.isConverted) {
      throw new BadRequestException('Cannot delete a converted lead');
    }

    await this.prisma.lead.delete({ where: { id } });

    await this.audit.log({
      action: 'LEAD.DELETE',
      userId,
      entityId: id,
      entityType: 'Lead',
    });

    return { message: 'Lead deleted successfully' };
  }
}
