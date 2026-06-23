import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryFilterDto, StockStatus, ValuationMethod } from './dto/inventory-filter.dto';
import { InventoryValuationDto } from './dto/inventory-valuation.dto';
import { StockLevelDto } from './dto/stock-level.dto';
import {
  InventoryItem,
  FIFOLayer,
  ValuationResult,
  FIFOLayerDetail,
  InventoryAgingItem,
} from './entities/inventory.entity';
import Decimal from 'decimal.js';

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(filter: InventoryFilterDto, branchId: string): Promise<{
    items: InventoryItem[];
    total: number;
    page: number;
    limit: number;
    summary: { totalItems: number; totalValue: number; totalQuantity: number; lowStockCount: number };
  }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { branchId };

    if (filter.warehouseId) where.warehouseId = filter.warehouseId;
    if (filter.productId) where.productId = filter.productId;
    if (filter.categoryId) where.product = { categoryId: filter.categoryId };
    if (filter.productType) where.product = { ...(where.product as Record<string, unknown> || {}), productType: filter.productType };
    if (filter.search) {
      where.product = {
        ...(where.product as Record<string, unknown> || {}),
        OR: [
          { name: { contains: filter.search, mode: 'insensitive' as const } },
          { sku: { contains: filter.search, mode: 'insensitive' as const } },
          { barcode: { contains: filter.search, mode: 'insensitive' as const } },
        ],
      };
    }

    if (filter.stockStatus && filter.stockStatus !== 'ALL') {
      switch (filter.stockStatus) {
        case 'LOW':
          where.quantityOnHand = { lte: { reorderPoint: true }, gt: 0 };
          break;
        case 'OUT':
          where.quantityOnHand = 0;
          break;
        case 'NORMAL':
          where.quantityOnHand = { gt: { reorderPoint: true } };
          break;
        case 'EXCESS':
          where.quantityOnHand = { gt: { reorderPoint: true } };
          break;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.inventory.findMany({
        where,
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true } },
              brand: { select: { id: true, name: true } },
              unit: { select: { id: true, abbreviation: true } },
            },
          },
          warehouse: { select: { id: true, name: true, code: true } },
        },
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.inventory.count({ where }),
    ]);

    const allForSummary = await this.prisma.inventory.findMany({
      where: { branchId },
      select: {
        quantityOnHand: true,
        totalValue: true,
        reorderPoint: true,
      },
    });

    const summary = {
      totalItems: allForSummary.length,
      totalValue: allForSummary.reduce((s, i) => s + i.totalValue.toNumber(), 0),
      totalQuantity: allForSummary.reduce((s, i) => s + i.quantityOnHand.toNumber(), 0),
      lowStockCount: allForSummary.filter(
        (i) => i.quantityOnHand.toNumber() > 0 && i.quantityOnHand.lessThanOrEqualTo(i.reorderPoint),
      ).length,
    };

    return { items: items as unknown as InventoryItem[], total, page, limit, summary };
  }

  async findOne(id: string, branchId: string): Promise<InventoryItem> {
    const item = await this.prisma.inventory.findFirst({
      where: { id, branchId },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
            unit: { select: { id: true, abbreviation: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
      },
    });

    if (!item) {
      throw new NotFoundException(`Inventory item with ID ${id} not found`);
    }

    return item as unknown as InventoryItem;
  }

  async getByProduct(productId: string, branchId: string): Promise<InventoryItem[]> {
    const items = await this.prisma.inventory.findMany({
      where: { productId, branchId },
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
            unit: { select: { id: true, abbreviation: true } },
          },
        },
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { warehouse: { name: 'asc' } },
    });

    return items as unknown as InventoryItem[];
  }

  async getLowStock(branchId: string, warehouseId?: string): Promise<InventoryItem[]> {
    const where: Record<string, unknown> = {
      branchId,
      quantityOnHand: { lte: { reorderPoint: true }, gt: 0 },
      product: { isActive: true },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
            unit: { select: { id: true, abbreviation: true } },
          },
        },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { quantityOnHand: 'asc' },
    });

    return items as unknown as InventoryItem[];
  }

  async getOutOfStock(branchId: string, warehouseId?: string): Promise<InventoryItem[]> {
    const where: Record<string, unknown> = {
      branchId,
      quantityOnHand: 0,
      product: { isActive: true },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const items = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          include: {
            category: { select: { id: true, name: true } },
            brand: { select: { id: true, name: true } },
            unit: { select: { id: true, abbreviation: true } },
          },
        },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return items as unknown as InventoryItem[];
  }

  async getFIFOLayers(inventoryId: string, branchId: string): Promise<FIFOLayer[]> {
    const inventory = await this.findOne(inventoryId, branchId);

    const layers = await this.prisma.fIFOLayer.findMany({
      where: {
        productId: inventory.productId,
        warehouseId: inventory.warehouseId,
        branchId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' },
    });

    return layers as unknown as FIFOLayer[];
  }

  async getValuation(
    dto: InventoryValuationDto,
    branchId: string,
  ): Promise<{
    method: ValuationMethod;
    asOfDate: Date;
    totalValue: number;
    totalQuantity: number;
    itemCount: number;
    results: ValuationResult[];
  }> {
    const method = dto.method ?? ValuationMethod.FIFO;
    const asOfDate = dto.asOfDate ? new Date(dto.asOfDate) : new Date();

    const where: Record<string, unknown> = {
      branchId,
      quantityOnHand: { gt: 0 },
    };
    if (dto.warehouseId) where.warehouseId = dto.warehouseId;
    if (dto.categoryId) where.product = { categoryId: dto.categoryId };

    const inventoryItems = await this.prisma.inventory.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, categoryId: true },
        },
        warehouse: { select: { id: true, name: true } },
      },
    });

    const results: ValuationResult[] = [];
    let totalValue = 0;
    let totalQuantity = 0;

    for (const item of inventoryItems) {
      const qty = item.quantityOnHand.toNumber();
      if (qty <= 0) continue;

      if (method === ValuationMethod.FIFO) {
        const fifoResult = await this.calculateFIFOCost(
          item.productId,
          item.warehouseId,
          qty,
          branchId,
        );
        results.push({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouse.name,
          method: 'FIFO',
          totalQuantity: qty,
          totalValue: fifoResult.totalCost,
          unitCost: fifoResult.unitCost,
          layers: fifoResult.layers,
        });
        totalValue += fifoResult.totalCost;
        totalQuantity += qty;
      } else {
        const avgCost = item.averageCost.toNumber();
        const value = qty * avgCost;
        results.push({
          productId: item.productId,
          productName: item.product.name,
          sku: item.product.sku,
          warehouseId: item.warehouseId,
          warehouseName: item.warehouse.name,
          method: 'WEIGHTED_AVERAGE',
          totalQuantity: qty,
          totalValue: value,
          unitCost: avgCost,
        });
        totalValue += value;
        totalQuantity += qty;
      }
    }

    return {
      method,
      asOfDate,
      totalValue: Math.round(totalValue * 100) / 100,
      totalQuantity,
      itemCount: results.length,
      results,
    };
  }

  async calculateFIFOCost(
    productId: string,
    warehouseId: string,
    quantity: number,
    branchId: string,
  ): Promise<{ totalCost: number; unitCost: number; layers: FIFOLayerDetail[] }> {
    const layers = await this.prisma.fIFOLayer.findMany({
      where: {
        productId,
        warehouseId,
        branchId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' },
    });

    let remainingQty = quantity;
    let totalCost = 0;
    const consumedLayers: FIFOLayerDetail[] = [];

    for (const layer of layers) {
      if (remainingQty <= 0) break;

      const layerRemQty = layer.remainingQuantity.toNumber();
      const takeQty = Math.min(remainingQty, layerRemQty);
      const layerCost = takeQty * layer.unitCost.toNumber();

      totalCost += layerCost;
      remainingQty -= takeQty;

      consumedLayers.push({
        layerId: layer.id,
        batchNumber: layer.batchNumber,
        quantity: takeQty,
        unitCost: layer.unitCost.toNumber(),
        layerValue: Math.round(layerCost * 100) / 100,
        remaining: layerRemQty - takeQty,
        purchaseDate: layer.purchaseDate,
        expiryDate: layer.expiryDate,
      });
    }

    const effectiveQty = quantity - remainingQty;
    const unitCost = effectiveQty > 0 ? totalCost / effectiveQty : 0;

    return {
      totalCost: Math.round(totalCost * 100) / 100,
      unitCost: Math.round(unitCost * 100) / 100,
      layers: consumedLayers,
    };
  }

  async consumeFIFOLayers(
    productId: string,
    warehouseId: string,
    quantity: number,
    branchId: string,
    movementId: string,
  ): Promise<{ totalCost: Decimal; layersConsumed: Array<{ layerId: string; quantity: number; cost: Decimal }> }> {
    const layers = await this.prisma.fIFOLayer.findMany({
      where: {
        productId,
        warehouseId,
        branchId,
        remainingQuantity: { gt: 0 },
      },
      orderBy: { purchaseDate: 'asc' },
    });

    let remainingQty = new Decimal(quantity);
    let totalCost = new Decimal(0);
    const consumed: Array<{ layerId: string; quantity: number; cost: Decimal }> = [];

    for (const layer of layers) {
      if (remainingQty.lte(0)) break;

      const takeQty = Decimal.min(remainingQty, layer.remainingQuantity);
      const layerCost = takeQty.mul(layer.unitCost);

      await this.prisma.fIFOLayer.update({
        where: { id: layer.id },
        data: {
          remainingQuantity: { decrement: takeQty.toNumber() },
        },
      });

      totalCost = totalCost.add(layerCost);
      remainingQty = remainingQty.sub(takeQty);

      consumed.push({
        layerId: layer.id,
        quantity: takeQty.toNumber(),
        cost: layerCost,
      });
    }

    return { totalCost, layersConsumed: consumed };
  }

  async addFIFOLayer(
    productId: string,
    warehouseId: string,
    quantity: Decimal,
    unitCost: Decimal,
    batchId: string | null,
    batchNumber: string | null,
    branchId: string,
  ): Promise<FIFOLayer> {
    const layer = await this.prisma.fIFOLayer.create({
      data: {
        productId,
        warehouseId,
        batchId,
        batchNumber,
        quantity: quantity.toNumber(),
        unitCost: unitCost.toNumber(),
        remainingQuantity: quantity.toNumber(),
        purchaseDate: new Date(),
        expiryDate: null,
        branchId,
      },
    });

    return layer as unknown as FIFOLayer;
  }

  async updateWeightedAverage(
    productId: string,
    warehouseId: string,
    quantityReceived: Decimal,
    unitCost: Decimal,
    branchId: string,
  ): Promise<Decimal> {
    const inventory = await this.prisma.inventory.findFirst({
      where: { productId, warehouseId, branchId },
    });

    if (!inventory) {
      return unitCost;
    }

    const currentQty = new Decimal(inventory.quantityOnHand);
    const currentAvgCost = new Decimal(inventory.averageCost);

    const currentValue = currentQty.mul(currentAvgCost);
    const newValue = quantityReceived.mul(unitCost);
    const totalQty = currentQty.plus(quantityReceived);

    let newAvgCost: Decimal;
    if (totalQty.lte(0)) {
      newAvgCost = unitCost;
    } else {
      newAvgCost = currentValue.plus(newValue).div(totalQty);
    }

    newAvgCost = new Decimal(newAvgCost.toFixed(4));

    await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        averageCost: newAvgCost.toNumber(),
      },
    });

    return newAvgCost;
  }

  async getAgingReport(
    branchId: string,
    warehouseId?: string,
  ): Promise<{ items: InventoryAgingItem[]; summary: Record<string, { count: number; value: number }> }> {
    const where: Record<string, unknown> = {
      branchId,
      remainingQuantity: { gt: 0 },
    };
    if (warehouseId) where.warehouseId = warehouseId;

    const layers = await this.prisma.fIFOLayer.findMany({
      where,
      include: {
        product: {
          select: { id: true, name: true, sku: true, shelfLifeDays: true },
        },
        warehouse: { select: { id: true, name: true } },
      },
      orderBy: { purchaseDate: 'asc' },
    });

    const now = new Date();
    const items: InventoryAgingItem[] = layers.map((layer) => {
      const ageInDays = Math.floor(
        (now.getTime() - new Date(layer.purchaseDate).getTime()) / (1000 * 60 * 60 * 24),
      );

      let ageCategory: InventoryAgingItem['ageCategory'];
      if (ageInDays <= 30) ageCategory = '0-30';
      else if (ageInDays <= 60) ageCategory = '31-60';
      else if (ageInDays <= 90) ageCategory = '61-90';
      else if (ageInDays <= 180) ageCategory = '91-180';
      else ageCategory = '180+';

      const qty = layer.remainingQuantity.toNumber();
      const cost = layer.unitCost.toNumber();

      let daysUntilExpiry: number | null = null;
      if (layer.expiryDate) {
        daysUntilExpiry = Math.floor(
          (new Date(layer.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      } else if (layer.product.shelfLifeDays) {
        const estimatedExpiry = new Date(layer.purchaseDate);
        estimatedExpiry.setDate(estimatedExpiry.getDate() + layer.product.shelfLifeDays);
        daysUntilExpiry = Math.floor(
          (estimatedExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
      }

      return {
        productId: layer.productId,
        productName: layer.product.name,
        sku: layer.product.sku,
        warehouseName: layer.warehouse.name,
        batchNumber: layer.batchNumber,
        quantity: qty,
        unitCost: cost,
        totalValue: Math.round(qty * cost * 100) / 100,
        ageInDays,
        ageCategory,
        expiryDate: layer.expiryDate,
        daysUntilExpiry,
      };
    });

    const summary: Record<string, { count: number; value: number }> = {
      '0-30': { count: 0, value: 0 },
      '31-60': { count: 0, value: 0 },
      '61-90': { count: 0, value: 0 },
      '91-180': { count: 0, value: 0 },
      '180+': { count: 0, value: 0 },
    };

    for (const item of items) {
      summary[item.ageCategory].count++;
      summary[item.ageCategory].value += item.totalValue;
    }

    for (const key of Object.keys(summary)) {
      summary[key].value = Math.round(summary[key].value * 100) / 100;
    }

    return { items, summary };
  }

  async getSummary(branchId: string) {
    const [
      totalItems,
      totalValue,
      totalQuantity,
      lowStockCount,
      outOfStockCount,
      reservedTotal,
      byWarehouse,
    ] = await Promise.all([
      this.prisma.inventory.count({ where: { branchId } }),
      this.prisma.inventory.aggregate({
        where: { branchId },
        _sum: { totalValue: true },
      }),
      this.prisma.inventory.aggregate({
        where: { branchId },
        _sum: { quantityOnHand: true },
      }),
      this.prisma.inventory.count({
        where: {
          branchId,
          quantityOnHand: { lte: { reorderPoint: true }, gt: 0 },
        },
      }),
      this.prisma.inventory.count({
        where: { branchId, quantityOnHand: 0 },
      }),
      this.prisma.inventory.aggregate({
        where: { branchId },
        _sum: { quantityReserved: true },
      }),
      this.prisma.inventory.groupBy({
        by: ['warehouseId'],
        where: { branchId },
        _sum: { quantityOnHand: true, totalValue: true },
        _count: { id: true },
      }),
    ]);

    const warehouseDetails = await this.prisma.warehouse.findMany({
      where: {
        id: { in: byWarehouse.map((w) => w.warehouseId) },
      },
      select: { id: true, name: true },
    });

    return {
      totalItems,
      totalValue: totalValue._sum.totalValue?.toNumber() ?? 0,
      totalQuantity: totalQuantity._sum.quantityOnHand?.toNumber() ?? 0,
      lowStockCount,
      outOfStockCount,
      totalReserved: reservedTotal._sum.quantityReserved?.toNumber() ?? 0,
      byWarehouse: byWarehouse.map((w) => ({
        warehouseId: w.warehouseId,
        warehouseName: warehouseDetails.find((d) => d.id === w.warehouseId)?.name ?? 'Unknown',
        itemCount: w._count.id,
        totalQuantity: w._sum.quantityOnHand?.toNumber() ?? 0,
        totalValue: w._sum.totalValue?.toNumber() ?? 0,
      })),
    };
  }

  async getByWarehouse(branchId: string) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { branchId, isActive: true },
      include: {
        inventory: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, productType: true },
            },
          },
        },
        _count: { select: { inventory: true } },
      },
      orderBy: { name: 'asc' },
    });

    return warehouses.map((wh) => ({
      ...wh,
      inventoryValue: wh.inventory.reduce((s, i) => s + i.totalValue.toNumber(), 0),
      totalItems: wh._count.inventory,
    }));
  }

  async getByCategory(branchId: string) {
    const categories = await this.prisma.category.findMany({
      where: { branchId, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          include: {
            inventory: {
              select: { quantityOnHand: true, totalValue: true },
            },
          },
        },
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => {
      const totalQty = cat.products.reduce(
        (s, p) => s + p.inventory.reduce((s2, i) => s2 + i.quantityOnHand.toNumber(), 0),
        0,
      );
      const totalVal = cat.products.reduce(
        (s, p) => s + p.inventory.reduce((s2, i) => s2 + i.totalValue.toNumber(), 0),
        0,
      );

      return {
        categoryId: cat.id,
        categoryName: cat.name,
        productCount: cat._count.products,
        totalQuantity: totalQty,
        totalValue: totalVal,
      };
    });
  }

  async getReservedStock(branchId: string) {
    const reservations = await this.prisma.stockReservation.findMany({
      where: { branchId, status: 'ACTIVE' },
      include: {
        product: {
          select: { id: true, name: true, sku: true, unit: { select: { abbreviation: true } } },
        },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      totalReserved: reservations.reduce((s, r) => s + r.quantity.toNumber(), 0),
      reservationCount: reservations.length,
      byProduct: this.groupReservationsByProduct(reservations),
      reservations,
    };
  }

  private groupReservationsByProduct(reservations: Array<{
    productId: string;
    product: { name: string; sku: string | null };
    quantity: { toNumber: () => number };
  }>) {
    const map = new Map<string, { productName: string; sku: string | null; totalReserved: number; count: number }>();

    for (const r of reservations) {
      const existing = map.get(r.productId);
      if (existing) {
        existing.totalReserved += r.quantity.toNumber();
        existing.count++;
      } else {
        map.set(r.productId, {
          productName: r.product.name,
          sku: r.product.sku,
          totalReserved: r.quantity.toNumber(),
          count: 1,
        });
      }
    }

    return Array.from(map.values());
  }

  async updateStockLevels(
    id: string,
    dto: StockLevelDto,
    branchId: string,
    userId: string,
  ) {
    const inventory = await this.findOne(id, branchId);

    const updated = await this.prisma.inventory.update({
      where: { id },
      data: {
        reorderPoint: dto.reorderPoint,
        reorderQuantity: dto.reorderQuantity,
        updatedAt: new Date(),
      },
    });

    await this.audit.log({
      action: 'INVENTORY.UPDATE_STOCK_LEVELS',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Inventory',
      details: `Updated stock levels for ${inventory.product.name}: RP=${dto.reorderPoint}, RQ=${dto.reorderQuantity}`,
    });

    return updated;
  }

  async recalculateAllWeightedAverages(branchId: string, userId: string) {
    const inventoryItems = await this.prisma.inventory.findMany({
      where: { branchId },
      select: { id: true, productId: true, warehouseId: true },
    });

    const results: Array<{ productId: string; warehouseId: string; newAvg: number }> = [];

    for (const item of inventoryItems) {
      const inMovements = await this.prisma.stockMovement.findMany({
        where: {
          productId: item.productId,
          type: 'IN',
          ...(item.warehouseId ? { destinationWarehouseId: item.warehouseId } : {}),
          branchId,
        },
        orderBy: { createdAt: 'asc' },
      });

      if (inMovements.length === 0) continue;

      let totalQty = new Decimal(0);
      let totalValue = new Decimal(0);

      for (const m of inMovements) {
        const qty = new Decimal(m.quantity);
        const cost = new Decimal(m.unitCost);
        totalQty = totalQty.plus(qty);
        totalValue = totalValue.plus(qty.mul(cost));
      }

      const outMovements = await this.prisma.stockMovement.findMany({
        where: {
          productId: item.productId,
          type: 'OUT',
          ...(item.warehouseId ? { sourceWarehouseId: item.warehouseId } : {}),
          branchId,
        },
      });

      for (const m of outMovements) {
        totalQty = totalQty.minus(new Decimal(m.quantity));
      }

      let newAvg = new Decimal(0);
      if (totalQty.gt(0)) {
        newAvg = totalValue.dividedBy(totalQty);
      }

      newAvg = new Decimal(newAvg.toFixed(4));

      await this.prisma.inventory.update({
        where: { id: item.id },
        data: {
          averageCost: newAvg.toNumber(),
          totalValue: totalQty.mul(newAvg).toNumber(),
          updatedAt: new Date(),
        },
      });

      results.push({
        productId: item.productId,
        warehouseId: item.warehouseId,
        newAvg: newAvg.toNumber(),
      });
    }

    await this.audit.log({
      action: 'INVENTORY.RECALCULATE_AVERAGES',
      userId,
      branchId,
      resourceType: 'Inventory',
      details: `Recalculated weighted averages for ${results.length} inventory items`,
    });

    return { recalculated: results.length, items: results };
  }
}
