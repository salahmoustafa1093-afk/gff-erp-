import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InventoryService } from '../inventory/inventory.service';
import { CreateStockMovementDto, MovementType } from './dto/create-stock-movement.dto';
import {
  CreateStockReservationDto,
  ReleaseReservationDto,
  FulfillReservationDto,
  ReservationStatus,
} from './dto/stock-reservation.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';
import { StockAdjustmentDto, ApproveAdjustmentDto, AdjustmentStatus, AdjustmentReason } from './dto/stock-adjustment.dto';
import {
  CreateInventoryCountDto,
  SubmitCountDto,
  ApproveCountDto,
  CountStatus,
} from './dto/inventory-count.dto';
import Decimal from 'decimal.js';

export interface MovementFilter {
  productId?: string;
  warehouseId?: string;
  type?: string;
  fromDate?: Date;
  toDate?: Date;
  page?: number;
  limit?: number;
}

@Injectable()
export class StockMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly inventoryService: InventoryService,
  ) {}

  // ==========================================
  // STOCK MOVEMENTS
  // ==========================================

  async createMovement(dto: CreateStockMovementDto, branchId: string, userId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, branchId },
    });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);

    const quantity = new Decimal(dto.quantity);
    const unitCost = new Decimal(dto.unitCost ?? product.standardCost);
    const totalCost = dto.totalCost ? new Decimal(dto.totalCost) : quantity.mul(unitCost);

    const result = await this.prisma.$transaction(async (tx) => {
      let sourceInventory = null;
      let destInventory = null;

      // Validate source warehouse for OUT/TRANSFER
      if ((dto.type === MovementType.OUT || dto.type === MovementType.TRANSFER) && dto.sourceWarehouseId) {
        sourceInventory = await tx.inventory.findFirst({
          where: { productId: dto.productId, warehouseId: dto.sourceWarehouseId, branchId },
        });
        if (!sourceInventory) {
          throw new NotFoundException('No inventory found for product in source warehouse');
        }
        const availableQty = sourceInventory.quantityOnHand.minus(sourceInventory.quantityReserved);
        if (availableQty.lessThan(quantity)) {
          throw new BadRequestException(
            `Insufficient available stock. On hand: ${sourceInventory.quantityOnHand}, Reserved: ${sourceInventory.quantityReserved}, Available: ${availableQty}, Requested: ${quantity}`,
          );
        }
      }

      // Validate destination warehouse for IN/TRANSFER
      if ((dto.type === MovementType.IN || dto.type === MovementType.TRANSFER) && dto.destinationWarehouseId) {
        destInventory = await tx.inventory.findFirst({
          where: { productId: dto.productId, warehouseId: dto.destinationWarehouseId, branchId },
        });
      }

      // Create movement record
      const movement = await tx.stockMovement.create({
        data: {
          productId: dto.productId,
          type: dto.type,
          quantity: quantity.toNumber(),
          unitCost: unitCost.toNumber(),
          totalCost: totalCost.toNumber(),
          sourceWarehouseId: dto.sourceWarehouseId ?? null,
          destinationWarehouseId: dto.destinationWarehouseId ?? null,
          batchId: dto.batchId ?? null,
          reference: dto.reference ?? null,
          referenceType: dto.referenceType ?? null,
          reason: dto.reason ?? null,
          notes: dto.notes ?? null,
          branchId,
          createdBy: userId,
        },
      });

      // Process based on movement type
      switch (dto.type) {
        case MovementType.IN:
          await this.processInbound(tx, dto.productId, dto.destinationWarehouseId!, quantity, unitCost, totalCost, branchId);
          break;
        case MovementType.OUT:
          await this.processOutbound(tx, dto.productId, dto.sourceWarehouseId!, quantity, branchId);
          break;
        case MovementType.TRANSFER:
          await this.processTransfer(tx, dto.productId, dto.sourceWarehouseId!, dto.destinationWarehouseId!, quantity, branchId);
          break;
        case MovementType.ADJUSTMENT:
          await this.processAdjustmentMovement(tx, dto.productId, dto.sourceWarehouseId ?? dto.destinationWarehouseId!, quantity, branchId);
          break;
        case MovementType.MANUFACTURING_CONSUMPTION:
          await this.processOutbound(tx, dto.productId, dto.sourceWarehouseId!, quantity, branchId);
          break;
        case MovementType.MANUFACTURING_OUTPUT:
          await this.processInbound(tx, dto.productId, dto.destinationWarehouseId!, quantity, unitCost, totalCost, branchId);
          break;
        default:
          break;
      }

      return { movement, sourceInventory, destInventory };
    });

    await this.audit.log({
      action: `STOCK_MOVEMENT.${dto.type}`,
      userId,
      branchId,
      resourceId: result.movement.id,
      resourceType: 'StockMovement',
      details: `${dto.type}: ${quantity} x ${product.name} @ ${unitCost}`,
    });

    return result.movement;
  }

  private async processInbound(
    tx: PrismaTransaction,
    productId: string,
    warehouseId: string,
    quantity: Decimal,
    unitCost: Decimal,
    totalCost: Decimal,
    branchId: string,
  ) {
    const existing = await tx.inventory.findFirst({
      where: { productId, warehouseId, branchId },
    });

    if (existing) {
      const newQty = existing.quantityOnHand.plus(quantity);
      // Update weighted average cost
      const currentValue = existing.quantityOnHand.mul(existing.averageCost);
      const newValue = quantity.mul(unitCost);
      let newAvg = currentValue.plus(newValue).dividedBy(newQty);
      newAvg = new Decimal(newAvg.toFixed(4));
      const newTotalValue = newQty.mul(newAvg);

      await tx.inventory.update({
        where: { id: existing.id },
        data: {
          quantityOnHand: newQty.toNumber(),
          averageCost: newAvg.toNumber(),
          totalValue: newTotalValue.toNumber(),
          lastMovementDate: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      const product = await tx.product.findUnique({ where: { id: productId } });
      await tx.inventory.create({
        data: {
          productId,
          warehouseId,
          quantityOnHand: quantity.toNumber(),
          quantityReserved: 0,
          averageCost: unitCost.toNumber(),
          totalValue: totalCost.toNumber(),
          reorderPoint: product?.reorderPoint ?? 0,
          reorderQuantity: product?.reorderQuantity ?? 0,
          lastMovementDate: new Date(),
          branchId,
        },
      });
    }

    // Add FIFO layer
    await tx.fIFOLayer.create({
      data: {
        productId,
        warehouseId,
        batchId: null,
        batchNumber: null,
        quantity: quantity.toNumber(),
        unitCost: unitCost.toNumber(),
        remainingQuantity: quantity.toNumber(),
        purchaseDate: new Date(),
        expiryDate: null,
        branchId,
      },
    });
  }

  private async processOutbound(
    tx: PrismaTransaction,
    productId: string,
    warehouseId: string,
    quantity: Decimal,
    branchId: string,
  ) {
    const inventory = await tx.inventory.findFirst({
      where: { productId, warehouseId, branchId },
    });

    if (!inventory) {
      throw new NotFoundException('Inventory not found');
    }

    // Consume FIFO layers
    const layers = await tx.fIFOLayer.findMany({
      where: { productId, warehouseId, branchId, remainingQuantity: { gt: 0 } },
      orderBy: { purchaseDate: 'asc' },
    });

    let remainingQty = quantity;
    let totalCost = new Decimal(0);

    for (const layer of layers) {
      if (remainingQty.lte(0)) break;
      const takeQty = Decimal.min(remainingQty, layer.remainingQuantity);
      const layerCost = takeQty.mul(layer.unitCost);

      await tx.fIFOLayer.update({
        where: { id: layer.id },
        data: { remainingQuantity: { decrement: takeQty.toNumber() } },
      });

      totalCost = totalCost.add(layerCost);
      remainingQty = remainingQty.sub(takeQty);
    }

    const newQty = inventory.quantityOnHand.minus(quantity);
    const newTotalValue = newQty.mul(inventory.averageCost);

    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        quantityOnHand: newQty.toNumber(),
        totalValue: Decimal.max(0, newTotalValue).toNumber(),
        lastMovementDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  private async processTransfer(
    tx: PrismaTransaction,
    productId: string,
    sourceWarehouseId: string,
    destWarehouseId: string,
    quantity: Decimal,
    branchId: string,
  ) {
    // Deduct from source
    const sourceInv = await tx.inventory.findFirst({
      where: { productId, warehouseId: sourceWarehouseId, branchId },
    });

    if (!sourceInv) throw new NotFoundException('Source inventory not found');

    const newSourceQty = sourceInv.quantityOnHand.minus(quantity);
    const newSourceValue = newSourceQty.mul(sourceInv.averageCost);

    await tx.inventory.update({
      where: { id: sourceInv.id },
      data: {
        quantityOnHand: newSourceQty.toNumber(),
        totalValue: Decimal.max(0, newSourceValue).toNumber(),
        lastMovementDate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Add to destination at source average cost
    const destInv = await tx.inventory.findFirst({
      where: { productId, warehouseId: destWarehouseId, branchId },
    });

    if (destInv) {
      const newDestQty = destInv.quantityOnHand.plus(quantity);
      const currentValue = destInv.quantityOnHand.mul(destInv.averageCost);
      const incomingValue = quantity.mul(sourceInv.averageCost);
      let newAvg = currentValue.plus(incomingValue).dividedBy(newDestQty);
      newAvg = new Decimal(newAvg.toFixed(4));
      const newTotalValue = newDestQty.mul(newAvg);

      await tx.inventory.update({
        where: { id: destInv.id },
        data: {
          quantityOnHand: newDestQty.toNumber(),
          averageCost: newAvg.toNumber(),
          totalValue: newTotalValue.toNumber(),
          lastMovementDate: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      const product = await tx.product.findUnique({ where: { id: productId } });
      await tx.inventory.create({
        data: {
          productId,
          warehouseId: destWarehouseId,
          quantityOnHand: quantity.toNumber(),
          quantityReserved: 0,
          averageCost: sourceInv.averageCost.toNumber(),
          totalValue: quantity.mul(sourceInv.averageCost).toNumber(),
          reorderPoint: product?.reorderPoint ?? 0,
          reorderQuantity: product?.reorderQuantity ?? 0,
          lastMovementDate: new Date(),
          branchId,
        },
      });
    }

    // Transfer FIFO layer equivalent
    await tx.fIFOLayer.create({
      data: {
        productId,
        warehouseId: destWarehouseId,
        batchId: null,
        batchNumber: `TRANSFER-${Date.now()}`,
        quantity: quantity.toNumber(),
        unitCost: sourceInv.averageCost.toNumber(),
        remainingQuantity: quantity.toNumber(),
        purchaseDate: new Date(),
        expiryDate: null,
        branchId,
      },
    });
  }

  private async processAdjustmentMovement(
    tx: PrismaTransaction,
    productId: string,
    warehouseId: string,
    quantity: Decimal,
    branchId: string,
  ) {
    const inventory = await tx.inventory.findFirst({
      where: { productId, warehouseId, branchId },
    });

    if (!inventory) {
      const product = await tx.product.findUnique({ where: { id: productId } });
      await tx.inventory.create({
        data: {
          productId,
          warehouseId,
          quantityOnHand: quantity.toNumber(),
          quantityReserved: 0,
          averageCost: product?.standardCost ?? 0,
          totalValue: 0,
          lastMovementDate: new Date(),
          branchId,
        },
      });
      return;
    }

    const newQty = inventory.quantityOnHand.plus(quantity);
    if (newQty.lt(0)) {
      throw new BadRequestException('Adjustment would result in negative stock');
    }

    const newTotalValue = newQty.mul(inventory.averageCost);
    await tx.inventory.update({
      where: { id: inventory.id },
      data: {
        quantityOnHand: newQty.toNumber(),
        totalValue: newTotalValue.toNumber(),
        lastMovementDate: new Date(),
        updatedAt: new Date(),
      },
    });
  }

  async findAll(filter: MovementFilter, branchId: string) {
    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { branchId };
    if (filter.productId) where.productId = filter.productId;
    if (filter.type) where.type = filter.type;
    if (filter.warehouseId) {
      where.OR = [
        { sourceWarehouseId: filter.warehouseId },
        { destinationWarehouseId: filter.warehouseId },
      ];
    }
    if (filter.fromDate || filter.toDate) {
      where.createdAt = {};
      if (filter.fromDate) (where.createdAt as Record<string, unknown>).gte = filter.fromDate;
      if (filter.toDate) (where.createdAt as Record<string, unknown>).lte = filter.toDate;
    }

    const [movements, total] = await Promise.all([
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unit: { select: { abbreviation: true } } } },
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
          batch: { select: { id: true, batchNumber: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.stockMovement.count({ where }),
    ]);

    return { movements, total, page, limit };
  }

  async getProductHistory(productId: string, branchId: string, limit: number) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, branchId },
    });
    if (!product) throw new NotFoundException(`Product ${productId} not found`);

    return this.prisma.stockMovement.findMany({
      where: { productId, branchId },
      include: {
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        batch: { select: { id: true, batchNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ==========================================
  // STOCK RESERVATIONS
  // ==========================================

  async createReservation(dto: CreateStockReservationDto, branchId: string, userId: string) {
    const [product, warehouse, inventory] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: dto.productId, branchId } }),
      this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, branchId } }),
      this.prisma.inventory.findFirst({
        where: { productId: dto.productId, warehouseId: dto.warehouseId, branchId },
      }),
    ]);

    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);
    if (!warehouse) throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);

    const quantity = new Decimal(dto.quantity);

    // Check available stock
    const qtyOnHand = inventory ? inventory.quantityOnHand : new Decimal(0);
    const qtyReserved = inventory ? inventory.quantityReserved : new Decimal(0);
    const available = qtyOnHand.minus(qtyReserved);

    if (available.lessThan(quantity)) {
      throw new BadRequestException(
        `Cannot reserve ${quantity}. Available: ${available} (On hand: ${qtyOnHand}, Reserved: ${qtyReserved})`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Create or update inventory to ensure record exists
      if (!inventory) {
        await tx.inventory.create({
          data: {
            productId: dto.productId,
            warehouseId: dto.warehouseId,
            quantityOnHand: 0,
            quantityReserved: quantity.toNumber(),
            averageCost: product.standardCost,
            totalValue: 0,
            reorderPoint: product.reorderPoint,
            reorderQuantity: product.reorderQuantity,
            branchId,
          },
        });
      } else {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantityReserved: { increment: quantity.toNumber() },
            updatedAt: new Date(),
          },
        });
      }

      const reservation = await tx.stockReservation.create({
        data: {
          productId: dto.productId,
          warehouseId: dto.warehouseId,
          salesOrderId: dto.salesOrderId,
          quantity: quantity.toNumber(),
          quantityFulfilled: 0,
          status: ReservationStatus.ACTIVE,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : null,
          notes: dto.notes ?? null,
          branchId,
        },
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true, customerName: true } },
        },
      });

      return reservation;
    });

    await this.audit.log({
      action: 'STOCK_RESERVATION.CREATE',
      userId,
      branchId,
      resourceId: result.id,
      resourceType: 'StockReservation',
      details: `Reserved ${quantity} x ${product.name} for warehouse ${warehouse.name}`,
    });

    return result;
  }

  async getReservations(
    branchId: string,
    status?: string,
    productId?: string,
    salesOrderId?: string,
  ) {
    const where: Record<string, unknown> = { branchId };
    if (status) where.status = status;
    if (productId) where.productId = productId;
    if (salesOrderId) where.salesOrderId = salesOrderId;

    return this.prisma.stockReservation.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: { select: { abbreviation: true } } } },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true, customerName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getReservation(id: string, branchId: string) {
    const reservation = await this.prisma.stockReservation.findFirst({
      where: { id, branchId },
      include: {
        product: { select: { id: true, name: true, sku: true, unit: { select: { abbreviation: true } } } },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true, customerName: true } },
      },
    });

    if (!reservation) throw new NotFoundException(`Reservation ${id} not found`);
    return reservation;
  }

  async releaseReservation(
    id: string,
    dto: ReleaseReservationDto,
    branchId: string,
    userId: string,
  ) {
    const reservation = await this.getReservation(id, branchId);

    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException(`Reservation is ${reservation.status}, cannot release`);
    }

    const releaseQty = dto.quantity ? new Decimal(dto.quantity) : reservation.quantity;

    await this.prisma.$transaction(async (tx) => {
      // Reduce reserved quantity
      await tx.inventory.updateMany({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
          branchId,
        },
        data: {
          quantityReserved: { decrement: releaseQty.toNumber() },
          updatedAt: new Date(),
        },
      });

      if (releaseQty.greaterThanOrEqualTo(reservation.quantity)) {
        await tx.stockReservation.update({
          where: { id },
          data: { status: ReservationStatus.CANCELLED, updatedAt: new Date() },
        });
      }

      // Record release movement
      await tx.stockMovement.create({
        data: {
          productId: reservation.productId,
          type: MovementType.RELEASE,
          quantity: releaseQty.toNumber(),
          unitCost: 0,
          totalCost: 0,
          destinationWarehouseId: reservation.warehouseId,
          reference: reservation.salesOrderId,
          referenceType: 'RESERVATION_RELEASE',
          reason: dto.reason ?? 'Reservation released',
          branchId,
          createdBy: userId,
        },
      });
    });

    await this.audit.log({
      action: 'STOCK_RESERVATION.RELEASE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'StockReservation',
      details: `Released ${releaseQty} x ${reservation.product.name} from reservation`,
    });

    return this.getReservation(id, branchId);
  }

  async fulfillReservation(
    id: string,
    dto: FulfillReservationDto,
    branchId: string,
    userId: string,
  ) {
    const reservation = await this.getReservation(id, branchId);

    if (reservation.status !== ReservationStatus.ACTIVE) {
      throw new BadRequestException(`Reservation is ${reservation.status}, cannot fulfill`);
    }

    const fulfillQty = dto.quantity ? new Decimal(dto.quantity) : reservation.quantity;

    await this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: reservation.productId,
          warehouseId: reservation.warehouseId,
          branchId,
        },
      });

      if (!inventory) throw new NotFoundException('Inventory not found');

      const available = inventory.quantityOnHand.minus(inventory.quantityReserved);
      if (available.lessThan(fulfillQty)) {
        throw new BadRequestException(`Insufficient available stock: ${available}`);
      }

      // Get FIFO cost
      const fifoResult = await this.inventoryService.consumeFIFOLayers(
        reservation.productId,
        reservation.warehouseId,
        fulfillQty.toNumber(),
        branchId,
        id,
      );

      // Reduce reserved and on-hand quantities
      await tx.inventory.update({
        where: { id: inventory.id },
        data: {
          quantityOnHand: { decrement: fulfillQty.toNumber() },
          quantityReserved: { decrement: fulfillQty.toNumber() },
          totalValue: { decrement: fifoResult.totalCost.toNumber() },
          lastMovementDate: new Date(),
          updatedAt: new Date(),
        },
      });

      // Record OUT movement
      await tx.stockMovement.create({
        data: {
          productId: reservation.productId,
          type: MovementType.OUT,
          quantity: fulfillQty.toNumber(),
          unitCost: fifoResult.totalCost.div(fulfillQty).toNumber(),
          totalCost: fifoResult.totalCost.toNumber(),
          sourceWarehouseId: reservation.warehouseId,
          reference: reservation.salesOrderId,
          referenceType: 'SALES_ORDER',
          reason: 'Reservation fulfilled',
          branchId,
          createdBy: userId,
        },
      });

      const newFulfilled = reservation.quantityFulfilled.plus(fulfillQty);
      if (newFulfilled.greaterThanOrEqualTo(reservation.quantity)) {
        await tx.stockReservation.update({
          where: { id },
          data: {
            status: ReservationStatus.FULFILLED,
            quantityFulfilled: newFulfilled.toNumber(),
            updatedAt: new Date(),
          },
        });
      } else {
        await tx.stockReservation.update({
          where: { id },
          data: {
            quantityFulfilled: newFulfilled.toNumber(),
            updatedAt: new Date(),
          },
        });
      }
    });

    await this.audit.log({
      action: 'STOCK_RESERVATION.FULFILL',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'StockReservation',
      details: `Fulfilled ${fulfillQty} x ${reservation.product.name} from reservation`,
    });

    return this.getReservation(id, branchId);
  }

  // ==========================================
  // STOCK TRANSFERS
  // ==========================================

  async executeTransfer(dto: StockTransferDto, branchId: string, userId: string) {
    if (dto.sourceWarehouseId === dto.destinationWarehouseId) {
      throw new BadRequestException('Source and destination warehouses cannot be the same');
    }

    const [sourceWh, destWh] = await Promise.all([
      this.prisma.warehouse.findFirst({ where: { id: dto.sourceWarehouseId, branchId } }),
      this.prisma.warehouse.findFirst({ where: { id: dto.destinationWarehouseId, branchId } }),
    ]);

    if (!sourceWh) throw new NotFoundException('Source warehouse not found');
    if (!destWh) throw new NotFoundException('Destination warehouse not found');

    const results = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findFirst({
        where: { id: item.productId, branchId },
      });
      if (!product) throw new NotFoundException(`Product ${item.productId} not found`);

      const quantity = new Decimal(item.quantity);

      const result = await this.createMovement(
        {
          productId: item.productId,
          type: MovementType.TRANSFER,
          quantity: quantity.toNumber(),
          sourceWarehouseId: dto.sourceWarehouseId,
          destinationWarehouseId: dto.destinationWarehouseId,
          reference: dto.reference,
          reason: dto.reason,
          notes: item.notes,
        },
        branchId,
        userId,
      );

      results.push(result);
    }

    await this.audit.log({
      action: 'STOCK_TRANSFER',
      userId,
      branchId,
      resourceId: dto.sourceWarehouseId,
      resourceType: 'Warehouse',
      details: `Transferred ${dto.items.length} products from ${sourceWh.name} to ${destWh.name}`,
    });

    return {
      transferReference: dto.reference ?? `TF-${Date.now()}`,
      sourceWarehouse: sourceWh.name,
      destinationWarehouse: destWh.name,
      itemsTransferred: dto.items.length,
      movements: results,
    };
  }

  async getTransfers(branchId: string, fromWarehouseId?: string, toWarehouseId?: string) {
    const where: Record<string, unknown> = { branchId, type: MovementType.TRANSFER };
    if (fromWarehouseId) where.sourceWarehouseId = fromWarehouseId;
    if (toWarehouseId) where.destinationWarehouseId = toWarehouseId;

    return this.prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true, unit: { select: { abbreviation: true } } } },
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  // ==========================================
  // STOCK ADJUSTMENTS
  // ==========================================

  async createAdjustment(dto: StockAdjustmentDto, branchId: string, userId: string) {
    const [product, warehouse, inventory] = await Promise.all([
      this.prisma.product.findFirst({ where: { id: dto.productId, branchId } }),
      this.prisma.warehouse.findFirst({ where: { id: dto.warehouseId, branchId } }),
      this.prisma.inventory.findFirst({
        where: { productId: dto.productId, warehouseId: dto.warehouseId, branchId },
      }),
    ]);

    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);
    if (!warehouse) throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);

    const adjustment = await this.prisma.stockAdjustment.create({
      data: {
        productId: dto.productId,
        warehouseId: dto.warehouseId,
        quantity: dto.quantity,
        newQuantity: dto.newQuantity ?? null,
        reason: dto.reason,
        unitCost: dto.unitCost ?? inventory?.averageCost.toNumber() ?? product.standardCost,
        status: AdjustmentStatus.PENDING,
        notes: dto.notes ?? null,
        branchId,
        createdBy: userId,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    await this.audit.log({
      action: 'STOCK_ADJUSTMENT.CREATE',
      userId,
      branchId,
      resourceId: adjustment.id,
      resourceType: 'StockAdjustment',
      details: `Created adjustment: ${dto.quantity} x ${product.name} (${dto.reason})`,
    });

    return adjustment;
  }

  async getAdjustments(branchId: string, status?: string) {
    const where: Record<string, unknown> = { branchId };
    if (status) where.status = status;

    return this.prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveAdjustment(
    id: string,
    dto: ApproveAdjustmentDto,
    branchId: string,
    userId: string,
  ) {
    const adjustment = await this.prisma.stockAdjustment.findFirst({
      where: { id, branchId },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    if (!adjustment) throw new NotFoundException(`Adjustment ${id} not found`);
    if (adjustment.status !== AdjustmentStatus.PENDING) {
      throw new BadRequestException(`Adjustment is already ${adjustment.status}`);
    }

    if (dto.approve === false) {
      const updated = await this.prisma.stockAdjustment.update({
        where: { id },
        data: {
          status: AdjustmentStatus.REJECTED,
          approvalNotes: dto.notes ?? 'Rejected',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      });

      await this.audit.log({
        action: 'STOCK_ADJUSTMENT.REJECT',
        userId,
        branchId,
        resourceId: id,
        resourceType: 'StockAdjustment',
        details: `Rejected adjustment ${id}: ${dto.notes}`,
      });

      return updated;
    }

    // Apply the adjustment
    const newStatus = AdjustmentStatus.APPROVED;
    const quantity = new Decimal(adjustment.quantity);

    await this.prisma.$transaction(async (tx) => {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: adjustment.productId,
          warehouseId: adjustment.warehouseId,
          branchId,
        },
      });

      let newQty: Decimal;
      if (adjustment.newQuantity) {
        newQty = new Decimal(adjustment.newQuantity);
      } else if (inventory) {
        newQty = inventory.quantityOnHand.plus(quantity);
      } else {
        newQty = Decimal.max(0, quantity);
      }

      if (newQty.lt(0)) {
        throw new BadRequestException('Adjustment would result in negative stock');
      }

      if (inventory) {
        const unitCost = new Decimal(adjustment.unitCost);
        const newTotalValue = newQty.mul(unitCost);
        await tx.inventory.update({
          where: { id: inventory.id },
          data: {
            quantityOnHand: newQty.toNumber(),
            totalValue: newTotalValue.toNumber(),
            lastMovementDate: new Date(),
            updatedAt: new Date(),
          },
        });
      } else if (newQty.gt(0)) {
        await tx.inventory.create({
          data: {
            productId: adjustment.productId,
            warehouseId: adjustment.warehouseId,
            quantityOnHand: newQty.toNumber(),
            quantityReserved: 0,
            averageCost: adjustment.unitCost,
            totalValue: newQty.mul(adjustment.unitCost).toNumber(),
            lastMovementDate: new Date(),
            branchId,
          },
        });
      }

      // Record ADJUSTMENT movement
      const movementType = quantity.gte(0) ? MovementType.ADJUSTMENT : MovementType.ADJUSTMENT;
      await tx.stockMovement.create({
        data: {
          productId: adjustment.productId,
          type: movementType,
          quantity: Math.abs(quantity.toNumber()),
          unitCost: adjustment.unitCost,
          totalCost: Math.abs(quantity.toNumber()) * adjustment.unitCost,
          ...(quantity.gte(0)
            ? { destinationWarehouseId: adjustment.warehouseId }
            : { sourceWarehouseId: adjustment.warehouseId }),
          reference: id,
          referenceType: 'STOCK_ADJUSTMENT',
          reason: adjustment.reason,
          notes: adjustment.notes,
          branchId,
          createdBy: userId,
        },
      });

      await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: newStatus,
          approvalNotes: dto.notes ?? 'Approved',
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    });

    await this.audit.log({
      action: 'STOCK_ADJUSTMENT.APPROVE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'StockAdjustment',
      details: `Approved adjustment ${id}: ${quantity} x ${adjustment.product.name}`,
    });

    return this.prisma.stockAdjustment.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });
  }

  // ==========================================
  // PHYSICAL / CYCLE COUNTS
  // ==========================================

  async createCount(dto: CreateInventoryCountDto, branchId: string, userId: string) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: dto.warehouseId, branchId },
    });
    if (!warehouse) throw new NotFoundException(`Warehouse ${dto.warehouseId} not found`);

    // Build product query
    const productWhere: Record<string, unknown> = { branchId, isActive: true };
    if (dto.categoryId) productWhere.categoryId = dto.categoryId;
    if (dto.productIds && dto.productIds.length > 0) productWhere.id = { in: dto.productIds };

    const products = await this.prisma.product.findMany({
      where: productWhere,
      select: { id: true, name: true, sku: true },
      orderBy: { name: 'asc' },
    });

    const count = await this.prisma.$transaction(async (tx) => {
      const countSheet = await tx.inventoryCount.create({
        data: {
          warehouseId: dto.warehouseId,
          title: dto.title ?? `Count - ${warehouse.name} - ${new Date().toISOString().split('T')[0]}`,
          status: CountStatus.DRAFT,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : new Date(),
          totalItems: products.length,
          varianceItems: 0,
          totalVarianceValue: 0,
          notes: dto.notes ?? null,
          branchId,
          createdBy: userId,
        },
      });

      // Create count items with expected quantities from current inventory
      for (const product of products) {
        const inventory = await tx.inventory.findFirst({
          where: { productId: product.id, warehouseId: dto.warehouseId, branchId },
        });

        await tx.countItem.create({
          data: {
            countId: countSheet.id,
            productId: product.id,
            expectedQuantity: inventory ? inventory.quantityOnHand.toNumber() : 0,
            countedQuantity: null,
            variance: null,
            notes: null,
          },
        });
      }

      return countSheet;
    });

    await this.audit.log({
      action: 'INVENTORY_COUNT.CREATE',
      userId,
      branchId,
      resourceId: count.id,
      resourceType: 'InventoryCount',
      details: `Created count sheet for ${warehouse.name} with ${products.length} products`,
    });

    return this.prisma.inventoryCount.findUnique({
      where: { id: count.id },
      include: {
        warehouse: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, unit: { select: { abbreviation: true } } } },
          },
        },
      },
    });
  }

  async getCounts(branchId: string, status?: string) {
    const where: Record<string, unknown> = { branchId };
    if (status) where.status = status;

    return this.prisma.inventoryCount.findMany({
      where,
      include: {
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getCount(id: string, branchId: string) {
    const count = await this.prisma.inventoryCount.findFirst({
      where: { id, branchId },
      include: {
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: { select: { abbreviation: true } },
              },
            },
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!count) throw new NotFoundException(`Count ${id} not found`);
    return count;
  }

  async submitCount(
    id: string,
    dto: SubmitCountDto,
    branchId: string,
    userId: string,
  ) {
    const count = await this.getCount(id, branchId);

    if (count.status !== CountStatus.DRAFT && count.status !== CountStatus.IN_PROGRESS) {
      throw new BadRequestException(`Count is ${count.status}, cannot submit`);
    }

    let varianceItems = 0;
    let totalVarianceValue = 0;

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const countItem = await tx.countItem.findFirst({
          where: { countId: id, productId: item.productId },
          include: {
            product: { select: { standardCost: true } },
          },
        });

        if (!countItem) continue;

        const countedQty = new Decimal(item.countedQuantity);
        const expectedQty = new Decimal(countItem.expectedQuantity ?? 0);
        const variance = countedQty.minus(expectedQty);
        const unitCost = countItem.product?.standardCost ?? 0;
        const varianceValue = variance.mul(unitCost).toNumber();

        if (!variance.equals(0)) {
          varianceItems++;
          totalVarianceValue += Math.abs(varianceValue);
        }

        await tx.countItem.update({
          where: { id: countItem.id },
          data: {
            countedQuantity: countedQty.toNumber(),
            variance: variance.toNumber(),
            notes: item.notes ?? countItem.notes,
          },
        });
      }

      await tx.inventoryCount.update({
        where: { id },
        data: {
          status: CountStatus.COMPLETED,
          completedDate: new Date(),
          varianceItems,
          totalVarianceValue,
          updatedAt: new Date(),
        },
      });
    });

    await this.audit.log({
      action: 'INVENTORY_COUNT.SUBMIT',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'InventoryCount',
      details: `Submitted count ${id}: ${varianceItems} variances, ${totalVarianceValue.toFixed(2)} value variance`,
    });

    return this.getCount(id, branchId);
  }

  async approveCount(
    id: string,
    dto: ApproveCountDto,
    branchId: string,
    userId: string,
  ) {
    const count = await this.getCount(id, branchId);

    if (count.status !== CountStatus.COMPLETED) {
      throw new BadRequestException(`Count is ${count.status}, cannot approve`);
    }

    if (dto.approve === false) {
      await this.prisma.inventoryCount.update({
        where: { id },
        data: {
          status: CountStatus.CANCELLED,
          notes: dto.notes ? `${count.notes ?? ''}\nCancelled: ${dto.notes}`.trim() : count.notes,
          updatedAt: new Date(),
        },
      });

      await this.audit.log({
        action: 'INVENTORY_COUNT.CANCEL',
        userId,
        branchId,
        resourceId: id,
        resourceType: 'InventoryCount',
        details: `Cancelled count ${id}: ${dto.notes}`,
      });

      return this.getCount(id, branchId);
    }

    const adjustments: Array<{
      productName: string;
      variance: number;
      newQuantity: number;
    }> = [];

    await this.prisma.$transaction(async (tx) => {
      const countItems = await tx.countItem.findMany({
        where: { countId: id },
        include: {
          product: { select: { id: true, name: true, standardCost: true } },
        },
      });

      for (const item of countItems) {
        if (item.variance === null || item.variance === 0) continue;
        if (dto.skipAdjustments) continue;

        const variance = new Decimal(item.variance ?? 0);
        const newQty = new Decimal(item.countedQuantity ?? 0);

        // Create stock adjustment for variance
        const adjustmentReason = variance.gt(0) ? AdjustmentReason.FOUND : AdjustmentReason.COUNT;

        await tx.stockAdjustment.create({
          data: {
            productId: item.productId,
            warehouseId: count.warehouseId,
            quantity: variance.toNumber(),
            newQuantity: newQty.toNumber(),
            reason: adjustmentReason,
            unitCost: item.product.standardCost,
            status: AdjustmentStatus.APPROVED,
            notes: `Auto-generated from count ${count.title}`,
            approvalNotes: 'Auto-approved from count approval',
            branchId,
            createdBy: userId,
            approvedBy: userId,
            approvedAt: new Date(),
          },
        });

        // Apply inventory update
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            warehouseId: count.warehouseId,
            branchId,
          },
        });

        if (inventory) {
          const unitCost = new Decimal(item.product.standardCost);
          const newTotalValue = newQty.mul(unitCost);
          await tx.inventory.update({
            where: { id: inventory.id },
            data: {
              quantityOnHand: newQty.toNumber(),
              totalValue: newTotalValue.toNumber(),
              lastMovementDate: new Date(),
              updatedAt: new Date(),
            },
          });
        } else if (newQty.gt(0)) {
          await tx.inventory.create({
            data: {
              productId: item.productId,
              warehouseId: count.warehouseId,
              quantityOnHand: newQty.toNumber(),
              quantityReserved: 0,
              averageCost: item.product.standardCost,
              totalValue: newQty.mul(item.product.standardCost).toNumber(),
              lastMovementDate: new Date(),
              branchId,
            },
          });
        }

        // Record movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.ADJUSTMENT,
            quantity: Math.abs(variance.toNumber()),
            unitCost: item.product.standardCost,
            totalCost: Math.abs(variance.toNumber()) * item.product.standardCost,
            destinationWarehouseId: count.warehouseId,
            reference: id,
            referenceType: 'INVENTORY_COUNT',
            reason: adjustmentReason,
            notes: `Count variance adjustment: expected ${item.expectedQuantity}, counted ${item.countedQuantity}`,
            branchId,
            createdBy: userId,
          },
        });

        adjustments.push({
          productName: item.product.name,
          variance: variance.toNumber(),
          newQuantity: newQty.toNumber(),
        });
      }

      await tx.inventoryCount.update({
        where: { id },
        data: {
          status: CountStatus.APPROVED,
          approvedBy: userId,
          approvedAt: new Date(),
          updatedAt: new Date(),
          notes: dto.notes ? `${count.notes ?? ''}\nApproved: ${dto.notes}`.trim() : count.notes,
        },
      });
    });

    await this.audit.log({
      action: 'INVENTORY_COUNT.APPROVE',
      userId,
      branchId,
      resourceId: id,
      resourceType: 'InventoryCount',
      details: `Approved count ${id}: ${adjustments.length} adjustments applied`,
    });

    return {
      count: await this.getCount(id, branchId),
      adjustmentsApplied: adjustments.length,
      adjustments,
    };
  }

  async getVarianceReport(id: string, branchId: string) {
    const count = await this.getCount(id, branchId);

    const varianceItems = count.items.filter(
      (item: { variance: number | null }) => item.variance !== null && item.variance !== 0,
    );

    const summary = {
      totalProducts: count.totalItems,
      countedProducts: count.items.filter(
        (item: { countedQuantity: number | null }) => item.countedQuantity !== null,
      ).length,
      varianceCount: varianceItems.length,
      positiveVariance: varianceItems.filter(
        (item: { variance: number }) => (item.variance ?? 0) > 0,
      ).length,
      negativeVariance: varianceItems.filter(
        (item: { variance: number }) => (item.variance ?? 0) < 0,
      ).length,
      totalVarianceValue: count.totalVarianceValue,
      accuracyPercent:
        count.totalItems > 0
          ? ((count.totalItems - varianceItems.length) / count.totalItems) * 100
          : 0,
    };

    return { count: { id: count.id, title: count.title, status: count.status }, summary, variances: varianceItems };
  }
}

// Helper type for Prisma transactions
type PrismaTransaction = Parameters<Parameters<typeof PrismaService.prototype['$transaction']>[0]>[0];
