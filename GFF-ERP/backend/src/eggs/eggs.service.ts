import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';
import { CreateEggProductionDto, UpdateEggProductionDto } from './dto/create-egg-production.dto';
import { EggProductionFilterDto, EggReportFilterDto } from './dto/egg-filter.dto';
import { CreateEggTransferDto, UpdateEggTransferDto, EggTransferFilterDto } from './dto/egg-transfer.dto';
import {
  EggSize,
  EggTransferType,
  EggTransferStatus,
  IEggProduction,
  IEggTransfer,
  IEggDailyReport,
  IEggProductionTrend,
  IEggSizeDistribution,
  IEggRevenueReport,
  IEggCollectionSchedule,
  IFeedConversionRatio,
} from './interfaces/egg.interface';

@Injectable()
export class EggsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // Egg Production CRUD
  // ─────────────────────────────────────────────

  async recordProduction(dto: CreateEggProductionDto, userId: string): Promise<IEggProduction> {
    const batch = await this.prisma.chicksBatch.findUnique({
      where: { id: dto.chicksBatchId },
    });
    if (!batch) throw new NotFoundException(`Chicks batch '${dto.chicksBatchId}' not found`);

    const totalGoodEggs = dto.goodLarge + dto.goodMedium + dto.goodSmall;
    const totalDirty = (dto.dirtyLarge || 0) + (dto.dirtyMedium || 0) + (dto.dirtySmall || 0);
    const totalBroken = (dto.brokenLarge || 0) + (dto.brokenMedium || 0) + (dto.brokenSmall || 0);
    const totalCollected = totalGoodEggs + totalDirty + totalBroken;

    const result = await this.prisma.eggProduction.create({
      data: {
        chicksBatchId: dto.chicksBatchId,
        collectionDate: new Date(dto.collectionDate),
        collectionTime: dto.collectionTime || null,
        collectorName: dto.collectorName || null,
        goodLarge: dto.goodLarge,
        goodMedium: dto.goodMedium,
        goodSmall: dto.goodSmall,
        dirtyLarge: dto.dirtyLarge || 0,
        dirtyMedium: dto.dirtyMedium || 0,
        dirtySmall: dto.dirtySmall || 0,
        brokenLarge: dto.brokenLarge || 0,
        brokenMedium: dto.brokenMedium || 0,
        brokenSmall: dto.brokenSmall || 0,
        totalGoodEggs,
        totalDirtyEggs: totalDirty,
        totalBrokenEggs: totalBroken,
        totalCollected,
        notes: dto.notes || null,
        branchId: dto.branchId || batch.branchId,
        createdBy: userId,
      },
      include: {
        chicksBatch: { select: { batchNumber: true } },
      },
    });

    await this.audit.log({
      action: 'EGG_PRODUCTION_RECORDED',
      entity: 'EggProduction',
      entityId: result.id,
      userId,
      details: {
        batchId: dto.chicksBatchId,
        totalCollected,
        totalGoodEggs,
      },
    });

    return this.mapProductionToInterface(result);
  }

  async findAllProduction(filter: EggProductionFilterDto): Promise<{ data: IEggProduction[]; total: number }> {
    const { chicksBatchId, branchId, dateFrom, dateTo, page = 1, limit = 20 } = filter;
    const where: any = {};

    if (chicksBatchId) where.chicksBatchId = chicksBatchId;
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.collectionDate = {};
      if (dateFrom) where.collectionDate.gte = new Date(dateFrom);
      if (dateTo) where.collectionDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.eggProduction.findMany({
        where,
        include: {
          chicksBatch: { select: { batchNumber: true } },
        },
        orderBy: { collectionDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.eggProduction.count({ where }),
    ]);

    return { data: data.map((p) => this.mapProductionToInterface(p)), total };
  }

  async findProductionById(id: string): Promise<IEggProduction> {
    const record = await this.prisma.eggProduction.findUnique({
      where: { id },
      include: {
        chicksBatch: { select: { batchNumber: true } },
      },
    });
    if (!record) throw new NotFoundException(`Egg production record '${id}' not found`);
    return this.mapProductionToInterface(record);
  }

  async updateProduction(id: string, dto: UpdateEggProductionDto, userId: string): Promise<IEggProduction> {
    const existing = await this.prisma.eggProduction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Egg production record '${id}' not found`);

    const totalGoodEggs =
      (dto.goodLarge ?? existing.goodLarge) +
      (dto.goodMedium ?? existing.goodMedium) +
      (dto.goodSmall ?? existing.goodSmall);

    const totalDirty =
      (dto.dirtyLarge ?? existing.dirtyLarge) +
      (dto.dirtyMedium ?? existing.dirtyMedium) +
      (dto.dirtySmall ?? existing.dirtySmall);

    const totalBroken =
      (dto.brokenLarge ?? existing.brokenLarge) +
      (dto.brokenMedium ?? existing.brokenMedium) +
      (dto.brokenSmall ?? existing.brokenSmall);

    const totalCollected = totalGoodEggs + totalDirty + totalBroken;

    const result = await this.prisma.eggProduction.update({
      where: { id },
      data: {
        collectionDate: dto.collectionDate ? new Date(dto.collectionDate) : undefined,
        collectionTime: dto.collectionTime,
        collectorName: dto.collectorName,
        goodLarge: dto.goodLarge,
        goodMedium: dto.goodMedium,
        goodSmall: dto.goodSmall,
        dirtyLarge: dto.dirtyLarge,
        dirtyMedium: dto.dirtyMedium,
        dirtySmall: dto.dirtySmall,
        brokenLarge: dto.brokenLarge,
        brokenMedium: dto.brokenMedium,
        brokenSmall: dto.brokenSmall,
        totalGoodEggs,
        totalDirtyEggs: totalDirty,
        totalBrokenEggs: totalBroken,
        totalCollected,
        notes: dto.notes,
      },
      include: {
        chicksBatch: { select: { batchNumber: true } },
      },
    });

    await this.audit.log({
      action: 'EGG_PRODUCTION_UPDATED',
      entity: 'EggProduction',
      entityId: id,
      userId,
      details: { totalCollected, totalGoodEggs },
    });

    return this.mapProductionToInterface(result);
  }

  async deleteProduction(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.eggProduction.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Egg production record '${id}' not found`);

    await this.prisma.eggProduction.delete({ where: { id } });

    await this.audit.log({
      action: 'EGG_PRODUCTION_DELETED',
      entity: 'EggProduction',
      entityId: id,
      userId,
      details: { batchId: existing.chicksBatchId },
    });
  }

  // ─────────────────────────────────────────────
  // Egg Transfers
  // ─────────────────────────────────────────────

  async createTransfer(dto: CreateEggTransferDto, userId: string): Promise<IEggTransfer> {
    const totalQuantity = dto.largeQuantity + dto.mediumQuantity + dto.smallQuantity;
    if (totalQuantity <= 0) {
      throw new BadRequestException('Transfer quantity must be greater than 0');
    }

    const transferNumber = await this.generateTransferNumber();
    const unitPrice = dto.unitPrice ? new Decimal(dto.unitPrice) : null;
    const totalAmount = dto.totalAmount
      ? new Decimal(dto.totalAmount)
      : unitPrice
        ? unitPrice.mul(totalQuantity)
        : null;

    const result = await this.prisma.eggTransfer.create({
      data: {
        transferNumber,
        transferType: dto.transferType,
        status: EggTransferStatus.COMPLETED,
        chicksBatchId: dto.chicksBatchId || null,
        fromWarehouseId: dto.fromWarehouseId || null,
        toWarehouseId: dto.toWarehouseId,
        largeQuantity: dto.largeQuantity,
        mediumQuantity: dto.mediumQuantity,
        smallQuantity: dto.smallQuantity,
        totalQuantity,
        unitPrice,
        totalAmount,
        customerName: dto.customerName || null,
        transferDate: new Date(dto.transferDate),
        notes: dto.notes || null,
        branchId: dto.branchId || null,
        createdBy: userId,
      },
    });

    await this.audit.log({
      action: 'EGG_TRANSFER_CREATED',
      entity: 'EggTransfer',
      entityId: result.id,
      userId,
      details: {
        transferNumber,
        type: dto.transferType,
        totalQuantity,
      },
    });

    return this.mapTransferToInterface(result);
  }

  async findAllTransfers(filter: EggTransferFilterDto): Promise<{ data: IEggTransfer[]; total: number }> {
    const {
      search,
      transferType,
      fromWarehouseId,
      toWarehouseId,
      branchId,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filter;

    const where: any = {};

    if (search) {
      where.OR = [
        { transferNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (transferType) where.transferType = transferType;
    if (fromWarehouseId) where.fromWarehouseId = fromWarehouseId;
    if (toWarehouseId) where.toWarehouseId = toWarehouseId;
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.transferDate = {};
      if (dateFrom) where.transferDate.gte = new Date(dateFrom);
      if (dateTo) where.transferDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.eggTransfer.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
      this.prisma.eggTransfer.count({ where }),
    ]);

    return { data: data.map((t) => this.mapTransferToInterface(t)), total };
  }

  async findTransferById(id: string): Promise<IEggTransfer> {
    const transfer = await this.prisma.eggTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundException(`Egg transfer '${id}' not found`);
    return this.mapTransferToInterface(transfer);
  }

  async updateTransfer(id: string, dto: UpdateEggTransferDto, userId: string): Promise<IEggTransfer> {
    const existing = await this.prisma.eggTransfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Egg transfer '${id}' not found`);

    const totalQuantity =
      (dto.largeQuantity ?? existing.largeQuantity) +
      (dto.mediumQuantity ?? existing.mediumQuantity) +
      (dto.smallQuantity ?? existing.smallQuantity);

    const result = await this.prisma.eggTransfer.update({
      where: { id },
      data: {
        largeQuantity: dto.largeQuantity,
        mediumQuantity: dto.mediumQuantity,
        smallQuantity: dto.smallQuantity,
        totalQuantity,
        unitPrice: dto.unitPrice ? new Decimal(dto.unitPrice) : undefined,
        totalAmount: dto.totalAmount
          ? new Decimal(dto.totalAmount)
          : dto.unitPrice && totalQuantity
            ? new Decimal(dto.unitPrice).mul(totalQuantity)
            : undefined,
        customerName: dto.customerName,
        transferDate: dto.transferDate ? new Date(dto.transferDate) : undefined,
        notes: dto.notes,
      },
    });

    await this.audit.log({
      action: 'EGG_TRANSFER_UPDATED',
      entity: 'EggTransfer',
      entityId: id,
      userId,
      details: { transferNumber: result.transferNumber },
    });

    return this.mapTransferToInterface(result);
  }

  async deleteTransfer(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.eggTransfer.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Egg transfer '${id}' not found`);

    await this.prisma.eggTransfer.delete({ where: { id } });

    await this.audit.log({
      action: 'EGG_TRANSFER_DELETED',
      entity: 'EggTransfer',
      entityId: id,
      userId,
      details: { transferNumber: existing.transferNumber },
    });
  }

  // ─────────────────────────────────────────────
  // Egg Reports
  // ─────────────────────────────────────────────

  async getDailyReport(date: string, branchId?: string): Promise<IEggDailyReport> {
    const reportDate = new Date(date);
    const where: any = { collectionDate: reportDate };
    if (branchId) where.branchId = branchId;

    const productions = await this.prisma.eggProduction.findMany({
      where,
      include: {
        chicksBatch: { select: { batchNumber: true } },
      },
      orderBy: { collectionDate: 'desc' },
    });

    const totalGoodLarge = productions.reduce((sum, p) => sum + p.goodLarge, 0);
    const totalGoodMedium = productions.reduce((sum, p) => sum + p.goodMedium, 0);
    const totalGoodSmall = productions.reduce((sum, p) => sum + p.goodSmall, 0);
    const totalDirty = productions.reduce(
      (sum, p) => sum + p.dirtyLarge + p.dirtyMedium + p.dirtySmall,
      0,
    );
    const totalBroken = productions.reduce(
      (sum, p) => sum + p.brokenLarge + p.brokenMedium + p.brokenSmall,
      0,
    );
    const totalCollected = productions.reduce((sum, p) => sum + p.totalCollected, 0);
    const totalGoodEggs = productions.reduce((sum, p) => sum + p.totalGoodEggs, 0);

    const byBatch = productions.map((p) => ({
      chicksBatchId: p.chicksBatchId,
      batchNumber: p.chicksBatch?.batchNumber || 'Unknown',
      goodLarge: p.goodLarge,
      goodMedium: p.goodMedium,
      goodSmall: p.goodSmall,
      dirty: p.dirtyLarge + p.dirtyMedium + p.dirtySmall,
      broken: p.brokenLarge + p.brokenMedium + p.brokenSmall,
      total: p.totalCollected,
    }));

    return {
      date,
      totalCollections: productions.length,
      totalGoodLarge,
      totalGoodMedium,
      totalGoodSmall,
      totalDirty,
      totalBroken,
      totalCollected,
      totalGoodEggs,
      breakageRate: totalCollected > 0 ? Math.round((totalBroken / totalCollected) * 10000) / 100 : 0,
      byBatch,
    };
  }

  async getProductionTrend(filter: EggReportFilterDto): Promise<IEggProductionTrend[]> {
    const { dateFrom, dateTo, groupBy = 'day' } = filter;
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    const productions = await this.prisma.eggProduction.findMany({
      where: {
        collectionDate: { gte: fromDate, lte: toDate },
        ...(filter.branchId ? { branchId: filter.branchId } : {}),
        ...(filter.chicksBatchId ? { chicksBatchId: filter.chicksBatchId } : {}),
      },
      orderBy: { collectionDate: 'asc' },
    });

    // Group by period
    const periodMap = new Map();
    for (const p of productions) {
      const d = new Date(p.collectionDate);
      let key: string;

      if (groupBy === 'week') {
        const weekStart = new Date(d);
        weekStart.setDate(d.getDate() - d.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else if (groupBy === 'month') {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      } else {
        key = d.toISOString().split('T')[0];
      }

      if (!periodMap.has(key)) {
        periodMap.set(key, { period: key, totalGoodEggs: 0, totalCollected: 0, count: 0 });
      }
      const entry = periodMap.get(key);
      entry.totalGoodEggs += p.totalGoodEggs;
      entry.totalCollected += p.totalCollected;
      entry.count++;
    }

    return Array.from(periodMap.values())
      .sort((a, b) => a.period.localeCompare(b.period))
      .map((e) => ({
        period: e.period,
        totalGoodEggs: e.totalGoodEggs,
        totalCollected: e.totalCollected,
        avgPerDay: Math.round((e.totalGoodEggs / (e.count || 1)) * 100) / 100,
        breakageRate:
          e.totalCollected > 0 ? Math.round(((e.totalCollected - e.totalGoodEggs) / e.totalCollected) * 10000) / 100 : 0,
      }));
  }

  async getSizeDistribution(filter: EggReportFilterDto): Promise<IEggSizeDistribution[]> {
    const { dateFrom, dateTo } = filter;
    const fromDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = dateTo ? new Date(dateTo) : new Date();

    const productions = await this.prisma.eggProduction.findMany({
      where: {
        collectionDate: { gte: fromDate, lte: toDate },
        ...(filter.branchId ? { branchId: filter.branchId } : {}),
      },
    });

    const totalGoodEggs = productions.reduce((sum, p) => sum + p.totalGoodEggs, 0);
    const large = productions.reduce((sum, p) => sum + p.goodLarge, 0);
    const medium = productions.reduce((sum, p) => sum + p.goodMedium, 0);
    const small = productions.reduce((sum, p) => sum + p.goodSmall, 0);

    return [
      {
        size: EggSize.LARGE,
        count: large,
        percentage: totalGoodEggs > 0 ? Math.round((large / totalGoodEggs) * 10000) / 100 : 0,
      },
      {
        size: EggSize.MEDIUM,
        count: medium,
        percentage: totalGoodEggs > 0 ? Math.round((medium / totalGoodEggs) * 10000) / 100 : 0,
      },
      {
        size: EggSize.SMALL,
        count: small,
        percentage: totalGoodEggs > 0 ? Math.round((small / totalGoodEggs) * 10000) / 100 : 0,
      },
    ];
  }

  async getRevenueReport(filter: EggReportFilterDto): Promise<IEggRevenueReport> {
    const { dateFrom, dateTo, branchId } = filter;

    const where: any = {
      transferType: EggTransferType.SALE,
      status: EggTransferStatus.COMPLETED,
    };
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.transferDate = {};
      if (dateFrom) where.transferDate.gte = new Date(dateFrom);
      if (dateTo) where.transferDate.lte = new Date(dateTo);
    }

    const transfers = await this.prisma.eggTransfer.findMany({ where });

    const totalEggsSold = transfers.reduce((sum, t) => sum + t.totalQuantity, 0);
    const totalRevenue = transfers.reduce(
      (sum, t) => sum + (t.totalAmount ? Number(t.totalAmount) : 0),
      0,
    );

    // By size
    const largeQty = transfers.reduce((sum, t) => sum + t.largeQuantity, 0);
    const mediumQty = transfers.reduce((sum, t) => sum + t.mediumQuantity, 0);
    const smallQty = transfers.reduce((sum, t) => sum + t.smallQuantity, 0);

    const largeRev = transfers.reduce(
      (sum, t) => sum + (t.largeQuantity > 0 && t.unitPrice ? Number(t.unitPrice) * t.largeQuantity : 0),
      0,
    );
    const mediumRev = transfers.reduce(
      (sum, t) => sum + (t.mediumQuantity > 0 && t.unitPrice ? Number(t.unitPrice) * t.mediumQuantity : 0),
      0,
    );
    const smallRev = transfers.reduce(
      (sum, t) => sum + (t.smallQuantity > 0 && t.unitPrice ? Number(t.unitPrice) * t.smallQuantity : 0),
      0,
    );

    return {
      period: `${dateFrom || 'all'} to ${dateTo || 'now'}`,
      totalEggsSold,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averagePricePerEgg: totalEggsSold > 0 ? Math.round((totalRevenue / totalEggsSold) * 10000) / 10000 : 0,
      bySize: [
        {
          size: EggSize.LARGE,
          quantity: largeQty,
          revenue: Math.round(largeRev * 100) / 100,
          averagePrice: largeQty > 0 ? Math.round((largeRev / largeQty) * 10000) / 10000 : 0,
        },
        {
          size: EggSize.MEDIUM,
          quantity: mediumQty,
          revenue: Math.round(mediumRev * 100) / 100,
          averagePrice: mediumQty > 0 ? Math.round((mediumRev / mediumQty) * 10000) / 10000 : 0,
        },
        {
          size: EggSize.SMALL,
          quantity: smallQty,
          revenue: Math.round(smallRev * 100) / 100,
          averagePrice: smallQty > 0 ? Math.round((smallRev / smallQty) * 10000) / 10000 : 0,
        },
      ],
    };
  }

  async getCollectionSchedule(branchId?: string): Promise<IEggCollectionSchedule[]> {
    const where: any = {
      breedType: 'LAYER',
      status: { in: ['ARRIVED', 'GROWING'] },
    };
    if (branchId) where.branchId = branchId;

    const batches = await this.prisma.chicksBatch.findMany({ where });

    // Get last collection date for each batch
    const lastCollections = await this.prisma.eggProduction.findMany({
      where: {
        chicksBatchId: { in: batches.map((b) => b.id) },
      },
      orderBy: { collectionDate: 'desc' },
      distinct: ['chicksBatchId'],
      select: {
        chicksBatchId: true,
        collectionDate: true,
      },
    });

    const lastCollectionMap = new Map(lastCollections.map((lc) => [lc.chicksBatchId, lc.collectionDate]));

    // Get average daily production per batch
    const productions = await this.prisma.eggProduction.findMany({
      where: {
        chicksBatchId: { in: batches.map((b) => b.id) },
        collectionDate: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    const productionMap = new Map();
    for (const p of productions) {
      if (!productionMap.has(p.chicksBatchId)) {
        productionMap.set(p.chicksBatchId, { total: 0, count: 0 });
      }
      const entry = productionMap.get(p.chicksBatchId);
      entry.total += p.totalGoodEggs;
      entry.count++;
    }

    return batches.map((batch) => {
      const lastDate = lastCollectionMap.get(batch.id);
      const now = new Date();
      const daysSinceLastCollection = lastDate
        ? Math.floor((now.getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24))
        : -1;

      const prod = productionMap.get(batch.id);
      const avgDailyProduction = prod ? Math.round((prod.total / prod.count) * 100) / 100 : 0;

      return {
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        expectedCollectionTime: '08:00',
        lastCollectionDate: lastDate ? new Date(lastDate).toISOString().split('T')[0] : null,
        daysSinceLastCollection,
        avgDailyProduction,
      };
    });
  }

  async getFeedConversionRatio(
    chicksBatchId?: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<IFeedConversionRatio[]> {
    const where: any = {};
    if (chicksBatchId) where.id = chicksBatchId;

    const batches = await this.prisma.chicksBatch.findMany({
      where,
      include: { mortalityRecords: true },
    });

    const results: IFeedConversionRatio[] = [];

    for (const batch of batches) {
      // Get egg production for this batch
      const eggWhere: any = { chicksBatchId: batch.id };
      if (dateFrom || dateTo) {
        eggWhere.collectionDate = {};
        if (dateFrom) eggWhere.collectionDate.gte = new Date(dateFrom);
        if (dateTo) eggWhere.collectionDate.lte = new Date(dateTo);
      }

      const productions = await this.prisma.eggProduction.findMany({ where: eggWhere });
      const totalEggs = productions.reduce((sum, p) => sum + p.totalGoodEggs, 0);

      // Estimate feed consumption (simplified: ~120g per layer per day)
      const days = productions.length;
      const avgChicks = batch.arrivalQuantity - (batch.mortalityCount || 0) / 2;
      const estimatedFeedKg = (avgChicks * 0.12 * days);

      results.push({
        chicksBatchId: batch.id,
        batchNumber: batch.batchNumber,
        breedType: batch.breedType,
        totalFeedConsumed: Math.round(estimatedFeedKg * 100) / 100,
        totalEggsProduced: totalEggs,
        fcr: totalEggs > 0 ? Math.round((estimatedFeedKg / totalEggs) * 10000) / 10000 : 0,
        period: `${dateFrom || 'all'} to ${dateTo || 'now'}`,
      });
    }

    return results;
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async generateTransferNumber(): Promise<string> {
    const prefix = 'ET';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const last = await this.prisma.eggTransfer.findFirst({
      where: { transferNumber: { startsWith: `${prefix}-${dateStr}` } },
      orderBy: { transferNumber: 'desc' },
    });

    let seq = 1;
    if (last) {
      const parts = last.transferNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${dateStr}-${String(seq).padStart(5, '0')}`;
  }

  private mapProductionToInterface(p: any): IEggProduction {
    return {
      id: p.id,
      chicksBatchId: p.chicksBatchId,
      batchNumber: p.chicksBatch?.batchNumber,
      collectionDate: p.collectionDate,
      collectionTime: p.collectionTime,
      collectorName: p.collectorName,
      goodLarge: p.goodLarge,
      goodMedium: p.goodMedium,
      goodSmall: p.goodSmall,
      dirtyLarge: p.dirtyLarge,
      dirtyMedium: p.dirtyMedium,
      dirtySmall: p.dirtySmall,
      brokenLarge: p.brokenLarge,
      brokenMedium: p.brokenMedium,
      brokenSmall: p.brokenSmall,
      totalGoodEggs: p.totalGoodEggs,
      totalDirtyEggs: p.totalDirtyEggs,
      totalBrokenEggs: p.totalBrokenEggs,
      totalCollected: p.totalCollected,
      notes: p.notes,
      branchId: p.branchId,
      createdBy: p.createdBy,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  }

  private mapTransferToInterface(t: any): IEggTransfer {
    return {
      id: t.id,
      transferNumber: t.transferNumber,
      transferType: t.transferType as EggTransferType,
      status: t.status as EggTransferStatus,
      chicksBatchId: t.chicksBatchId,
      fromWarehouseId: t.fromWarehouseId,
      toWarehouseId: t.toWarehouseId,
      largeQuantity: t.largeQuantity,
      mediumQuantity: t.mediumQuantity,
      smallQuantity: t.smallQuantity,
      totalQuantity: t.totalQuantity,
      unitPrice: t.unitPrice ? Number(t.unitPrice) : null,
      totalAmount: t.totalAmount ? Number(t.totalAmount) : null,
      customerName: t.customerName,
      transferDate: t.transferDate,
      notes: t.notes,
      branchId: t.branchId,
      createdBy: t.createdBy,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    };
  }
}
