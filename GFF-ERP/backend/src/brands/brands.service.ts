import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateBrandDto } from './dto/create-brand.dto';
import { UpdateBrandDto } from './dto/update-brand.dto';
import { Brand } from './entities/brand.entity';

@Injectable()
export class BrandsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateBrandDto, branchId: string, userId: string): Promise<Brand> {
    const existing = await this.prisma.brand.findFirst({
      where: {
        OR: [{ name: dto.name }, ...(dto.code ? [{ code: dto.code }] : [])],
        branchId,
      },
    });

    if (existing) {
      throw new ConflictException('Brand with this name or code already exists');
    }

    const brand = await this.prisma.brand.create({
      data: {
        name: dto.name,
        code: dto.code ?? null,
        description: dto.description ?? null,
        logoUrl: dto.logoUrl ?? null,
        countryOfOrigin: dto.countryOfOrigin ?? null,
        email: dto.email ?? null,
        phone: dto.phone ?? null,
        website: dto.website ?? null,
        isActive: dto.isActive ?? true,
        notes: dto.notes ?? null,
        branchId,
      },
      include: { _count: { select: { products: true } } },
    });

    await this.audit.log({
      action: 'BRAND.CREATE',
      userId,
      branchId,
      resourceId: brand.id,
      resourceType: 'Brand',
      details: `Created brand: ${dto.name}`,
    });

    return brand as Brand;
  }

  async findAll(branchId: string, includeInactive = false, search?: string): Promise<Brand[]> {
    const brands = await this.prisma.brand.findMany({
      where: {
        branchId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { code: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });

    return brands as Brand[];
  }

  async findOne(id: string, branchId: string): Promise<Brand> {
    const brand = await this.prisma.brand.findFirst({
      where: { id, branchId },
      include: { _count: { select: { products: true } } },
    });

    if (!brand) {
      throw new NotFoundException(`Brand with ID ${id} not found`);
    }

    return brand as Brand;
  }

  async getBrandProducts(id: string, branchId: string) {
    await this.findOne(id, branchId);

    return this.prisma.product.findMany({
      where: { brandId: id, branchId },
      include: {
        category: true,
        unit: true,
        inventory: { include: { warehouse: true } },
      },
    });
  }

  async update(id: string, dto: UpdateBrandDto, branchId: string, userId: string): Promise<Brand> {
    await this.findOne(id, branchId);

    if (dto.name || dto.code) {
      const existing = await this.prisma.brand.findFirst({
        where: {
          OR: [
            ...(dto.name ? [{ name: dto.name }] : []),
            ...(dto.code ? [{ code: dto.code }] : []),
          ],
          NOT: { id },
          branchId,
        },
      });

      if (existing) {
        throw new ConflictException('Brand with this name or code already exists');
      }
    }

    const brand = await this.prisma.brand.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: { _count: { select: { products: true } } },
    });

    await this.audit.log({
      action: 'BRAND.UPDATE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Brand',
      details: `Updated brand: ${dto.name ?? id}`,
    });

    return brand as Brand;
  }

  async remove(id: string, branchId: string, userId: string): Promise<void> {
    const brand = await this.findOne(id, branchId);

    const productCount = await this.prisma.product.count({
      where: { brandId: id, branchId },
    });

    if (productCount > 0) {
      await this.prisma.brand.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } else {
      await this.prisma.brand.delete({ where: { id } });
    }

    await this.audit.log({
      action: 'BRAND.DELETE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Brand',
      details: `Deleted brand: ${brand.name} (${productCount > 0 ? 'deactivated' : 'hard deleted'})`,
    });
  }
}
