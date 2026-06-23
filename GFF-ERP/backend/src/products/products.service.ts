import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductStockDto, UpdateStockSettingsDto } from './dto/product-stock.dto';
import { Product, ProductInventoryItem } from './entities/product.entity';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateProductDto, branchId: string, userId: string): Promise<Product> {
    const [category, brand, unit] = await Promise.all([
      this.prisma.category.findFirst({ where: { id: dto.categoryId, branchId } }),
      dto.brandId
        ? this.prisma.brand.findFirst({ where: { id: dto.brandId, branchId } })
        : Promise.resolve(true),
      this.prisma.unit.findFirst({ where: { id: dto.unitId, branchId } }),
    ]);

    if (!category) throw new NotFoundException(`Category ${dto.categoryId} not found`);
    if (dto.brandId && brand === null) throw new NotFoundException(`Brand ${dto.brandId} not found`);
    if (!unit) throw new NotFoundException(`Unit ${dto.unitId} not found`);

    if (dto.sku || dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          OR: [
            ...(dto.sku ? [{ sku: dto.sku }] : []),
            ...(dto.barcode ? [{ barcode: dto.barcode }] : []),
          ],
          branchId,
        },
      });

      if (existing) {
        throw new ConflictException('Product with this SKU or barcode already exists');
      }
    }

    const sku = dto.sku ?? this.generateSku(dto.name, dto.productType);
    const barcode = dto.barcode ?? this.generateBarcode();

    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        sku,
        barcode,
        productType: dto.productType,
        categoryId: dto.categoryId,
        brandId: dto.brandId ?? null,
        unitId: dto.unitId,
        description: dto.description ?? null,
        specifications: dto.specifications ?? null,
        standardCost: dto.standardCost ?? 0,
        sellingPrice: dto.sellingPrice ?? 0,
        weightKg: dto.weightKg ?? null,
        reorderPoint: dto.reorderPoint ?? 0,
        reorderQuantity: dto.reorderQuantity ?? 0,
        nutritionalInfo: dto.nutritionalInfo ? (dto.nutritionalInfo as unknown as Record<string, unknown>) : null,
        storageRequirements: dto.storageRequirements ?? null,
        shelfLifeDays: dto.shelfLifeDays ?? null,
        status: dto.status ?? 'ACTIVE',
        isActive: dto.isActive ?? true,
        isTraceable: dto.isTraceable ?? false,
        defaultWarehouseId: dto.defaultWarehouseId ?? null,
        imageUrl: dto.imageUrl ?? null,
        taxRate: dto.taxRate ?? 0,
        notes: dto.notes ?? null,
        branchId,
      },
      include: {
        category: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        _count: {
          select: {
            inventory: true,
            stockMovements: true,
            salesOrderItems: true,
            purchaseOrderItems: true,
          },
        },
      },
    });

    if (dto.standardCost && dto.standardCost > 0) {
      await this.prisma.productCostHistory.create({
        data: {
          productId: product.id,
          cost: dto.standardCost,
          type: 'STANDARD',
          notes: 'Initial standard cost',
          branchId,
          createdBy: userId,
        },
      });
    }

    await this.audit.log({
      action: 'PRODUCT.CREATE',
      userId,
      branchId,
      resourceId: product.id,
      resourceType: 'Product',
      details: `Created product: ${dto.name} (${sku})`,
    });

    return product as Product;
  }

  async findAll(filter: ProductFilterDto, branchId: string): Promise<{
    items: Product[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;
    const sortBy = filter.sortBy ?? 'name';
    const sortDir = filter.sortDir ?? 'asc';

    const where: Record<string, unknown> = { branchId };

    if (filter.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' as const } },
        { sku: { contains: filter.search, mode: 'insensitive' as const } },
        { barcode: { contains: filter.search, mode: 'insensitive' as const } },
      ];
    }

    if (filter.productType) where.productType = filter.productType;
    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.brandId) where.brandId = filter.brandId;
    if (filter.status) where.status = filter.status;
    if (filter.traceable) where.isTraceable = true;

    where.isActive = true;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, code: true } },
          brand: { select: { id: true, name: true, code: true } },
          unit: { select: { id: true, name: true, abbreviation: true } },
          inventory: {
            select: {
              id: true,
              warehouseId: true,
              quantityOnHand: true,
              quantityReserved: true,
              averageCost: true,
              reorderPoint: true,
            },
          },
          _count: {
            select: {
              inventory: true,
              stockMovements: true,
              salesOrderItems: true,
              purchaseOrderItems: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: { [sortBy]: sortDir },
      }),
      this.prisma.product.count({ where }),
    ]);

    return { items: products as Product[], total, page, limit };
  }

  async findOne(id: string, branchId: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { id, branchId },
      include: {
        category: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        inventory: {
          include: {
            warehouse: { select: { id: true, name: true, code: true } },
          },
        },
        _count: {
          select: {
            inventory: true,
            stockMovements: true,
            salesOrderItems: true,
            purchaseOrderItems: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product as Product;
  }

  async findByBarcode(barcode: string, branchId: string): Promise<Product> {
    const product = await this.prisma.product.findFirst({
      where: { barcode, branchId },
      include: {
        category: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        inventory: {
          include: {
            warehouse: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with barcode ${barcode} not found`);
    }

    return product as Product;
  }

  async getProductStock(
    id: string,
    branchId: string,
  ): Promise<{
    product: Product;
    stock: ProductInventoryItem[];
    totalPhysical: number;
    totalReserved: number;
    totalAvailable: number;
    totalValue: number;
  }> {
    const product = await this.findOne(id, branchId);

    const inventory = await this.prisma.inventory.findMany({
      where: { productId: id, branchId },
      include: {
        warehouse: { select: { id: true, name: true, code: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const stock: ProductInventoryItem[] = inventory.map((inv) => ({
      id: inv.id,
      warehouseId: inv.warehouseId,
      warehouse: inv.warehouse,
      quantityOnHand: inv.quantityOnHand.toNumber(),
      quantityReserved: inv.quantityReserved.toNumber(),
      quantityAvailable: inv.quantityOnHand.toNumber() - inv.quantityReserved.toNumber(),
      averageCost: inv.averageCost.toNumber(),
      totalValue: inv.totalValue.toNumber(),
      reorderPoint: inv.reorderPoint.toNumber(),
      reorderQuantity: inv.reorderQuantity.toNumber(),
      lastMovementDate: inv.lastMovementDate,
    }));

    return {
      product,
      stock,
      totalPhysical: stock.reduce((s, i) => s + i.quantityOnHand, 0),
      totalReserved: stock.reduce((s, i) => s + i.quantityReserved, 0),
      totalAvailable: stock.reduce((s, i) => s + i.quantityAvailable, 0),
      totalValue: stock.reduce((s, i) => s + i.totalValue, 0),
    };
  }

  async getCostHistory(id: string, branchId: string) {
    await this.findOne(id, branchId);

    return this.prisma.productCostHistory.findMany({
      where: { productId: id, branchId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getStockMovements(id: string, branchId: string, limit: number) {
    await this.findOne(id, branchId);

    return this.prisma.stockMovement.findMany({
      where: { productId: id, branchId },
      include: {
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        batch: { select: { id: true, batchNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getLowStock(branchId: string, warehouseId?: string) {
    const where: Record<string, unknown> = {
      branchId,
      quantityOnHand: { lte: { reorderPoint: true } },
      product: { isActive: true },
    };

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    const lowStockItems = await this.prisma.inventory.findMany({
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

    return lowStockItems.map((item) => ({
      ...item,
      quantityOnHand: item.quantityOnHand.toNumber(),
      quantityReserved: item.quantityReserved.toNumber(),
      quantityAvailable: item.quantityOnHand.toNumber() - item.quantityReserved.toNumber(),
      reorderPoint: item.reorderPoint.toNumber(),
      shortfall: item.reorderPoint.toNumber() - item.quantityOnHand.toNumber(),
    }));
  }

  async getStatistics(branchId: string) {
    const [
      totalProducts,
      activeProducts,
      lowStockCount,
      traceableProducts,
      byType,
    ] = await Promise.all([
      this.prisma.product.count({ where: { branchId } }),
      this.prisma.product.count({ where: { branchId, isActive: true, status: 'ACTIVE' } }),
      this.prisma.inventory.count({
        where: {
          branchId,
          quantityOnHand: { lte: { reorderPoint: true } },
          product: { isActive: true },
        },
      }),
      this.prisma.product.count({ where: { branchId, isTraceable: true } }),
      this.prisma.product.groupBy({
        by: ['productType'],
        where: { branchId, isActive: true },
        _count: { id: true },
      }),
    ]);

    return {
      totalProducts,
      activeProducts,
      inactiveProducts: totalProducts - activeProducts,
      lowStockCount,
      traceableProducts,
      byType: byType.reduce(
        (acc, item) => {
          acc[item.productType] = item._count.id;
          return acc;
        },
        {} as Record<string, number>,
      ),
    };
  }

  async initializeStock(
    id: string,
    dto: ProductStockDto,
    branchId: string,
    userId: string,
  ) {
    const product = await this.findOne(id, branchId);

    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, branchId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);
    }

    const existing = await this.prisma.inventory.findFirst({
      where: { productId: id, warehouseId: dto.warehouseId, branchId },
    });

    if (existing) {
      throw new ConflictException('Inventory record already exists for this product and warehouse');
    }

    const initialQty = dto.initialQuantity ?? 0;
    const initialCost = dto.initialCost ?? product.standardCost;
    const totalValue = initialQty * initialCost;

    const inventory = await this.prisma.inventory.create({
      data: {
        productId: id,
        warehouseId: dto.warehouseId,
        quantityOnHand: initialQty,
        quantityReserved: 0,
        averageCost: initialCost,
        totalValue,
        reorderPoint: dto.reorderPoint ?? product.reorderPoint,
        reorderQuantity: dto.reorderQuantity ?? product.reorderQuantity,
        expiryDate: null,
        lastMovementDate: initialQty > 0 ? new Date() : null,
        branchId,
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    if (initialQty > 0) {
      await this.prisma.stockMovement.create({
        data: {
          productId: id,
          type: 'IN',
          quantity: initialQty,
          unitCost: initialCost,
          totalCost: totalValue,
          destinationWarehouseId: dto.warehouseId,
          reference: 'INITIAL_STOCK',
          reason: 'Initial stock setup',
          branchId,
          createdBy: userId,
        },
      });

      await this.prisma.productCostHistory.create({
        data: {
          productId: id,
          cost: initialCost,
          type: 'MANUAL',
          reference: `Warehouse: ${warehouse.name}`,
          notes: `Initial stock: ${initialQty} units`,
          branchId,
          createdBy: userId,
        },
      });
    }

    await this.audit.log({
      action: 'PRODUCT.INIT_STOCK',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Product',
      details: `Initialized stock for ${product.name}: ${initialQty} units in ${warehouse.name}`,
    });

    return inventory;
  }

  async update(
    id: string,
    dto: UpdateProductDto,
    branchId: string,
    userId: string,
  ): Promise<Product> {
    await this.findOne(id, branchId);

    if (dto.sku || dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          OR: [
            ...(dto.sku ? [{ sku: dto.sku }] : []),
            ...(dto.barcode ? [{ barcode: dto.barcode }] : []),
          ],
          NOT: { id },
          branchId,
        },
      });

      if (existing) {
        throw new ConflictException('Product with this SKU or barcode already exists');
      }
    }

    const data: Record<string, unknown> = { ...dto, updatedAt: new Date() };
    if (dto.nutritionalInfo) {
      data.nutritionalInfo = dto.nutritionalInfo as unknown as Record<string, unknown>;
    }

    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: {
        category: { select: { id: true, name: true, code: true } },
        brand: { select: { id: true, name: true, code: true } },
        unit: { select: { id: true, name: true, abbreviation: true } },
        _count: {
          select: {
            inventory: true,
            stockMovements: true,
            salesOrderItems: true,
            purchaseOrderItems: true,
          },
        },
      },
    });

    await this.audit.log({
      action: 'PRODUCT.UPDATE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Product',
      details: `Updated product: ${dto.name ?? id}`,
    });

    return product as Product;
  }

  async updateStockSettings(
    id: string,
    warehouseId: string,
    dto: UpdateStockSettingsDto,
    branchId: string,
    userId: string,
  ) {
    await this.findOne(id, branchId);

    const inventory = await this.prisma.inventory.findFirst({
      where: { productId: id, warehouseId, branchId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory record not found for this product and warehouse');
    }

    const updated = await this.prisma.inventory.update({
      where: { id: inventory.id },
      data: {
        reorderPoint: dto.reorderPoint,
        reorderQuantity: dto.reorderQuantity,
        updatedAt: new Date(),
      },
    });

    await this.audit.log({
      action: 'PRODUCT.UPDATE_STOCK_SETTINGS',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Product',
      details: `Updated stock settings for product ${id} in warehouse ${warehouseId}`,
    });

    return updated;
  }

  async remove(id: string, branchId: string, userId: string): Promise<void> {
    const product = await this.findOne(id, branchId);

    const inventoryCount = await this.prisma.inventory.count({
      where: { productId: id, branchId },
    });

    const movementCount = await this.prisma.stockMovement.count({
      where: { productId: id, branchId },
    });

    if (inventoryCount > 0 || movementCount > 0) {
      await this.prisma.product.update({
        where: { id },
        data: {
          isActive: false,
          status: 'DISCONTINUED',
          updatedAt: new Date(),
        },
      });
    } else {
      await this.prisma.product.delete({ where: { id } });
    }

    await this.audit.log({
      action: 'PRODUCT.DELETE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'Product',
      details: `Deleted product: ${product.name} (${inventoryCount > 0 || movementCount > 0 ? 'deactivated' : 'hard deleted'})`,
    });
  }

  private generateSku(name: string, type: string): string {
    const prefix = name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 6);
    const typeCode = type.slice(0, 3);
    const timestamp = Date.now().toString(36).toUpperCase();
    return `${typeCode}-${prefix}-${timestamp}`;
  }

  private generateBarcode(): string {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `61${timestamp.slice(-9)}${random}`;
  }
}
