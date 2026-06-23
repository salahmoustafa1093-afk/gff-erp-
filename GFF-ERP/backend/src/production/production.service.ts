import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { AuditService } from '../audit/audit.service';
import {
  CreateProductionPlanDto,
  UpdateProductionPlanDto,
  ProductionPlanFilterDto,
} from './dto/production-plan.dto';
import {
  ProductionKpiFilterDto,
  TargetAnalysisFilterDto,
  CapacityPlanningFilterDto,
} from './dto/production-kpi.dto';
import {
  ProductionPlanStatus,
  PlanningPeriod,
  IProductionPlan,
  IProductionKpi,
  IProductionTargetAnalysis,
  ICapacityPlanning,
  IEfficiencyMetrics,
} from './interfaces/production.interface';

@Injectable()
export class ProductionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ─────────────────────────────────────────────
  // Production Plans CRUD
  // ─────────────────────────────────────────────

  async createPlan(dto: CreateProductionPlanDto, userId: string): Promise<IProductionPlan> {
    const planNumber = await this.generatePlanNumber();

    const result = await this.prisma.$transaction(async (tx) => {
      const plan = await tx.productionPlan.create({
        data: {
          planNumber,
          name: dto.name,
          description: dto.description || null,
          period: dto.period,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          status: ProductionPlanStatus.DRAFT,
          targetFeedProductionKg: dto.targetFeedProductionKg
            ? new Decimal(dto.targetFeedProductionKg)
            : new Decimal(0),
          targetEggProductionCount: dto.targetEggProductionCount || null,
          targetChicksCount: dto.targetChicksCount || null,
          branchId: dto.branchId || null,
          createdBy: userId,
          lines: dto.lines
            ? {
                create: dto.lines.map((line, idx) => ({
                  productId: line.productId || null,
                  feedFormulaId: line.feedFormulaId || null,
                  targetQuantity: new Decimal(line.targetQuantity),
                  actualQuantity: null,
                  unitCost: line.unitCost ? new Decimal(line.unitCost) : null,
                  totalCost: line.unitCost
                    ? new Decimal(line.unitCost).mul(line.targetQuantity)
                    : null,
                  startDate: line.startDate ? new Date(line.startDate) : null,
                  endDate: line.endDate ? new Date(line.endDate) : null,
                  notes: line.notes || null,
                  sortOrder: line.sortOrder ?? idx,
                })),
              }
            : undefined,
        },
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });

      return plan;
    });

    await this.audit.log({
      action: 'PRODUCTION_PLAN_CREATED',
      entity: 'ProductionPlan',
      entityId: result.id,
      userId,
      details: { planNumber: result.planNumber, name: result.name },
    });

    return this.mapPlanToInterface(result);
  }

  async findAllPlans(filter: ProductionPlanFilterDto): Promise<{ data: IProductionPlan[]; total: number }> {
    const { search, period, status, branchId, page = 1, limit = 20 } = filter;
    const where: any = {};

    if (search) {
      where.OR = [
        { planNumber: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (period) where.period = period;
    if (status) where.status = status;
    if (branchId) where.branchId = branchId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.productionPlan.findMany({
        where,
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.productionPlan.count({ where }),
    ]);

    return { data: data.map((p) => this.mapPlanToInterface(p)), total };
  }

  async findPlanById(id: string): Promise<IProductionPlan> {
    const plan = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!plan) throw new NotFoundException(`Production plan '${id}' not found`);
    return this.mapPlanToInterface(plan);
  }

  async updatePlan(id: string, dto: UpdateProductionPlanDto, userId: string): Promise<IProductionPlan> {
    const existing = await this.prisma.productionPlan.findUnique({
      where: { id },
      include: { lines: true },
    });
    if (!existing) throw new NotFoundException(`Production plan '${id}' not found`);

    const result = await this.prisma.$transaction(async (tx) => {
      // Replace lines if provided
      if (dto.lines && dto.lines.length > 0) {
        await tx.productionPlanLine.deleteMany({ where: { productionPlanId: id } });
      }

      const updateData: any = {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        targetFeedProductionKg: dto.targetFeedProductionKg
          ? new Decimal(dto.targetFeedProductionKg)
          : undefined,
        targetEggProductionCount: dto.targetEggProductionCount,
        targetChicksCount: dto.targetChicksCount,
      };

      if (dto.lines) {
        updateData.lines = {
          create: dto.lines.map((line, idx) => ({
            productId: line.productId || null,
            feedFormulaId: line.feedFormulaId || null,
            targetQuantity: new Decimal(line.targetQuantity),
            actualQuantity: null,
            unitCost: line.unitCost ? new Decimal(line.unitCost) : null,
            totalCost: line.unitCost
              ? new Decimal(line.unitCost).mul(line.targetQuantity)
              : null,
            notes: line.notes || null,
            sortOrder: line.sortOrder ?? idx,
          })),
        };
      }

      return tx.productionPlan.update({
        where: { id },
        data: updateData,
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
      });
    });

    await this.audit.log({
      action: 'PRODUCTION_PLAN_UPDATED',
      entity: 'ProductionPlan',
      entityId: result.id,
      userId,
      details: { planNumber: result.planNumber, status: result.status },
    });

    return this.mapPlanToInterface(result);
  }

  async deletePlan(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.productionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Production plan '${id}' not found`);

    await this.prisma.$transaction([
      this.prisma.productionPlanLine.deleteMany({ where: { productionPlanId: id } }),
      this.prisma.productionPlan.delete({ where: { id } }),
    ]);

    await this.audit.log({
      action: 'PRODUCTION_PLAN_DELETED',
      entity: 'ProductionPlan',
      entityId: id,
      userId,
      details: { planNumber: existing.planNumber },
    });
  }

  async approvePlan(id: string, userId: string): Promise<IProductionPlan> {
    const existing = await this.prisma.productionPlan.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Production plan '${id}' not found`);
    if (existing.status !== ProductionPlanStatus.DRAFT) {
      throw new BadRequestException(`Cannot approve plan in status: ${existing.status}`);
    }

    const result = await this.prisma.productionPlan.update({
      where: { id },
      data: { status: ProductionPlanStatus.APPROVED },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });

    await this.audit.log({
      action: 'PRODUCTION_PLAN_APPROVED',
      entity: 'ProductionPlan',
      entityId: id,
      userId,
      details: { planNumber: result.planNumber },
    });

    return this.mapPlanToInterface(result);
  }

  // ─────────────────────────────────────────────
  // KPIs Dashboard
  // ─────────────────────────────────────────────

  async getKpis(filter: ProductionKpiFilterDto): Promise<IProductionKpi> {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : new Date();
    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};

    // Manufacturing orders
    const manufacturingOrders = await this.prisma.manufacturingOrder.findMany({
      where: {
        ...branchFilter,
        productionDate: { gte: dateFrom, lte: dateTo },
      },
    });

    const completedMOs = manufacturingOrders.filter((mo) => mo.status === 'COMPLETED');
    const totalPlannedFeed = completedMOs.reduce(
      (sum, mo) => sum + Number(mo.plannedQuantityKg),
      0,
    );
    const totalActualFeed = completedMOs.reduce(
      (sum, mo) => sum + (mo.actualQuantityKg ? Number(mo.actualQuantityKg) : 0),
      0,
    );

    // Egg production
    const eggProduction = await this.prisma.eggProduction.findMany({
      where: {
        ...branchFilter,
        collectionDate: { gte: dateFrom, lte: dateTo },
      },
    });
    const totalEggs = eggProduction.reduce(
      (sum, ep) => sum + ep.goodLarge + ep.goodMedium + ep.goodSmall,
      0,
    );

    // Chicks batches
    const chicksBatches = await this.prisma.chicksBatch.findMany({
      where: {
        ...branchFilter,
        status: 'ACTIVE',
      },
    });
    const totalChicks = chicksBatches.reduce(
      (sum, batch) => sum + (batch.currentQuantity || 0),
      0,
    );
    const totalArrived = chicksBatches.reduce((sum, b) => sum + b.arrivalQuantity, 0);
    const totalMortality = chicksBatches.reduce((sum, b) => sum + b.mortalityCount, 0);

    // Mortality rate
    const mortalityRate = totalArrived > 0 ? (totalMortality / totalArrived) * 100 : 0;

    // FCR estimation (feed consumed per unit output)
    const feedConversionRatio = totalEggs > 0 ? totalActualFeed / totalEggs : 0;

    return {
      period: `${dateFrom.toISOString().split('T')[0]} to ${dateTo.toISOString().split('T')[0]}`,
      feedProduction: {
        planned: Math.round(totalPlannedFeed * 100) / 100,
        actual: Math.round(totalActualFeed * 100) / 100,
        variance: Math.round((totalActualFeed - totalPlannedFeed) * 100) / 100,
        variancePercent:
          totalPlannedFeed > 0
            ? Math.round(((totalActualFeed - totalPlannedFeed) / totalPlannedFeed) * 10000) / 100
            : 0,
      },
      eggProduction: {
        target: 0,
        actual: totalEggs,
        variance: totalEggs,
        variancePercent: 0,
      },
      mortalityRate: Math.round(mortalityRate * 100) / 100,
      feedConversionRatio: Math.round(feedConversionRatio * 10000) / 10000,
      activeBatches: chicksBatches.length,
      totalChicks,
      manufacturingOrders: {
        total: manufacturingOrders.length,
        completed: completedMOs.length,
        inProgress: manufacturingOrders.filter((mo) => mo.status === 'IN_PROGRESS').length,
        avgYield:
          completedMOs.length > 0
            ? Math.round(
                (completedMOs.reduce(
                  (sum, mo) => sum + (mo.yieldPercentage ? Number(mo.yieldPercentage) : 0),
                  0,
                ) /
                  completedMOs.length) *
                  100,
              ) / 100
            : 0,
      },
    };
  }

  // ─────────────────────────────────────────────
  // Target vs Actual Analysis
  // ─────────────────────────────────────────────

  async getTargetAnalysis(filter: TargetAnalysisFilterDto): Promise<IProductionTargetAnalysis> {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : new Date();
    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};

    // Get all production plans in period
    const plans = await this.prisma.productionPlan.findMany({
      where: {
        ...branchFilter,
        startDate: { lte: dateTo },
        endDate: { gte: dateFrom },
        status: { in: ['APPROVED', 'IN_PROGRESS', 'COMPLETED'] },
      },
    });

    const totalTargetFeed = plans.reduce(
      (sum, p) => sum + Number(p.targetFeedProductionKg),
      0,
    );
    const totalTargetEggs = plans.reduce(
      (sum, p) => sum + (p.targetEggProductionCount || 0),
      0,
    );

    // Get actuals
    const manufacturingOrders = await this.prisma.manufacturingOrder.findMany({
      where: {
        ...branchFilter,
        status: 'COMPLETED',
        completionDate: { gte: dateFrom, lte: dateTo },
      },
    });
    const actualFeed = manufacturingOrders.reduce(
      (sum, mo) => sum + (mo.actualQuantityKg ? Number(mo.actualQuantityKg) : 0),
      0,
    );

    const eggProduction = await this.prisma.eggProduction.findMany({
      where: {
        ...branchFilter,
        collectionDate: { gte: dateFrom, lte: dateTo },
      },
    });
    const actualEggs = eggProduction.reduce(
      (sum, ep) => sum + ep.goodLarge + ep.goodMedium + ep.goodSmall,
      0,
    );

    const feedAchievement = totalTargetFeed > 0 ? (actualFeed / totalTargetFeed) * 100 : 0;
    const eggAchievement = totalTargetEggs > 0 ? (actualEggs / totalTargetEggs) * 100 : 0;

    const categories = [
      {
        category: 'Feed Production',
        target: Math.round(totalTargetFeed * 100) / 100,
        actual: Math.round(actualFeed * 100) / 100,
        achievement: Math.round(feedAchievement * 100) / 100,
        trend: feedAchievement >= 95 ? ('STABLE' as const) : feedAchievement >= 80 ? ('UP' as const) : ('DOWN' as const),
      },
      {
        category: 'Egg Production',
        target: totalTargetEggs,
        actual: actualEggs,
        achievement: Math.round(eggAchievement * 100) / 100,
        trend: eggAchievement >= 95 ? ('STABLE' as const) : eggAchievement >= 80 ? ('UP' as const) : ('DOWN' as const),
      },
    ];

    return {
      overallAchievement: Math.round(
        categories.reduce((sum, c) => sum + c.achievement, 0) / categories.length,
      ),
      byCategory: categories,
    };
  }

  // ─────────────────────────────────────────────
  // Capacity Planning
  // ─────────────────────────────────────────────

  async getCapacityPlanning(filter: CapacityPlanningFilterDto): Promise<ICapacityPlanning> {
    const dateFrom = filter.dateFrom ? new Date(filter.dateFrom) : new Date();
    const dateTo = filter.dateTo ? new Date(filter.dateTo) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const branchFilter = filter.branchId ? { branchId: filter.branchId } : {};
    const capacity = filter.productionCapacity || 10000; // Default 10,000 KG

    const plannedOrders = await this.prisma.manufacturingOrder.findMany({
      where: {
        ...branchFilter,
        status: { in: ['PLANNED', 'IN_PROGRESS'] },
        productionDate: { gte: dateFrom, lte: dateTo },
      },
    });

    const plannedProduction = plannedOrders.reduce(
      (sum, mo) => sum + Number(mo.plannedQuantityKg),
      0,
    );

    const utilizationRate = capacity > 0 ? (plannedProduction / capacity) * 100 : 0;

    return {
      period: `${dateFrom.toISOString().split('T')[0]} to ${dateTo.toISOString().split('T')[0]}`,
      productionCapacity: capacity,
      plannedProduction: Math.round(plannedProduction * 100) / 100,
      utilizationRate: Math.round(utilizationRate * 100) / 100,
      availableCapacity: Math.round((capacity - plannedProduction) * 100) / 100,
      bottleneckResource: utilizationRate > 90 ? 'Production Capacity' : null,
    };
  }

  // ─────────────────────────────────────────────
  // Efficiency Metrics
  // ─────────────────────────────────────────────

  async getEfficiencyMetrics(branchId?: string): Promise<IEfficiencyMetrics> {
    const branchFilter = branchId ? { branchId } : {};

    const completedOrders = await this.prisma.manufacturingOrder.findMany({
      where: {
        ...branchFilter,
        status: 'COMPLETED',
      },
    });

    const totalMOs = await this.prisma.manufacturingOrder.count({
      where: { ...branchFilter },
    });

    const qualityPassCount = completedOrders.filter((mo) => mo.qualityStatus === 'PASS').length;

    const plannedDowntime = 0.1; // 10% assumed planned downtime
    const availabilityRate = totalMOs > 0
      ? (completedOrders.length / totalMOs) * 100 * (1 - plannedDowntime)
      : 0;

    const qualityRate = completedOrders.length > 0
      ? (qualityPassCount / completedOrders.length) * 100
      : 0;

    const avgYield = completedOrders.length > 0
      ? completedOrders.reduce((sum, mo) => sum + (mo.yieldPercentage ? Number(mo.yieldPercentage) : 0), 0) / completedOrders.length
      : 0;

    const performanceRate = avgYield;
    const oee = (availabilityRate / 100) * (performanceRate / 100) * (qualityRate / 100) * 100;

    const plannedCostTotal = completedOrders.reduce(
      (sum, mo) => sum + (mo.plannedCost ? Number(mo.plannedCost) : 0),
      0,
    );
    const actualCostTotal = completedOrders.reduce(
      (sum, mo) => sum + (mo.actualCost ? Number(mo.actualCost) : 0),
      0,
    );

    const costEfficiency = actualCostTotal > 0
      ? (plannedCostTotal / actualCostTotal) * 100
      : 0;

    return {
      overallEquipmentEffectiveness: Math.round(oee * 100) / 100,
      productionEfficiency: Math.round(avgYield * 100) / 100,
      qualityRate: Math.round(qualityRate * 100) / 100,
      availabilityRate: Math.round(availabilityRate * 100) / 100,
      costEfficiency: Math.round(costEfficiency * 100) / 100,
    };
  }

  // ─────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────

  private async generatePlanNumber(): Promise<string> {
    const prefix = 'PP';
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;

    const lastPlan = await this.prisma.productionPlan.findFirst({
      where: { planNumber: { startsWith: `${prefix}-${dateStr}` } },
      orderBy: { planNumber: 'desc' },
    });

    let seq = 1;
    if (lastPlan) {
      const parts = lastPlan.planNumber.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) seq = lastSeq + 1;
    }

    return `${prefix}-${dateStr}-${String(seq).padStart(5, '0')}`;
  }

  private mapPlanToInterface(plan: any): IProductionPlan {
    return {
      id: plan.id,
      planNumber: plan.planNumber,
      name: plan.name,
      description: plan.description,
      period: plan.period as PlanningPeriod,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: plan.status as ProductionPlanStatus,
      targetFeedProductionKg: Number(plan.targetFeedProductionKg),
      actualFeedProductionKg: plan.actualFeedProductionKg ? Number(plan.actualFeedProductionKg) : null,
      targetEggProductionCount: plan.targetEggProductionCount,
      actualEggProductionCount: plan.actualEggProductionCount,
      targetChicksCount: plan.targetChicksCount,
      actualChicksCount: plan.actualChicksCount,
      branchId: plan.branchId,
      createdBy: plan.createdBy,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
      lines: plan.lines?.map((l: any) => ({
        id: l.id,
        productionPlanId: l.productionPlanId,
        productId: l.productId,
        feedFormulaId: l.feedFormulaId,
        targetQuantity: Number(l.targetQuantity),
        actualQuantity: l.actualQuantity ? Number(l.actualQuantity) : null,
        unitCost: l.unitCost ? Number(l.unitCost) : null,
        totalCost: l.totalCost ? Number(l.totalCost) : null,
        startDate: l.startDate,
        endDate: l.endDate,
        notes: l.notes,
        sortOrder: l.sortOrder,
        createdAt: l.createdAt,
      })),
    };
  }
}
