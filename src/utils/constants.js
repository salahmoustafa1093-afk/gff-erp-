// ============================================
// GFF ERP Enterprise - Application Constants
// ============================================
// ============================================
// API Configuration
// ============================================
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
export const API_VERSION = 'v1';
export const API_TIMEOUT = 30000;
// ============================================
// Pagination
// ============================================
export const DEFAULT_PAGE = 0;
export const DEFAULT_PAGE_SIZE = 25;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];
// ============================================
// Date & Time Formats
// ============================================
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATE_TIME_FORMAT = 'yyyy-MM-dd HH:mm';
export const TIME_FORMAT = 'HH:mm';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_DATE_TIME_FORMAT = 'MMM dd, yyyy HH:mm';
export const DISPLAY_SHORT_DATE = 'MMM dd';
// ============================================
// Currency
// ============================================
export const DEFAULT_CURRENCY = 'USD';
export const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '\u20AC',
    GBP: '\u00A3',
    SAR: '\u0631.\u0633',
    AED: '\u062F.\u0625',
    EGP: '\u062C.\u0645',
    JOD: '\u062F.\u0623',
    IQD: '\u062F.\u0639',
    TRY: '\u20BA',
    QAR: '\u0631.\u0642',
    KWD: '\u062F.\u0643',
    BHD: '\u062F.\u0628',
    OMR: '\u0631.\u0639',
};
// ============================================
// Status Constants
// ============================================
// Sales Order Status
export const SALE_STATUS = {
    DRAFT: 'DRAFT',
    CONFIRMED: 'CONFIRMED',
    SHIPPED: 'SHIPPED',
    DELIVERED: 'DELIVERED',
    INVOICED: 'INVOICED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
};
export const SALE_STATUS_OPTIONS = [
    { value: SALE_STATUS.DRAFT, label: 'Draft' },
    { value: SALE_STATUS.CONFIRMED, label: 'Confirmed' },
    { value: SALE_STATUS.SHIPPED, label: 'Shipped' },
    { value: SALE_STATUS.DELIVERED, label: 'Delivered' },
    { value: SALE_STATUS.INVOICED, label: 'Invoiced' },
    { value: SALE_STATUS.PAID, label: 'Paid' },
    { value: SALE_STATUS.CANCELLED, label: 'Cancelled' },
    { value: SALE_STATUS.RETURNED, label: 'Returned' },
];
// Purchase Order Status
export const PURCHASE_STATUS = {
    DRAFT: 'DRAFT',
    SENT: 'SENT',
    ACKNOWLEDGED: 'ACKNOWLEDGED',
    PARTIAL: 'PARTIAL',
    RECEIVED: 'RECEIVED',
    CANCELLED: 'CANCELLED',
    RETURNED: 'RETURNED',
};
export const PURCHASE_STATUS_OPTIONS = [
    { value: PURCHASE_STATUS.DRAFT, label: 'Draft' },
    { value: PURCHASE_STATUS.SENT, label: 'Sent' },
    { value: PURCHASE_STATUS.ACKNOWLEDGED, label: 'Acknowledged' },
    { value: PURCHASE_STATUS.PARTIAL, label: 'Partial' },
    { value: PURCHASE_STATUS.RECEIVED, label: 'Received' },
    { value: PURCHASE_STATUS.CANCELLED, label: 'Cancelled' },
    { value: PURCHASE_STATUS.RETURNED, label: 'Returned' },
];
// Payment Status
export const PAYMENT_STATUS = {
    PENDING: 'PENDING',
    PARTIAL: 'PARTIAL',
    PAID: 'PAID',
    OVERDUE: 'OVERDUE',
    REFUNDED: 'REFUNDED',
};
export const PAYMENT_STATUS_OPTIONS = [
    { value: PAYMENT_STATUS.PENDING, label: 'Pending' },
    { value: PAYMENT_STATUS.PARTIAL, label: 'Partial' },
    { value: PAYMENT_STATUS.PAID, label: 'Paid' },
    { value: PAYMENT_STATUS.OVERDUE, label: 'Overdue' },
    { value: PAYMENT_STATUS.REFUNDED, label: 'Refunded' },
];
// Inventory Status
export const INVENTORY_STATUS = {
    IN_STOCK: 'IN_STOCK',
    LOW_STOCK: 'LOW_STOCK',
    OUT_OF_STOCK: 'OUT_OF_STOCK',
    DISCONTINUED: 'DISCONTINUED',
};
// Product Types
export const PRODUCT_TYPES = {
    RAW_MATERIAL: 'RAW_MATERIAL',
    FINISHED_GOOD: 'FINISHED_GOOD',
    PACKAGING: 'PACKAGING',
    EQUIPMENT: 'EQUIPMENT',
    OTHER: 'OTHER',
};
export const PRODUCT_TYPE_OPTIONS = [
    { value: PRODUCT_TYPES.RAW_MATERIAL, label: 'Raw Material' },
    { value: PRODUCT_TYPES.FINISHED_GOOD, label: 'Finished Good' },
    { value: PRODUCT_TYPES.PACKAGING, label: 'Packaging' },
    { value: PRODUCT_TYPES.EQUIPMENT, label: 'Equipment' },
    { value: PRODUCT_TYPES.OTHER, label: 'Other' },
];
// General Status
export const GENERAL_STATUS = {
    ACTIVE: 'ACTIVE',
    INACTIVE: 'INACTIVE',
    SUSPENDED: 'SUSPENDED',
    ARCHIVED: 'ARCHIVED',
};
export const GENERAL_STATUS_OPTIONS = [
    { value: GENERAL_STATUS.ACTIVE, label: 'Active' },
    { value: GENERAL_STATUS.INACTIVE, label: 'Inactive' },
    { value: GENERAL_STATUS.SUSPENDED, label: 'Suspended' },
    { value: GENERAL_STATUS.ARCHIVED, label: 'Archived' },
];
// ============================================
// Color Mappings
// ============================================
export const STATUS_COLORS = {
    // Sales
    DRAFT: '#9E9E9E',
    CONFIRMED: '#0288D1',
    SHIPPED: '#7B1FA2',
    DELIVERED: '#2E7D32',
    INVOICED: '#ED6C02',
    PAID: '#2E7D32',
    CANCELLED: '#D32F2F',
    RETURNED: '#D32F2F',
    // Purchase
    SENT: '#0288D1',
    ACKNOWLEDGED: '#7B1FA2',
    RECEIVED: '#2E7D32',
    // Payment
    PENDING: '#ED6C02',
    PARTIAL: '#F9A825',
    OVERDUE: '#D32F2F',
    REFUNDED: '#9E9E9E',
    // Inventory
    IN_STOCK: '#2E7D32',
    LOW_STOCK: '#ED6C02',
    OUT_OF_STOCK: '#D32F2F',
    DISCONTINUED: '#9E9E9E',
    // General
    ACTIVE: '#2E7D32',
    INACTIVE: '#9E9E9E',
    SUSPENDED: '#F9A825',
    ARCHIVED: '#0288D1',
};
export const CHART_COLORS = [
    '#2E7D32',
    '#F9A825',
    '#0288D1',
    '#ED6C02',
    '#D32F2F',
    '#7B1FA2',
    '#5C6BC0',
    '#26A69A',
    '#EC407A',
    '#AB47BC',
    '#42A5F5',
    '#FFA726',
];
export const menuGroups = [
    {
        id: 'dashboard',
        label: 'Dashboard',
        icon: 'Dashboard',
        items: [{ label: 'Dashboard', path: '/dashboard', icon: 'Dashboard' }],
    },
    {
        id: 'sales',
        label: 'Sales',
        icon: 'ShoppingCart',
        items: [
            { label: 'Sales Orders', path: '/sales/orders', icon: 'ShoppingCart', requiredPermissions: ['sales:read'] },
            { label: 'Invoices', path: '/sales/invoices', icon: 'Receipt', requiredPermissions: ['invoices:read'] },
            { label: 'Returns', path: '/sales/returns', icon: 'AssignmentReturn', requiredPermissions: ['returns:read'] },
            { label: 'Customers', path: '/customers', icon: 'People', requiredPermissions: ['customers:read'] },
            { label: 'Price Lists', path: '/sales/prices', icon: 'ListAlt', requiredPermissions: ['prices:read'] },
        ],
    },
    {
        id: 'procurement',
        label: 'Procurement',
        icon: 'Store',
        items: [
            { label: 'Purchase Orders', path: '/purchases/orders', icon: 'Store', requiredPermissions: ['purchases:read'] },
            { label: 'GRN', path: '/purchases/grn', icon: 'Inventory', requiredPermissions: ['grn:read'] },
            { label: 'Returns', path: '/purchases/returns', icon: 'AssignmentReturn', requiredPermissions: ['purchase_returns:read'] },
            { label: 'Suppliers', path: '/suppliers', icon: 'Business', requiredPermissions: ['suppliers:read'] },
        ],
    },
    {
        id: 'inventory',
        label: 'Inventory',
        icon: 'Inventory',
        items: [
            { label: 'Products', path: '/products', icon: 'Inventory', requiredPermissions: ['products:read'] },
            { label: 'Categories', path: '/inventory/categories', icon: 'Category', requiredPermissions: ['categories:read'] },
            { label: 'Brands', path: '/inventory/brands', icon: 'Label', requiredPermissions: ['brands:read'] },
            { label: 'Stock Levels', path: '/inventory/stock', icon: 'BarChart', requiredPermissions: ['stock:read'] },
            { label: 'Movements', path: '/inventory/movements', icon: 'SwapHoriz', requiredPermissions: ['movements:read'] },
            { label: 'Transfers', path: '/inventory/transfers', icon: 'LocalShipping', requiredPermissions: ['transfers:read'] },
            { label: 'Adjustments', path: '/inventory/adjustments', icon: 'Tune', requiredPermissions: ['adjustments:read'] },
            { label: 'Physical Counts', path: '/inventory/counts', icon: 'FormatListNumbered', requiredPermissions: ['counts:read'] },
        ],
    },
    {
        id: 'warehouses',
        label: 'Warehouses & Branches',
        icon: 'Warehouse',
        items: [
            { label: 'Warehouses', path: '/warehouses', icon: 'Warehouse', requiredPermissions: ['warehouses:read'] },
            { label: 'Branches', path: '/branches', icon: 'Business', requiredPermissions: ['branches:read'] },
        ],
    },
    {
        id: 'finance',
        label: 'Finance',
        icon: 'AccountBalanceWallet',
        items: [
            { label: 'Treasury', path: '/treasury', icon: 'AccountBalanceWallet', requiredPermissions: ['treasury:read'] },
            { label: 'Banks', path: '/banks', icon: 'AccountBalance', requiredPermissions: ['banks:read'] },
            { label: 'Cash Boxes', path: '/cashboxes', icon: 'LocalAtm', requiredPermissions: ['cashboxes:read'] },
            { label: 'Chart of Accounts', path: '/accounting/chart', icon: 'Book', requiredPermissions: ['accounts:read'] },
            { label: 'Journal Entries', path: '/accounting/journals', icon: 'MenuBook', requiredPermissions: ['journals:read'] },
            { label: 'General Ledger', path: '/accounting/ledger', icon: 'LibraryBooks', requiredPermissions: ['ledger:read'] },
        ],
    },
    {
        id: 'hr',
        label: 'Human Resources',
        icon: 'Badge',
        items: [
            { label: 'Employees', path: '/hr/employees', icon: 'Badge', requiredPermissions: ['employees:read'] },
            { label: 'Attendance', path: '/hr/attendance', icon: 'EventAvailable', requiredPermissions: ['attendance:read'] },
            { label: 'Payroll', path: '/hr/payroll', icon: 'Payments', requiredPermissions: ['payroll:read'] },
            { label: 'Leave', path: '/hr/leave', icon: 'BeachAccess', requiredPermissions: ['leave:read'] },
        ],
    },
    {
        id: 'crm',
        label: 'CRM',
        icon: 'Group',
        items: [
            { label: 'Leads', path: '/crm/leads', icon: 'Group', requiredPermissions: ['leads:read'] },
            { label: 'Activities', path: '/crm/activities', icon: 'EventNote', requiredPermissions: ['activities:read'] },
        ],
    },
    {
        id: 'logistics',
        label: 'Logistics',
        icon: 'LocalShipping',
        items: [
            { label: 'Vehicles', path: '/logistics/vehicles', icon: 'LocalShipping', requiredPermissions: ['vehicles:read'] },
            { label: 'Drivers', path: '/logistics/drivers', icon: 'Person', requiredPermissions: ['drivers:read'] },
            { label: 'Trips', path: '/logistics/trips', icon: 'Route', requiredPermissions: ['trips:read'] },
            { label: 'Fuel', path: '/logistics/fuel', icon: 'LocalGasStation', requiredPermissions: ['fuel:read'] },
            { label: 'Maintenance', path: '/logistics/maintenance', icon: 'Build', requiredPermissions: ['maintenance:read'] },
        ],
    },
    {
        id: 'production',
        label: 'Production',
        icon: 'PrecisionManufacturing',
        items: [
            { label: 'Manufacturing Orders', path: '/production/orders', icon: 'PrecisionManufacturing', requiredPermissions: ['production:read'] },
            { label: 'Feed Formulation', path: '/feed-formulation', icon: 'Grain', requiredPermissions: ['feed:read'] },
            { label: 'Quality Control', path: '/production/quality', icon: 'Verified', requiredPermissions: ['quality:read'] },
        ],
    },
    {
        id: 'poultry',
        label: 'Poultry',
        icon: 'Egg',
        items: [
            { label: 'Chicks Batches', path: '/chicks', icon: 'BabyChangingStation', requiredPermissions: ['chicks:read'] },
            { label: 'Egg Production', path: '/eggs', icon: 'Egg', requiredPermissions: ['eggs:read'] },
            { label: 'Mortality', path: '/poultry/mortality', icon: 'Warning', requiredPermissions: ['mortality:read'] },
            { label: 'Flock Management', path: '/poultry/flocks', icon: 'Groups', requiredPermissions: ['flocks:read'] },
        ],
    },
    {
        id: 'reports',
        label: 'Reports',
        icon: 'InsertChart',
        items: [
            { label: 'Sales Reports', path: '/reports/sales', icon: 'InsertChart', requiredPermissions: ['reports:read'] },
            { label: 'Inventory Reports', path: '/reports/inventory', icon: 'BarChart', requiredPermissions: ['reports:read'] },
            { label: 'Financial Reports', path: '/reports/financial', icon: 'ShowChart', requiredPermissions: ['reports:read'] },
            { label: 'Production Reports', path: '/reports/production', icon: 'Timeline', requiredPermissions: ['reports:read'] },
            { label: 'HR Reports', path: '/reports/hr', icon: 'Assessment', requiredPermissions: ['reports:read'] },
            { label: 'Custom Reports', path: '/reports/custom', icon: 'DashboardCustomize', requiredPermissions: ['reports:read'] },
        ],
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: 'Settings',
        items: [{ label: 'Settings', path: '/settings', icon: 'Settings', requiredRoles: ['ADMIN', 'SUPER_ADMIN'] }],
    },
];
// ============================================
// Permissions
// ============================================
export const PERMISSIONS = {
    // Sales
    SALES_CREATE: 'sales:create',
    SALES_READ: 'sales:read',
    SALES_UPDATE: 'sales:update',
    SALES_DELETE: 'sales:delete',
    // Purchase
    PURCHASES_CREATE: 'purchases:create',
    PURCHASES_READ: 'purchases:read',
    PURCHASES_UPDATE: 'purchases:update',
    PURCHASES_DELETE: 'purchases:delete',
    // Products
    PRODUCTS_CREATE: 'products:create',
    PRODUCTS_READ: 'products:read',
    PRODUCTS_UPDATE: 'products:update',
    PRODUCTS_DELETE: 'products:delete',
    // Inventory
    STOCK_READ: 'stock:read',
    STOCK_UPDATE: 'stock:update',
    // Finance
    ACCOUNTS_READ: 'accounts:read',
    JOURNALS_CREATE: 'journals:create',
    JOURNALS_READ: 'journals:read',
    // HR
    EMPLOYEES_CREATE: 'employees:create',
    EMPLOYEES_READ: 'employees:read',
    EMPLOYEES_UPDATE: 'employees:update',
    // Reports
    REPORTS_READ: 'reports:read',
    REPORTS_EXPORT: 'reports:export',
    // Admin
    ADMIN_ACCESS: 'admin:access',
    SETTINGS_MANAGE: 'settings:manage',
};
// ============================================
// Roles
// ============================================
export const ROLES = {
    SUPER_ADMIN: 'SUPER_ADMIN',
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    ACCOUNTANT: 'ACCOUNTANT',
    SALES_REP: 'SALES_REP',
    PURCHASE_OFFICER: 'PURCHASE_OFFICER',
    INVENTORY_OFFICER: 'INVENTORY_OFFICER',
    HR_MANAGER: 'HR_MANAGER',
    DRIVER: 'DRIVER',
    VIEWER: 'VIEWER',
};
export const ROLE_OPTIONS = [
    { value: ROLES.SUPER_ADMIN, label: 'Super Admin' },
    { value: ROLES.ADMIN, label: 'Admin' },
    { value: ROLES.MANAGER, label: 'Manager' },
    { value: ROLES.ACCOUNTANT, label: 'Accountant' },
    { value: ROLES.SALES_REP, label: 'Sales Representative' },
    { value: ROLES.PURCHASE_OFFICER, label: 'Purchase Officer' },
    { value: ROLES.INVENTORY_OFFICER, label: 'Inventory Officer' },
    { value: ROLES.HR_MANAGER, label: 'HR Manager' },
    { value: ROLES.DRIVER, label: 'Driver' },
    { value: ROLES.VIEWER, label: 'Viewer' },
];
// ============================================
// Local Storage Keys
// ============================================
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    CURRENT_BRANCH: 'current_branch',
    THEME: 'theme',
    LANGUAGE: 'language',
    SIDEBAR_COLLAPSED: 'sidebar_collapsed',
    RECENT_PAGES: 'recent_pages',
    USER_PREFERENCES: 'user_preferences',
};
// ============================================
// Validation Rules
// ============================================
export const VALIDATION = {
    EMAIL_REGEX: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
    PHONE_REGEX: /^[+]?[\d\s-]{8,}$/,
    URL_REGEX: /^https?:\/\/.+/,
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    SKU_MAX_LENGTH: 50,
    BARCODE_MAX_LENGTH: 50,
    NOTES_MAX_LENGTH: 2000,
};
// ============================================
// Units of Measure
// ============================================
export const UOM_OPTIONS = [
    { value: 'KG', label: 'Kilogram (kg)' },
    { value: 'G', label: 'Gram (g)' },
    { value: 'TON', label: 'Ton' },
    { value: 'L', label: 'Liter (L)' },
    { value: 'ML', label: 'Milliliter (ml)' },
    { value: 'UNIT', label: 'Unit' },
    { value: 'PCS', label: 'Pieces' },
    { value: 'BOX', label: 'Box' },
    { value: 'CARTON', label: 'Carton' },
    { value: 'BAG', label: 'Bag' },
    { value: 'PALLET', label: 'Pallet' },
    { value: 'METER', label: 'Meter' },
    { value: 'CM', label: 'Centimeter' },
    { value: 'TRAY', label: 'Tray' },
    { value: 'DOZEN', label: 'Dozen' },
];
// ============================================
// Number Formatting
// ============================================
export const NUMBER_FORMATS = {
    DECIMAL_PLACES: 2,
    CURRENCY_DECIMALS: 2,
    QUANTITY_DECIMALS: 3,
    PERCENTAGE_DECIMALS: 1,
};
// ============================================
// Export File Types
// ============================================
export const EXPORT_FORMATS = ['csv', 'xlsx', 'pdf'];
