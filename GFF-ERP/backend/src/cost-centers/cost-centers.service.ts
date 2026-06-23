import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import {
  CostCenter,
  CostCenterType,
  CostCenterStatus,
  CostCenterAllocation,
} from './interfaces/cost-center.interface';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';

@Injectable()
export class CostCentersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateCostCenterDto, userId: string): Promise<CostCenter> {
    const existing = await this.prisma.costCenter.findUnique({
      where: { code_branchId: { code: dto.code, branchId: dto.branchId } },
    });
    if (existing) {
      throw new ConflictException(
        `Cost center with code ${dto.code} already exists in this branch`,
      );
    }

    let level = 1;
    let path = dto.code;

    if (dto.parentId) {
      const parent = await this.prisma.costCenter.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent cost center ${dto.parentId} not found`);
      }
      level = parent.level + 1;
      path = `${parent.path}.${dto.code}`;
    }

    const cc = await this.prisma.costCenter.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameAr: dto.nameAr || null,
        type: dto.type,
        parentId: dto.parentId || null,
        branchId: dto.branchId,
        description: dto.description || null,
        budgetAmount: dto.budgetAmount
          ? new Prisma.Decimal(dto.budgetAmount)
          : null,
        status: CostCenterStatus.ACTIVE,
        level,
        path,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.auditService.log({
      action: 'COST_CENTER_CREATE',
      entity: 'CostCenter',
      entityId: cc.id,
      userId,
      branchId: dto.branchId,
      details: { code: dto.code, name: dto.name, type: dto.type },
    });

    return this.mapToInterface(cc);
  }

  async findAll(branchId?: string): Promise<CostCenter[]> {
    const where: Prisma.CostCenterWhereInput = {};
    if (branchId) where.branchId = branchId;

    const centers = await this.prisma.costCenter.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });

    return centers.map((c) => this.mapToInterface(c));
  }

  async findTree(branchId?: string): Promise<CostCenter[]> {
    const where: Prisma.CostCenterWhereInput = {};
    if (branchId) where.branchId = branchId;

    const centers = await this.prisma.costCenter.findMany({
      where,
      orderBy: [{ path: 'asc' }],
    });

    const centerMap = new Map<string, CostCenter>();
    const roots: CostCenter[] = [];

    for (const c of centers) {
      const cc = this.mapToInterface(c);
      cc.children = [];
      centerMap.set(c.id, cc);
    }

    for (const c of centers) {
      const node = centerMap.get(c.id)!;
      if (c.parentId && centerMap.has(c.parentId)) {
        const parent = centerMap.get(c.parentId)!;
        parent.children!.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(id: string, branchId?: string): Promise<CostCenter> {
    const cc = await this.prisma.costCenter.findUnique({ where: { id } });
    if (!cc) {
      throw new NotFoundException(`Cost center ${id} not found`);
    }
    if (branchId && cc.branchId !== branchId) {
      throw new ForbiddenException('Cost center does not belong to this branch');
    }
    return this.mapToInterface(cc);
  }

  async update(
    id: string,
    dto: UpdateCostCenterDto,
    userId: string,
  ): Promise<CostCenter> {
    const existing = await this.prisma.costCenter.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Cost center ${id} not found`);
    }

    const data: Prisma.CostCenterUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr || null;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.budgetAmount !== undefined) {
      data.budgetAmount = dto.budgetAmount
        ? new Prisma.Decimal(dto.budgetAmount)
        : null;
    }
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Cost center cannot be its own parent');
      }
      if (dto.parentId) {
        const parent = await this.prisma.costCenter.findUnique({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(`Parent cost center ${dto.parentId} not found`);
        }
        data.parentId = dto.parentId;
        data.level = parent.level + 1;
        data.path = `${parent.path}.${existing.code}`;
      } else {
        data.parentId = null;
        data.level = 1;
        data.path = existing.code;
      }
    }

    data.updatedBy = userId;

    const updated = await this.prisma.costCenter.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      action: 'COST_CENTER_UPDATE',
      entity: 'CostCenter',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: dto,
    });

    return this.mapToInterface(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.costCenter.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Cost center ${id} not found`);
    }

    const childrenCount = await this.prisma.costCenter.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException('Cannot delete cost center with children');
    }

    const journalLinesCount = await this.prisma.journalEntryLine.count({
      where: { costCenterId: id },
    });
    if (journalLinesCount > 0) {
      throw new BadRequestException(
        'Cannot delete cost center with journal entry allocations',
      );
    }

    await this.prisma.costCenter.delete({ where: { id } });

    await this.auditService.log({
      action: 'COST_CENTER_DELETE',
      entity: 'CostCenter',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { code: existing.code, name: existing.name },
    });
  }

  async getAllocationReport(
    startDate: Date,
    endDate: Date,
    branchId?: string,
  ): Promise<CostCenterAllocation[]> {
    const where: Prisma.JournalEntryLineWhereInput = {
      journalEntry: {
        status: 'POSTED',
        date: { gte: startDate, lte: endDate },
      },
      costCenterId: { not: null },
    };

    if (branchId) {
      where.journalEntry = {
        ...where.journalEntry,
        branchId,
      };
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where,
      include: { costCenter: true },
    });

    const allocationMap = new Map<string, CostCenterAllocation>();
    let grandTotal = new Decimal(0);

    for (const line of lines) {
      if (!line.costCenter) continue;
      const ccId = line.costCenter.id;
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());

      if (!allocationMap.has(ccId)) {
        allocationMap.set(ccId, {
          costCenterId: ccId,
          costCenterName: line.costCenter.name,
          totalDebits: 0,
          totalCredits: 0,
          netAmount: 0,
          percentageOfTotal: 0,
        });
      }

      const alloc = allocationMap.get(ccId)!;
      alloc.totalDebits = new Decimal(alloc.totalDebits).plus(debit).toNumber();
      alloc.totalCredits = new Decimal(alloc.totalCredits).plus(credit).toNumber();
      const net = new Decimal(alloc.netAmount).plus(debit).minus(credit);
      alloc.netAmount = net.toNumber();
      grandTotal = grandTotal.plus(debit).plus(credit);
    }

    const result = Array.from(allocationMap.values());

    if (grandTotal.greaterThan(0)) {
      for (const alloc of result) {
        alloc.percentageOfTotal = new Decimal(alloc.totalDebits)
          .plus(alloc.totalCredits)
          .dividedBy(grandTotal)
          .times(100)
          .toDecimalPlaces(2)
          .toNumber();
      }
    }

    return result.sort((a, b) => b.netAmount - a.netAmount);
  }

  private mapToInterface(cc: {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
    type: string;
    parentId: string | null;
    branchId: string;
    description: string | null;
    budgetAmount: Prisma.Decimal | null;
    status: string;
    level: number;
    path: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }): CostCenter {
    return {
      id: cc.id,
      code: cc.code,
      name: cc.name,
      nameAr: cc.nameAr,
      type: cc.type as CostCenterType,
      parentId: cc.parentId,
      branchId: cc.branchId,
      description: cc.description,
      budgetAmount: cc.budgetAmount ? cc.budgetAmount.toNumber() : null,
      status: cc.status as CostCenterStatus,
      level: cc.level,
      path: cc.path,
      createdAt: cc.createdAt,
      updatedAt: cc.updatedAt,
      createdBy: cc.createdBy,
      updatedBy: cc.updatedBy,
    };
  }
}
