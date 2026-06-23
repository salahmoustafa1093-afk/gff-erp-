import { WarehouseType } from '../dto/create-warehouse.dto';

export interface Warehouse {
  id: string;
  name: string;
  code: string | null;
  type: WarehouseType;
  branchId: string;
  address: string | null;
  city: string | null;
  maxCapacity: number | null;
  currentUsage: number | null;
  temperatureControl: string | null;
  isActive: boolean;
  description: string | null;
  managerName: string | null;
  phone: string | null;
  allowNegativeStock: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  branch?: {
    id: string;
    name: string;
  };
  inventory?: WarehouseInventoryItem[];
  _count?: {
    inventory: number;
    sourceMovements: number;
    destinationMovements: number;
  };
}

export interface WarehouseInventoryItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    sku: string;
    barcode: string | null;
    productType: string;
    category: { id: string; name: string } | null;
    brand: { id: string; name: string } | null;
    unit: { id: string; name: string; abbreviation: string } | null;
  };
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  averageCost: number;
  totalValue: number;
  reorderPoint: number;
  reorderQuantity: number;
  expiryDate: Date | null;
  lastMovementDate: Date | null;
  isLowStock: boolean;
}
