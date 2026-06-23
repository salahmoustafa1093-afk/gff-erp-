import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';
import { CreateManufacturingOrderDto } from './dto/create-manufacturing-order.dto';
import { UpdateManufacturingOrderDto } from './dto/update-manufacturing-order.dto';
import { CompleteManufacturingDto } from './dto/complete-manufacturing.dto';
import { ManufacturingFilterDto } from './dto/manufacturing-filter.dto';
import { YieldReportFilterDto, CostReportFilterDto } from './dto/yield-report.dto';
import {
  RecordConsumptionDto,
  AddConsumptionLineDto,
  UpdateConsumptionLineDto,
} from './dto/consumption-line.dto';
import {
  ManufacturingStatus,
  QualityStatus,
  IManufacturingOrder,
  IConsumptionLine,
  IQualityTest,
  IYieldReport,
  ICostReport,
  IProductionCapacityReport,
} from './interfaces/manufacturing.interface';

@Injectable()
export class ManufacturingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────

  async create(dto: CreateManufacturingOrderDto, userId: string): Promise<IManufacturingOrder> {
    // Validate feed formula
    const formula = await this.prisma.feedFormula.findUnique({
      where: { id: dto.feedFormulaId },
      include: { ingredients: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!formula) {
      throw new NotFoundException(`Feed formula '${dto.feedFormulaId}' not found`);
    }

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Calculate planned cost from formula
    const plannedCost = formula.totalCostPerKg
      ? new Decimal(formula.totalCostPerKg).mul(dto.plannedQuantityKg)
      : new Decimal(0);

    // Auto-generate consumption lines from formula if not provided
    const consumptionLines = dto.consumptionLines || formula.ingredients.map((ing) => ({
      productId: ing.productId,
      plannedQuantityKg: new Decimal(ing.percentage)
        .div(100)
        .mul(dto.plannedQuantityKg)
        .toNumber(),
      unitCost: ing.costPerKg ? Number(ing.costPerKg) : undefined,
      sortOrder: ing.sortOrder,
    }));

    const result = await this.prisma.$transaction(async (tx) => {
      const order = await tx.manufacturingOrder.create({
        data: {
          orderNumber,
          feedFormulaId: dto.feedFormulaId,
          status: ManufacturingStatus.DRAFT,
          plannedQuantityKg: new Decimal(dto.plannedQuantityKg),
          plannedCost,
          productionDate: dto.productionDate ? new Date(dto.productionDate) : new Date(),
          branchId: dto.branchId || null,
          warehouseId: dto.warehouseId || null,
          outputWarehouseId: dto.outputWarehouseId || null,
          notes: dto.notes || null,
          qualityStatus: QualityStatus.PENDING,
          createdBy: userId,
          consumptionLines: {
            create: consumptionLines.map((line, idx) => ({
              productId: line.productId,
              plannedQuantityKg: new Decimal(line.plannedQuantityKg),
              actualQuantityKg: null,
              varianceKg: null,
              unitCost: line.unitCost ? new Decimal(line.unitCost) : null,
              totalCost: line.unitCost
                ? new Decimal(line.unitCost).mul(line.plannedQuantityKg)
                : null,
              sortOrder: line.sortOrder ?? idx,
            })),
          },
          qualityTests: dto.qualityTests
            ? {
                create: dto.qualityTests.map((qt) => ({
                  testType: qt.testType,
                  testValue: qt.testValue ? new Decimal(qt.testValue) : null,
                  targetValue: qt.targetValue ? new Decimal(qt.targetValue) : null,
                  unit: qt.unit || '%',
                  result: QualityStatus.PENDING,
                  notes: qt.notes || null,
                })),
              }
            : undefined,
        },
        include: {
          consumptionLines: { orderBy: { sortOrder: 'asc' } },
          qualityTests: true,
          feedFormula: { select: { name: true, code: true } },
        },
      });

      return order;
    });

    await this.audit.log({
      action: 'MANUFACTURING_ORDER_CREATED',
      entity: 'ManufacturingOrder',
      entityId: result.id,
      userId,
      details: {
        orderNumber: result.orderNumber,
        formulaId: dto.feedFormulaId,
        plannedQuantity: dto.plannedQuantityKg,
      },
    });

    return this.mapToInterface(result);
  }

  async findAll(filter: ManufacturingFilterDto): Promise<{ data: IManufacturingOrder[]; total: number }> {
    const {
      search,
      status,
      qualityStatus,
      feedFormulaId,
      branchId,
      warehouseId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filter;

    const where: any = {};

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { batchNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (qualityStatus) where.qualityStatus = qualityStatus;
    if (feedFormulaId) where.feedFormulaId = feedFormulaId;
    if (branchId) where.branchId = branchId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (dateFrom || dateTo) {
      where.productionDate = {};
      if (dateFrom) where.productionDate.gte = new Date(dateFrom);
      if (dateTo) where.productionDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.manufacturingOrder.findMany({
        where,
        include: {
          consumptionLines: { orderBy: { sortOrder: 'asc' } },
          qualityTests: true,
          feedFormula: { select: { name: true, code: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.manufacturingOrder.count({ where }),
    ]);

    return {
      data: data.map((o) => this.mapToInterface(o)),
      total,
    };
  }

  async findOne(id: string): Promise<IManufacturingOrder> {
    const order = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: {
        consumptionLines: {
          orderBy: { sortOrder: 'asc' },
          include: { product: { select: { name: true, sku: true, unitId: true } } },
        },
        qualityTests: true,
        feedFormula: { select: { name: true, code: true } },
      },
    });

    if (!order) {
      throw new NotFoundException(`Manufacturing order '${id}' not found`);
    }

    return this.mapToInterface(order);
  }

  async update(id: string, dto: UpdateManufacturingOrderDto, userId: string): Promise<IManufacturingOrder> {
    const existing = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { consumptionLines: true, qualityTests: true },
    });
    if (!existing) {
      throw new NotFoundException(`Manufacturing order '${id}' not found`);
    }

    if (existing.status === ManufacturingStatus.COMPLETED || existing.status === ManufacturingStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update a ${existing.status.toLowerCase()} order`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Handle consumption lines replacement
      if (dto.consumptionLines && dto.consumptionLines.length > 0) {
        await tx.consumptionLine.deleteMany({ where: { manufacturingOrderId: id } });
      }

      // Handle quality tests replacement
      if (dto.qualityTests && dto.qualityTests.length > 0) {
        await tx.qualityTest.deleteMany({ where: { manufacturingOrderId: id } });
      }

      const updateData: any = {
        feedFormulaId: dto.feedFormulaId,
        plannedQuantityKg: dto.plannedQuantityKg
          ? new Decimal(dto.plannedQuantityKg)
          : undefined,
        status: dto.status,
        productionDate: dto.productionDate ? new Date(dto.productionDate) : undefined,
        completionDate: dto.completionDate ? new Date(dto.completionDate) : undefined,
        branchId: dto.branchId,
        warehouseId: dto.warehouseId,
        outputWarehouseId: dto.outputWarehouseId,
        notes: dto.notes,
      };

      // Recalculate planned cost if quantity or formula changed
      if (dto.plannedQuantityKg || dto.feedFormulaId) {
        const formulaId = dto.feedFormulaId || existing.feedFormulaId;
        const formula = await tx.feedFormula.findUnique({
          where: { id: formulaId },
        });
        const qty = dto.plannedQuantityKg
          ? new Decimal(dto.plannedQuantityKg)
          : existing.plannedQuantityKg;
        if (formula && formula.totalCostPerKg) {
          updateData.plannedCost = new Decimal(formula.totalCostPerKg).mul(qty);
        }
      }

      if (dto.consumptionLines) {
        updateData.consumptionLines = {
          create: dto.consumptionLines.map((line, idx) => ({
            productId: line.productId,
            plannedQuantityKg: new Decimal(line.plannedQuantityKg),
            actualQuantityKg: null,
            varianceKg: null,
            unitCost: line.unitCost ? new Decimal(line.unitCost) : null,
            totalCost: line.unitCost
              ? new Decimal(line.unitCost).mul(line.plannedQuantityKg)
              : null,
            sortOrder: line.sortOrder ?? idx,
          })),
        };
      }

      if (dto.qualityTests) {
        updateData.qualityTests = {
          create: dto.qualityTests.map((qt) => ({
            testType: qt.testType,
            testValue: qt.testValue ? new Decimal(qt.testValue) : null,
            targetValue: qt.targetValue ? new Decimal(qt.targetValue) : null,
            unit: qt.unit || '%',
            result: QualityStatus.PENDING,
            notes: qt.notes || null,
          })),
        };
      }

      return tx.manufacturingOrder.update({
        where: { id },
        data: updateData,
        include: {
          consumptionLines: { orderBy: { sortOrder: 'asc' } },
          qualityTests: true,
          feedFormula: { select: { name: true, code: true } },
        },
      });
    });

    await this.audit.log({
      action: 'MANUFACTURING_ORDER_UPDATED',
      entity: 'ManufacturingOrder',
      entityId: result.id,
      userId,
      details: { orderNumber: result.orderNumber, status: result.status },
    });

    return this.mapToInterface(result);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.manufacturingOrder.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Manufacturing order '${id}' not found`);
    }
    if (existing.status === ManufacturingStatus.IN_PROGRESS || existing.status === ManufacturingStatus.COMPLETED) {
      throw new BadRequestException('Cannot delete an in-progress or completed order');
    }

    await this.prisma.$transaction([
      this.prisma.consumptionLine.deleteMany({ where: { manufacturingOrderId: id } }),
      this.prisma.qualityTest.deleteMany({ where: { manufacturingOrderId: id } }),
      this.prisma.manufacturingOrder.delete({ where: { id } }),
    ]);

    await this.audit.log({
      action: 'MANUFACTURING_ORDER_DELETED',
      entity: 'ManufacturingOrder',
      entityId: id,
      userId,
      details: { orderNumber: existing.orderNumber },
    });
  }

  // ─────────────────────────────────────────────
  // Status Transitions
  // ─────────────────────────────────────────────

  async startProduction(id: string, userId: string): Promise<IManufacturingOrder> {
    const order = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { consumptionLines: true },
    });
    if (!order) throw new NotFoundException(`Order '${id}' not found`);
    if (order.status !== ManufacturingStatus.DRAFT && order.status !== ManufacturingStatus.PLANNED) {
      throw new BadRequestException(`Cannot start production from status: ${order.status}`);
    }

    // Deduct raw materials from warehouse
    await this.prisma.$transaction(async (tx) => {
      for (const line of order.consumptionLines) {
        if (line.plannedQuantityKg.gt(0) && order.warehouseId) {
          // Get current stock
          const stock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          if (!stock || new Decimal(stock.quantity).lt(line.plannedQuantityKg)) {
            throw new BadRequestException(
              `Insufficient stock for product ${line.productId}. Required: ${line.plannedQuantityKg}, Available: ${stock?.quantity || 0}`,
            );
          }

          // Deduct stock
          await tx.stock.update({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: order.warehouseId,
              },
            },
            data: {
              quantity: new Decimal(stock.quantity).sub(line.plannedQuantityKg),
              reservedQuantity: new Decimal(stock.reservedQuantity || 0).add(line.plannedQuantityKg),
            },
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: line.productId,
              warehouseId: order.warehouseId,
              type: 'MANUFACTURING_CONSUMPTION',
              quantity: line.plannedQuantityKg,
              unitCost: line.unitCost,
              reference: order.orderNumber,
              referenceId: order.id,
              notes: `Manufacturing consumption for ${order.orderNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      // Update order status
      await tx.manufacturingOrder.update({
        where: { id },
        data: { status: ManufacturingStatus.IN_PROGRESS },
      });
    });

    const result = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: {
        consumptionLines: { orderBy: { sortOrder: 'asc' } },
        qualityTests: true,
        feedFormula: { select: { name: true, code: true } },
      },
    });

    await this.audit.log({
      action: 'MANUFACTURING_STARTED',
      entity: 'ManufacturingOrder',
      entityId: id,
      userId,
      details: { orderNumber: order.orderNumber },
    });

    return this.mapToInterface(result);
  }

  async completeProduction(id: string, dto: CompleteManufacturingDto, userId: string): Promise<IManufacturingOrder> {
    const order = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { consumptionLines: true, qualityTests: true },
    });
    if (!order) throw new NotFoundException(`Order '${id}' not found`);
    if (order.status !== ManufacturingStatus.IN_PROGRESS) {
      throw new BadRequestException(`Cannot complete order in status: ${order.status}`);
    }

    const yieldPercentage = (dto.actualQuantityKg / Number(order.plannedQuantityKg)) * 100;

    const result = await this.prisma.$transaction(async (tx) => {
      // Update consumption lines with actual quantities if quality tests provided
      if (dto.qualityTests && dto.qualityTests.length > 0) {
        for (const qt of dto.qualityTests) {
          const testResult = qt.result || (
            qt.testValue >= 0 ? QualityStatus.PASS : QualityStatus.FAIL
          );
          await tx.qualityTest.update({
            where: { id: qt.testId },
            data: {
              testValue: new Decimal(qt.testValue),
              result: testResult as QualityStatus,
              notes: qt.notes || null,
              testedBy: userId,
              testedAt: new Date(),
            },
          });
        }
      }

      // Determine overall quality status
      const qualityTests = await tx.qualityTest.findMany({
        where: { manufacturingOrderId: id },
      });
      const overallQuality = qualityTests.every((t) => t.result === QualityStatus.PASS)
        ? QualityStatus.PASS
        : qualityTests.some((t) => t.result === QualityStatus.FAIL)
          ? QualityStatus.FAIL
          : qualityTests.some((t) => t.result === QualityStatus.PARTIAL)
            ? QualityStatus.PARTIAL
            : QualityStatus.PENDING;

      // Calculate actual material cost from consumption
      let actualMaterialCost = new Decimal(0);
      for (const line of order.consumptionLines) {
        const cost = line.unitCost
          ? new Decimal(line.unitCost).mul(line.plannedQuantityKg)
          : new Decimal(0);
        actualMaterialCost = actualMaterialCost.add(cost);
      }

      const overheadCost = new Decimal(dto.overheadCost || 0);
      const totalActualCost = actualMaterialCost.add(overheadCost);

      // Release reserved stock and record final consumption
      if (order.warehouseId) {
        for (const line of order.consumptionLines) {
          const stock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: order.warehouseId,
              },
            },
          });

          if (stock) {
            await tx.stock.update({
              where: {
                productId_warehouseId: {
                  productId: line.productId,
                  warehouseId: order.warehouseId,
                },
              },
              data: {
                reservedQuantity: Decimal.max(
                  new Decimal(stock.reservedQuantity || 0).sub(line.plannedQuantityKg),
                  new Decimal(0),
                ),
              },
            });
          }
        }
      }

      // Add finished goods to output warehouse
      if (order.outputWarehouseId && order.feedFormulaId) {
        const formula = await tx.feedFormula.findUnique({
          where: { id: order.feedFormulaId },
        });

        // Find or create the feed product
        const feedProduct = await tx.product.findFirst({
          where: {
            OR: [
              { name: { contains: formula?.name || '', mode: 'insensitive' } },
              { sku: { contains: formula?.code || '', mode: 'insensitive' } },
            ],
          },
        });

        if (feedProduct) {
          const existingStock = await tx.stock.findUnique({
            where: {
              productId_warehouseId: {
                productId: feedProduct.id,
                warehouseId: order.outputWarehouseId,
              },
            },
          });

          if (existingStock) {
            await tx.stock.update({
              where: {
                productId_warehouseId: {
                  productId: feedProduct.id,
                  warehouseId: order.outputWarehouseId,
                },
              },
              data: {
                quantity: new Decimal(existingStock.quantity).add(dto.actualQuantityKg),
                averageCost: this.calculateNewAverageCost(
                  existingStock,
                  dto.actualQuantityKg,
                  totalActualCost,
                ),
              },
            });
          } else {
            await tx.stock.create({
              data: {
                productId: feedProduct.id,
                warehouseId: order.outputWarehouseId,
                quantity: new Decimal(dto.actualQuantityKg),
                reservedQuantity: new Decimal(0),
                averageCost: totalActualCost.div(dto.actualQuantityKg),
              },
            });
          }

          // Create stock movement for output
          await tx.stockMovement.create({
            data: {
              productId: feedProduct.id,
              warehouseId: order.outputWarehouseId,
              type: 'MANUFACTURING_OUTPUT',
              quantity: new Decimal(dto.actualQuantityKg),
              unitCost: totalActualCost.div(dto.actualQuantityKg),
              reference: order.orderNumber,
              referenceId: order.id,
              notes: `Manufacturing output for ${order.orderNumber}`,
              createdBy: userId,
            },
          });
        }
      }

      const updated = await tx.manufacturingOrder.update({
        where: { id },
        data: {
          status: ManufacturingStatus.COMPLETED,
          actualQuantityKg: new Decimal(dto.actualQuantityKg),
          actualCost: totalActualCost,
          yieldPercentage: new Decimal(yieldPercentage),
          completionDate: new Date(),
          batchNumber: dto.batchNumber || `BATCH-${order.orderNumber}`,
          qualityStatus: overallQuality,
          notes: dto.notes ? `${order.notes || ''}\n${dto.notes}` : order.notes,
        },
        include: {
          consumptionLines: { orderBy: { sortOrder: 'asc' } },
          qualityTests: true,
          feedFormula: { select: { name: true, code: true } },
        },
      });

      return updated;
    });

    await this.audit.log({
      action: 'MANUFACTURING_COMPLETED',
      entity: 'ManufacturingOrder',
      entityId: id,
      userId,
      details: {
        orderNumber: result.orderNumber,
        actualQuantity: dto.actualQuantityKg,
        yieldPercentage,
        qualityStatus: result.qualityStatus,
      },
    });

    return this.mapToInterface(result);
  }

  async cancelOrder(id: string, userId: string, reason?: string): Promise<IManufacturingOrder> {
    const order = await this.prisma.manufacturingOrder.findUnique({
      where: { id },
      include: { consumptionLines: true },
    });
    if (!order) throw new NotFoundException(`Order '${id}' not found`);
    if (order.status === ManufacturingStatus.COMPLETED || order.status === ManufacturingStatus.CANCELLED) {
      throw new BadRequestException(`Cannot cancel order in status: ${order.status}`);
    }

    // Return reserved materials to available stock
    if (order.status === ManufacturingStatus.IN_PROGRESS && order.warehouseId) {
      for (const line of order.consumptionLines) {
        const stock = await this.prisma.stock.findUnique({
          where: {
            productId_warehouseId: {
              productId: line.productId,
              warehouseId: order.warehouseId,
            },
          },
        });

        if (stock) {
          await this.prisma.stock.update({
            where: {
              productId_warehouseId: {
                productId: line.productId,
                warehouseId: order.warehouseId,
              },
            },
            data: {
              quantity: new Decimal(stock.quantity).add(line.plannedQuantityKg),
              reservedQuantity: Decimal.max(
                new Decimal(stock.reservedQuantity || 0).sub(line.plannedQuantityKg),
                new Decimal(0),
              ),
            },
          });
        }
      }
    }

    const result = await this.prisma.manufacturingOrder.update({
      where: { id },
      data: {
        status: ManufacturingStatus.CANCELLED,
        notes: reason ? `${order.notes || ''}\nCancelled: ${reason}` : order.notes,
      },
      include: {
        consumptionLines: { orderBy: { sortOrder: 'asc' } },
        qualityTests: true,
        feedFormula: { select: { name: true, code: true } },
      },
    });

    await this.audit.log({
      action: 'MANUFACTURING_CANCELLED',
      entity: 'ManufacturingOrder',
      entityId: id,
      userId,
      details: { orderNumber: order.orderNumber, reason },
    });

    return this.mapToInterface(result);
  }

  // ─────────────────────────────────────────────
  // Consumption Line Management
  // ─────────────────────────────────────────────

  async recordConsumption(id: string, dto: RecordConsumptionDto, userId: string): Promise<IConsumptionLine> {
    const order = await this.prisma.manufacturingOrder.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order '${id}' not found`);

    const line = await this.prisma.consumptionLine.findUnique({ where: { id: dto.lineId } });
    if (!line || line.manufacturingOrderId !== id) {
      throw new NotFoundException(`Consumption line '${dto.lineId}' not found`);
    }

    const varianceKg = new Decimal(dto.actualQuantityKg).sub(line.plannedQuantityKg);
    const totalCost = line.unitCost
      ? new Decimal(line.unitCost).mul(dto.actualQuantityKg)
      : null;

    const updated = await this.prisma.consumptionLine.update({
      where: { id: dto.lineId },
      data: {
        actualQuantityKg: new Decimal(dto.actualQuantityKg),
        varianceKg,
        totalCost,
      },
      include: { product: { select: { name: true } } },
    });

    await this.audit.log({
      action: 'CONSUMPTION_RECORDED',
      entity: 'ConsumptionLine',
      entityId: dto.lineId,
      userId,
      details: {
        orderId: id,
        actualQty: dto.actualQuantityKg,
        variance: varianceKg.toNumber(),
      },
    });

    return {
      id: updated.id,
      manufacturingOrderId: updated.manufacturingOrderId,
      productId: updated.productId,
      productName: updated.product?.name,
      plannedQuantityKg: Number(updated.plannedQuantityKg),
      actualQuantityKg: updated.actualQuantityKg ? Number(updated.actualQuantityKg) : null,
      varianceKg: updated.varianceKg ? Number(updated.varianceKg) : null,
      unitCost: updated.unitCost ? Number(updated.unitCost) : null,
      totalCost: updated.totalCost ? Number(updated.totalCost) : null,
      sortOrder: updated.sortOrder,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async addConsumptionLine(dto: AddConsumptionLineDto, userId: string): Promise<IConsumptionLine> {
    const order = await this.prisma.manufacturingOrder.findUnique({
      where: { id: dto.manufacturingOrderId },
    });
    if (!order) throw new NotFoundException(`Order '${dto.manufacturingOrderId}' not found`);
    if (order.status !== ManufacturingStatus.DRAFT && order.status !== ManufacturingStatus.PLANNED) {
      throw new BadRequestException('Cannot add lines to an active or completed order');
    }

    const totalCost = dto.unitCost
      ? new Decimal(dto.unitCost).mul(dto.plannedQuantityKg)
      : null;

    const line = await this.prisma.consumptionLine.create({
      data: {
        manufacturingOrderId: dto.manufacturingOrderId,
        productId: dto.productId,
        plannedQuantityKg: new Decimal(dto.plannedQuantityKg),
        actualQuantityKg: dto.actualQuantityKg ? new Decimal(dto.actualQuantityKg) : null,
        varianceKg: null,
        unitCost: dto.unitCost ? new Decimal(dto.unitCost) : null,
        totalCost,
        sortOrder: dto.sortOrder || 0,
      },
      include: { product: { select: { name: true } } },
    });

    await this.audit.log({
      action: 'CONSUMPTION_LINE_ADDED',
      entity: 'ConsumptionLine',
      entityId: line.id,
      userId,
      details: { orderId: dto.manufacturingOrderId, productId: dto.productId },
    });

    return {
      id: line.id,
      manufacturingOrderId: line.manufacturingOrderId,
      productId: line.productId,
      productName: line.product?.name,
      plannedQuantityKg: Number(line.plannedQuantityKg),
      actualQuantityKg: line.actualQuantityKg ? Number(line.actualQuantityKg) : null,
      varianceKg: line.varianceKg ? Number(line.varianceKg) : null,
      unitCost: line.unitCost ? Number(line.unitCost) : null,
      totalCost: line.totalCost ? Number(line.totalCost) : null,
      sortOrder: line.sortOrder,
      createdAt: line.createdAt,
      updatedAt: line.updatedAt,
    };
  }

  // ─────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────

  async getYieldReport(filter: YieldReportFilterDto): Promise<IYieldReport> {
    const where: any = { status: ManufacturingStatus.COMPLETED };
    if (filter.feedFormulaId) where.feedFormulaId = filter.feedFormulaId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.dateFrom || filter.dateTo) {
      where.completionDate = {};
      if (filter.dateFrom) where.completionDate.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.completionDate.lte = new Date(filter.dateTo);
    }

    const orders = await this.prisma.manufacturingOrder.findMany({
      where,
      include: { feedFormula: { select: { name: true } } },
    });

    const totalPlanned = orders.reduce((sum, o) => sum + Number(o.plannedQuantityKg), 0);
    const totalActual = orders.reduce(
      (sum, o) => sum + (o.actualQuantityKg ? Number(o.actualQuantityKg) : 0),
      0,
    );

    // Group by formula
    const formulaMap = new Map();
    for (const o of orders) {
      const key = o.feedFormulaId;
      if (!formulaMap.has(key)) {
        formulaMap.set(key, {
          formulaId: o.feedFormulaId,
          formulaName: o.feedFormula?.name || 'Unknown',
          orderCount: 0,
          plannedQty: 0,
          actualQty: 0,
        });
      }
      const f = formulaMap.get(key);
      f.orderCount++;
      f.plannedQty += Number(o.plannedQuantityKg);
      f.actualQty += o.actualQuantityKg ? Number(o.actualQuantityKg) : 0;
    }

    // Group by month
    const periodMap = new Map();
    for (const o of orders) {
      if (!o.completionDate) continue;
      const d = new Date(o.completionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!periodMap.has(key)) {
        periodMap.set(key, { period: key, orderCount: 0, plannedQty: 0, actualQty: 0 });
      }
      const p = periodMap.get(key);
      p.orderCount++;
      p.plannedQty += Number(o.plannedQuantityKg);
      p.actualQty += o.actualQuantityKg ? Number(o.actualQuantityKg) : 0;
    }

    return {
      totalOrders: orders.length,
      totalPlannedQuantity: Math.round(totalPlanned * 10000) / 10000,
      totalActualQuantity: Math.round(totalActual * 10000) / 10000,
      averageYieldPercentage: totalPlanned > 0 ? Math.round((totalActual / totalPlanned) * 10000) / 100 : 0,
      byFormula: Array.from(formulaMap.values()).map((f) => ({
        ...f,
        avgYield: f.plannedQty > 0 ? Math.round((f.actualQty / f.plannedQty) * 10000) / 100 : 0,
      })),
      byPeriod: Array.from(periodMap.values())
        .sort((a, b) => a.period.localeCompare(b.period))
        .map((p) => ({
          ...p,
          avgYield: p.plannedQty > 0 ? Math.round((p.actualQty / p.plannedQty) * 10000) / 100 : 0,
        })),
    };
  }

  async getCostReport(filter: CostReportFilterDto): Promise<ICostReport> {
    const where: any = { status: ManufacturingStatus.COMPLETED };
    if (filter.feedFormulaId) where.feedFormulaId = filter.feedFormulaId;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.dateFrom || filter.dateTo) {
      where.completionDate = {};
      if (filter.dateFrom) where.completionDate.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.completionDate.lte = new Date(filter.dateTo);
    }

    const orders = await this.prisma.manufacturingOrder.findMany({
      where,
      include: { feedFormula: { select: { name: true } }, consumptionLines: true },
    });

    const totalPlannedCost = orders.reduce(
      (sum, o) => sum + (o.plannedCost ? Number(o.plannedCost) : 0),
      0,
    );
    const totalActualCost = orders.reduce(
      (sum, o) => sum + (o.actualCost ? Number(o.actualCost) : 0),
      0,
    );

    // Group by formula
    const formulaMap = new Map();
    for (const o of orders) {
      const key = o.feedFormulaId;
      if (!formulaMap.has(key)) {
        formulaMap.set(key, {
          formulaId: o.feedFormulaId,
          formulaName: o.feedFormula?.name || 'Unknown',
          plannedCost: 0,
          actualCost: 0,
          variance: 0,
        });
      }
      const f = formulaMap.get(key);
      f.plannedCost += o.plannedCost ? Number(o.plannedCost) : 0;
      f.actualCost += o.actualCost ? Number(o.actualCost) : 0;
      f.variance += (o.actualCost ? Number(o.actualCost) : 0) - (o.plannedCost ? Number(o.plannedCost) : 0);
    }

    const totalActual = orders.reduce(
      (sum, o) => sum + (o.actualQuantityKg ? Number(o.actualQuantityKg) : 0),
      0,
    );

    return {
      totalPlannedCost: Math.round(totalPlannedCost * 100) / 100,
      totalActualCost: Math.round(totalActualCost * 100) / 100,
      costVariance: Math.round((totalActualCost - totalPlannedCost) * 100) / 100,
      costVariancePercentage:
        totalPlannedCost > 0
          ? Math.round(((totalActualCost - totalPlannedCost) / totalPlannedCost) * 10000) / 100
          : 0,
      byFormula: Array.from(formulaMap.values()).map((f) => ({
        ...f,
        plannedCost: Math.round(f.plannedCost * 100) / 100,
        actualCost: Math.round(f.actualCost * 100) / 100,
        variance: Math.round(f.variance * 100) / 100,
      })),
      materialCost: Math.round(totalActualCost * 0.85 * 100) / 100,
      overheadCost: Math.round(totalActualCost * 0.15 * 100) / 100,
      costPerKg: totalActual > 0 ? Math.round((totalActualCost / totalActual) * 10000) / 10000 : 0,
    };
  }

  async getCapacityReport(branchId?: string): Promise<IProductionCapacityReport> {
    const where: any = {};
    if (branchId) where.branchId = branchId;

    const orders = await this.prisma.manufacturingOrder.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const statusMap = new Map(orders.map((o) => [o.status, o._count.status]));
    const total = orders.reduce((sum, o) => sum + o._count.status, 0);
    const completed = statusMap.get(ManufacturingStatus.COMPLETED) || 0;
    const inProgress = statusMap.get(ManufacturingStatus.IN_PROGRESS) || 0;
    const cancelled = statusMap.get(ManufacturingStatus.CANCELLED) || 0;

    // Capacity utilization = (completed + in_progress) / total active
    const active = completed + inProgress;
    const utilization = total - cancelled > 0 ? (active / (total - cancelled)) * 100 : 0;

    return {
      totalOrders: total,
      completedOrders: completed,
      inProgressOrders: inProgress,
      cancelledOrders: cancelled,
      capacityUtilization: Math.round(utilization * 100) / 100,
      byStatus: {
        [ManufacturingStatus.DRAFT]: statusMap.get(ManufacturingStatus.DRAFT) || 0,
        [ManufacturingStatus.PLANNED]: statusMap.get(ManufacturingStatus.PLANNED) || 0,
        [ManufacturingStatus.IN_PROGRESS]: inProgress,
        [ManufacturingStatus.COMPLETED]: completed,
        [ManufacturingStatus.CANCELLED]: cancelled,
      },
    };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async generateOrderNumber(): Promise<string> {
    const prefix = 'MO';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const lastOrder = await this.prisma.manufacturingOrder.findFirst({
      where: { orderNumber: { startsWith: `${prefix}-${dateStr}` } },
      orderBy: { orderNumber: 'desc' },
    });

    let seq = 1;
    if (lastOrder) {
      const parts = lastOrder.orderNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${dateStr}-${String(seq).padStart(5, '0')}`;
  }

  private calculateNewAverageCost(
    existingStock: any,
    newQuantity: number,
    newTotalCost: Decimal,
  ): Decimal {
    const existingQty = new Decimal(existingStock.quantity);
    const existingTotalCost = existingQty.mul(existingStock.averageCost || 0);
    const totalQty = existingQty.add(newQuantity);

    if (totalQty.eq(0)) return new Decimal(0);

    return existingTotalCost.add(newTotalCost).div(totalQty);
  }

  private mapToInterface(order: any): IManufacturingOrder {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      feedFormulaId: order.feedFormulaId,
      feedFormulaName: order.feedFormula?.name,
      feedFormulaCode: order.feedFormula?.code,
      status: order.status as ManufacturingStatus,
      plannedQuantityKg: Number(order.plannedQuantityKg),
      actualQuantityKg: order.actualQuantityKg ? Number(order.actualQuantityKg) : null,
      plannedCost: order.plannedCost ? Number(order.plannedCost) : null,
      actualCost: order.actualCost ? Number(order.actualCost) : null,
      yieldPercentage: order.yieldPercentage ? Number(order.yieldPercentage) : null,
      productionDate: order.productionDate,
      completionDate: order.completionDate,
      batchNumber: order.batchNumber,
      branchId: order.branchId,
      warehouseId: order.warehouseId,
      outputWarehouseId: order.outputWarehouseId,
      notes: order.notes,
      qualityStatus: order.qualityStatus as QualityStatus,
      createdBy: order.createdBy,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      consumptionLines: order.consumptionLines?.map((l: any) => ({
        id: l.id,
        manufacturingOrderId: l.manufacturingOrderId,
        productId: l.productId,
        productName: l.product?.name,
        plannedQuantityKg: Number(l.plannedQuantityKg),
        actualQuantityKg: l.actualQuantityKg ? Number(l.actualQuantityKg) : null,
        varianceKg: l.varianceKg ? Number(l.varianceKg) : null,
        unitCost: l.unitCost ? Number(l.unitCost) : null,
        totalCost: l.totalCost ? Number(l.totalCost) : null,
        sortOrder: l.sortOrder,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      qualityTests: order.qualityTests?.map((t: any) => ({
        id: t.id,
        manufacturingOrderId: t.manufacturingOrderId,
        testType: t.testType,
        testValue: t.testValue ? Number(t.testValue) : null,
        targetValue: t.targetValue ? Number(t.targetValue) : null,
        unit: t.unit,
        result: t.result as QualityStatus,
        notes: t.notes,
        testedBy: t.testedBy,
        testedAt: t.testedAt,
        createdAt: t.createdAt,
      })),
    };
  }
}
