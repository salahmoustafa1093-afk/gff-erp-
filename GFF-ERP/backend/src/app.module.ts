import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

// Configuration
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import swaggerConfig from './config/swagger.config';

// Database
import { DatabaseModule } from './database/database.module';

// Guards
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

// Modules - Core
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

// Modules - Organization
import { BranchesModule } from './modules/branches/branches.module';

// Modules - Inventory
import { WarehousesModule } from './modules/warehouses/warehouses.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { StockMovementsModule } from './modules/stock-movements/stock-movements.module';
import { ProductsModule } from './modules/products/products.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { UnitsModule } from './modules/units/units.module';

// Modules - Sales
import { SalesModule } from './modules/sales/sales.module';
import { SalesReturnsModule } from './modules/sales-returns/sales-returns.module';
import { CustomersModule } from './modules/customers/customers.module';

// Modules - Purchasing
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { PurchasesModule } from './modules/purchases/purchases.module';
import { PurchaseReturnsModule } from './modules/purchase-returns/purchase-returns.module';

// Modules - Treasury
import { TreasuryModule } from './modules/treasury/treasury.module';
import { BanksModule } from './modules/banks/banks.module';
import { CashboxesModule } from './modules/cashboxes/cashboxes.module';

// Modules - Accounting
import { AccountingModule } from './modules/accounting/accounting.module';
import { ChartOfAccountsModule } from './modules/chart-of-accounts/chart-of-accounts.module';
import { JournalEntriesModule } from './modules/journal-entries/journal-entries.module';
import { GeneralLedgerModule } from './modules/general-ledger/general-ledger.module';
import { CostCentersModule } from './modules/cost-centers/cost-centers.module';
import { AssetsModule } from './modules/assets/assets.module';

// Modules - HR
import { HrModule } from './modules/hr/hr.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PayrollModule } from './modules/payroll/payroll.module';

// Modules - CRM
import { CrmModule } from './modules/crm/crm.module';
import { LeadsModule } from './modules/leads/leads.module';
import { ActivitiesModule } from './modules/activities/activities.module';

// Modules - Logistics
import { LogisticsModule } from './modules/logistics/logistics.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { TripsModule } from './modules/trips/trips.module';

// Modules - Production
import { ProductionModule } from './modules/production/production.module';
import { FeedFormulationModule } from './modules/feed-formulation/feed-formulation.module';
import { ManufacturingModule } from './modules/manufacturing/manufacturing.module';

// Modules - Poultry
import { PoultryModule } from './modules/poultry/poultry.module';
import { ChicksModule } from './modules/chicks/chicks.module';
import { EggsModule } from './modules/eggs/eggs.module';

// Modules - Reports
import { ReportsModule } from './modules/reports/reports.module';
import { DashboardsModule } from './modules/dashboards/dashboards.module';

// Modules - Mobile
import { MobileApiModule } from './modules/mobile-api/mobile-api.module';

function createWinston transports(): winston.transport[] {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.colorize({ all: true }),
        winston.format.printf(
          (info: winston.Logform.TransformableInfo) => {
            const { timestamp, level, message, context, ...meta } = info;
            const contextStr = context ? ` [${context}]` : '';
            const metaStr =
              Object.keys(meta).length > 0
                ? ` \n${JSON.stringify(meta, null, 2)}`
                : '';
            return `${timestamp}${contextStr} ${level}: ${message}${metaStr}`;
          },
        ),
      ),
    }),
  ];

  // Add file transports in non-test environments
  if (process.env.NODE_ENV !== 'test') {
    transports.push(
      new DailyRotateFile({
        filename: 'logs/application-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      }),
    );
  }

  return transports;
}

@Module({
  imports: [
    // Configuration Module
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [appConfig, databaseConfig, jwtConfig, swaggerConfig],
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
        '.env.local',
        '.env',
      ],
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),

    // Winston Logging
    WinstonModule.forRoot({
      level: process.env.LOG_LEVEL || 'info',
      defaultMeta: {
        service: 'gff-erp-api',
        environment: process.env.NODE_ENV || 'development',
      },
      transports: createWinstonTransports(),
      exitOnError: false,
    }),

    // Database
    DatabaseModule,

    // Core Modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuditModule,
    NotificationsModule,

    // Organization
    BranchesModule,

    // Inventory
    WarehousesModule,
    InventoryModule,
    StockMovementsModule,
    ProductsModule,
    CategoriesModule,
    BrandsModule,
    UnitsModule,

    // Sales & Customers
    SalesModule,
    SalesReturnsModule,
    CustomersModule,

    // Purchasing & Suppliers
    SuppliersModule,
    PurchasesModule,
    PurchaseReturnsModule,

    // Treasury
    TreasuryModule,
    BanksModule,
    CashboxesModule,

    // Accounting
    AccountingModule,
    ChartOfAccountsModule,
    JournalEntriesModule,
    GeneralLedgerModule,
    CostCentersModule,
    AssetsModule,

    // HR
    HrModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule,

    // CRM
    CrmModule,
    LeadsModule,
    ActivitiesModule,

    // Logistics
    LogisticsModule,
    VehiclesModule,
    DriversModule,
    TripsModule,

    // Production
    ProductionModule,
    FeedFormulationModule,
    ManufacturingModule,

    // Poultry
    PoultryModule,
    ChicksModule,
    EggsModule,

    // Reports
    ReportsModule,
    DashboardsModule,

    // Mobile API
    MobileApiModule,
  ],
  providers: [
    // Global JWT Auth Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Global Roles Guard (runs after JWT)
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    // Global Permissions Guard (runs after Roles)
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule implements NestModule {
  // Configure middleware if needed
  configure(consumer: MiddlewareConsumer): void {
    // Middleware can be applied here
    // consumer.apply(AuditMiddleware).forRoutes('*');
  }
}
