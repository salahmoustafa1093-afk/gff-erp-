import { Decimal } from '@prisma/client/runtime/library';

export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  DEPRECIATING = 'DEPRECIATING',
  FULLY_DEPRECIATED = 'FULLY_DEPRECIATED',
  DISPOSED = 'DISPOSED',
  IDLE = 'IDLE',
}

export enum DepreciationMethod {
  STRAIGHT_LINE = 'STRAIGHT_LINE',
  DECLINING_BALANCE = 'DECLINING_BALANCE',
}

export enum DisposalMethod {
  SOLD = 'SOLD',
  SCRAPPED = 'SCRAPPED',
  DONATED = 'DONATED',
  TRADED = 'TRADED',
}

export interface FixedAsset {
  id: string;
  assetCode: string;
  name: string;
  description: string | null;
  categoryId: string;
  categoryName?: string;
  branchId: string;
  costCenterId: string | null;
  acquisitionDate: Date;
  acquisitionCost: Decimal;
  salvageValue: Decimal;
  usefulLifeMonths: number;
  depreciationMethod: DepreciationMethod;
  depreciationRate: Decimal;
  accumulatedDepreciation: Decimal;
  netBookValue: Decimal;
  assetAccountId: string;
  depreciationAccountId: string;
  expenseAccountId: string;
  status: AssetStatus;
  location: string | null;
  serialNumber: string | null;
  supplierName: string | null;
  warrantyExpiry: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface DepreciationScheduleEntry {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  beginningBookValue: Decimal;
  depreciationAmount: Decimal;
  accumulatedDepreciation: Decimal;
  endingBookValue: Decimal;
}

export interface DepreciationBatchResult {
  period: string;
  entriesProcessed: number;
  totalDepreciation: Decimal;
  journalEntryId: string | null;
}

export interface AssetDisposal {
  assetId: string;
  disposalDate: Date;
  disposalMethod: DisposalMethod;
  saleProceeds: Decimal;
  netBookValue: Decimal;
  gainOrLoss: Decimal;
  journalEntryId: string | null;
  notes: string | null;
}

export interface AssetRegisterItem {
  asset: FixedAsset;
  annualDepreciation: Decimal;
  remainingLife: number;
  monthlyDepreciation: Decimal;
}
