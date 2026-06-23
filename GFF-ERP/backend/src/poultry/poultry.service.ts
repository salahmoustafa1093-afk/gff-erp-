import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';
import { CreateChicksBatchDto } from './dto/create-chicks-batch.dto';
import { UpdateChicksBatchDto } from './dto/update-chicks-batch.dto';
import { RecordMortalityDto, MortalityRecordFilterDto } from './dto/record-mortality.dto';
import { ChicksFilterDto } from './dto/chicks-filter.dto';
import { ChicksReportFilterDto, SupplierPerformanceFilterDto } from './dto/chicks-report.dto';
import {
  BreedType,
  ChicksBatchStatus,
  IChicksBatch,
  IMortalityRecord,
  IChicksBatchStatistics,
  IChicksReport,
  ISupplierPerformance,
} from './interfaces/poultry.interface';

@Injectable()
export class PoultryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // Chicks Batch CRUD
  // ─────────────────────────────────────────────

  async createBatch(dto: CreateChicksBatchDto, userId: string): Promise<IChicksBatch> {
    const batchNumber = await this.generateBatchNumber();

    const unitCost = dto.unitCost ? new Decimal(dto.unitCost) : null;
    const totalCost = dto.totalCost
      ? new Decimal(dto.totalCost)
      : unitCost
        ? unitCost.mul(dto.arrivalQuantity)
        : null;

    const result = await this.prisma.chicksBatch.create({
      data: {
        batchNumber,
        batchName: dto.batchName,
        breedType: dto.breedType,
        supplierId: dto.supplierId || null,
        arrivalDate: new Date(dto.arrivalDate),
        arrivalQuantity: dto.arrivalQuantity,
        currentQuantity: dto.arrivalQuantity,
        mortalityCount: 0,
        soldCount: 0,
        unitCost,
        totalCost,
        costPerChick: totalCost ? totalCost.div(dto.arrivalQuantity) : unitCost,
        ageInDays: 0,
        status: ChicksBatchStatus.ARRIVED,
        branchId: dto.branchId || null,
        warehouseId: dto.warehouseId || null,
        notes: dto.notes || null,
        createdBy: userId,
      },
      include: { supplier: { select: { name: true } } },
    });

    // Create stock movement for arrival if warehouse specified
    if (dto.warehouseId) {
      await this.createChicksStockMovement(result.id, dto.arrivalQuantity, dto.warehouseId, 'IN', userId, batchNumber);
    }

    await this.audit.log({
      action: 'CHICKS_BATCH_CREATED',
      entity: 'ChicksBatch',
      entityId: result.id,
      userId,
      details: {
        batchNumber: result.batchNumber,
        breedType: result.breedType,
        arrivalQuantity: result.arrivalQuantity,
      },
    });

    return this.mapBatchToInterface(result);
  }

  async findAll(filter: ChicksFilterDto): Promise<{ data: IChicksBatch[]; total: number }> {
    const {
      search,
      breedType,
      status,
      supplierId,
      branchId,
      arrivalDateFrom,
      arrivalDateTo,
      page = 1,
      limit = 20,
    } = filter;

    const where: any = {};

    if (search) {
      where.OR = [
        { batchNumber: { contains: search, mode: 'insensitive' } },
        { batchName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (breedType) where.breedType = breedType;
    if (status) where.status = status;
    if (supplierId) where.supplierId = supplierId;
    if (branchId) where.branchId = branchId;
    if (arrivalDateFrom || arrivalDateTo) {
      where.arrivalDate = {};
      if (arrivalDateFrom) where.arrivalDate.gte = new Date(arrivalDateFrom);
      if (arrivalDateTo) where.arrivalDate.lte = new Date(arrivalDateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.chicksBatch.findMany({
        where,
        include: {
          supplier: { select: { name: true } },
          mortalityRecords: { orderBy: { recordDate: 'desc' }, take: 5 },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chicksBatch.count({ where }),
    ]);

    // Calculate age in days for each batch
    const now = new Date();
    return {
      data: data.map((b) => {
        const ageInDays = Math.floor(
          (now.getTime() - new Date(b.arrivalDate).getTime()) / (1000 * 60 * 60 * 24),
        );
        return this.mapBatchToInterface({ ...b, ageInDays });
      }),
      total,
    };
  }

  async findOne(id: string): Promise<IChicksBatch> {
    const batch = await this.prisma.chicksBatch.findUnique({
      where: { id },
      include: {
        supplier: { select: { name: true } },
        mortalityRecords: { orderBy: { recordDate: 'desc' } },
      },
    });

    if (!batch) throw new NotFoundException(`Chicks batch '${id}' not found`);

    const ageInDays = Math.floor(
      (new Date().getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    return this.mapBatchToInterface({ ...batch, ageInDays });
  }

  async update(id: string, dto: UpdateChicksBatchDto, userId: string): Promise<IChicksBatch> {
    const existing = await this.prisma.chicksBatch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Chicks batch '${id}' not found`);

    if (existing.status === ChicksBatchStatus.COMPLETED || existing.status === ChicksBatchStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a completed or cancelled batch');
    }

    const result = await this.prisma.chicksBatch.update({
      where: { id },
      data: {
        batchName: dto.batchName,
        breedType: dto.breedType,
        supplierId: dto.supplierId,
        arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : undefined,
        arrivalQuantity: dto.arrivalQuantity,
        status: dto.status,
        unitCost: dto.unitCost ? new Decimal(dto.unitCost) : undefined,
        totalCost: dto.totalCost ? new Decimal(dto.totalCost) : undefined,
        branchId: dto.branchId,
        warehouseId: dto.warehouseId,
        notes: dto.notes,
      },
      include: {
        supplier: { select: { name: true } },
        mortalityRecords: { orderBy: { recordDate: 'desc' }, take: 5 },
      },
    });

    await this.audit.log({
      action: 'CHICKS_BATCH_UPDATED',
      entity: 'ChicksBatch',
      entityId: result.id,
      userId,
      details: { batchNumber: result.batchNumber, status: result.status },
    });

    const ageInDays = Math.floor(
      (new Date().getTime() - new Date(result.arrivalDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    return this.mapBatchToInterface({ ...result, ageInDays });
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.chicksBatch.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Chicks batch '${id}' not found`);

    // Delete related records first
    await this.prisma.$transaction([
      this.prisma.mortalityRecord.deleteMany({ where: { chicksBatchId: id } }),
      this.prisma.chicksBatch.delete({ where: { id } }),
    ]);

    await this.audit.log({
      action: 'CHICKS_BATCH_DELETED',
      entity: 'ChicksBatch',
      entityId: id,
      userId,
      details: { batchNumber: existing.batchNumber },
    });
  }

  // ─────────────────────────────────────────────
  // Mortality Tracking
  // ─────────────────────────────────────────────

  async recordMortality(dto: RecordMortalityDto, userId: string): Promise<IMortalityRecord> {
    const batch = await this.prisma.chicksBatch.findUnique({
      where: { id: dto.chicksBatchId },
    });

    if (!batch) throw new NotFoundException(`Chicks batch '${dto.chicksBatchId}' not found`);

    if (batch.status === ChicksBatchStatus.COMPLETED || batch.status === ChicksBatchStatus.CANCELLED) {
      throw new BadRequestException('Cannot record mortality for a completed or cancelled batch');
    }

    if (dto.count > batch.currentQuantity) {
      throw new BadRequestException(
        `Mortality count (${dto.count}) exceeds current quantity (${batch.currentQuantity})`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const record = await tx.mortalityRecord.create({
        data: {
          chicksBatchId: dto.chicksBatchId,
          recordDate: new Date(dto.recordDate),
          count: dto.count,
          cause: dto.cause,
          description: dto.description || null,
          recordedBy: userId,
        },
      });

      const newMortalityCount = batch.mortalityCount + dto.count;
      const newCurrentQuantity = batch.arrivalQuantity - newMortalityCount - batch.soldCount;

      await tx.chicksBatch.update({
        where: { id: dto.chicksBatchId },
        data: {
          mortalityCount: newMortalityCount,
          currentQuantity: newCurrentQuantity >= 0 ? newCurrentQuantity : 0,
          status: newCurrentQuantity <= 0 ? ChicksBatchStatus.COMPLETED : ChicksBatchStatus.GROWING,
        },
      });

      // Update stock if warehouse exists
      if (batch.warehouseId) {
        await this.createChicksStockMovement(
          batch.id,
          dto.count,
          batch.warehouseId,
          'OUT',
          userId,
          `Mortality: ${dto.cause}`,
        );
      }

      return record;
    });

    await this.audit.log({
      action: 'MORTALITY_RECORDED',
      entity: 'ChicksBatch',
      entityId: dto.chicksBatchId,
      userId,
      details: {
        batchNumber: batch.batchNumber,
        count: dto.count,
        cause: dto.cause,
      },
    });

    return {
      id: result.id,
      chicksBatchId: result.chicksBatchId,
      recordDate: result.recordDate,
      count: result.count,
      cause: result.cause as any,
      description: result.description,
      recordedBy: result.recordedBy,
      createdAt: result.createdAt,
    };
  }

  async findMortalityRecords(filter: MortalityRecordFilterDto): Promise<{ data: IMortalityRecord[]; total: number }> {
    const { chicksBatchId, cause, dateFrom, dateTo, page = 1, limit = 20 } = filter;
    const where: any = {};

    if (chicksBatchId) where.chicksBatchId = chicksBatchId;
    if (cause) where.cause = cause;
    if (dateFrom || dateTo) {
      where.recordDate = {};
      if (dateFrom) where.recordDate.gte = new Date(dateFrom);
      if (dateTo) where.recordDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.mortalityRecord.findMany({
        where,
        orderBy: { recordDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.mortalityRecord.count({ where }),
    ]);

    return {
      data: data.map((r) => ({
        id: r.id,
        chicksBatchId: r.chicksBatchId,
        recordDate: r.recordDate,
        count: r.count,
        cause: r.cause as any,
        description: r.description,
        recordedBy: r.recordedBy,
        createdAt: r.createdAt,
      })),
      total,
    };
  }

  async removeMortalityRecord(recordId: string, userId: string): Promise<void> {
    const record = await this.prisma.mortalityRecord.findUnique({
      where: { id: recordId },
    });
    if (!record) throw new NotFoundException(`Mortality record '${recordId}' not found`);

    const batch = await this.prisma.chicksBatch.findUnique({
      where: { id: record.chicksBatchId },
    });

    await this.prisma.$transaction([
      this.prisma.mortalityRecord.delete({ where: { id: recordId } }),
      this.prisma.chicksBatch.update({
        where: { id: record.chicksBatchId },
        data: {
          mortalityCount: batch.mortalityCount - record.count,
          currentQuantity: batch.currentQuantity + record.count,
        },
      }),
    ]);

    await this.audit.log({
      action: 'MORTALITY_RECORD_DELETED',
      entity: 'MortalityRecord',
      entityId: recordId,
      userId,
      details: {
        batchId: record.chicksBatchId,
        count: record.count,
      },
    });
  }

  // ─────────────────────────────────────────────
  // Statistics
  // ─────────────────────────────────────────────

  async getBatchStatistics(id: string): Promise<IChicksBatchStatistics> {
    const batch = await this.prisma.chicksBatch.findUnique({
      where: { id },
      include: { supplier: { select: { name: true } } },
    });

    if (!batch) throw new NotFoundException(`Chicks batch '${id}' not found`);

    const now = new Date();
    const ageInDays = Math.floor(
      (now.getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24),
    );

    const mortalityRate = batch.arrivalQuantity > 0
      ? (batch.mortalityCount / batch.arrivalQuantity) * 100
      : 0;

    return {
      batchId: batch.id,
      batchNumber: batch.batchNumber,
      breedType: batch.breedType as BreedType,
      arrivalQuantity: batch.arrivalQuantity,
      currentQuantity: batch.currentQuantity,
      mortalityCount: batch.mortalityCount,
      mortalityRate: Math.round(mortalityRate * 100) / 100,
      survivalRate: Math.round((100 - mortalityRate) * 100) / 100,
      ageInDays,
      ageInWeeks: Math.round((ageInDays / 7) * 10) / 10,
      costPerChick: batch.costPerChick ? Number(batch.costPerChick) : 0,
      daysSinceArrival: ageInDays,
    };
  }

  // ─────────────────────────────────────────────
  // Reports
  // ─────────────────────────────────────────────

  async getChicksReport(filter: ChicksReportFilterDto): Promise<IChicksReport> {
    const { breedType, branchId, dateFrom, dateTo } = filter;

    const where: any = {};
    if (breedType) where.breedType = breedType;
    if (branchId) where.branchId = branchId;

    const batches = await this.prisma.chicksBatch.findMany({ where });

    const activeBatches = batches.filter((b) => b.status === 'GROWING' || b.status === 'ARRIVED');
    const totalChicks = activeBatches.reduce((sum, b) => sum + b.currentQuantity, 0);

    // Mortality this month
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const mortalityWhere: any = { recordDate: { gte: monthStart } };
    if (dateFrom) mortalityWhere.recordDate.gte = new Date(dateFrom);
    if (dateTo) mortalityWhere.recordDate.lte = new Date(dateTo);

    const mortalityRecords = await this.prisma.mortalityRecord.findMany({
      where: mortalityWhere,
      include: { chicksBatch: { select: { breedType: true } } },
    });

    const totalMortalityThisMonth = mortalityRecords.reduce((sum, r) => sum + r.count, 0);

    // By breed
    const breedMap = new Map();
    for (const batch of batches) {
      const key = batch.breedType;
      if (!breedMap.has(key)) {
        breedMap.set(key, { breedType: key, batchCount: 0, totalChicks: 0, totalMortality: 0 });
      }
      const b = breedMap.get(key);
      b.batchCount++;
      b.totalChicks += batch.currentQuantity;
      b.totalMortality += batch.mortalityCount;
    }

    // Mortality trend (last 30 days)
    const trendMap = new Map();
    for (const r of mortalityRecords) {
      const date = r.recordDate.toISOString().split('T')[0];
      trendMap.set(date, (trendMap.get(date) || 0) + r.count);
    }

    // Supplier performance
    const supplierMap = new Map();
    for (const batch of batches) {
      if (!batch.supplierId) continue;
      if (!supplierMap.has(batch.supplierId)) {
        supplierMap.set(batch.supplierId, {
          supplierId: batch.supplierId,
          supplierName: '',
          batchesReceived: 0,
          totalChicks: 0,
          totalMortality: 0,
        });
      }
      const s = supplierMap.get(batch.supplierId);
      s.batchesReceived++;
      s.totalChicks += batch.arrivalQuantity;
      s.totalMortality += batch.mortalityCount;
    }

    // Get supplier names
    const supplierIds = Array.from(supplierMap.keys());
    if (supplierIds.length > 0) {
      const suppliers = await this.prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true },
      });
      const supplierNameMap = new Map(suppliers.map((s) => [s.id, s.name]));
      for (const s of supplierMap.values()) {
        s.supplierName = supplierNameMap.get(s.supplierId) || 'Unknown';
      }
    }

    return {
      summary: {
        totalActiveBatches: activeBatches.length,
        totalChicks,
        totalMortalityThisMonth,
        averageMortalityRate:
          batches.length > 0
            ? Math.round(
                (batches.reduce((sum, b) => sum + (b.arrivalQuantity > 0 ? (b.mortalityCount / b.arrivalQuantity) * 100 : 0), 0) /
                  batches.length) *
                  100,
              ) / 100
            : 0,
      },
      byBreed: Array.from(breedMap.values()).map((b) => ({
        breedType: b.breedType,
        batchCount: b.batchCount,
        totalChicks: b.totalChicks,
        avgMortalityRate:
          b.totalChicks > 0 ? Math.round((b.totalMortality / (b.totalChicks + b.totalMortality)) * 10000) / 100 : 0,
      })),
      mortalityTrend: Array.from(trendMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      supplierPerformance: Array.from(supplierMap.values()).map((s) => ({
        ...s,
        mortalityRate:
          s.totalChicks > 0 ? Math.round((s.totalMortality / s.totalChicks) * 10000) / 100 : 0,
      })),
    };
  }

  async getSupplierPerformance(filter: SupplierPerformanceFilterDto): Promise<ISupplierPerformance[]> {
    const where: any = {};
    if (filter.supplierId) where.supplierId = filter.supplierId;
    if (filter.dateFrom || filter.dateTo) {
      where.arrivalDate = {};
      if (filter.dateFrom) where.arrivalDate.gte = new Date(filter.dateFrom);
      if (filter.dateTo) where.arrivalDate.lte = new Date(filter.dateTo);
    }

    const batches = await this.prisma.chicksBatch.findMany({ where });

    const supplierMap = new Map();
    for (const batch of batches) {
      if (!batch.supplierId) continue;
      if (!supplierMap.has(batch.supplierId)) {
        supplierMap.set(batch.supplierId, {
          supplierId: batch.supplierId,
          supplierName: '',
          totalBatches: 0,
          totalChicks: 0,
          totalMortality: 0,
          totalCost: new Decimal(0),
          lastDeliveryDate: null,
        });
      }
      const s = supplierMap.get(batch.supplierId);
      s.totalBatches++;
      s.totalChicks += batch.arrivalQuantity;
      s.totalMortality += batch.mortalityCount;
      if (batch.totalCost) s.totalCost = s.totalCost.add(batch.totalCost);
      if (!s.lastDeliveryDate || new Date(batch.arrivalDate) > s.lastDeliveryDate) {
        s.lastDeliveryDate = new Date(batch.arrivalDate);
      }
    }

    // Get supplier names
    const supplierIds = Array.from(supplierMap.keys());
    if (supplierIds.length > 0) {
      const suppliers = await this.prisma.supplier.findMany({
        where: { id: { in: supplierIds } },
        select: { id: true, name: true },
      });
      const nameMap = new Map(suppliers.map((s) => [s.id, s.name]));
      for (const s of supplierMap.values()) {
        s.supplierName = nameMap.get(s.supplierId) || 'Unknown';
      }
    }

    return Array.from(supplierMap.values()).map((s) => ({
      supplierId: s.supplierId,
      supplierName: s.supplierName,
      totalBatches: s.totalBatches,
      totalChicks: s.totalChicks,
      totalMortality: s.totalMortality,
      mortalityRate: s.totalChicks > 0 ? Math.round((s.totalMortality / s.totalChicks) * 10000) / 100 : 0,
      averageCostPerChick:
        s.totalChicks > 0 ? Math.round(s.totalCost.div(s.totalChicks).toNumber() * 10000) / 10000 : 0,
      lastDeliveryDate: s.lastDeliveryDate,
    }));
  }

  // ─────────────────────────────────────────────
  // Inventory Integration
  // ─────────────────────────────────────────────

  private async createChicksStockMovement(
    chicksBatchId: string,
    quantity: number,
    warehouseId: string,
    direction: 'IN' | 'OUT',
    userId: string,
    reference?: string,
  ): Promise<void> {
    // Find or create a "Chicks" product for inventory tracking
    const product = await this.prisma.product.findFirst({
      where: { name: { contains: 'Chicks', mode: 'insensitive' } },
    });

    if (!product) return; // Silently skip if no product configured

    const stockMovementType = direction === 'IN' ? 'INBOUND' : 'OUTBOUND';

    await this.prisma.stockMovement.create({
      data: {
        productId: product.id,
        warehouseId,
        type: stockMovementType,
        quantity: new Decimal(quantity),
        reference: reference || `Chicks-Batch-${chicksBatchId}`,
        referenceId: chicksBatchId,
        notes: `Chicks batch ${direction === 'IN' ? 'arrival' : 'mortality'}: ${quantity}`,
        createdBy: userId,
      },
    });

    // Update stock quantity
    const existingStock = await this.prisma.stock.findUnique({
      where: {
        productId_warehouseId: { productId: product.id, warehouseId },
      },
    });

    if (existingStock) {
      const newQuantity =
        direction === 'IN'
          ? new Decimal(existingStock.quantity).add(quantity)
          : new Decimal(existingStock.quantity).sub(quantity);

      await this.prisma.stock.update({
        where: {
          productId_warehouseId: { productId: product.id, warehouseId },
        },
        data: { quantity: newQuantity },
      });
    } else if (direction === 'IN') {
      await this.prisma.stock.create({
        data: {
          productId: product.id,
          warehouseId,
          quantity: new Decimal(quantity),
          reservedQuantity: new Decimal(0),
        },
      });
    }
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async generateBatchNumber(): Promise<string> {
    const prefix = 'CB';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const lastBatch = await this.prisma.chicksBatch.findFirst({
      where: { batchNumber: { startsWith: `${prefix}-${dateStr}` } },
      orderBy: { batchNumber: 'desc' },
    });

    let seq = 1;
    if (lastBatch) {
      const parts = lastBatch.batchNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${dateStr}-${String(seq).padStart(5, '0')}`;
  }

  private mapBatchToInterface(batch: any): IChicksBatch {
    return {
      id: batch.id,
      batchNumber: batch.batchNumber,
      batchName: batch.batchName,
      breedType: batch.breedType as BreedType,
      supplierId: batch.supplierId,
      supplierName: batch.supplier?.name,
      arrivalDate: batch.arrivalDate,
      arrivalQuantity: batch.arrivalQuantity,
      currentQuantity: batch.currentQuantity,
      mortalityCount: batch.mortalityCount,
      soldCount: batch.soldCount || 0,
      unitCost: batch.unitCost ? Number(batch.unitCost) : null,
      totalCost: batch.totalCost ? Number(batch.totalCost) : null,
      costPerChick: batch.costPerChick ? Number(batch.costPerChick) : null,
      ageInDays: batch.ageInDays || 0,
      status: batch.status as ChicksBatchStatus,
      branchId: batch.branchId,
      warehouseId: batch.warehouseId,
      notes: batch.notes,
      createdBy: batch.createdBy,
      createdAt: batch.createdAt,
      updatedAt: batch.updatedAt,
      mortalityRecords: batch.mortalityRecords?.map((r: any) => ({
        id: r.id,
        chicksBatchId: r.chicksBatchId,
        recordDate: r.recordDate,
        count: r.count,
        cause: r.cause as any,
        description: r.description,
        recordedBy: r.recordedBy,
        createdAt: r.createdAt,
      })),
    };
  }
}
