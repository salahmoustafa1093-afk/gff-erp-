import { Decimal } from '@prisma/client/runtime/library';

export enum ManufacturingStatus {
  DRAFT = 'DRAFT',
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum StockMovementType {
  MANUFACTURING_CONSUMPTION = 'MANUFACTURING_CONSUMPTION',
  MANUFACTURING_OUTPUT = 'MANUFACTURING_OUTPUT',
  MANUFACTURING_WASTE = 'MANUFACTURING_WASTE',
}

export enum QualityStatus {
  PENDING = 'PENDING',
  PASS = 'PASS',
  FAIL = 'FAIL',
  PARTIAL = 'PARTIAL',
}

export interface IManufacturingOrder {
  id: string;
  orderNumber: string;
  feedFormulaId: string;
  feedFormulaName?: string;
  feedFormulaCode?: string;
  status: ManufacturingStatus;
  plannedQuantityKg: Decimal | number;
  actualQuantityKg: Decimal | number | null;
  plannedCost: Decimal | number | null;
  actualCost: Decimal | number | null;
  yieldPercentage: Decimal | number | null;
  productionDate: Date;
  completionDate: Date | null;
  batchNumber: string | null;
  branchId: string | null;
  warehouseId: string | null;
  outputWarehouseId: string | null;
  notes: string | null;
  qualityStatus: QualityStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  consumptionLines?: IConsumptionLine[];
  qualityTests?: IQualityTest[];
}

export interface IConsumptionLine {
  id: string;
  manufacturingOrderId: string;
  productId: string;
  productName?: string;
  plannedQuantityKg: Decimal | number;
  actualQuantityKg: Decimal | number | null;
  varianceKg: Decimal | number | null;
  unitCost: Decimal | number | null;
  totalCost: Decimal | number | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IQualityTest {
  id: string;
  manufacturingOrderId: string;
  testType: string;
  testValue: Decimal | number | null;
  targetValue: Decimal | number | null;
  unit: string;
  result: QualityStatus;
  notes: string | null;
  testedBy: string | null;
  testedAt: Date | null;
  createdAt: Date;
}

export interface IYieldReport {
  totalOrders: number;
  totalPlannedQuantity: number;
  totalActualQuantity: number;
  averageYieldPercentage: number;
  byFormula: Array<{
    formulaId: string;
    formulaName: string;
    orderCount: number;
    plannedQty: number;
    actualQty: number;
    avgYield: number;
  }>;
  byPeriod: Array<{
    period: string;
    orderCount: number;
    plannedQty: number;
    actualQty: number;
    avgYield: number;
  }>;
}

export interface ICostReport {
  totalPlannedCost: number;
  totalActualCost: number;
  costVariance: number;
  costVariancePercentage: number;
  byFormula: Array<{
    formulaId: string;
    formulaName: string;
    plannedCost: number;
    actualCost: number;
    variance: number;
  }>;
  materialCost: number;
  overheadCost: number;
  costPerKg: number;
}

export interface IProductionCapacityReport {
  totalOrders: number;
  completedOrders: number;
  inProgressOrders: number;
  cancelledOrders: number;
  capacityUtilization: number;
  byStatus: Record<ManufacturingStatus, number>;
}
