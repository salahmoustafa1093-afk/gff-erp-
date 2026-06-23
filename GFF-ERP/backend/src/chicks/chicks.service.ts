import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';
import {
  CreateChicksDistributionDto,
  UpdateChicksDistributionDto,
} from './dto/create-chicks-distribution.dto';
import {
  ChicksDistributionFilterDto,
  ChicksSalesReportFilterDto,
} from './dto/chicks-sales-filter.dto';
import {
  ChicksTransferType,
  ChicksTransferStatus,
  IChicksDistribution,
  IChicksAvailability,
  IChicksSalesReport,
} from './interfaces/chicks-distribution.interface';

@Injectable()
export class ChicksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // CRUD
  // ─────────────────────────────────────────────

  async create(dto: CreateChicksDistributionDto, userId: string): Promise<IChicksDistribution> {
    const batch = await this.prisma.chicksBatch.findUnique({
      where: { id: dto.chicksBatchId },
    });

    if (!batch) {
      throw new NotFoundException(`Chicks batch '${dto.chicksBatchId}' not found`);
    }

    if (batch.currentQuantity < dto.quantity) {
      throw new BadRequestException(
        `Insufficient quantity. Available: ${batch.currentQuantity}, Requested: ${dto.quantity}`,
      );
    }

    const transferNumber = await this.generateTransferNumber();
    const unitPrice = dto.unitPrice ? new Decimal(dto.unitPrice) : null;
    const totalAmount = dto.totalAmount
      ? new Decimal(dto.totalAmount)
      : unitPrice
        ? unitPrice.mul(dto.quantity)
        : null;

    const result = await this.prisma.$transaction(async (tx) => {
      const transfer = await tx.chicksDistribution.create({
        data: {
          transferNumber,
          chicksBatchId: dto.chicksBatchId,
          transferType: dto.transferType,
          status: ChicksTransferStatus.COMPLETED,
          quantity: dto.quantity,
          unitPrice,
          totalAmount,
          customerName: dto.customerName || null,
          customerId: dto.customerId || null,
          fromWarehouseId: dto.fromWarehouseId || batch.warehouseId,
          toWarehouseId: dto.toWarehouseId || null,
          transferDate: new Date(dto.transferDate),
          notes: dto.notes || null,
          branchId: dto.branchId || batch.branchId,
          createdBy: userId,
        },
        include: {
          chicksBatch: { select: { batchNumber: true, breedType: true } },
        },
      });

      // Update batch quantity
      const newSoldCount = (batch.soldCount || 0) + dto.quantity;
      const newCurrentQuantity = batch.currentQuantity - dto.quantity;

      await tx.chicksBatch.update({
        where: { id: dto.chicksBatchId },
        data: {
          soldCount: newSoldCount,
          currentQuantity: newCurrentQuantity,
          status: newCurrentQuantity <= 0 ? 'COMPLETED' : batch.status,
        },
      });

      return transfer;
    });

    await this.audit.log({
      action: 'CHICKS_DISTRIBUTION_CREATED',
      entity: 'ChicksDistribution',
      entityId: result.id,
      userId,
      details: {
        transferNumber: result.transferNumber,
        batchId: dto.chicksBatchId,
        quantity: dto.quantity,
        type: dto.transferType,
      },
    });

    return this.mapToInterface(result);
  }

  async findAll(filter: ChicksDistributionFilterDto): Promise<{ data: IChicksDistribution[]; total: number }> {
    const {
      search,
      chicksBatchId,
      transferType,
      status,
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
    if (chicksBatchId) where.chicksBatchId = chicksBatchId;
    if (transferType) where.transferType = transferType;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.transferDate = {};
      if (dateFrom) where.transferDate.gte = new Date(dateFrom);
      if (dateTo) where.transferDate.lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.chicksDistribution.findMany({
        where,
        include: {
          chicksBatch: { select: { batchNumber: true, breedType: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.chicksDistribution.count({ where }),
    ]);

    return { data: data.map((d) => this.mapToInterface(d)), total };
  }

  async findOne(id: string): Promise<IChicksDistribution> {
    const transfer = await this.prisma.chicksDistribution.findUnique({
      where: { id },
      include: {
        chicksBatch: { select: { batchNumber: true, breedType: true } },
      },
    });

    if (!transfer) {
      throw new NotFoundException(`Chicks distribution '${id}' not found`);
    }

    return this.mapToInterface(transfer);
  }

  async update(id: string, dto: UpdateChicksDistributionDto, userId: string): Promise<IChicksDistribution> {
    const existing = await this.prisma.chicksDistribution.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Chicks distribution '${id}' not found`);

    if (existing.status === ChicksTransferStatus.CANCELLED) {
      throw new BadRequestException('Cannot update a cancelled transfer');
    }

    const result = await this.prisma.chicksDistribution.update({
      where: { id },
      data: {
        quantity: dto.quantity,
        unitPrice: dto.unitPrice ? new Decimal(dto.unitPrice) : undefined,
        totalAmount: dto.totalAmount ? new Decimal(dto.totalAmount) : undefined,
        customerName: dto.customerName,
        transferDate: dto.transferDate ? new Date(dto.transferDate) : undefined,
        notes: dto.notes,
      },
      include: {
        chicksBatch: { select: { batchNumber: true, breedType: true } },
      },
    });

    await this.audit.log({
      action: 'CHICKS_DISTRIBUTION_UPDATED',
      entity: 'ChicksDistribution',
      entityId: id,
      userId,
      details: { transferNumber: result.transferNumber },
    });

    return this.mapToInterface(result);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.chicksDistribution.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Chicks distribution '${id}' not found`);

    await this.prisma.chicksDistribution.delete({ where: { id } });

    await this.audit.log({
      action: 'CHICKS_DISTRIBUTION_DELETED',
      entity: 'ChicksDistribution',
      entityId: id,
      userId,
      details: { transferNumber: existing.transferNumber },
    });
  }

  // ─────────────────────────────────────────────
  // Availability
  // ─────────────────────────────────────────────

  async getAvailability(branchId?: string, breedType?: string): Promise<IChicksAvailability[]> {
    const where: any = {
      status: { in: ['ARRIVED', 'GROWING'] },
      currentQuantity: { gt: 0 },
    };
    if (branchId) where.branchId = branchId;
    if (breedType) where.breedType = breedType;

    const batches = await this.prisma.chicksBatch.findMany({ where });

    const now = new Date();
    return batches.map((batch) => ({
      chicksBatchId: batch.id,
      batchNumber: batch.batchNumber,
      batchName: batch.batchName,
      breedType: batch.breedType,
      ageInDays: Math.floor(
        (now.getTime() - new Date(batch.arrivalDate).getTime()) / (1000 * 60 * 60 * 24),
      ),
      availableQuantity: batch.currentQuantity,
      unitCost: batch.costPerChick ? Number(batch.costPerChick) : 0,
    }));
  }

  // ─────────────────────────────────────────────
  // Sales Reporting
  // ─────────────────────────────────────────────

  async getSalesReport(filter: ChicksSalesReportFilterDto): Promise<IChicksSalesReport> {
    const { dateFrom, dateTo, branchId } = filter;

    const where: any = {
      transferType: ChicksTransferType.SALE,
      status: ChicksTransferStatus.COMPLETED,
    };
    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.transferDate = {};
      if (dateFrom) where.transferDate.gte = new Date(dateFrom);
      if (dateTo) where.transferDate.lte = new Date(dateTo);
    }

    const distributions = await this.prisma.chicksDistribution.findMany({
      where,
      include: {
        chicksBatch: { select: { breedType: true } },
      },
    });

    const totalQuantity = distributions.reduce((sum, d) => sum + d.quantity, 0);
    const totalRevenue = distributions.reduce(
      (sum, d) => sum + (d.totalAmount ? Number(d.totalAmount) : 0),
      0,
    );

    // By breed type
    const breedMap = new Map();
    for (const d of distributions) {
      const key = d.chicksBatch?.breedType || 'UNKNOWN';
      if (!breedMap.has(key)) {
        breedMap.set(key, { breedType: key, quantity: 0, revenue: 0 });
      }
      const b = breedMap.get(key);
      b.quantity += d.quantity;
      b.revenue += d.totalAmount ? Number(d.totalAmount) : 0;
    }

    // By customer
    const customerMap = new Map();
    for (const d of distributions) {
      const key = d.customerId || d.customerName || 'WALK-IN';
      if (!customerMap.has(key)) {
        customerMap.set(key, { customerId: key, customerName: d.customerName || 'Walk-in', quantity: 0, revenue: 0 });
      }
      const c = customerMap.get(key);
      c.quantity += d.quantity;
      c.revenue += d.totalAmount ? Number(d.totalAmount) : 0;
    }

    return {
      period: `${dateFrom || 'all'} to ${dateTo || 'now'}`,
      totalSales: distributions.length,
      totalQuantity,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averagePrice: totalQuantity > 0 ? Math.round((totalRevenue / totalQuantity) * 10000) / 10000 : 0,
      byBreedType: Array.from(breedMap.values()).map((b) => ({
        ...b,
        averagePrice: b.quantity > 0 ? Math.round((b.revenue / b.quantity) * 10000) / 10000 : 0,
      })),
      byCustomer: Array.from(customerMap.values()).map((c) => ({
        ...c,
        revenue: Math.round(c.revenue * 100) / 100,
      })),
    };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async generateTransferNumber(): Promise<string> {
    const prefix = 'CT';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const last = await this.prisma.chicksDistribution.findFirst({
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

  private mapToInterface(d: any): IChicksDistribution {
    return {
      id: d.id,
      transferNumber: d.transferNumber,
      chicksBatchId: d.chicksBatchId,
      batchNumber: d.chicksBatch?.batchNumber,
      breedType: d.chicksBatch?.breedType,
      transferType: d.transferType as ChicksTransferType,
      status: d.status as ChicksTransferStatus,
      quantity: d.quantity,
      unitPrice: d.unitPrice ? Number(d.unitPrice) : null,
      totalAmount: d.totalAmount ? Number(d.totalAmount) : null,
      customerName: d.customerName,
      customerId: d.customerId,
      fromWarehouseId: d.fromWarehouseId,
      toWarehouseId: d.toWarehouseId,
      transferDate: d.transferDate,
      notes: d.notes,
      branchId: d.branchId,
      createdBy: d.createdBy,
      createdAt: d.createdAt,
      updatedAt: d.updatedAt,
    };
  }
}
