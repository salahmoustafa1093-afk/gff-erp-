import { Decimal } from '@prisma/client/runtime/library';

export enum EggSize {
  LARGE = 'LARGE',
  MEDIUM = 'MEDIUM',
  SMALL = 'SMALL',
}

export enum EggQuality {
  CLEAN = 'CLEAN',
  DIRTY = 'DIRTY',
  BROKEN = 'BROKEN',
}

export enum EggTransferType {
  FARM_TO_WAREHOUSE = 'FARM_TO_WAREHOUSE',
  WAREHOUSE_TO_WAREHOUSE = 'WAREHOUSE_TO_WAREHOUSE',
  SALE = 'SALE',
}

export enum EggTransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IEggProduction {
  id: string;
  chicksBatchId: string;
  batchNumber?: string;
  collectionDate: Date;
  collectionTime: string | null;
  collectorName: string | null;
  goodLarge: number;
  goodMedium: number;
  goodSmall: number;
  dirtyLarge: number;
  dirtyMedium: number;
  dirtySmall: number;
  brokenLarge: number;
  brokenMedium: number;
  brokenSmall: number;
  totalGoodEggs: number;
  totalDirtyEggs: number;
  totalBrokenEggs: number;
  totalCollected: number;
  notes: string | null;
  branchId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEggInventory {
  id: string;
  productId: string;
  warehouseId: string;
  largeQuantity: number;
  mediumQuantity: number;
  smallQuantity: number;
  totalQuantity: number;
  averageCost: Decimal | number | null;
  updatedAt: Date;
}

export interface IEggTransfer {
  id: string;
  transferNumber: string;
  transferType: EggTransferType;
  status: EggTransferStatus;
  chicksBatchId: string | null;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  largeQuantity: number;
  mediumQuantity: number;
  smallQuantity: number;
  totalQuantity: number;
  unitPrice: Decimal | number | null;
  totalAmount: Decimal | number | null;
  customerName: string | null;
  transferDate: Date;
  notes: string | null;
  branchId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEggDailyReport {
  date: string;
  totalCollections: number;
  totalGoodLarge: number;
  totalGoodMedium: number;
  totalGoodSmall: number;
  totalDirty: number;
  totalBroken: number;
  totalCollected: number;
  totalGoodEggs: number;
  breakageRate: number;
  byBatch: Array<{
    chicksBatchId: string;
    batchNumber: string;
    goodLarge: number;
    goodMedium: number;
    goodSmall: number;
    dirty: number;
    broken: number;
    total: number;
  }>;
}

export interface IEggProductionTrend {
  period: string;
  totalGoodEggs: number;
  totalCollected: number;
  avgPerDay: number;
  breakageRate: number;
}

export interface IEggSizeDistribution {
  size: EggSize;
  count: number;
  percentage: number;
}

export interface IEggRevenueReport {
  period: string;
  totalEggsSold: number;
  totalRevenue: number;
  averagePricePerEgg: number;
  bySize: Array<{
    size: EggSize;
    quantity: number;
    revenue: number;
    averagePrice: number;
  }>;
}

export interface IEggCollectionSchedule {
  batchId: string;
  batchNumber: string;
  expectedCollectionTime: string;
  lastCollectionDate: string | null;
  daysSinceLastCollection: number;
  avgDailyProduction: number;
}

export interface IFeedConversionRatio {
  chicksBatchId: string;
  batchNumber: string;
  breedType: string;
  totalFeedConsumed: number;
  totalEggsProduced: number;
  fcr: number;
  period: string;
}
