import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateCategoryDto, branchId: string, userId: string): Promise<Category> {
    const existing = await this.prisma.category.findFirst({
      where: {
        name: dto.name,
        branchId,
      },
    });

    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    let level = 1;
    if (dto.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, branchId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category ${dto.parentId} not found`);
      }
      level = parent.level + 1;
    }

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        code: dto.code ?? null,
        description: dto.description ?? null,
        parentId: dto.parentId ?? null,
        level,
        sortOrder: dto.sortOrder ?? 0,
        imageUrl: dto.imageUrl ?? null,
        colorCode: dto.colorCode ?? null,
        isActive: dto.isActive ?? true,
        notes: dto.notes ?? null,
        branchId,
      },
      include: {
        parent: true,
        _count: { select: { products: true, children: true } },
      },
    });

    await this.audit.log({
      action: 'CATEGORY.CREATE',
      userId,
      branchId,
      resourceId: category.id,
      resourceType: 'Category',
      details: `Created category: ${dto.name}${dto.parentId ? ` under parent ${dto.parentId}` : ''}`,
    });

    return category as Category;
  }

  async findAll(
    branchId: string,
    includeInactive = false,
    parentId?: string,
    search?: string,
  ): Promise<Category[]> {
    const categories = await this.prisma.category.findMany({
      where: {
        branchId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(parentId !== undefined
          ? { parentId: parentId === 'null' ? null : parentId }
          : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' as const } },
                { code: { contains: search, mode: 'insensitive' as const } },
              ],
            }
          : {}),
      },
      include: {
        parent: true,
        _count: { select: { products: true, children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories as Category[];
  }

  async getTree(branchId: string): Promise<Category[]> {
    const allCategories = await this.prisma.category.findMany({
      where: { branchId, isActive: true },
      include: {
        _count: { select: { products: true, children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    const categoryMap = new Map<string, Category & { children?: Category[] }>();
    const roots: Category[] = [];

    for (const cat of allCategories) {
      categoryMap.set(cat.id, { ...cat, children: [] });
    }

    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async findOne(id: string, branchId: string): Promise<Category> {
    const category = await this.prisma.category.findFirst({
      where: { id, branchId },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true, children: true } },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category as Category;
  }

  async getChildren(id: string, branchId: string): Promise<Category[]> {
    await this.findOne(id, branchId);

    const children = await this.prisma.category.findMany({
      where: { parentId: id, branchId, isActive: true },
      include: {
        _count: { select: { products: true, children: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return children as Category[];
  }

  async getCategoryProducts(id: string, branchId: string) {
    const category = await this.findOne(id, branchId);

    const allCategoryIds = await this.getAllDescendantIds(id, branchId);
    allCategoryIds.push(id);

    return this.prisma.product.findMany({
      where: {
        categoryId: { in: allCategoryIds },
        branchId,
      },
      include: {
        category: true,
        brand: true,
        unit: true,
        inventory: {
          include: { warehouse: true },
        },
      },
    });
  }

  private async getAllDescendantIds(categoryId: string, branchId: string): Promise<string[]> {
    const children = await this.prisma.category.findMany({
      where: { parentId: categoryId, branchId },
      select: { id: true },
    });

    const ids: string[] = [];
    for (const child of children) {
      ids.push(child.id);
      const descendants = await this.getAllDescendantIds(child.id, branchId);
      ids.push(...descendants);
    }

    return ids;
  }

  async update(id: string, dto: UpdateCategoryDto, branchId: string, userId: string): Promise<Category> {
    const category = await this.findOne(id, branchId);

    if (dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
          branchId,
        },
      });

      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    if (dto.parentId && dto.parentId === id) {
      throw new BadRequestException('Category cannot be its own parent');
    }

    if (dto.parentId && dto.parentId !== category.parentId) {
      const parent = await this.prisma.category.findFirst({
        where: { id: dto.parentId, branchId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent category ${dto.parentId} not found`);
      }

      const descendantIds = await this.getAllDescendantIds(id, branchId);
      if (descendantIds.includes(dto.parentId)) {
        throw new BadRequestException('Cannot set a descendant as parent');
      }

      dto.level = parent.level + 1;
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        parent: true,
        children: true,
        _count: { select: { products: true, children: true } },
      },
    });

    await this.audit.log({
      action: 'CATEGORY.UPDATE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Category',
      details: `Updated category: ${dto.name ?? id}`,
    });

    return updated as Category;
  }

  async remove(id: string, branchId: string, userId: string): Promise<void> {
    const category = await this.findOne(id, branchId);

    const childCount = await this.prisma.category.count({
      where: { parentId: id, branchId },
    });

    if (childCount > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${childCount} subcategories. Delete subcategories first.`,
      );
    }

    const productCount = await this.prisma.product.count({
      where: { categoryId: id, branchId },
    });

    if (productCount > 0) {
      await this.prisma.category.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } else {
      await this.prisma.category.delete({ where: { id } });
    }

    await this.audit.log({
      action: 'CATEGORY.DELETE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Category',
      details: `Deleted category: ${category.name} (${productCount > 0 ? 'deactivated' : 'hard deleted'})`,
    });
  }
}
