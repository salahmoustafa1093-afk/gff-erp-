import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateUnitDto, branchId: string, userId: string): Promise<Unit> {
    const existing = await this.prisma.unit.findFirst({
      where: {
        OR: [{ name: dto.name }, { abbreviation: dto.abbreviation }],
        branchId,
        isActive: true,
      },
    });

    if (existing) {
      throw new ConflictException('Unit with this name or abbreviation already exists');
    }

    const unit = await this.prisma.unit.create({
      data: {
        name: dto.name,
        abbreviation: dto.abbreviation,
        code: dto.code ?? dto.abbreviation.toLowerCase(),
        conversionFactor: dto.conversionFactor ?? 1,
        baseUnitId: dto.baseUnitId ?? null,
        isBaseUnit: dto.isBaseUnit ?? !dto.baseUnitId,
        type: dto.type ?? null,
        decimalPlaces: dto.decimalPlaces ?? 2,
        isActive: dto.isActive ?? true,
        notes: dto.notes ?? null,
        branchId,
      },
      include: { baseUnit: true, derivedUnits: true },
    });

    await this.audit.log({
      action: 'UNIT.CREATE',
      userId,
      branchId,
      resourceId: unit.id,
      resourceType: 'Unit',
      details: `Created unit: ${dto.name} (${dto.abbreviation})`,
    });

    return unit as Unit;
  }

  async findAll(branchId: string, includeInactive = false, type?: string): Promise<Unit[]> {
    const units = await this.prisma.unit.findMany({
      where: {
        branchId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(type ? { type } : {}),
      },
      include: { baseUnit: true, derivedUnits: true },
      orderBy: { name: 'asc' },
    });

    return units as Unit[];
  }

  async findOne(id: string, branchId: string): Promise<Unit> {
    const unit = await this.prisma.unit.findFirst({
      where: { id, branchId },
      include: { baseUnit: true, derivedUnits: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    return unit as Unit;
  }

  async findByCode(code: string, branchId: string): Promise<Unit> {
    const unit = await this.prisma.unit.findFirst({
      where: { code, branchId, isActive: true },
      include: { baseUnit: true },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with code ${code} not found`);
    }

    return unit as Unit;
  }

  async update(id: string, dto: UpdateUnitDto, branchId: string, userId: string): Promise<Unit> {
    await this.findOne(id, branchId);

    if (dto.name || dto.abbreviation) {
      const existing = await this.prisma.unit.findFirst({
        where: {
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.abbreviation ? [{ abbreviation: dto.abbreviation }] : []),
          ],
          NOT: { id },
          branchId,
          isActive: true,
        },
      });

      if (existing) {
        throw new ConflictException('Unit with this name or abbreviation already exists');
      }
    }

    const unit = await this.prisma.unit.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: { baseUnit: true, derivedUnits: true },
    });

    await this.audit.log({
      action: 'UNIT.UPDATE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Unit',
      details: `Updated unit: ${dto.name ?? id}`,
    });

    return unit as Unit;
  }

  async remove(id: string, branchId: string, userId: string): Promise<void> {
    const unit = await this.findOne(id, branchId);

    const productCount = await this.prisma.product.count({
      where: { unitId: id, branchId },
    });

    if (productCount > 0) {
      await this.prisma.unit.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } else {
      await this.prisma.unit.delete({ where: { id } });
    }

    await this.audit.log({
      action: 'UNIT.DELETE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Unit',
      details: `Deleted unit: ${unit.name} (${productCount > 0 ? 'deactivated' : 'hard deleted'})`,
    });
  }

  async getBaseUnits(branchId: string): Promise<Unit[]> {
    const units = await this.prisma.unit.findMany({
      where: { branchId, isBaseUnit: true, isActive: true },
      include: { derivedUnits: true },
      orderBy: { name: 'asc' },
    });

    return units as Unit[];
  }
}
