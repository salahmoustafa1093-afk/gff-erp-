import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { Branch } from './entities/branch.entity';

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateBranchDto, userId: string): Promise<Branch> {
    const existing = await this.prisma.branch.findFirst({
      where: {
        OR: [{ name: dto.name }, ...(dto.code ? [{ code: dto.code }] : [])],
      },
    });

    if (existing) {
      throw new ConflictException('Branch with this name or code already exists');
    }

    const branch = await this.prisma.branch.create({
      data: {
        name: dto.name,
        code: dto.code ?? null,
        address1: dto.address1 ?? null,
        address2: dto.address2 ?? null,
        city: dto.city ?? null,
        region: dto.region ?? null,
        country: dto.country ?? 'Morocco',
        postalCode: dto.postalCode ?? null,
        phone: dto.phone ?? null,
        email: dto.email ?? null,
        managerId: dto.managerId ?? null,
        isActive: dto.isActive ?? true,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        notes: dto.notes ?? null,
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: { warehouses: true, employees: true, salesOrders: true },
        },
      },
    });

    await this.audit.log({
      action: 'BRANCH.CREATE',
      userId,
      branchId: branch.id,
      resourceId: branch.id,
      resourceType: 'Branch',
      details: `Created branch: ${dto.name}`,
    });

    return branch as Branch;
  }

  async findAll(
    branchId?: string,
    includeInactive = false,
    search?: string,
  ): Promise<Branch[]> {
    const branches = await this.prisma.branch.findMany({
      where: {
        ...(branchId ? { id: branchId } : {}),
        ...(includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { code: { contains: search, mode: 'insensitive' as const } },
                { city: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: { warehouses: true, employees: true, salesOrders: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return branches as Branch[];
  }

  async findOne(id: string, branchId?: string): Promise<Branch> {
    const where = branchId ? { id, AND: [{ id: branchId }] } : { id };

    const branch = await this.prisma.branch.findFirst({
      where,
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: { warehouses: true, employees: true, salesOrders: true },
        },
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch as Branch;
  }

  async getStatistics(id: string, branchId?: string): Promise<{
    branch: Branch;
    warehouses: number;
    employees: number;
    salesThisMonth: number;
    totalInventoryValue: number;
    lowStockItems: number;
  }> {
    const branch = await this.findOne(id, branchId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [warehouses, employees, salesThisMonth, inventoryAgg, lowStockItems] =
      await Promise.all([
        this.prisma.warehouse.count({ where: { branchId: id } }),
        this.prisma.user.count({ where: { branchId: id, isActive: true } }),
        this.prisma.salesOrder.count({
          where: {
            branchId: id,
            createdAt: { gte: startOfMonth },
          },
        }),
        this.prisma.inventory.aggregate({
          where: { branchId: id },
          _sum: { totalValue: true },
        }),
        this.prisma.inventory.count({
          where: {
            branchId: id,
            quantityOnHand: { lte: this.prisma.inventory.fields.reorderPoint },
          },
        }),
      ]);

    return {
      branch,
      warehouses,
      employees,
      salesThisMonth,
      totalInventoryValue: inventoryAgg._sum.totalValue?.toNumber() ?? 0,
      lowStockItems,
    };
  }

  async update(id: string, dto: UpdateBranchDto, userId: string): Promise<Branch> {
    await this.findOne(id);

    if (dto.name || dto.code) {
      const existing = await this.prisma.branch.findFirst({
        where: {
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.code ? [{ code: dto.code }] : []),
          ],
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException('Branch with this name or code already exists');
      }
    }

    const branch = await this.prisma.branch.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: { warehouses: true, employees: true, salesOrders: true },
        },
      },
    });

    await this.audit.log({
      action: 'BRANCH.UPDATE',
      userId,
      branchId: id,
      resourceId: id,
      resourceType: 'Branch',
      details: `Updated branch: ${dto.name ?? id}`,
    });

    return branch as Branch;
  }

  async assignManager(
    id: string,
    managerId: string,
    userId: string,
  ): Promise<Branch> {
    await this.findOne(id);

    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
    });

    if (!manager) {
      throw new NotFoundException(`User with ID ${managerId} not found`);
    }

    const branch = await this.prisma.branch.update({
      where: { id },
      data: { managerId, updatedAt: new Date() },
      include: {
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: {
          select: { warehouses: true, employees: true, salesOrders: true },
        },
      },
    });

    await this.audit.log({
      action: 'BRANCH.ASSIGN_MANAGER',
      userId,
      branchId: id,
      resourceId: id,
      resourceType: 'Branch',
      details: `Assigned manager ${manager.firstName} ${manager.lastName} to branch ${branch.name}`,
    });

    return branch as Branch;
  }

  async remove(id: string, userId: string): Promise<void> {
    const branch = await this.findOne(id);

    const warehouseCount = await this.prisma.warehouse.count({
      where: { branchId: id },
    });

    if (warehouseCount > 0) {
      await this.prisma.branch.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } else {
      await this.prisma.branch.delete({ where: { id } });
    }

    await this.audit.log({
      action: 'BRANCH.DELETE',
      userId,
      branchId: id,
      resourceId: id,
      resourceType: 'Branch',
      details: `Deleted branch: ${branch.name} (${warehouseCount > 0 ? 'deactivated' : 'hard deleted'})`,
    });
  }
}
