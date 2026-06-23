import { Decimal } from '@prisma/client/runtime/library';

export enum ChicksTransferType {
  SALE = 'SALE',
  INTERNAL_TRANSFER = 'INTERNAL_TRANSFER',
  FARM_TRANSFER = 'FARM_TRANSFER',
  RETURN = 'RETURN',
}

export enum ChicksTransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface IChicksDistribution {
  id: string;
  transferNumber: string;
  chicksBatchId: string;
  batchNumber?: string;
  breedType?: string;
  transferType: ChicksTransferType;
  status: ChicksTransferStatus;
  quantity: number;
  unitPrice: Decimal | number | null;
  totalAmount: Decimal | number | null;
  customerName: string | null;
  customerId: string | null;
  fromWarehouseId: string | null;
  toWarehouseId: string | null;
  transferDate: Date;
  notes: string | null;
  branchId: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IChicksAvailability {
  chicksBatchId: string;
  batchNumber: string;
  batchName: string;
  breedType: string;
  ageInDays: number;
  availableQuantity: number;
  unitCost: number;
}

export interface IChicksSalesReport {
  period: string;
  totalSales: number;
  totalQuantity: number;
  totalRevenue: number;
  averagePrice: number;
  byBreedType: Array<{
    breedType: string;
    quantity: number;
    revenue: number;
    averagePrice: number;
  }>;
  byCustomer: Array<{
    customerId: string;
    customerName: string;
    quantity: number;
    revenue: number;
  }>;
}
