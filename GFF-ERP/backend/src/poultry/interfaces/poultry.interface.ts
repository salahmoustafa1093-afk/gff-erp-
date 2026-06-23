import { Decimal } from '@prisma/client/runtime/library';

export enum BreedType {
  BROILER = 'BROILER',
  LAYER = 'LAYER',
  BREEDER = 'BREEDER',
  PIGEON = 'PIGEON',
  OTHER = 'OTHER',
}

export enum ChicksBatchStatus {
  ORDERED = 'ORDERED',
  ARRIVED = 'ARRIVED',
  GROWING = 'GROWING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MortalityCause {
  DISEASE = 'DISEASE',
  HEAT = 'HEAT',
  COLD = 'COLD',
  PREDATOR = 'PREDATOR',
  DEFORMITY = 'DEFORMITY',
  STARVATION = 'STARVATION',
  OTHER = 'OTHER',
}

export enum ChicksAgeUnit {
  DAYS = 'DAYS',
  WEEKS = 'WEEKS',
}

export interface IChicksBatch {
  id: string;
  batchNumber: string;
  batchName: string;
  breedType: BreedType;
  supplierId: string | null;
  supplierName?: string;
  arrivalDate: Date;
  arrivalQuantity: number;
  currentQuantity: number;
  mortalityCount: number;
  soldCount: number;
  unitCost: Decimal | number | null;
  totalCost: Decimal | number | null;
  costPerChick: Decimal | number | null;
  ageInDays: number;
  status: ChicksBatchStatus;
  branchId: string | null;
  warehouseId: string | null;
  notes: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  mortalityRecords?: IMortalityRecord[];
}

export interface IMortalityRecord {
  id: string;
  chicksBatchId: string;
  recordDate: Date;
  count: number;
  cause: MortalityCause;
  description: string | null;
  recordedBy: string;
  createdAt: Date;
}

export interface IChicksBatchStatistics {
  batchId: string;
  batchNumber: string;
  breedType: BreedType;
  arrivalQuantity: number;
  currentQuantity: number;
  mortalityCount: number;
  mortalityRate: number;
  survivalRate: number;
  ageInDays: number;
  ageInWeeks: number;
  costPerChick: number;
  daysSinceArrival: number;
}

export interface IChicksReport {
  summary: {
    totalActiveBatches: number;
    totalChicks: number;
    totalMortalityThisMonth: number;
    averageMortalityRate: number;
  };
  byBreed: Array<{
    breedType: BreedType;
    batchCount: number;
    totalChicks: number;
    avgMortalityRate: number;
  }>;
  mortalityTrend: Array<{
    date: string;
    count: number;
  }>;
  supplierPerformance: Array<{
    supplierId: string;
    supplierName: string;
    batchesReceived: number;
    totalChicks: number;
    mortalityRate: number;
  }>;
}

export interface ISupplierPerformance {
  supplierId: string;
  supplierName: string;
  totalBatches: number;
  totalChicks: number;
  totalMortality: number;
  mortalityRate: number;
  averageCostPerChick: number;
  lastDeliveryDate: Date | null;
}
