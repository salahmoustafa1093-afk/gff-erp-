import Decimal from 'decimal.js';

export interface InventoryItem {
  id: string;
  productId: string;
  warehouseId: string;
  quantityOnHand: Decimal;
  quantityReserved: Decimal;
  averageCost: Decimal;
  totalValue: Decimal;
  reorderPoint: Decimal;
  reorderQuantity: Decimal;
  expiryDate: Date | null;
  lastMovementDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  product?: {
    id: string;
    name: string;
    sku: string | null;
    barcode: string | null;
    productType: string;
    isTraceable: boolean;
    category: { id: string; name: string } | null;
    brand: { id: string; name: string } | null;
    unit: { id: string; abbreviation: string } | null;
  };
  warehouse?: {
    id: string;
    name: string;
    code: string | null;
  };
}

export interface FIFOLayer {
  id: string;
  productId: string;
  warehouseId: string;
  batchId: string | null;
  batchNumber: string | null;
  quantity: Decimal;
  unitCost: Decimal;
  remainingQuantity: Decimal;
  purchaseDate: Date;
  expiryDate: Date | null;
  createdAt: Date;
}

export interface ValuationResult {
  productId: string;
  productName: string;
  sku: string | null;
  warehouseId: string;
  warehouseName: string;
  method: 'FIFO' | 'WEIGHTED_AVERAGE';
  totalQuantity: number;
  totalValue: number;
  unitCost: number;
  layers?: FIFOLayerDetail[];
}

export interface FIFOLayerDetail {
  layerId: string;
  batchNumber: string | null;
  quantity: number;
  unitCost: number;
  layerValue: number;
  remaining: number;
  purchaseDate: Date;
  expiryDate: Date | null;
}

export interface InventoryAgingItem {
  productId: string;
  productName: string;
  sku: string | null;
  warehouseName: string;
  batchNumber: string | null;
  quantity: number;
  unitCost: number;
  totalValue: number;
  ageInDays: number;
  ageCategory: '0-30' | '31-60' | '61-90' | '91-180' | '180+';
  expiryDate: Date | null;
  daysUntilExpiry: number | null;
}
