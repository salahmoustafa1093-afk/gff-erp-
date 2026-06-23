import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityFilterDto } from './dto/activity-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async createActivity(dto: CreateActivityDto, userId: string) {
    const activity = await this.prisma.activity.create({
      data: {
        activityType: dto.activityType,
        subject: dto.subject,
        description: dto.description,
        leadId: dto.leadId,
        customerId: dto.customerId,
        salesOrderId: dto.salesOrderId,
        assignedToId: dto.assignedToId,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        priority: dto.priority || 'MEDIUM',
        status: dto.status || 'PENDING',
        result: dto.result,
        branchId: dto.branchId,
        notes: dto.notes,
        createdById: userId,
      },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'ACTIVITY.CREATE',
      userId,
      entityId: activity.id,
      entityType: 'Activity',
      details: { activityType: dto.activityType, subject: dto.subject },
    });

    return activity;
  }

  async findAllActivities(filter: ActivityFilterDto) {
    const where: Prisma.ActivityWhereInput = {};

    if (filter.activityType) where.activityType = filter.activityType;
    if (filter.status) where.status = filter.status;
    if (filter.priority) where.priority = filter.priority;
    if (filter.leadId) where.leadId = filter.leadId;
    if (filter.customerId) where.customerId = filter.customerId;
    if (filter.assignedToId) where.assignedToId = filter.assignedToId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.startDate || filter.endDate) {
      where.scheduledAt = {};
      if (filter.startDate) where.scheduledAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.scheduledAt.lte = new Date(filter.endDate);
    }
    if (filter.overdue === true) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const orderBy: Prisma.ActivityOrderByWithRelationInput = {};
    if (filter.sortBy) {
      orderBy[filter.sortBy] = filter.sortOrder ?? 'asc';
    } else {
      orderBy.scheduledAt = 'asc';
    }

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where, skip, take: limit, orderBy,
        include: {
          lead: { select: { id: true, name: true } },
          customer: { select: { id: true, name: true } },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOneActivity(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        lead: { select: { id: true, name: true, status: true } },
        customer: { select: { id: true, name: true, customerCode: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        createdBy: { select: { id: true, name: true } },
      },
    });

    if (!activity) throw new NotFoundException(`Activity '${id}' not found`);
    return activity;
  }

  async updateActivity(id: string, dto: UpdateActivityDto, userId: string) {
    await this.findOneActivity(id);

    const activity = await this.prisma.activity.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'ACTIVITY.UPDATE',
      userId,
      entityId: id,
      entityType: 'Activity',
      details: dto,
    });

    return activity;
  }

  async completeActivity(id: string, result: string, userId: string) {
    await this.findOneActivity(id);

    const activity = await this.prisma.activity.update({
      where: { id },
      data: { status: 'COMPLETED', result, completedAt: new Date(), updatedAt: new Date() },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'ACTIVITY.COMPLETE',
      userId,
      entityId: id,
      entityType: 'Activity',
      details: { result },
    });

    return activity;
  }

  async removeActivity(id: string, userId: string) {
    await this.findOneActivity(id);

    await this.prisma.activity.delete({ where: { id } });

    await this.audit.log({
      action: 'ACTIVITY.DELETE',
      userId,
      entityId: id,
      entityType: 'Activity',
    });

    return { message: 'Activity deleted successfully' };
  }

  async getOverdueActivities(assignedToId?: string, branchId?: string) {
    const where: Prisma.ActivityWhereInput = {
      dueDate: { lt: new Date() },
      status: { notIn: ['COMPLETED', 'CANCELLED'] },
    };
    if (assignedToId) where.assignedToId = assignedToId;
    if (branchId) where.branchId = branchId;

    return this.prisma.activity.findMany({
      where,
      orderBy: { dueDate: 'asc' },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
        assignedTo: { select: { id: true, name: true } },
      },
    });
  }

  async getActivitiesByUser(userId: string, startDate?: string, endDate?: string) {
    const where: Prisma.ActivityWhereInput = {
      assignedToId: userId,
    };

    if (startDate || endDate) {
      where.scheduledAt = {};
      if (startDate) where.scheduledAt.gte = new Date(startDate);
      if (endDate) where.scheduledAt.lte = new Date(endDate);
    }

    return this.prisma.activity.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async getActivityCalendar(userId: string, month: number, year: number) {
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    return this.prisma.activity.findMany({
      where: {
        assignedToId: userId,
        scheduledAt: { gte: startOfMonth, lte: endOfMonth },
        status: { notIn: ['CANCELLED'] },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        lead: { select: { id: true, name: true } },
        customer: { select: { id: true, name: true } },
      },
    });
  }

  async getActivitySummary(userId: string) {
    const [total, pending, completed, overdue] = await Promise.all([
      this.prisma.activity.count({ where: { assignedToId: userId } }),
      this.prisma.activity.count({ where: { assignedToId: userId, status: 'PENDING' } }),
      this.prisma.activity.count({ where: { assignedToId: userId, status: 'COMPLETED' } }),
      this.prisma.activity.count({
        where: {
          assignedToId: userId,
          dueDate: { lt: new Date() },
          status: { notIn: ['COMPLETED', 'CANCELLED'] },
        },
      }),
    ]);

    return { total, pending, completed, overdue };
  }
}
