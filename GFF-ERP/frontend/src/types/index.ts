// ============================================
// User & Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: string;
  roleId: string;
  permissions: string[];
  isActive: boolean;
  branchId?: string;
  branchIds?: string[];
  department?: string;
  departmentId?: string;
  phone?: string;
  lastLogin?: string;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  dateFormat: string;
  numberFormat: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  orderAlerts: boolean;
  stockAlerts: boolean;
  paymentAlerts: boolean;
  systemAlerts: boolean;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage' | 'export' | 'approve';
  description?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: ResponseMeta;
}

export interface ResponseMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: ResponseMeta;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

// ============================================
// Filter & Query Types
// ============================================

export interface QueryFilters {
  [key: string]: unknown;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: QueryFilters;
  startDate?: string;
  endDate?: string;
}

export interface SelectOption<T = string> {
  label: string;
  value: T;
  description?: string;
  disabled?: boolean;
}

// ============================================
// Dashboard Types
// ============================================

export interface DashboardKPI {
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  changeLabel?: string;
  icon: string;
  iconColor?: string;
  link?: string;
  format?: 'currency' | 'number' | 'percentage' | 'quantity';
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface LineChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface PieChartData {
  labels: string[];
  values: number[];
  colors?: string[];
}

export interface BarChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    color?: string;
  }>;
}

export interface DashboardData {
  kpis: DashboardKPI[];
  salesChart: LineChartData;
  topProducts: TopProductItem[];
  topCustomers: TopCustomerItem[];
  recentOrders: RecentOrder[];
  recentPurchases: RecentPurchase[];
  lowStockAlerts: LowStockItem[];
  branchPerformance: BranchPerformanceItem[];
  activityFeed: ActivityItem[];
}

export interface TopProductItem {
  id: string;
  name: string;
  category: string;
  totalSold: number;
  totalRevenue: number;
}

export interface TopCustomerItem {
  id: string;
  name: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: string;
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
}

export interface RecentPurchase {
  id: string;
  poNumber: string;
  supplierName: string;
  totalAmount: number;
  status: string;
  orderDate: string;
}

export interface LowStockItem {
  id: string;
  productName: string;
  sku: string;
  currentStock: number;
  reorderLevel: number;
  warehouseName: string;
}

export interface BranchPerformanceItem {
  branchId: string;
  branchName: string;
  salesTotal: number;
  orderCount: number;
  target: number;
  achievement: number;
}

export interface ActivityItem {
  id: string;
  type: 'order' | 'purchase' | 'inventory' | 'payment' | 'system' | 'alert';
  title: string;
  description: string;
  timestamp: string;
  userName?: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// Sales Types
// ============================================

export type SaleStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'INVOICED'
  | 'PAID'
  | 'CANCELLED'
  | 'RETURNED';

export type PaymentStatus = 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'REFUNDED';

export interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  branchId: string;
  branchName: string;
  orderDate: string;
  deliveryDate?: string;
  status: SaleStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  notes?: string;
  items: SalesOrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  warehouseId?: string;
  warehouseName?: string;
}

// ============================================
// Purchase Types
// ============================================

export type PurchaseStatus =
  | 'DRAFT'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'PARTIAL'
  | 'RECEIVED'
  | 'CANCELLED'
  | 'RETURNED';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName: string;
  branchId: string;
  branchName: string;
  orderDate: string;
  expectedDate?: string;
  receivedDate?: string;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  taxAmount: number;
  discountAmount: number;
  netAmount: number;
  paidAmount: number;
  balanceDue: number;
  currency: string;
  notes?: string;
  items: PurchaseOrderItem[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  receivedQuantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
}

// ============================================
// Product & Inventory Types
// ============================================

export type ProductType = 'RAW_MATERIAL' | 'FINISHED_GOOD' | 'PACKAGING' | 'EQUIPMENT' | 'OTHER';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  type: ProductType;
  categoryId: string;
  categoryName: string;
  brandId?: string;
  brandName?: string;
  unitOfMeasure: string;
  costPrice: number;
  sellingPrice: number;
  weight?: number;
  weightUnit?: string;
  isActive: boolean;
  barcode?: string;
  reorderLevel: number;
  reorderQuantity: number;
  trackInventory: boolean;
  hasVariants: boolean;
  images?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  branchId: string;
  branchName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
  reorderPoint: number;
  averageCost: number;
  lastMovementDate?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  warehouseId: string;
  warehouseName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  quantity: number;
  unitCost?: number;
  referenceType: string;
  referenceId: string;
  referenceNumber?: string;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// ============================================
// Branch & Warehouse Types
// ============================================

export interface Branch {
  id: string;
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  managerId?: string;
  managerName?: string;
  isActive: boolean;
  isMain: boolean;
  timezone?: string;
  currency?: string;
  taxId?: string;
  warehouses?: Warehouse[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  type: 'STORAGE' | 'PRODUCTION' | 'COLD_STORAGE' | 'QUARANTINE';
  isActive: boolean;
  address?: string;
  capacity?: number;
  managerName?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Customer & Supplier Types
// ============================================

export interface Customer {
  id: string;
  customerNumber: string;
  name: string;
  type: 'INDIVIDUAL' | 'COMPANY';
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  creditLimit: number;
  currentBalance: number;
  paymentTerms: number;
  isActive: boolean;
  assignedTo?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  supplierNumber: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  city?: string;
  country?: string;
  taxId?: string;
  paymentTerms: number;
  leadTime?: number;
  isActive: boolean;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Finance Types
// ============================================

export interface TreasuryAccount {
  id: string;
  name: string;
  code: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'INCOME' | 'EXPENSE';
  balance: number;
  currency: string;
  isActive: boolean;
  parentId?: string;
  level: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  iban?: string;
  swiftCode?: string;
  branchName?: string;
  branchId: string;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CashBox {
  id: string;
  name: string;
  code: string;
  branchId: string;
  branchName: string;
  currentBalance: number;
  currency: string;
  isActive: boolean;
  responsibleUserId?: string;
  responsibleUserName?: string;
  lastTransactionDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  reference?: string;
  totalDebit: number;
  totalCredit: number;
  isPosted: boolean;
  postedAt?: string;
  postedBy?: string;
  lines: JournalEntryLine[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntryLine {
  id: string;
  accountId: string;
  accountName: string;
  accountCode: string;
  description?: string;
  debit: number;
  credit: number;
  costCenterId?: string;
  costCenterName?: string;
}

// ============================================
// HR Types
// ============================================

export interface Employee {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hireDate: string;
  departmentId: string;
  departmentName: string;
  jobTitle: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  baseSalary: number;
  currency: string;
  branchId: string;
  branchName: string;
  managerId?: string;
  managerName?: string;
  status: 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Settings Types
// ============================================

export interface CompanySettings {
  companyName: string;
  legalName?: string;
  taxId?: string;
  registrationNumber?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  logo?: string;
  defaultCurrency: string;
  defaultLanguage: string;
  dateFormat: string;
  numberFormat: string;
  fiscalYearStart: string;
  timezone: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'ar';
  dateFormat: string;
  sidebarCollapsed: boolean;
  notifications: NotificationPreferences;
}

// ============================================
// Report Types
// ============================================

export interface ReportFilter {
  startDate: string;
  endDate: string;
  branchId?: string;
  warehouseId?: string;
  productId?: string;
  customerId?: string;
  categoryId?: string;
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface ReportSummary {
  totalCount: number;
  totalAmount: number;
  totalTax: number;
  totalDiscount: number;
  averageAmount: number;
  periodComparison?: {
    countChange: number;
    amountChange: number;
    countChangePercent: number;
    amountChangePercent: number;
  };
}

// ============================================
// Generic Form Types
// ============================================

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'multiselect' | 'date' | 'datetime' | 'textarea' | 'checkbox' | 'switch' | 'file' | 'currency';
  required?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  placeholder?: string;
  helperText?: string;
  options?: SelectOption[];
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    email?: boolean;
    url?: boolean;
  };
}

export interface FormSection {
  title: string;
  description?: string;
  fields: FormField[];
  columns?: 1 | 2 | 3;
}