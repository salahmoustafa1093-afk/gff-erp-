// Shared Types for GFF ERP Frontend Modules

export interface Branch {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  city: string;
  phone: string;
  email: string;
  managerId: string;
  managerName: string;
  isActive: boolean;
  createdAt: string;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'MAIN' | 'RETAIL' | 'RETURN' | 'TEMPORARY';
  branchId: string;
  branchName: string;
  managerId: string;
  managerName: string;
  address: string;
  isActive: boolean;
  totalSKUs: number;
  totalValue: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  barcode: string;
  type: 'GOODS' | 'SERVICE' | 'RAW_MATERIAL' | 'FINISHED' | 'FEED';
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  unitId: string;
  unitName: string;
  costPrice: number;
  salePrice: number;
  minPrice: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  reorderQty: number;
  weight: number;
  nutritionalInfo: Record<string, unknown>;
  description: string;
  isActive: boolean;
  imageUrl: string;
  currentStock: number;
}

export interface ProductCategory {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  parentId: string | null;
}

export interface ProductBrand {
  id: string;
  code: string;
  name: string;
  nameAr: string;
}

export interface Unit {
  id: string;
  code: string;
  name: string;
  nameAr: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'INDIVIDUAL' | 'COMPANY' | 'DEALER' | 'DISTRIBUTOR';
  phone: string;
  email: string;
  address: string;
  city: string;
  taxNumber: string;
  creditLimit: number;
  paymentTerms: number;
  discountPercent: number;
  salesRepId: string;
  salesRepName: string;
  gpsLat: number;
  gpsLng: number;
  notes: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  code: string;
  name: string;
  nameAr: string;
  type: 'LOCAL' | 'IMPORT' | 'MANUFACTURER';
  phone: string;
  email: string;
  address: string;
  city: string;
  taxNumber: string;
  creditLimit: number;
  paymentTerms: number;
  leadTime: number;
  rating: number;
  salesRepId: string;
  salesRepName: string;
  notes: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerCode: string;
  branchId: string;
  branchName: string;
  salesRepId: string;
  salesRepName: string;
  orderDate: string;
  dueDate: string;
  status: SalesOrderStatus;
  subtotal: number;
  discount: number;
  discountPercent: number;
  tax: number;
  taxPercent: number;
  shipping: number;
  total: number;
  paid: number;
  balance: number;
  notes: string;
  items: SalesOrderItem[];
  invoices: SalesInvoice[];
  returns: SalesReturn[];
  activities: ActivityLog[];
  createdAt: string;
  updatedAt: string;
}

export type SalesOrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'INVOICED' | 'PAID' | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  deliveredQty: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  total: number;
  stockAvailable: number;
  notes: string;
}

export interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  branchId: string;
  branchName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paid: number;
  balance: number;
  notes: string;
  items: SalesInvoiceItem[];
  payments: Payment[];
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'PARTIAL' | 'OVERDUE' | 'CANCELLED';

export interface SalesInvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
}

export interface SalesReturn {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  returnDate: string;
  status: ReturnStatus;
  reason: string;
  subtotal: number;
  total: number;
  items: SalesReturnItem[];
  createdAt: string;
}

export type ReturnStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'RECEIVED' | 'REFUNDED' | 'CANCELLED';

export interface SalesReturnItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  originalQty: number;
  returnQty: number;
  unitPrice: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentNumber: string;
  referenceId: string;
  referenceType: 'SALE_INVOICE' | 'PURCHASE_INVOICE';
  customerId?: string;
  customerName?: string;
  supplierId?: string;
  supplierName?: string;
  paymentDate: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  notes: string;
  createdAt: string;
}

export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CHECK' | 'CREDIT_CARD' | 'ONLINE';

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  branchId: string;
  branchName: string;
  orderDate: string;
  expectedDate: string;
  status: PurchaseOrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  paid: number;
  balance: number;
  notes: string;
  items: PurchaseOrderItem[];
  grns: GRN[];
  invoices: PurchaseInvoice[];
  activities: ActivityLog[];
  createdAt: string;
}

export type PurchaseOrderStatus = 'DRAFT' | 'PENDING' | 'CONFIRMED' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  receivedQty: number;
  unitPrice: number;
  discountPercent: number;
  taxPercent: number;
  total: number;
  notes: string;
}

export interface GRN {
  id: string;
  grnNumber: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  branchName: string;
  grnDate: string;
  status: GRNStatus;
  items: GRNItem[];
  notes: string;
  createdAt: string;
}

export type GRNStatus = 'DRAFT' | 'CONFIRMED' | 'POSTED' | 'CANCELLED';

export interface GRNItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  orderedQty: number;
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  unitPrice: number;
  total: number;
  notes: string;
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  invoiceDate: string;
  dueDate: string;
  status: InvoiceStatus;
  total: number;
  paid: number;
  balance: number;
  items: PurchaseInvoiceItem[];
  payments: Payment[];
  createdAt: string;
}

export interface PurchaseInvoiceItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  orderId: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  returnDate: string;
  status: ReturnStatus;
  reason: string;
  total: number;
  items: PurchaseReturnItem[];
  createdAt: string;
}

export interface PurchaseReturnItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  returnQty: number;
  unitPrice: number;
  total: number;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  warehouseId: string;
  warehouseName: string;
  branchId: string;
  branchName: string;
  categoryId: string;
  categoryName: string;
  brandId: string;
  brandName: string;
  quantity: number;
  reserved: number;
  available: number;
  minStock: number;
  maxStock: number;
  unitCost: number;
  totalValue: number;
  lastMovement: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  type: MovementType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceId: string;
  referenceType: string;
  referenceNumber: string;
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'ADJUSTMENT' | 'SALE' | 'PURCHASE' | 'RETURN' | 'OPENING';

export interface StockTransfer {
  id: string;
  transferNumber: string;
  fromWarehouseId: string;
  fromWarehouseName: string;
  toWarehouseId: string;
  toWarehouseName: string;
  branchId: string;
  branchName: string;
  transferDate: string;
  status: TransferStatus;
  items: StockTransferItem[];
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type TransferStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'SHIPPED' | 'RECEIVED' | 'CANCELLED';

export interface StockTransferItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  quantity: number;
  shippedQty: number;
  receivedQty: number;
  unitCost: number;
  notes: string;
}

export interface StockAdjustment {
  id: string;
  adjustmentNumber: string;
  warehouseId: string;
  warehouseName: string;
  productId: string;
  productCode: string;
  productName: string;
  currentQty: number;
  newQty: number;
  difference: number;
  unitCost: number;
  totalCost: number;
  reason: AdjustmentReason;
  notes: string;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  createdBy: string;
  createdAt: string;
}

export type AdjustmentReason = 'DAMAGE' | 'EXPIRY' | 'LOSS' | 'FOUND' | 'COUNT' | 'OTHER';

export interface PhysicalCount {
  id: string;
  countNumber: string;
  warehouseId: string;
  warehouseName: string;
  categoryId: string;
  categoryName: string;
  countDate: string;
  status: CountStatus;
  items: PhysicalCountItem[];
  notes: string;
  createdBy: string;
  createdAt: string;
}

export type CountStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED' | 'CANCELLED';

export interface PhysicalCountItem {
  id: string;
  productId: string;
  productCode: string;
  productName: string;
  systemQty: number;
  countedQty: number;
  variance: number;
  unitCost: number;
  varianceCost: number;
  notes: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface SalesReportRow {
  period: string;
  orderCount: number;
  itemCount: number;
  subtotal: number;
  discount: number;
  tax: number;
  shipping: number;
  total: number;
  profit: number;
}

export interface CustomerStatementRow {
  date: string;
  type: 'INVOICE' | 'PAYMENT' | 'DEBIT_NOTE' | 'CREDIT_NOTE' | 'OPENING';
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
}

export interface ListResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  statusCode: number;
}
