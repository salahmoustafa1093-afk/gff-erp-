import { lazy } from 'react';
// Core Pages
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
// Sales Module
const SalesOrdersPage = lazy(() => import('@/pages/sales/SalesOrdersPage'));
const SalesOrderForm = lazy(() => import('@/pages/sales/SalesOrderForm'));
const SalesOrderDetail = lazy(() => import('@/pages/sales/SalesOrderDetail'));
const SalesInvoicesPage = lazy(() => import('@/pages/sales/SalesInvoicesPage'));
const SalesReturnsPage = lazy(() => import('@/pages/sales/SalesReturnsPage'));
const SalesReportsPage = lazy(() => import('@/pages/sales/SalesReportsPage'));
// Customers Module
const CustomersPage = lazy(() => import('@/pages/customers/CustomersPage'));
const CustomerForm = lazy(() => import('@/pages/customers/CustomerForm'));
const CustomerDetail = lazy(() => import('@/pages/customers/CustomerDetail'));
const CustomerStatementPage = lazy(() => import('@/pages/customers/CustomerStatementPage'));
// Purchases Module
const PurchaseOrdersPage = lazy(() => import('@/pages/purchases/PurchaseOrdersPage'));
const PurchaseOrderForm = lazy(() => import('@/pages/purchases/PurchaseOrderForm'));
const PurchaseOrderDetail = lazy(() => import('@/pages/purchases/PurchaseOrderDetail'));
const PurchaseInvoicesPage = lazy(() => import('@/pages/purchases/PurchaseInvoicesPage'));
const PurchaseReturnsPage = lazy(() => import('@/pages/purchases/PurchaseReturnsPage'));
// Suppliers Module
const SuppliersPage = lazy(() => import('@/pages/suppliers/SuppliersPage'));
const SupplierForm = lazy(() => import('@/pages/suppliers/SupplierForm'));
const SupplierDetail = lazy(() => import('@/pages/suppliers/SupplierDetail'));
const SupplierStatementPage = lazy(() => import('@/pages/suppliers/SupplierStatementPage'));
// Inventory Module
const InventoryPage = lazy(() => import('@/pages/inventory/InventoryPage'));
const InventoryMovementsPage = lazy(() => import('@/pages/inventory/InventoryMovementsPage'));
const StockTransferPage = lazy(() => import('@/pages/inventory/StockTransferPage'));
const InventoryAdjustmentPage = lazy(() => import('@/pages/inventory/InventoryAdjustmentPage'));
const PhysicalCountPage = lazy(() => import('@/pages/inventory/PhysicalCountPage'));
// Products Module
const ProductsPage = lazy(() => import('@/pages/products/ProductsPage'));
const ProductForm = lazy(() => import('@/pages/products/ProductForm'));
const ProductDetail = lazy(() => import('@/pages/products/ProductDetail'));
// Warehouses Module
const WarehousesPage = lazy(() => import('@/pages/warehouses/WarehousesPage'));
const WarehouseDetail = lazy(() => import('@/pages/warehouses/WarehouseDetail'));
// Branches Module
const BranchesPage = lazy(() => import('@/pages/branches/BranchesPage'));
// Treasury Module
const TreasuryPage = lazy(() => import('@/pages/treasury/TreasuryPage'));
const TreasuryTransfersPage = lazy(() => import('@/pages/treasury/TreasuryTransfersPage'));
// Banks Module
const BanksPage = lazy(() => import('@/pages/banks/BanksPage'));
const BankForm = lazy(() => import('@/pages/banks/BankForm'));
const BankTransactionsPage = lazy(() => import('@/pages/banks/BankTransactionsPage'));
const BankReconciliationPage = lazy(() => import('@/pages/banks/BankReconciliationPage'));
// Cashboxes Module
const CashboxesPage = lazy(() => import('@/pages/cashboxes/CashboxesPage'));
const CashboxDetail = lazy(() => import('@/pages/cashboxes/CashboxDetail'));
// Accounting Module
const ChartOfAccountsPage = lazy(() => import('@/pages/accounting/ChartOfAccountsPage'));
const ChartOfAccountsForm = lazy(() => import('@/pages/accounting/ChartOfAccountsForm'));
const JournalEntriesPage = lazy(() => import('@/pages/accounting/JournalEntriesPage'));
const JournalEntryForm = lazy(() => import('@/pages/accounting/JournalEntryForm'));
const JournalEntryDetail = lazy(() => import('@/pages/accounting/JournalEntryDetail'));
const GeneralLedgerPage = lazy(() => import('@/pages/accounting/GeneralLedgerPage'));
const TrialBalancePage = lazy(() => import('@/pages/accounting/TrialBalancePage'));
const BalanceSheetPage = lazy(() => import('@/pages/accounting/BalanceSheetPage'));
const IncomeStatementPage = lazy(() => import('@/pages/accounting/IncomeStatementPage'));
const CashFlowPage = lazy(() => import('@/pages/accounting/CashFlowPage'));
// Reports Module
const ReportsDashboardPage = lazy(() => import('@/pages/reports/ReportsDashboardPage'));
const SalesReportsPage = lazy(() => import('@/pages/reports/SalesReportsPage'));
const InventoryReportsPage = lazy(() => import('@/pages/reports/InventoryReportsPage'));
const FinancialReportsPage = lazy(() => import('@/pages/reports/FinancialReportsPage'));
// HR Module
const HRDashboardPage = lazy(() => import('@/pages/hr/HRDashboardPage'));
// Employees Module
const EmployeesPage = lazy(() => import('@/pages/employees/EmployeesPage'));
const EmployeeForm = lazy(() => import('@/pages/employees/EmployeeForm'));
const EmployeeDetail = lazy(() => import('@/pages/employees/EmployeeDetail'));
// Attendance Module
const AttendancePage = lazy(() => import('@/pages/attendance/AttendancePage'));
const AttendanceCalendar = lazy(() => import('@/pages/attendance/AttendanceCalendar'));
const AttendanceReportsPage = lazy(() => import('@/pages/attendance/AttendanceReportsPage'));
// Payroll Module
const PayrollPeriodsPage = lazy(() => import('@/pages/payroll/PayrollPeriodsPage'));
const PayrollProcessingPage = lazy(() => import('@/pages/payroll/PayrollProcessingPage'));
const PayslipViewer = lazy(() => import('@/pages/payroll/PayslipViewer'));
const PayrollReportsPage = lazy(() => import('@/pages/payroll/PayrollReportsPage'));
// CRM Module
const CRMPage = lazy(() => import('@/pages/crm/CRMPage'));
const LeadsPage = lazy(() => import('@/pages/crm/LeadsPage'));
const LeadForm = lazy(() => import('@/pages/crm/LeadForm'));
const LeadDetail = lazy(() => import('@/pages/crm/LeadDetail'));
const ActivitiesPage = lazy(() => import('@/pages/crm/ActivitiesPage'));
// Logistics Module
const LogisticsDashboardPage = lazy(() => import('@/pages/logistics/LogisticsDashboardPage'));
const VehiclesPage = lazy(() => import('@/pages/logistics/VehiclesPage'));
const VehicleForm = lazy(() => import('@/pages/logistics/VehicleForm'));
const VehicleDetail = lazy(() => import('@/pages/logistics/VehicleDetail'));
const DriversPage = lazy(() => import('@/pages/logistics/DriversPage'));
const DriverDetail = lazy(() => import('@/pages/logistics/DriverDetail'));
const TripsPage = lazy(() => import('@/pages/logistics/TripsPage'));
const TripForm = lazy(() => import('@/pages/logistics/TripForm'));
const TripDetail = lazy(() => import('@/pages/logistics/TripDetail'));
const FuelLogsPage = lazy(() => import('@/pages/logistics/FuelLogsPage'));
const MaintenancePage = lazy(() => import('@/pages/logistics/MaintenancePage'));
// Production Module
const ProductionDashboardPage = lazy(() => import('@/pages/production/ProductionDashboardPage'));
const ProductionPlansPage = lazy(() => import('@/pages/production/ProductionPlansPage'));
// Feed Formulation Module
const FeedFormulasPage = lazy(() => import('@/pages/feed-formulation/FeedFormulasPage'));
const FeedFormulaForm = lazy(() => import('@/pages/feed-formulation/FeedFormulaForm'));
const FeedFormulaDetail = lazy(() => import('@/pages/feed-formulation/FeedFormulaDetail'));
const FormulaComparisonPage = lazy(() => import('@/pages/feed-formulation/FormulaComparisonPage'));
// Manufacturing Module
const ManufacturingOrdersPage = lazy(() => import('@/pages/manufacturing/ManufacturingOrdersPage'));
const ManufacturingOrderForm = lazy(() => import('@/pages/manufacturing/ManufacturingOrderForm'));
const ManufacturingOrderDetail = lazy(() => import('@/pages/manufacturing/ManufacturingOrderDetail'));
const QualityControlForm = lazy(() => import('@/pages/manufacturing/QualityControlForm'));
const YieldReportPage = lazy(() => import('@/pages/manufacturing/YieldReportPage'));
// Poultry Module
const PoultryDashboardPage = lazy(() => import('@/pages/poultry/PoultryDashboardPage'));
const ChicksBatchesPage = lazy(() => import('@/pages/poultry/ChicksBatchesPage'));
const ChicksBatchForm = lazy(() => import('@/pages/poultry/ChicksBatchForm'));
const ChicksBatchDetail = lazy(() => import('@/pages/poultry/ChicksBatchDetail'));
const MortalityRecordForm = lazy(() => import('@/pages/poultry/MortalityRecordForm'));
const MortalityReportPage = lazy(() => import('@/pages/poultry/MortalityReportPage'));
// Chicks Module
const ChicksDistributionPage = lazy(() => import('@/pages/chicks/ChicksDistributionPage'));
const ChicksSalesReportPage = lazy(() => import('@/pages/chicks/ChicksSalesReportPage'));
// Eggs Module
const EggProductionPage = lazy(() => import('@/pages/eggs/EggProductionPage'));
const EggProductionReportPage = lazy(() => import('@/pages/eggs/EggProductionReportPage'));
const EggInventoryPage = lazy(() => import('@/pages/eggs/EggInventoryPage'));
const EggTransferPage = lazy(() => import('@/pages/eggs/EggTransferPage'));
const EggSalesReportPage = lazy(() => import('@/pages/eggs/EggSalesReportPage'));
export const routeConfig = [
    // Auth Routes
    {
        path: '/login',
        element: />,,
        title: 'Login',
    },
    {
        path: '/forgot-password',
        element: />,,
        title: 'Forgot Password',
    },
    // Dashboard
    {
        path: '/dashboard',
        element: />,,
        title: 'Dashboard',
        icon: 'Dashboard',
        isMenuItem: true,
        menuGroup: 'main',
    },
    // Sales Routes
    {
        path: '/sales',
        element: />,,
        title: 'Sales',
        icon: 'ShoppingCart',
        requiredPermissions: ['sales:read'],
        isMenuItem: true,
        menuGroup: 'sales',
    },
    {
        path: '/sales/orders',
        element: />,,
        title: 'Sales Orders',
        icon: 'ShoppingCart',
        requiredPermissions: ['sales:read'],
        isMenuItem: true,
        menuGroup: 'sales',
    },
    {
        path: '/sales/orders/new',
        element: />,,
        title: 'New Sales Order',
        requiredPermissions: ['sales:create'],
        isMenuItem: false,
    },
    {
        path: '/sales/orders/:id',
        element: />,,
        title: 'Sales Order Detail',
        requiredPermissions: ['sales:read'],
        isMenuItem: false,
    },
    {
        path: '/sales/orders/:id/edit',
        element: />,,
        title: 'Edit Sales Order',
        requiredPermissions: ['sales:update'],
        isMenuItem: false,
    },
    {
        path: '/sales/invoices',
        element: />,,
        title: 'Invoices',
        icon: 'Receipt',
        requiredPermissions: ['sales:read'],
        isMenuItem: true,
        menuGroup: 'sales',
    },
    {
        path: '/sales/returns',
        element: />,,
        title: 'Returns',
        icon: 'AssignmentReturn',
        requiredPermissions: ['sales:read'],
        isMenuItem: true,
        menuGroup: 'sales',
    },
    {
        path: '/sales/reports',
        element: />,,
        title: 'Sales Reports',
        icon: 'Assessment',
        requiredPermissions: ['reports:read'],
        isMenuItem: true,
        menuGroup: 'sales',
    },
    // Purchase Routes
    {
        path: '/purchases',
        element: />,,
        title: 'Purchases',
        icon: 'Store',
        requiredPermissions: ['purchases:read'],
        isMenuItem: true,
        menuGroup: 'procurement',
    },
    {
        path: '/purchases/orders',
        element: />,,
        title: 'Purchase Orders',
        icon: 'Store',
        requiredPermissions: ['purchases:read'],
        isMenuItem: true,
        menuGroup: 'procurement',
    },
    {
        path: '/purchases/orders/new',
        element: />,,
        title: 'New Purchase Order',
        requiredPermissions: ['purchases:create'],
        isMenuItem: false,
    },
    {
        path: '/purchases/orders/:id',
        element: />,,
        title: 'Purchase Order Detail',
        requiredPermissions: ['purchases:read'],
        isMenuItem: false,
    },
    {
        path: '/purchases/invoices',
        element: />,,
        title: 'Purchase Invoices',
        icon: 'Receipt',
        requiredPermissions: ['purchases:read'],
        isMenuItem: true,
        menuGroup: 'procurement',
    },
    {
        path: '/purchases/returns',
        element: />,,
        title: 'Purchase Returns',
        icon: 'AssignmentReturn',
        requiredPermissions: ['purchases:read'],
        isMenuItem: true,
        menuGroup: 'procurement',
    },
    // Customer Routes
    {
        path: '/customers',
        element: />,,
        title: 'Customers',
        icon: 'People',
        requiredPermissions: ['customers:read'],
        isMenuItem: true,
        menuGroup: 'customers',
    },
    {
        path: '/customers/new',
        element: />,,
        title: 'New Customer',
        requiredPermissions: ['customers:create'],
        isMenuItem: false,
    },
    {
        path: '/customers/:id',
        element: />,,
        title: 'Customer Detail',
        requiredPermissions: ['customers:read'],
        isMenuItem: false,
    },
    {
        path: '/customers/:id/edit',
        element: />,,
        title: 'Edit Customer',
        requiredPermissions: ['customers:update'],
        isMenuItem: false,
    },
    {
        path: '/customers/:id/statement',
        element: />,,
        title: 'Customer Statement',
        requiredPermissions: ['customers:read'],
        isMenuItem: false,
    },
    // Supplier Routes
    {
        path: '/suppliers',
        element: />,,
        title: 'Suppliers',
        icon: 'Business',
        requiredPermissions: ['suppliers:read'],
        isMenuItem: true,
        menuGroup: 'suppliers',
    },
    {
        path: '/suppliers/new',
        element: />,,
        title: 'New Supplier',
        requiredPermissions: ['suppliers:create'],
        isMenuItem: false,
    },
    {
        path: '/suppliers/:id',
        element: />,,
        title: 'Supplier Detail',
        requiredPermissions: ['suppliers:read'],
        isMenuItem: false,
    },
    {
        path: '/suppliers/:id/edit',
        element: />,,
        title: 'Edit Supplier',
        requiredPermissions: ['suppliers:update'],
        isMenuItem: false,
    },
    {
        path: '/suppliers/:id/statement',
        element: />,,
        title: 'Supplier Statement',
        requiredPermissions: ['suppliers:read'],
        isMenuItem: false,
    },
    // Inventory Routes
    {
        path: '/inventory',
        element: />,,
        title: 'Inventory',
        icon: 'Inventory',
        requiredPermissions: ['stock:read'],
        isMenuItem: true,
        menuGroup: 'inventory',
    },
    {
        path: '/inventory/movements',
        element: />,,
        title: 'Movements',
        icon: 'SwapHoriz',
        requiredPermissions: ['stock:read'],
        isMenuItem: true,
        menuGroup: 'inventory',
    },
    {
        path: '/inventory/transfers',
        element: />,,
        title: 'Transfers',
        icon: 'LocalShipping',
        requiredPermissions: ['transfers:read'],
        isMenuItem: true,
        menuGroup: 'inventory',
    },
    {
        path: '/inventory/adjustments',
        element: />,,
        title: 'Adjustments',
        icon: 'Tune',
        requiredPermissions: ['adjustments:read'],
        isMenuItem: true,
        menuGroup: 'inventory',
    },
    {
        path: '/inventory/counts',
        element: />,,
        title: 'Physical Counts',
        icon: 'FormatListNumbered',
        requiredPermissions: ['counts:read'],
        isMenuItem: true,
        menuGroup: 'inventory',
    },
    // Product Routes
    {
        path: '/products',
        element: />,,
        title: 'Products',
        icon: 'Inventory',
        requiredPermissions: ['products:read'],
        isMenuItem: true,
        menuGroup: 'products',
    },
    {
        path: '/products/new',
        element: />,,
        title: 'New Product',
        requiredPermissions: ['products:create'],
        isMenuItem: false,
    },
    {
        path: '/products/:id',
        element: />,,
        title: 'Product Detail',
        requiredPermissions: ['products:read'],
        isMenuItem: false,
    },
    {
        path: '/products/:id/edit',
        element: />,,
        title: 'Edit Product',
        requiredPermissions: ['products:update'],
        isMenuItem: false,
    },
    // Warehouse Routes
    {
        path: '/warehouses',
        element: />,,
        title: 'Warehouses',
        icon: 'Warehouse',
        requiredPermissions: ['warehouses:read'],
        isMenuItem: true,
        menuGroup: 'warehouses',
    },
    {
        path: '/warehouses/:id',
        element: />,,
        title: 'Warehouse Detail',
        requiredPermissions: ['warehouses:read'],
        isMenuItem: false,
    },
    // Branch Routes
    {
        path: '/branches',
        element: />,,
        title: 'Branches',
        icon: 'Business',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
        isMenuItem: true,
        menuGroup: 'branches',
    },
    // Treasury Routes
    {
        path: '/treasury',
        element: />,,
        title: 'Treasury',
        icon: 'AccountBalanceWallet',
        requiredPermissions: ['treasury:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/treasury/transfers',
        element: />,,
        title: 'Transfers',
        icon: 'SwapHoriz',
        requiredPermissions: ['treasury:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    // Bank Routes
    {
        path: '/banks',
        element: />,,
        title: 'Banks',
        icon: 'AccountBalance',
        requiredPermissions: ['banks:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/banks/new',
        element: />,,
        title: 'New Bank',
        requiredPermissions: ['banks:create'],
        isMenuItem: false,
    },
    {
        path: '/banks/:id',
        element: />,,
        title: 'Bank Transactions',
        requiredPermissions: ['banks:read'],
        isMenuItem: false,
    },
    {
        path: '/banks/:id/edit',
        element: />,,
        title: 'Edit Bank',
        requiredPermissions: ['banks:update'],
        isMenuItem: false,
    },
    {
        path: '/banks/:id/reconciliation',
        element: />,,
        title: 'Bank Reconciliation',
        requiredPermissions: ['banks:read'],
        isMenuItem: false,
    },
    // Cashbox Routes
    {
        path: '/cashboxes',
        element: />,,
        title: 'Cash Boxes',
        icon: 'LocalAtm',
        requiredPermissions: ['cashboxes:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/cashboxes/:id',
        element: />,,
        title: 'Cash Box Detail',
        requiredPermissions: ['cashboxes:read'],
        isMenuItem: false,
    },
    // Accounting Routes
    {
        path: '/accounting/chart',
        element: />,,
        title: 'Chart of Accounts',
        icon: 'Book',
        requiredPermissions: ['accounts:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/accounting/chart/new',
        element: />,,
        title: 'New Account',
        requiredPermissions: ['accounts:create'],
        isMenuItem: false,
    },
    {
        path: '/accounting/chart/:id/edit',
        element: />,,
        title: 'Edit Account',
        requiredPermissions: ['accounts:update'],
        isMenuItem: false,
    },
    {
        path: '/accounting/journals',
        element: />,,
        title: 'Journal Entries',
        icon: 'MenuBook',
        requiredPermissions: ['journals:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/accounting/journals/new',
        element: />,,
        title: 'New Journal Entry',
        requiredPermissions: ['journals:create'],
        isMenuItem: false,
    },
    {
        path: '/accounting/journals/:id',
        element: />,,
        title: 'Journal Entry Detail',
        requiredPermissions: ['journals:read'],
        isMenuItem: false,
    },
    {
        path: '/accounting/ledger',
        element: />,,
        title: 'General Ledger',
        icon: 'LibraryBooks',
        requiredPermissions: ['ledger:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/accounting/trial-balance',
        element: />,,
        title: 'Trial Balance',
        icon: 'Balance',
        requiredPermissions: ['ledger:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/accounting/balance-sheet',
        element: />,,
        title: 'Balance Sheet',
        icon: 'AccountBalance',
        requiredPermissions: ['ledger:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/accounting/income-statement',
        element: />,,
        title: 'Income Statement',
        icon: 'TrendingUp',
        requiredPermissions: ['ledger:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    {
        path: '/accounting/cash-flow',
        element: />,,
        title: 'Cash Flow',
        icon: 'AccountBalanceWallet',
        requiredPermissions: ['ledger:read'],
        isMenuItem: true,
        menuGroup: 'finance',
    },
    // Reports Routes
    {
        path: '/reports',
        element: />,,
        title: 'Reports',
        icon: 'InsertChart',
        requiredPermissions: ['reports:read'],
        isMenuItem: true,
        menuGroup: 'reports',
    },
    {
        path: '/reports/sales',
        element: />,,
        title: 'Sales Reports',
        icon: 'Assessment',
        requiredPermissions: ['reports:read'],
        isMenuItem: true,
        menuGroup: 'reports',
    },
    {
        path: '/reports/inventory',
        element: />,,
        title: 'Inventory Reports',
        icon: 'BarChart',
        requiredPermissions: ['reports:read'],
        isMenuItem: true,
        menuGroup: 'reports',
    },
    {
        path: '/reports/financial',
        element: />,,
        title: 'Financial Reports',
        icon: 'ShowChart',
        requiredPermissions: ['reports:read'],
        isMenuItem: true,
        menuGroup: 'reports',
    },
    // HR Routes
    {
        path: '/hr',
        element: />,,
        title: 'Human Resources',
        icon: 'Badge',
        requiredPermissions: ['employees:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    {
        path: '/hr/employees',
        element: />,,
        title: 'Employees',
        icon: 'Badge',
        requiredPermissions: ['employees:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    {
        path: '/hr/employees/new',
        element: />,,
        title: 'New Employee',
        requiredPermissions: ['employees:create'],
        isMenuItem: false,
    },
    {
        path: '/hr/employees/:id',
        element: />,,
        title: 'Employee Detail',
        requiredPermissions: ['employees:read'],
        isMenuItem: false,
    },
    {
        path: '/hr/employees/:id/edit',
        element: />,,
        title: 'Edit Employee',
        requiredPermissions: ['employees:update'],
        isMenuItem: false,
    },
    {
        path: '/hr/attendance',
        element: />,,
        title: 'Attendance',
        icon: 'EventAvailable',
        requiredPermissions: ['attendance:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    {
        path: '/hr/attendance/calendar',
        element: />,,
        title: 'Attendance Calendar',
        requiredPermissions: ['attendance:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    {
        path: '/hr/attendance/reports',
        element: />,,
        title: 'Attendance Reports',
        requiredPermissions: ['attendance:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    {
        path: '/hr/payroll',
        element: />,,
        title: 'Payroll',
        icon: 'Payments',
        requiredPermissions: ['payroll:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    {
        path: '/hr/payroll/:id/process',
        element: />,,
        title: 'Process Payroll',
        requiredPermissions: ['payroll:update'],
        isMenuItem: false,
    },
    {
        path: '/hr/payroll/:id/payslip/:employeeId',
        element: />,,
        title: 'Payslip',
        requiredPermissions: ['payroll:read'],
        isMenuItem: false,
    },
    {
        path: '/hr/payroll/reports',
        element: />,,
        title: 'Payroll Reports',
        requiredPermissions: ['payroll:read'],
        isMenuItem: true,
        menuGroup: 'hr',
    },
    // CRM Routes
    {
        path: '/crm',
        element: />,,
        title: 'CRM',
        icon: 'Group',
        requiredPermissions: ['leads:read'],
        isMenuItem: true,
        menuGroup: 'crm',
    },
    {
        path: '/crm/leads',
        element: />,,
        title: 'Leads',
        icon: 'Group',
        requiredPermissions: ['leads:read'],
        isMenuItem: true,
        menuGroup: 'crm',
    },
    {
        path: '/crm/leads/new',
        element: />,,
        title: 'New Lead',
        requiredPermissions: ['leads:create'],
        isMenuItem: false,
    },
    {
        path: '/crm/leads/:id',
        element: />,,
        title: 'Lead Detail',
        requiredPermissions: ['leads:read'],
        isMenuItem: false,
    },
    {
        path: '/crm/leads/:id/edit',
        element: />,,
        title: 'Edit Lead',
        requiredPermissions: ['leads:update'],
        isMenuItem: false,
    },
    {
        path: '/crm/activities',
        element: />,,
        title: 'Activities',
        icon: 'EventNote',
        requiredPermissions: ['activities:read'],
        isMenuItem: true,
        menuGroup: 'crm',
    },
    // Logistics Routes
    {
        path: '/logistics',
        element: />,,
        title: 'Logistics',
        icon: 'LocalShipping',
        requiredPermissions: ['vehicles:read'],
        isMenuItem: true,
        menuGroup: 'logistics',
    },
    {
        path: '/logistics/vehicles',
        element: />,,
        title: 'Vehicles',
        icon: 'LocalShipping',
        requiredPermissions: ['vehicles:read'],
        isMenuItem: true,
        menuGroup: 'logistics',
    },
    {
        path: '/logistics/vehicles/new',
        element: />,,
        title: 'New Vehicle',
        requiredPermissions: ['vehicles:create'],
        isMenuItem: false,
    },
    {
        path: '/logistics/vehicles/:id',
        element: />,,
        title: 'Vehicle Detail',
        requiredPermissions: ['vehicles:read'],
        isMenuItem: false,
    },
    {
        path: '/logistics/vehicles/:id/edit',
        element: />,,
        title: 'Edit Vehicle',
        requiredPermissions: ['vehicles:update'],
        isMenuItem: false,
    },
    {
        path: '/logistics/drivers',
        element: />,,
        title: 'Drivers',
        icon: 'Person',
        requiredPermissions: ['drivers:read'],
        isMenuItem: true,
        menuGroup: 'logistics',
    },
    {
        path: '/logistics/drivers/:id',
        element: />,,
        title: 'Driver Detail',
        requiredPermissions: ['drivers:read'],
        isMenuItem: false,
    },
    {
        path: '/logistics/trips',
        element: />,,
        title: 'Trips',
        icon: 'Route',
        requiredPermissions: ['trips:read'],
        isMenuItem: true,
        menuGroup: 'logistics',
    },
    {
        path: '/logistics/trips/new',
        element: />,,
        title: 'New Trip',
        requiredPermissions: ['trips:create'],
        isMenuItem: false,
    },
    {
        path: '/logistics/trips/:id',
        element: />,,
        title: 'Trip Detail',
        requiredPermissions: ['trips:read'],
        isMenuItem: false,
    },
    {
        path: '/logistics/fuel',
        element: />,,
        title: 'Fuel',
        icon: 'LocalGasStation',
        requiredPermissions: ['vehicles:read'],
        isMenuItem: true,
        menuGroup: 'logistics',
    },
    {
        path: '/logistics/maintenance',
        element: />,,
        title: 'Maintenance',
        icon: 'Build',
        requiredPermissions: ['vehicles:read'],
        isMenuItem: true,
        menuGroup: 'logistics',
    },
    // Production Routes
    {
        path: '/production',
        element: />,,
        title: 'Production',
        icon: 'PrecisionManufacturing',
        requiredPermissions: ['production:read'],
        isMenuItem: true,
        menuGroup: 'production',
    },
    {
        path: '/production/plans',
        element: />,,
        title: 'Production Plans',
        requiredPermissions: ['production:read'],
        isMenuItem: true,
        menuGroup: 'production',
    },
    {
        path: '/production/orders',
        element: />,,
        title: 'Manufacturing Orders',
        icon: 'PrecisionManufacturing',
        requiredPermissions: ['production:read'],
        isMenuItem: true,
        menuGroup: 'production',
    },
    {
        path: '/production/orders/new',
        element: />,,
        title: 'New Manufacturing Order',
        requiredPermissions: ['production:create'],
        isMenuItem: false,
    },
    {
        path: '/production/orders/:id',
        element: />,,
        title: 'Manufacturing Order Detail',
        requiredPermissions: ['production:read'],
        isMenuItem: false,
    },
    {
        path: '/production/quality/:orderId',
        element: />,,
        title: 'Quality Control',
        requiredPermissions: ['production:update'],
        isMenuItem: false,
    },
    {
        path: '/production/yield-report',
        element: />,,
        title: 'Yield Report',
        requiredPermissions: ['production:read'],
        isMenuItem: true,
        menuGroup: 'production',
    },
    // Feed Formulation
    {
        path: '/feed-formulation',
        element: />,,
        title: 'Feed Formulation',
        icon: 'Grain',
        requiredPermissions: ['feed:read'],
        isMenuItem: true,
        menuGroup: 'production',
    },
    {
        path: '/feed-formulation/new',
        element: />,,
        title: 'New Formula',
        requiredPermissions: ['feed:create'],
        isMenuItem: false,
    },
    {
        path: '/feed-formulation/:id',
        element: />,,
        title: 'Formula Detail',
        requiredPermissions: ['feed:read'],
        isMenuItem: false,
    },
    {
        path: '/feed-formulation/:id/edit',
        element: />,,
        title: 'Edit Formula',
        requiredPermissions: ['feed:update'],
        isMenuItem: false,
    },
    {
        path: '/feed-formulation/compare',
        element: />,,
        title: 'Compare Formulas',
        requiredPermissions: ['feed:read'],
        isMenuItem: true,
        menuGroup: 'production',
    },
    // Poultry Routes
    {
        path: '/poultry',
        element: />,,
        title: 'Poultry',
        icon: 'EggAlt',
        requiredPermissions: ['chicks:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/poultry/batches',
        element: />,,
        title: 'Chicks Batches',
        icon: 'Chick',
        requiredPermissions: ['chicks:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/poultry/batches/new',
        element: />,,
        title: 'New Chicks Batch',
        requiredPermissions: ['chicks:create'],
        isMenuItem: false,
    },
    {
        path: '/poultry/batches/:id',
        element: />,,
        title: 'Chicks Batch Detail',
        requiredPermissions: ['chicks:read'],
        isMenuItem: false,
    },
    {
        path: '/poultry/batches/:id/mortality',
        element: />,,
        title: 'Record Mortality',
        requiredPermissions: ['chicks:update'],
        isMenuItem: false,
    },
    {
        path: '/poultry/mortality-report',
        element: />,,
        title: 'Mortality Report',
        requiredPermissions: ['chicks:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    // Chicks Routes
    {
        path: '/chicks/distribution',
        element: />,,
        title: 'Distribution',
        icon: 'LocalShipping',
        requiredPermissions: ['chicks:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/chicks/sales-report',
        element: />,,
        title: 'Chicks Sales Report',
        requiredPermissions: ['chicks:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    // Eggs Routes
    {
        path: '/eggs/production',
        element: />,,
        title: 'Egg Production',
        icon: 'Egg',
        requiredPermissions: ['eggs:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/eggs/production-report',
        element: />,,
        title: 'Production Report',
        requiredPermissions: ['eggs:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/eggs/inventory',
        element: />,,
        title: 'Egg Inventory',
        icon: 'Inventory',
        requiredPermissions: ['eggs:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/eggs/transfers',
        element: />,,
        title: 'Transfers',
        icon: 'SwapHoriz',
        requiredPermissions: ['eggs:update'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    {
        path: '/eggs/sales-report',
        element: />,,
        title: 'Egg Sales Report',
        requiredPermissions: ['eggs:read'],
        isMenuItem: true,
        menuGroup: 'poultry',
    },
    // Settings Route
    {
        path: '/settings/*',
        element: />,,
        title: 'Settings',
        icon: 'Settings',
        requiredRoles: ['ADMIN', 'SUPER_ADMIN'],
        isMenuItem: true,
        menuGroup: 'settings',
    },
    // 404 - Not Found
    {
        path: '*',
        element: />,,
        title: 'Page Not Found',
    },
];
export function getRouteObjects() {
    const convert = (routes) => {
        return routes.map((route) => {
            const routeObject = {
                path: route.path,
                element: route.requiredRoles || route.requiredPermissions
                    ? requiredRoles = { route, : .requiredRoles }
                    :
                ,
                requiredPermissions = { route, : .requiredPermissions }
                    >
                        { route, : .element }
                    < /ProtectedRoute>
            };
        });
    };
    route.element,
    ;
}
;
if (route.children) {
    routeObject.children = convert(route.children);
}
return routeObject;
;
;
return convert(routeConfig);
export function getMenuRoutes() {
    return routeConfig.filter((route) => route.isMenuItem);
}
export function getRouteTitle(path) {
    const route = routeConfig.find((r) => r.path === path || path.startsWith(r.path.replace('*', '')));
    return route?.title || 'GFF ERP';
}
export default routeConfig;
