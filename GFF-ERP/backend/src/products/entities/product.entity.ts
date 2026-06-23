import { ProductType, ProductStatus, NutritionalInfoDto } from '../dto/create-product.dto';

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  productType: ProductType;
  categoryId: string;
  brandId: string | null;
  unitId: string;
  description: string | null;
  specifications: string | null;
  standardCost: number;
  sellingPrice: number;
  weightKg: number | null;
  reorderPoint: number;
  reorderQuantity: number;
  nutritionalInfo: NutritionalInfoDto | null;
  storageRequirements: string | null;
  shelfLifeDays: number | null;
  status: ProductStatus;
  isActive: boolean;
  isTraceable: boolean;
  defaultWarehouseId: string | null;
  imageUrl: string | null;
  taxRate: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branchId: string;
  category?: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  brand?: {
    id: string;
    name: string;
    code: string | null;
  } | null;
  unit?: {
    id: string;
    name: string;
    abbreviation: string;
  } | null;
  inventory?: ProductInventoryItem[];
  _count?: {
    inventory: number;
    stockMovements: number;
    salesOrderItems: number;
    purchaseOrderItems: number;
  };
}

export interface ProductInventoryItem {
  id: string;
  warehouseId: string;
  warehouse: {
    id: string;
    name: string;
    code: string | null;
  };
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  totalValue: number;
  reorderPoint: number;
  reorderQuantity: number;
  lastMovementDate: Date | null;
}

export interface ProductCostHistory {
  id: string;
  productId: string;
  cost: number;
  type: 'STANDARD' | 'AVERAGE' | 'FIFO' | 'MANUAL';
  reference: string | null;
  notes: string | null;
  createdAt: Date;
  createdBy: string;
}
