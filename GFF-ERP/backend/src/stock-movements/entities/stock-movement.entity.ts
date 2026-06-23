import Decimal from 'decimal.js';

export interface StockMovement {
  id: string;
  productId: string;
  type: string;
  quantity: Decimal;
  unitCost: Decimal;
  totalCost: Decimal;
  sourceWarehouseId: string | null;
  destinationWarehouseId: string | null;
  batchId: string | null;
  reference: string | null;
  referenceType: string | null;
  reason: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  createdBy: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    unit: { abbreviation: string } | null;
  };
  sourceWarehouse?: { id: string; name: string } | null;
  destinationWarehouse?: { id: string; name: string } | null;
  batch?: { id: string; batchNumber: string } | null;
}

export interface StockReservation {
  id: string;
  productId: string;
  warehouseId: string;
  salesOrderId: string;
  quantity: Decimal;
  quantityFulfilled: Decimal;
  status: string;
  expiryDate: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  product?: { id: string; name: string; sku: string | null };
  warehouse?: { id: string; name: string };
  salesOrder?: { id: string; orderNumber: string; customerName: string | null };
}

export interface InventoryCount {
  id: string;
  warehouseId: string;
  title: string | null;
  status: string;
  scheduledDate: Date | null;
  completedDate: Date | null;
  totalItems: number;
  varianceItems: number;
  totalVarianceValue: Decimal;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: Decimal;
  newQuantity: Decimal | null;
  reason: string;
  unitCost: Decimal;
  status: string;
  notes: string | null;
  approvalNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
}
