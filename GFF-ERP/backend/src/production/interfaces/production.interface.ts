import { Decimal } from '@prisma/client/runtime/library';

export enum ProductionPlanStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum PlanningPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export interface IProductionPlan {
  id: string;
  planNumber: string;
  name: string;
  description: string | null;
  period: PlanningPeriod;
  startDate: Date;
  endDate: Date;
  status: ProductionPlanStatus;
  targetFeedProductionKg: Decimal | number;
  actualFeedProductionKg: Decimal | number | null;
  targetEggProductionCount: number | null;
  actualEggProductionCount: number | null;
  targetChicksCount: number | null;
  actualChicksCount: number | null;
  branchId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lines?: IProductionPlanLine[];
}

export interface IProductionPlanLine {
  id: string;
  productionPlanId: string;
  productId: string | null;
  feedFormulaId: string | null;
  targetQuantity: Decimal | number;
  actualQuantity: Decimal | number | null;
  unitCost: Decimal | number | null;
  totalCost: Decimal | number | null;
  startDate: Date | null;
  endDate: Date | null;
  notes: string | null;
  sortOrder: number;
  createdAt: Date;
}

export interface IProductionKpi {
  period: string;
  feedProduction: {
    planned: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
  eggProduction: {
    target: number;
    actual: number;
    variance: number;
    variancePercent: number;
  };
  mortalityRate: number;
  feedConversionRatio: number;
  activeBatches: number;
  totalChicks: number;
  manufacturingOrders: {
    total: number;
    completed: number;
    inProgress: number;
    avgYield: number;
  };
}

export interface ICapacityPlanning {
  period: string;
  productionCapacity: number;
  plannedProduction: number;
  utilizationRate: number;
  availableCapacity: number;
  bottleneckResource: string | null;
}

export interface IEfficiencyMetrics {
  overallEquipmentEffectiveness: number;
  productionEfficiency: number;
  qualityRate: number;
  availabilityRate: number;
  costEfficiency: number;
}

export interface IProductionTargetAnalysis {
  overallAchievement: number;
  byCategory: Array<{
    category: string;
    target: number;
    actual: number;
    achievement: number;
    trend: 'UP' | 'DOWN' | 'STABLE';
  }>;
}
