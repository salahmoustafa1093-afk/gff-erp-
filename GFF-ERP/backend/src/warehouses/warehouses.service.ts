import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseStockFilterDto } from './dto/warehouse-stock.dto';
import { Warehouse, WarehouseInventoryItem } from './entities/warehouse.entity';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateWarehouseDto, branchId: string, userId: string): Promise<Warehouse> {
    const existing = await this.prisma.warehouse.findFirst({
      where: {
        OR: [{ name: dto.name }, ...(dto.code ? [{ code: dto.code }] : [])],
        branchId,
      },
    });

    if (existing) {
      throw new ConflictException('Warehouse with this name or code already exists');
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        code: dto.code ?? null,
        type: dto.type,
        branchId,
        address: dto.address ?? null,
        city: dto.city ?? null,
        maxCapacity: dto.maxCapacity ?? null,
        currentUsage: dto.currentUsage ?? 0,
        temperatureControl: dto.temperatureControl ?? null,
        isActive: dto.isActive ?? true,
        description: dto.description ?? null,
        managerName: dto.managerName ?? null,
        phone: dto.phone ?? null,
        allowNegativeStock: dto.allowNegativeStock ?? false,
        notes: dto.notes ?? null,
      },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: { inventory: true, sourceMovements: true, destinationMovements: true },
        },
      },
    });

    await this.audit.log({
      action: 'WAREHOUSE.CREATE',
      userId,
      branchId,
      resourceId: warehouse.id,
      resourceType: 'Warehouse',
      details: `Created warehouse: ${dto.name} (${dto.type})`,
    });

    return warehouse as Warehouse;
  }

  async findAll(
    branchId: string,
    includeInactive = false,
    type?: string,
    search?: string,
  ): Promise<Warehouse[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      where: {
        branchId,
        ...(includeInactive ? {} : { isActive: true }),
        ...(type ? { type } : {}),
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
        branch: { select: { id: true, name: true } },
        _count: {
          select: { inventory: true, sourceMovements: true, destinationMovements: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return warehouses as Warehouse[];
  }

  async findOne(id: string, branchId: string): Promise<Warehouse> {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, branchId },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: { inventory: true, sourceMovements: true, destinationMovements: true },
        },
      },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return warehouse as Warehouse;
  }

  async getWarehouseStock(
    id: string,
    branchId: string,
    filter: WarehouseStockFilterDto,
  ): Promise<{
    items: WarehouseInventoryItem[];
    total: number;
    page: number;
    limit: number;
    summary: { totalItems: number; totalValue: number; lowStockCount: number };
  }> {
    await this.findOne(id, branchId);

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {
      warehouseId: id,
      branchId,
    };

    if (filter.productId) {
      where.productId = filter.productId;
    }

    if (filter.categoryId) {
      where.product = { categoryId: filter.categoryId };
    }

    if (filter.search) {
      where.product = {
        ...(where.product as Record<string, unknown> || {}),
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          { sku: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      };
    }

    if (filter.lowStock) {
      where.quantityOnHand = { lte: { reorderPoint: true } };
    }

    const [inventory, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              brand: { select: { id: true, name: true } },
              unit: { select: { id: true, name: true, abbreviation: true } },
            },
          },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    const allInventoryForSummary = await this.prisma.inventory.findMany({
      where: { warehouseId: id, branchId },
      select: {
        quantityOnHand: true,
        totalValue: true,
        reorderPoint: true,
      },
    });

    const items: WarehouseInventoryItem[] = inventory.map((inv) => ({
      id: inv.id,
      productId: inv.productId,
      product: inv.product,
      quantityOnHand: inv.quantityOnHand.toNumber(),
      quantityReserved: inv.quantityReserved.toNumber(),
      quantityAvailable: inv.quantityOnHand.toNumber() - inv.quantityReserved.toNumber(),
      averageCost: inv.averageCost.toNumber(),
      totalValue: inv.totalValue.toNumber(),
      reorderPoint: inv.reorderPoint.toNumber(),
      reorderQuantity: inv.reorderQuantity.toNumber(),
      expiryDate: inv.expiryDate,
      lastMovementDate: inv.lastMovementDate,
      isLowStock: inv.quantityOnHand.lessThanOrEqualTo(inv.reorderPoint),
    }));

    const summary = {
      totalItems: allInventoryForSummary.length,
      totalValue: allInventoryForSummary.reduce((sum, inv) => sum + inv.totalValue.toNumber(), 0),
      lowStockCount: allInventoryForSummary.filter((inv) =>
        inv.quantityOnHand.lessThanOrEqualTo(inv.reorderPoint),
      ).length,
    };

    return { items, total, page, limit, summary };
  }

  async getCapacityReport(id: string, branchId: string) {
    const warehouse = await this.findOne(id, branchId);

    const [inventorySummary, uniqueProducts, movementsToday] = await Promise.all([
      this.prisma.inventory.aggregate({
        where: { warehouseId: id, branchId },
        _sum: { quantityOnHand: true, totalValue: true },
        _count: { id: true },
      }),
      this.prisma.inventory.groupBy({
        by: ['productId'],
        where: { warehouseId: id, branchId },
        _count: true,
      }),
      this.prisma.stockMovement.count({
        where: {
          OR: [{ sourceWarehouseId: id }, { destinationWarehouseId: id }],
          branchId,
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
    ]);

    const maxCapacity = warehouse.maxCapacity?.toNumber() ?? 0;
    const currentUsage = warehouse.currentUsage?.toNumber() ?? 0;
    const utilizationPercent = maxCapacity > 0 ? (currentUsage / maxCapacity) * 100 : 0;

    return {
      warehouse,
      capacity: {
        maxCapacity,
        currentUsage,
        availableSpace: maxCapacity - currentUsage,
        utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      },
      inventory: {
        totalProducts: uniqueProducts.length,
        totalUnits: inventorySummary._sum.quantityOnHand?.toNumber() ?? 0,
        totalValue: inventorySummary._sum.totalValue?.toNumber() ?? 0,
        stockLines: inventorySummary._count.id,
      },
      movementsToday,
    };
  }

  async getStatistics(id: string, branchId: string) {
    await this.findOne(id, branchId);

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalProducts,
      lowStockCount,
      inboundToday,
      outboundToday,
      transfersThisMonth,
      totalValue,
    ] = await Promise.all([
      this.prisma.inventory.count({ where: { warehouseId: id, branchId } }),
      this.prisma.inventory.count({
        where: {
          warehouseId: id,
          branchId,
          quantityOnHand: { lte: { reorderPoint: true } },
        },
      }),
      this.prisma.stockMovement.aggregate({
        where: {
          destinationWarehouseId: id,
          branchId,
          type: 'IN',
          createdAt: { gte: startOfDay },
        },
        _sum: { quantity: true },
      }),
      this.prisma.stockMovement.aggregate({
        where: {
          sourceWarehouseId: id,
          branchId,
          type: 'OUT',
          createdAt: { gte: startOfDay },
        },
        _sum: { quantity: true },
      }),
      this.prisma.stockMovement.count({
        where: {
          OR: [{ sourceWarehouseId: id }, { destinationWarehouseId: id }],
          branchId,
          type: 'TRANSFER',
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.inventory.aggregate({
        where: { warehouseId: id, branchId },
        _sum: { totalValue: true },
      }),
    ]);

    return {
      totalProducts,
      lowStockCount,
      inboundToday: inboundToday._sum.quantity?.toNumber() ?? 0,
      outboundToday: outboundToday._sum.quantity?.toNumber() ?? 0,
      transfersThisMonth,
      totalValue: totalValue._sum.totalValue?.toNumber() ?? 0,
    };
  }

  async update(
    id: string,
    dto: UpdateWarehouseDto,
    branchId: string,
    userId: string,
  ): Promise<Warehouse> {
    await this.findOne(id, branchId);

    if (dto.name || dto.code) {
      const existing = await this.prisma.warehouse.findFirst({
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
        throw new ConflictException('Warehouse with this name or code already exists');
      }
    }

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: { ...dto, updatedAt: new Date() },
      include: {
        branch: { select: { id: true, name: true } },
        _count: {
          select: { inventory: true, sourceMovements: true, destinationMovements: true },
        },
      },
    });

    await this.audit.log({
      action: 'WAREHOUSE.UPDATE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Warehouse',
      details: `Updated warehouse: ${dto.name ?? id}`,
    });

    return warehouse as Warehouse;
  }

  async remove(id: string, branchId: string, userId: string): Promise<void> {
    const warehouse = await this.findOne(id, branchId);

    const inventoryCount = await this.prisma.inventory.count({
      where: { warehouseId: id, branchId },
    });

    if (inventoryCount > 0) {
      await this.prisma.warehouse.update({
        where: { id },
        data: { isActive: false, updatedAt: new Date() },
      });
    } else {
      await this.prisma.warehouse.delete({ where: { id } });
    }

    await this.audit.log({
      action: 'WAREHOUSE.DELETE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Warehouse',
      details: `Deleted warehouse: ${warehouse.name} (${inventoryCount > 0 ? 'deactivated' : 'hard deleted'})`,
    });
  }
}
