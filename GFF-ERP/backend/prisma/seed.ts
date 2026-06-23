import { PrismaClient, Prisma } from '@prisma/client';
import * as bcryptjs from 'bcryptjs';

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function main(): Promise<void> {
  console.log('🌱 Starting database seed...');

  await seedCompanySettings();
  await seedBranches();
  await seedRolesAndPermissions();
  await seedAdminUser();
  await seedChartOfAccounts();
  await seedUnits();
  await seedLeaveTypes();
  await seedNumberSequences();

  console.log('✅ Database seed completed successfully');
}

async function seedCompanySettings(): Promise<void> {
  console.log('🏢 Seeding company settings...');

  const existing = await prisma.companySetting.findFirst();
  if (existing) {
    console.log('   Company settings already exist, skipping...');
    return;
  }

  await prisma.companySetting.create({
    data: {
      companyName: 'GFF - Global Feed & Farms',
      tradeName: 'GFF',
      taxId: 'TAX-123456789',
      commercialRegistration: 'CR-987654321',
      email: 'info@gff-erp.com',
      phone: '+20 100 000 0000',
      address: '123 Industrial Zone, 10th of Ramadan City, Egypt',
      city: '10th of Ramadan',
      country: 'Egypt',
      currency: 'EGP',
      currencySymbol: '£',
      fiscalYearStart: new Date(new Date().getFullYear(), 6, 1), // July 1st
      fiscalYearEnd: new Date(new Date().getFullYear() + 1, 5, 30), // June 30th
      defaultTaxRate: 14.0,
      logo: null,
      website: 'https://gff-erp.com',
      defaultLanguage: 'ar',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Africa/Cairo',
      lowStockAlertDays: 7,
      autoBackupEnabled: true,
      backupFrequency: 'DAILY',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('   ✓ Company settings created');
}

async function seedBranches(): Promise<void> {
  console.log('🏭 Seeding branches...');

  const existing = await prisma.branch.findFirst({
    where: { code: 'MAIN' },
  });
  if (existing) {
    console.log('   Main branch already exists, skipping...');
    return;
  }

  await prisma.branch.create({
    data: {
      code: 'MAIN',
      name: 'الفرع الرئيسي',
      nameEn: 'Main Branch',
      address: '123 Industrial Zone, 10th of Ramadan City',
      city: '10th of Ramadan',
      country: 'Egypt',
      phone: '+20 100 000 0000',
      email: 'main@gff-erp.com',
      isMain: true,
      isActive: true,
      managerName: null,
      latitude: null,
      longitude: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  });

  console.log('   ✓ Main branch created');
}

async function seedRolesAndPermissions(): Promise<void> {
  console.log('🔐 Seeding roles and permissions...');

  // Check if roles already exist
  const existingRoles = await prisma.role.findMany();
  if (existingRoles.length > 0) {
    console.log('   Roles already exist, skipping...');
    return;
  }

  // Define all roles
  const rolesData = [
    { code: 'SUPER_ADMIN', name: 'Super Administrator', nameEn: 'Super Administrator', level: 0, description: 'Full system access with all permissions' },
    { code: 'ADMIN', name: 'مدير النظام', nameEn: 'System Administrator', level: 1, description: 'System administration and configuration' },
    { code: 'MANAGER', name: 'مدير عام', nameEn: 'General Manager', level: 2, description: 'Overall management and oversight' },
    { code: 'ACCOUNTANT', name: 'محاسب', nameEn: 'Accountant', level: 3, description: 'Financial operations and reporting' },
    { code: 'SALES_REP', name: 'مندوب مبيعات', nameEn: 'Sales Representative', level: 4, description: 'Sales operations and customer management' },
    { code: 'PURCHASING_OFFICER', name: 'موظف مشتريات', nameEn: 'Purchasing Officer', level: 4, description: 'Procurement and supplier management' },
    { code: 'WAREHOUSE_MANAGER', name: 'مدير مخازن', nameEn: 'Warehouse Manager', level: 4, description: 'Inventory and warehouse operations' },
    { code: 'HR_MANAGER', name: 'مدير موارد بشرية', nameEn: 'HR Manager', level: 4, description: 'Human resources management' },
    { code: 'PRODUCTION_MANAGER', name: 'مدير إنتاج', nameEn: 'Production Manager', level: 4, description: 'Production and manufacturing management' },
    { code: 'LOGISTICS_MANAGER', name: 'مدير لوجستيات', nameEn: 'Logistics Manager', level: 4, description: 'Logistics and transportation management' },
    { code: 'DRIVER', name: 'سائق', nameEn: 'Driver', level: 5, description: 'Vehicle and delivery operations' },
    { code: 'CASHIER', name: 'أمين صندوق', nameEn: 'Cashier', level: 5, description: 'Cash handling and point of sale' },
    { code: 'VIEWER', name: 'مشاهد', nameEn: 'Viewer', level: 6, description: 'Read-only access to reports and data' },
  ];

  // Create all roles
  for (const role of rolesData) {
    await prisma.role.create({
      data: {
        ...role,
        isSystem: true,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      },
    });
  }

  console.log(`   ✓ ${rolesData.length} roles created`);

  // Define all modules
  const modules = [
    'DASHBOARD',
    'USERS',
    'ROLES',
    'PERMISSIONS',
    'BRANCHES',
    'WAREHOUSES',
    'INVENTORY',
    'STOCK_MOVEMENTS',
    'PRODUCTS',
    'CATEGORIES',
    'BRANDS',
    'UNITS',
    'SALES',
    'SALES_RETURNS',
    'CUSTOMERS',
    'SUPPLIERS',
    'PURCHASES',
    'PURCHASE_RETURNS',
    'TREASURY',
    'BANKS',
    'CASHBOXES',
    'ACCOUNTING',
    'CHART_OF_ACCOUNTS',
    'JOURNAL_ENTRIES',
    'GENERAL_LEDGER',
    'COST_CENTERS',
    'ASSETS',
    'HR',
    'EMPLOYEES',
    'ATTENDANCE',
    'PAYROLL',
    'LEAVES',
    'CRM',
    'LEADS',
    'ACTIVITIES',
    'LOGISTICS',
    'VEHICLES',
    'DRIVERS',
    'TRIPS',
    'PRODUCTION',
    'FEED_FORMULATION',
    'MANUFACTURING',
    'POULTRY',
    'CHICKS',
    'EGGS',
    'REPORTS',
    'SETTINGS',
    'AUDIT_LOG',
    'NOTIFICATIONS',
  ];

  // Define permission actions
  const actions = ['CREATE', 'READ', 'UPDATE', 'DELETE', 'APPROVE', 'EXPORT', 'IMPORT'];

  // Create all permissions
  const permissions: Array<{ module: string; action: string; description: string }> = [];
  for (const module of modules) {
    for (const action of actions) {
      permissions.push({
        module,
        action,
        description: `${action} ${module.replace(/_/g, ' ')}`,
      });
    }
  }

  // Insert permissions in batches
  const batchSize = 50;
  for (let i = 0; i < permissions.length; i += batchSize) {
    const batch = permissions.slice(i, i + batchSize);
    await prisma.permission.createMany({
      data: batch.map(p => ({
        ...p,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
      skipDuplicates: true,
    });
  }

  console.log(`   ✓ ${permissions.length} permissions created`);

  // Assign all permissions to SUPER_ADMIN
  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });

  const allPermissions = await prisma.permission.findMany();

  if (superAdminRole) {
    const rolePermissionsData = allPermissions.map(permission => ({
      roleId: superAdminRole.id,
      permissionId: permission.id,
      createdAt: new Date(),
    }));

    for (let i = 0; i < rolePermissionsData.length; i += batchSize) {
      const batch = rolePermissionsData.slice(i, i + batchSize);
      await prisma.rolePermission.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    console.log(`   ✓ All ${allPermissions.length} permissions assigned to SUPER_ADMIN`);
  }

  // Assign appropriate permissions to ADMIN
  const adminRole = await prisma.role.findUnique({
    where: { code: 'ADMIN' },
  });

  if (adminRole) {
    const adminModules = [
      'DASHBOARD', 'USERS', 'ROLES', 'PERMISSIONS', 'BRANCHES', 'WAREHOUSES',
      'INVENTORY', 'STOCK_MOVEMENTS', 'PRODUCTS', 'CATEGORIES', 'BRANDS', 'UNITS',
      'SALES', 'SALES_RETURNS', 'CUSTOMERS', 'SUPPLIERS', 'PURCHASES', 'PURCHASE_RETURNS',
      'TREASURY', 'BANKS', 'CASHBOXES', 'ACCOUNTING', 'CHART_OF_ACCOUNTS',
      'JOURNAL_ENTRIES', 'GENERAL_LEDGER', 'COST_CENTERS', 'ASSETS',
      'HR', 'EMPLOYEES', 'ATTENDANCE', 'PAYROLL', 'LEAVES',
      'CRM', 'LEADS', 'ACTIVITIES',
      'LOGISTICS', 'VEHICLES', 'DRIVERS', 'TRIPS',
      'PRODUCTION', 'FEED_FORMULATION', 'MANUFACTURING',
      'POULTRY', 'CHICKS', 'EGGS',
      'REPORTS', 'SETTINGS', 'AUDIT_LOG', 'NOTIFICATIONS',
    ];

    const adminPermissions = allPermissions.filter(p =>
      adminModules.includes(p.module),
    );

    const adminRolePermissionsData = adminPermissions.map(permission => ({
      roleId: adminRole.id,
      permissionId: permission.id,
      createdAt: new Date(),
    }));

    for (let i = 0; i < adminRolePermissionsData.length; i += batchSize) {
      const batch = adminRolePermissionsData.slice(i, i + batchSize);
      await prisma.rolePermission.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    console.log(`   ✓ ${adminPermissions.length} permissions assigned to ADMIN`);
  }

  // Assign read-only permissions to VIEWER
  const viewerRole = await prisma.role.findUnique({
    where: { code: 'VIEWER' },
  });

  if (viewerRole) {
    const viewerPermissions = allPermissions.filter(p => p.action === 'READ');

    const viewerRolePermissionsData = viewerPermissions.map(permission => ({
      roleId: viewerRole.id,
      permissionId: permission.id,
      createdAt: new Date(),
    }));

    for (let i = 0; i < viewerRolePermissionsData.length; i += batchSize) {
      const batch = viewerRolePermissionsData.slice(i, i + batchSize);
      await prisma.rolePermission.createMany({
        data: batch,
        skipDuplicates: true,
      });
    }

    console.log(`   ✓ ${viewerPermissions.length} READ permissions assigned to VIEWER`);
  }

  // Assign module-specific permissions to other roles
  await assignRolePermissions('ACCOUNTANT', [
    'DASHBOARD', 'ACCOUNTING', 'CHART_OF_ACCOUNTS', 'JOURNAL_ENTRIES',
    'GENERAL_LEDGER', 'COST_CENTERS', 'ASSETS', 'TREASURY', 'BANKS',
    'CASHBOXES', 'REPORTS',
  ], allPermissions);

  await assignRolePermissions('SALES_REP', [
    'DASHBOARD', 'SALES', 'SALES_RETURNS', 'CUSTOMERS',
    'PRODUCTS', 'INVENTORY', 'REPORTS', 'CRM', 'LEADS', 'ACTIVITIES',
  ], allPermissions);

  await assignRolePermissions('PURCHASING_OFFICER', [
    'DASHBOARD', 'PURCHASES', 'PURCHASE_RETURNS', 'SUPPLIERS',
    'PRODUCTS', 'INVENTORY', 'REPORTS',
  ], allPermissions);

  await assignRolePermissions('WAREHOUSE_MANAGER', [
    'DASHBOARD', 'WAREHOUSES', 'INVENTORY', 'STOCK_MOVEMENTS',
    'PRODUCTS', 'CATEGORIES', 'UNITS', 'REPORTS',
  ], allPermissions);

  await assignRolePermissions('HR_MANAGER', [
    'DASHBOARD', 'HR', 'EMPLOYEES', 'ATTENDANCE', 'PAYROLL', 'LEAVES', 'REPORTS',
  ], allPermissions);

  await assignRolePermissions('PRODUCTION_MANAGER', [
    'DASHBOARD', 'PRODUCTION', 'FEED_FORMULATION', 'MANUFACTURING',
    'POULTRY', 'CHICKS', 'EGGS', 'INVENTORY', 'PRODUCTS', 'REPORTS',
  ], allPermissions);

  await assignRolePermissions('LOGISTICS_MANAGER', [
    'DASHBOARD', 'LOGISTICS', 'VEHICLES', 'DRIVERS', 'TRIPS',
    'CUSTOMERS', 'REPORTS',
  ], allPermissions);

  await assignRolePermissions('DRIVER', [
    'DASHBOARD', 'TRIPS', 'NOTIFICATIONS',
  ], allPermissions);

  await assignRolePermissions('CASHIER', [
    'DASHBOARD', 'TREASURY', 'CASHBOXES', 'SALES', 'CUSTOMERS', 'NOTIFICATIONS',
  ], allPermissions);

  await assignRolePermissions('MANAGER', [
    'DASHBOARD', 'REPORTS', 'USERS', 'SALES', 'PURCHASES',
    'INVENTORY', 'ACCOUNTING', 'HR', 'PRODUCTION',
    'LOGISTICS', 'CRM', 'NOTIFICATIONS',
  ], allPermissions);

  console.log('   ✓ All role-permission assignments completed');
}

async function assignRolePermissions(
  roleCode: string,
  moduleNames: string[],
  allPermissions: Array<{ id: number; module: string; action: string }>,
): Promise<void> {
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (!role) return;

  const filteredPermissions = allPermissions.filter(p =>
    moduleNames.includes(p.module),
  );

  const rolePermissionsData = filteredPermissions.map(permission => ({
    roleId: role.id,
    permissionId: permission.id,
    createdAt: new Date(),
  }));

  const batchSize = 50;
  for (let i = 0; i < rolePermissionsData.length; i += batchSize) {
    const batch = rolePermissionsData.slice(i, i + batchSize);
    await prisma.rolePermission.createMany({
      data: batch,
      skipDuplicates: true,
    });
  }

  console.log(`   ✓ ${filteredPermissions.length} permissions assigned to ${roleCode}`);
}

async function seedAdminUser(): Promise<void> {
  console.log('👤 Seeding admin user...');

  const existing = await prisma.user.findUnique({
    where: { email: 'admin@gff-erp.com' },
  });
  if (existing) {
    console.log('   Admin user already exists, skipping...');
    return;
  }

  const hashedPassword = await bcryptjs.hash('admin123', 12);

  const superAdminRole = await prisma.role.findUnique({
    where: { code: 'SUPER_ADMIN' },
  });

  const mainBranch = await prisma.branch.findUnique({
    where: { code: 'MAIN' },
  });

  if (!superAdminRole || !mainBranch) {
    throw new Error('Required role or branch not found for admin user');
  }

  await prisma.user.create({
    data: {
      email: 'admin@gff-erp.com',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+20 100 000 0000',
      avatar: null,
      isActive: true,
      emailVerified: true,
      roleId: superAdminRole.id,
      branchId: mainBranch.id,
      lastLoginAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
    },
  });

  console.log('   ✓ Admin user created (email: admin@gff-erp.com, password: admin123)');
}

async function seedChartOfAccounts(): Promise<void> {
  console.log('📊 Seeding chart of accounts...');

  const existing = await prisma.chartOfAccount.findFirst();
  if (existing) {
    console.log('   Chart of accounts already exists, skipping...');
    return;
  }

  const mainBranch = await prisma.branch.findUnique({
    where: { code: 'MAIN' },
  });

  if (!mainBranch) {
    throw new Error('Main branch not found for chart of accounts');
  }

  // Assets (1xxxx)
  const assetAccounts: Prisma.ChartOfAccountCreateManyInput[] = [
    { code: '10000', nameAr: 'الأصول', nameEn: 'Assets', type: 'ASSET', category: 'FIXED', level: 1, parentCode: null, isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11000', nameAr: 'الأصول المتداولة', nameEn: 'Current Assets', type: 'ASSET', category: 'CURRENT', level: 2, parentCode: '10000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11100', nameAr: 'النقدية', nameEn: 'Cash', type: 'ASSET', category: 'CURRENT', level: 3, parentCode: '11000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11101', nameAr: 'الصندوق', nameEn: 'Cash on Hand', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11102', nameAr: 'البنك', nameEn: 'Bank', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11200', nameAr: 'العملاء', nameEn: 'Accounts Receivable', type: 'ASSET', category: 'CURRENT', level: 3, parentCode: '11000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11201', nameAr: 'ذمم عملاء', nameEn: 'Customers Receivable', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11200', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11202', nameAr: 'شيكات تحت التحصيل', nameEn: 'Checks Under Collection', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11200', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11300', nameAr: 'المخزون', nameEn: 'Inventory', type: 'ASSET', category: 'CURRENT', level: 3, parentCode: '11000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11301', nameAr: 'مخزون خامات', nameEn: 'Raw Materials Inventory', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11302', nameAr: 'مخزون منتج تام', nameEn: 'Finished Goods Inventory', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11303', nameAr: 'مخزون تحت التصنيع', nameEn: 'Work in Process Inventory', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11304', nameAr: 'مخزون كتاكيت', nameEn: 'Chicks Inventory', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11305', nameAr: 'مخزون علف', nameEn: 'Feed Inventory', type: 'ASSET', category: 'CURRENT', level: 4, parentCode: '11300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11400', nameAr: 'مصروفات مدفوعة مقدماً', nameEn: 'Prepaid Expenses', type: 'ASSET', category: 'CURRENT', level: 3, parentCode: '11000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '11500', nameAr: 'مستحقات أخرى', nameEn: 'Other Receivables', type: 'ASSET', category: 'CURRENT', level: 3, parentCode: '11000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12000', nameAr: 'الأصول الثابتة', nameEn: 'Fixed Assets', type: 'ASSET', category: 'FIXED', level: 2, parentCode: '10000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12100', nameAr: 'أراضي', nameEn: 'Land', type: 'ASSET', category: 'FIXED', level: 3, parentCode: '12000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12200', nameAr: 'مباني', nameEn: 'Buildings', type: 'ASSET', category: 'FIXED', level: 3, parentCode: '12000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12201', nameAr: 'مجمع مباني', nameEn: 'Buildings Complex', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12200', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12202', nameAr: 'إهلاك مباني', nameEn: 'Buildings Depreciation', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12200', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12300', nameAr: 'معدات وآلات', nameEn: 'Machinery and Equipment', type: 'ASSET', category: 'FIXED', level: 3, parentCode: '12000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12301', nameAr: 'معدات إنتاج', nameEn: 'Production Equipment', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12302', nameAr: 'إهلاك معدات', nameEn: 'Equipment Depreciation', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12400', nameAr: 'سيارات ومركبات', nameEn: 'Vehicles', type: 'ASSET', category: 'FIXED', level: 3, parentCode: '12000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12401', nameAr: 'سيارات نقل', nameEn: 'Transport Vehicles', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12400', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12402', nameAr: 'إهلاك سيارات', nameEn: 'Vehicles Depreciation', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12400', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12500', nameAr: 'أثاث ومفروشات', nameEn: 'Furniture and Fixtures', type: 'ASSET', category: 'FIXED', level: 3, parentCode: '12000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12501', nameAr: 'أثاث مكتبي', nameEn: 'Office Furniture', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12500', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12502', nameAr: 'إهلاك أثاث', nameEn: 'Furniture Depreciation', type: 'ASSET', category: 'FIXED', level: 4, parentCode: '12500', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '12600', nameAr: 'أجهزة كمبيوتر وأجهزة إلكترونية', nameEn: 'Computers and Electronics', type: 'ASSET', category: 'FIXED', level: 3, parentCode: '12000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '13000', nameAr: 'مشاريع تحت التنفيذ', nameEn: 'Projects Under Construction', type: 'ASSET', category: 'FIXED', level: 2, parentCode: '10000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Liabilities (2xxxx)
  const liabilityAccounts: Prisma.ChartOfAccountCreateManyInput[] = [
    { code: '20000', nameAr: 'الالتزامات', nameEn: 'Liabilities', type: 'LIABILITY', category: 'FIXED', level: 1, parentCode: null, isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21000', nameAr: 'الالتزامات المتداولة', nameEn: 'Current Liabilities', type: 'LIABILITY', category: 'CURRENT', level: 2, parentCode: '20000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21100', nameAr: 'موردون', nameEn: 'Accounts Payable', type: 'LIABILITY', category: 'CURRENT', level: 3, parentCode: '21000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21101', nameAr: 'ذمم موردين', nameEn: 'Suppliers Payable', type: 'LIABILITY', category: 'CURRENT', level: 4, parentCode: '21100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21200', nameAr: 'قرض قصير الأجل', nameEn: 'Short-term Loans', type: 'LIABILITY', category: 'CURRENT', level: 3, parentCode: '21000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21300', nameAr: 'التزامات ضريبية', nameEn: 'Tax Liabilities', type: 'LIABILITY', category: 'CURRENT', level: 3, parentCode: '21000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21301', nameAr: 'ضريبة القيمة المضافة المستحقة', nameEn: 'VAT Payable', type: 'LIABILITY', category: 'CURRENT', level: 4, parentCode: '21300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21302', nameAr: 'ضريبة الاستقطاع المستحقة', nameEn: 'Withholding Tax Payable', type: 'LIABILITY', category: 'CURRENT', level: 4, parentCode: '21300', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21400', nameAr: 'مبالغ مستحقة للموظفين', nameEn: 'Employee Payables', type: 'LIABILITY', category: 'CURRENT', level: 3, parentCode: '21000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21401', nameAr: 'رواتب مستحقة', nameEn: 'Salaries Payable', type: 'LIABILITY', category: 'CURRENT', level: 4, parentCode: '21400', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21402', nameAr: 'تأمينات اجتماعية مستحقة', nameEn: 'Social Insurance Payable', type: 'LIABILITY', category: 'CURRENT', level: 4, parentCode: '21400', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '21500', nameAr: 'إيرادات مقدمة', nameEn: 'Unearned Revenue', type: 'LIABILITY', category: 'CURRENT', level: 3, parentCode: '21000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '22000', nameAr: 'الالتزامات طويلة الأجل', nameEn: 'Long-term Liabilities', type: 'LIABILITY', category: 'LONG_TERM', level: 2, parentCode: '20000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '22100', nameAr: 'قرض طويل الأجل', nameEn: 'Long-term Loans', type: 'LIABILITY', category: 'LONG_TERM', level: 3, parentCode: '22000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '22200', nameAr: 'التزامات تأجير', nameEn: 'Lease Liabilities', type: 'LIABILITY', category: 'LONG_TERM', level: 3, parentCode: '22000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Equity (3xxxx)
  const equityAccounts: Prisma.ChartOfAccountCreateManyInput[] = [
    { code: '30000', nameAr: 'حقوق الملكية', nameEn: 'Equity', type: 'EQUITY', category: 'CAPITAL', level: 1, parentCode: null, isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '31000', nameAr: 'رأس المال', nameEn: 'Capital', type: 'EQUITY', category: 'CAPITAL', level: 2, parentCode: '30000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '31100', nameAr: 'رأس المال المدفوع', nameEn: 'Paid-in Capital', type: 'EQUITY', category: 'CAPITAL', level: 3, parentCode: '31000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '32000', nameAr: 'الأرباح المحتجزة', nameEn: 'Retained Earnings', type: 'EQUITY', category: 'RETAINED', level: 2, parentCode: '30000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '32100', nameAr: 'أرباح العام الحالي', nameEn: 'Current Year Earnings', type: 'EQUITY', category: 'RETAINED', level: 3, parentCode: '32000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '32200', nameAr: 'أرباح السنوات السابقة', nameEn: 'Previous Years Earnings', type: 'EQUITY', category: 'RETAINED', level: 3, parentCode: '32000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '33000', nameAr: 'احتياطي قانوني', nameEn: 'Legal Reserve', type: 'EQUITY', category: 'RESERVE', level: 2, parentCode: '30000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '34000', nameAr: 'خزينة الأسهم', nameEn: 'Treasury Stock', type: 'EQUITY', category: 'TREASURY', level: 2, parentCode: '30000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Revenue (4xxxx)
  const revenueAccounts: Prisma.ChartOfAccountCreateManyInput[] = [
    { code: '40000', nameAr: 'الإيرادات', nameEn: 'Revenue', type: 'REVENUE', category: 'OPERATING', level: 1, parentCode: null, isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41000', nameAr: 'إيرادات المبيعات', nameEn: 'Sales Revenue', type: 'REVENUE', category: 'OPERATING', level: 2, parentCode: '40000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41100', nameAr: 'مبيعات الأعلاف', nameEn: 'Feed Sales', type: 'REVENUE', category: 'OPERATING', level: 3, parentCode: '41000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41101', nameAr: 'مبيعات علف دواجن', nameEn: 'Poultry Feed Sales', type: 'REVENUE', category: 'OPERATING', level: 4, parentCode: '41100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41102', nameAr: 'مبيعات علف ماشية', nameEn: 'Cattle Feed Sales', type: 'REVENUE', category: 'OPERATING', level: 4, parentCode: '41100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41103', nameAr: 'مبيعات علف أرانب', nameEn: 'Rabbit Feed Sales', type: 'REVENUE', category: 'OPERATING', level: 4, parentCode: '41100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41104', nameAr: 'مبيعات علف أسماك', nameEn: 'Fish Feed Sales', type: 'REVENUE', category: 'OPERATING', level: 4, parentCode: '41100', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41200', nameAr: 'مبيعات الكتاكيت', nameEn: 'Chicks Sales', type: 'REVENUE', category: 'OPERATING', level: 3, parentCode: '41000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41300', nameAr: 'مبيعات البيض', nameEn: 'Eggs Sales', type: 'REVENUE', category: 'OPERATING', level: 3, parentCode: '41000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '41400', nameAr: 'مبيعات دواجن', nameEn: 'Poultry Sales', type: 'REVENUE', category: 'OPERATING', level: 3, parentCode: '41000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '42000', nameAr: 'إيرادات الخدمات', nameEn: 'Service Revenue', type: 'REVENUE', category: 'OPERATING', level: 2, parentCode: '40000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '42100', nameAr: 'خدمات نقل', nameEn: 'Transportation Services', type: 'REVENUE', category: 'OPERATING', level: 3, parentCode: '42000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '42200', nameAr: 'خدمات استشارية', nameEn: 'Consulting Services', type: 'REVENUE', category: 'OPERATING', level: 3, parentCode: '42000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '43000', nameAr: 'إيرادات أخرى', nameEn: 'Other Revenue', type: 'REVENUE', category: 'OTHER', level: 2, parentCode: '40000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '43100', nameAr: 'إيرادات استثمارية', nameEn: 'Investment Income', type: 'REVENUE', category: 'OTHER', level: 3, parentCode: '43000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '43200', nameAr: 'أرباح عملة', nameEn: 'Foreign Exchange Gains', type: 'REVENUE', category: 'OTHER', level: 3, parentCode: '43000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '43300', nameAr: 'إيرادات متنوعة', nameEn: 'Miscellaneous Revenue', type: 'REVENUE', category: 'OTHER', level: 3, parentCode: '43000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '44000', nameAr: 'مردودات المبيعات', nameEn: 'Sales Returns', type: 'REVENUE', category: 'CONTRA', level: 2, parentCode: '40000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '44100', nameAr: 'خصومات المبيعات', nameEn: 'Sales Discounts', type: 'REVENUE', category: 'CONTRA', level: 2, parentCode: '40000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  // COGS (5xxxx)
  const cogsAccounts: Prisma.ChartOfAccountCreateManyInput[] = [
    { code: '50000', nameAr: 'تكلفة البضاعة المباعة', nameEn: 'Cost of Goods Sold', type: 'COGS', category: 'DIRECT', level: 1, parentCode: null, isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51000', nameAr: 'تكلفة مواد خام', nameEn: 'Raw Materials Cost', type: 'COGS', category: 'DIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51001', nameAr: 'قمح', nameEn: 'Wheat', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51002', nameAr: 'ذرة صفراء', nameEn: 'Yellow Corn', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51003', nameAr: 'صويا', nameEn: 'Soybeans', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51004', nameAr: 'كسبة قطن', nameEn: 'Cottonseed Meal', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51005', nameAr: 'ردة', nameEn: 'Bran', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51006', nameAr: 'إضافات علفية', nameEn: 'Feed Additives', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '51007', nameAr: 'فيتامينات وأملاح معدنية', nameEn: 'Vitamins and Minerals', type: 'COGS', category: 'DIRECT', level: 3, parentCode: '51000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '52000', nameAr: 'تكلفة كتاكيت', nameEn: 'Chicks Cost', type: 'COGS', category: 'DIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '52100', nameAr: 'تكلفة علف الدواجن', nameEn: 'Poultry Feed Cost', type: 'COGS', category: 'DIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '52200', nameAr: 'تكلفة أدوية ولقاحات', nameEn: 'Medicines and Vaccines Cost', type: 'COGS', category: 'DIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '52300', nameAr: 'تكلفة تغليف وتعبئة', nameEn: 'Packaging Cost', type: 'COGS', category: 'DIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '53000', nameAr: 'مصنعية مباشرة', nameEn: 'Direct Labor', type: 'COGS', category: 'DIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '54000', nameAr: 'مصاريف تشغيلية صناعية', nameEn: 'Manufacturing Overhead', type: 'COGS', category: 'INDIRECT', level: 2, parentCode: '50000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  // Expenses (6xxxx)
  const expenseAccounts: Prisma.ChartOfAccountCreateManyInput[] = [
    { code: '60000', nameAr: 'المصروفات', nameEn: 'Expenses', type: 'EXPENSE', category: 'OPERATING', level: 1, parentCode: null, isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '61000', nameAr: 'مصروفات بيع وتسويق', nameEn: 'Selling and Marketing Expenses', type: 'EXPENSE', category: 'OPERATING', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '61100', nameAr: 'رواتب ومكافآت البيع', nameEn: 'Sales Salaries and Bonuses', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '61000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '61200', nameAr: 'عمولات مبيعات', nameEn: 'Sales Commissions', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '61000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '61300', nameAr: 'إعلان وتسويق', nameEn: 'Advertising and Marketing', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '61000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '61400', nameAr: 'نقل وتوزيع', nameEn: 'Transportation and Distribution', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '61000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '61500', nameAr: 'مصروفات تعبئة وتغليف', nameEn: 'Packaging Expenses', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '61000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62000', nameAr: 'مصروفات إدارية وعمومية', nameEn: 'General and Administrative Expenses', type: 'EXPENSE', category: 'ADMIN', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62100', nameAr: 'رواتب إدارية', nameEn: 'Administrative Salaries', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62200', nameAr: 'إيجارات', nameEn: 'Rent', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62300', nameAr: 'كهرباء ومياه', nameEn: 'Utilities', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62400', nameAr: 'هاتف وإنترنت', nameEn: 'Telephone and Internet', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62500', nameAr: 'صيانة وقطع غيار', nameEn: 'Maintenance and Spare Parts', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62600', nameAr: 'طباعة وقرطاسية', nameEn: 'Printing and Stationery', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62700', nameAr: 'مصاريف قانونية واستشارية', nameEn: 'Legal and Consulting Fees', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '62800', nameAr: 'تأمينات', nameEn: 'Insurance', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '62000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '63000', nameAr: 'مصروفات مالية', nameEn: 'Financial Expenses', type: 'EXPENSE', category: 'FINANCIAL', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '63100', nameAr: 'فوائد بنكية', nameEn: 'Bank Interest', type: 'EXPENSE', category: 'FINANCIAL', level: 3, parentCode: '63000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '63200', nameAr: 'عمولات بنكية', nameEn: 'Bank Charges', type: 'EXPENSE', category: 'FINANCIAL', level: 3, parentCode: '63000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '63300', nameAr: 'خسائر عملة', nameEn: 'Foreign Exchange Losses', type: 'EXPENSE', category: 'FINANCIAL', level: 3, parentCode: '63000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '63400', nameAr: 'خصومات مسموح بها', nameEn: 'Discounts Allowed', type: 'EXPENSE', category: 'FINANCIAL', level: 3, parentCode: '63000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '64000', nameAr: 'مصروفات الاستهلاك', nameEn: 'Depreciation Expenses', type: 'EXPENSE', category: 'OPERATING', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '64100', nameAr: 'استهلاك مباني', nameEn: 'Buildings Depreciation', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '64000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '64200', nameAr: 'استهلاك معدات', nameEn: 'Equipment Depreciation', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '64000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '64300', nameAr: 'استهلاك سيارات', nameEn: 'Vehicles Depreciation', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '64000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '64400', nameAr: 'استهلاك أثاث', nameEn: 'Furniture Depreciation', type: 'EXPENSE', category: 'OPERATING', level: 3, parentCode: '64000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '65000', nameAr: 'مصروفات الموارد البشرية', nameEn: 'Human Resources Expenses', type: 'EXPENSE', category: 'ADMIN', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '65100', nameAr: 'تأمينات اجتماعية', nameEn: 'Social Insurance', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '65000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '65200', nameAr: 'تدريب وتطوير', nameEn: 'Training and Development', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '65000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '65300', nameAr: 'رعاية صحية', nameEn: 'Medical Care', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '65000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '65400', nameAr: 'بدلات وسفريات', nameEn: 'Allowances and Travel', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '65000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '66000', nameAr: 'مصروفات ضريبية', nameEn: 'Tax Expenses', type: 'EXPENSE', category: 'ADMIN', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '66100', nameAr: 'ضريبة دخل', nameEn: 'Income Tax', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '66000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '66200', nameAr: 'ضريبة أملاك', nameEn: 'Property Tax', type: 'EXPENSE', category: 'ADMIN', level: 3, parentCode: '66000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '67000', nameAr: 'مصروفات متنوعة', nameEn: 'Miscellaneous Expenses', type: 'EXPENSE', category: 'OTHER', level: 2, parentCode: '60000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '67100', nameAr: 'تبرعات', nameEn: 'Donations', type: 'EXPENSE', category: 'OTHER', level: 3, parentCode: '67000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: '67200', nameAr: 'غرامات وجزاءات', nameEn: 'Fines and Penalties', type: 'EXPENSE', category: 'OTHER', level: 3, parentCode: '67000', isActive: true, isSystem: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  const allAccounts = [
    ...assetAccounts,
    ...liabilityAccounts,
    ...equityAccounts,
    ...revenueAccounts,
    ...cogsAccounts,
    ...expenseAccounts,
  ];

  await prisma.chartOfAccount.createMany({
    data: allAccounts,
    skipDuplicates: true,
  });

  console.log(`   ✓ ${allAccounts.length} chart of accounts created`);
}

async function seedUnits(): Promise<void> {
  console.log('⚖️ Seeding units...');

  const existing = await prisma.unit.findFirst();
  if (existing) {
    console.log('   Units already exist, skipping...');
    return;
  }

  const mainBranch = await prisma.branch.findUnique({
    where: { code: 'MAIN' },
  });

  if (!mainBranch) {
    throw new Error('Main branch not found for units');
  }

  const unitsData: Prisma.UnitCreateManyInput[] = [
    { code: 'KG', name: 'كيلوجرام', nameEn: 'Kilogram', symbol: 'kg', conversionFactor: 1.0, isBaseUnit: true, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'TON', name: 'طن', nameEn: 'Ton', symbol: 'ton', conversionFactor: 1000.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'BAG', name: 'شكارة', nameEn: 'Bag', symbol: 'bag', conversionFactor: 50.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'BAG25', name: 'شكارة 25 كجم', nameEn: '25kg Bag', symbol: 'bag25', conversionFactor: 25.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'PIECE', name: 'قطعة', nameEn: 'Piece', symbol: 'pc', conversionFactor: 1.0, isBaseUnit: true, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'BOX', name: 'علبة', nameEn: 'Box', symbol: 'box', conversionFactor: 30.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'LITER', name: 'لتر', nameEn: 'Liter', symbol: 'L', conversionFactor: 1.0, isBaseUnit: true, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'METER', name: 'متر', nameEn: 'Meter', symbol: 'm', conversionFactor: 1.0, isBaseUnit: true, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'GRAM', name: 'جرام', nameEn: 'Gram', symbol: 'g', conversionFactor: 0.001, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'DOZEN', name: 'دزينة', nameEn: 'Dozen', symbol: 'dz', conversionFactor: 12.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'CARTON', name: 'كرتونة', nameEn: 'Carton', symbol: 'ctn', conversionFactor: 360.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { code: 'TRAY', name: 'طبق', nameEn: 'Tray', symbol: 'tray', conversionFactor: 30.0, isBaseUnit: false, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  await prisma.unit.createMany({
    data: unitsData,
    skipDuplicates: true,
  });

  console.log(`   ✓ ${unitsData.length} units created`);
}

async function seedLeaveTypes(): Promise<void> {
  console.log('🏖️ Seeding leave types...');

  const existing = await prisma.leaveType.findFirst();
  if (existing) {
    console.log('   Leave types already exist, skipping...');
    return;
  }

  const leaveTypesData: Prisma.LeaveTypeCreateManyInput[] = [
    { code: 'ANNUAL', name: 'إجازة سنوية', nameEn: 'Annual Leave', description: 'الإجازة السنوية المدفوعة', isPaid: true, defaultDays: 21, maxDays: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'SICK', name: 'إجازة مرضية', nameEn: 'Sick Leave', description: 'إجازة مرضية مع شهادة طبية', isPaid: true, defaultDays: 15, maxDays: 180, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'CASUAL', name: 'إجازة عارضة', nameEn: 'Casual Leave', description: 'إجازة عارضة قصيرة', isPaid: true, defaultDays: 6, maxDays: 10, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'UNPAID', name: 'إجازة بدون راتب', nameEn: 'Unpaid Leave', description: 'إجازة بدون راتب', isPaid: false, defaultDays: 30, maxDays: 90, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'MATERNITY', name: 'إجازة وضع', nameEn: 'Maternity Leave', description: 'إجازة الوضع للسيدات', isPaid: true, defaultDays: 90, maxDays: 120, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'PATERNITY', name: 'إجازة أبوة', nameEn: 'Paternity Leave', description: 'إجازة الأبوة للرجال', isPaid: true, defaultDays: 3, maxDays: 7, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'BEREAVEMENT', name: 'إجازة وفاة', nameEn: 'Bereavement Leave', description: 'إجازة في حالة وفاة أحد الأقارب', isPaid: true, defaultDays: 3, maxDays: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'HAJJ', name: 'إجازة حج', nameEn: 'Hajj Leave', description: 'إجازة الحج', isPaid: true, defaultDays: 21, maxDays: 30, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'UMRAH', name: 'إجازة عمرة', nameEn: 'Umrah Leave', description: 'إجازة العمرة', isPaid: false, defaultDays: 7, maxDays: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'EMERGENCY', name: 'إجازة طارئة', nameEn: 'Emergency Leave', description: 'إجازة للظروف الطارئة', isPaid: true, defaultDays: 3, maxDays: 5, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'TRAINING', name: 'إجازة تدريب', nameEn: 'Training Leave', description: 'إجازة للتدريب والتطوير', isPaid: true, defaultDays: 5, maxDays: 15, isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { code: 'MARRIAGE', name: 'إجازة زواج', nameEn: 'Marriage Leave', description: 'إجازة الزواج', isPaid: true, defaultDays: 5, maxDays: 7, isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ];

  await prisma.leaveType.createMany({
    data: leaveTypesData,
    skipDuplicates: true,
  });

  console.log(`   ✓ ${leaveTypesData.length} leave types created`);
}

async function seedNumberSequences(): Promise<void> {
  console.log('🔢 Seeding number sequences...');

  const existing = await prisma.numberSequence.findFirst();
  if (existing) {
    console.log('   Number sequences already exist, skipping...');
    return;
  }

  const mainBranch = await prisma.branch.findUnique({
    where: { code: 'MAIN' },
  });

  if (!mainBranch) {
    throw new Error('Main branch not found for number sequences');
  }

  const fiscalYear = `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

  const sequencesData: Prisma.NumberSequenceCreateManyInput[] = [
    { documentType: 'SALES_INVOICE', prefix: 'SI', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'SALES_RETURN', prefix: 'SR', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'PURCHASE_INVOICE', prefix: 'PI', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'PURCHASE_RETURN', prefix: 'PR', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'JOURNAL_ENTRY', prefix: 'JV', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'RECEIPT_VOUCHER', prefix: 'RV', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'PAYMENT_VOUCHER', prefix: 'PV', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'STOCK_TRANSFER', prefix: 'ST', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'STOCK_ADJUSTMENT', prefix: 'SA', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'PRODUCTION_ORDER', prefix: 'PO', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'FEED_FORMULA', prefix: 'FF', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'EMPLOYEE', prefix: 'EMP', suffix: '', currentNumber: 100, padding: 4, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'PAYROLL', prefix: 'PAY', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'TRIP', prefix: 'TR', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'CUSTOMER', prefix: 'CUST', suffix: '', currentNumber: 1000, padding: 5, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'SUPPLIER', prefix: 'SUP', suffix: '', currentNumber: 1000, padding: 5, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'FIXED_ASSET', prefix: 'FA', suffix: '', currentNumber: 100, padding: 4, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'DEPRECIATION', prefix: 'DEP', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'CHICKS_ORDER', prefix: 'CO', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
    { documentType: 'EGG_COLLECTION', prefix: 'EC', suffix: '', currentNumber: 1000, padding: 6, fiscalYear, isActive: true, branchId: mainBranch.id, createdAt: new Date(), updatedAt: new Date() },
  ];

  await prisma.numberSequence.createMany({
    data: sequencesData,
    skipDuplicates: true,
  });

  console.log(`   ✓ ${sequencesData.length} number sequences created`);
}

main()
  .catch(e => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
