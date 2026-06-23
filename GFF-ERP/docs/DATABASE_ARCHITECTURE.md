# GFF ERP Enterprise - Database Architecture Document

**Document Version:** 1.0  
**Date:** June 2025  
**Classification:** Technical Architecture - Database  
**Status:** Production Ready

---

## Table of Contents

1. [Database Overview](#1-database-overview)
2. [Prisma ORM Configuration](#2-prisma-orm-configuration)
3. [Entity Relationship Diagram](#3-entity-relationship-diagram)
4. [Schema Statistics](#4-schema-statistics)
5. [Module-by-Module Schema Breakdown](#5-module-by-module-schema-breakdown)
6. [Key Design Patterns](#6-key-design-patterns)
7. [Indexing Strategy](#7-indexing-strategy)
8. [Data Integrity Rules](#8-data-integrity-rules)
9. [Migration Strategy](#9-migration-strategy)
10. [Backup and Recovery](#10-backup-and-recovery)
11. [Performance Optimization](#11-performance-optimization)

---

## 1. Database Overview

### 1.1 Database Selection

| Attribute | Value |
|-----------|-------|
| **Database Engine** | PostgreSQL 16 |
| **ORM** | Prisma 5.x |
| **Migration Tool** | Prisma Migrate |
| **Schema Definition** | Prisma Schema Language |
| **Database Name** | `gff_erp_db` |
| **Application User** | `gff_erp_user` |
| **Character Set** | UTF-8 (full Unicode including Arabic) |
| **Timezone** | UTC (application handles localization) |

### 1.2 Why PostgreSQL 16

- **ACID Compliance**: Full transactional integrity critical for financial data
- **Complex Queries**: CTEs, window functions, subqueries for reporting
- **JSON Support**: Flexible schema for extensible attributes
- **Concurrency**: MVCC for high-throughput OLTP operations
- **Extensions**: Full-text search, UUID generation, mathematical functions
- **Reliability**: Proven enterprise-grade stability
- **Decimal Precision**: Exact numeric types for monetary values

### 1.3 Connection Configuration

```
Max Connections: 200
Shared Buffers: 25% of RAM (e.g., 4GB for 16GB RAM)
Effective Cache Size: 50% of RAM
Work Mem: 4MB
Maintenance Work Mem: 512MB
WAL Buffers: 16MB
Checkpoint Completion Target: 0.9
Random Page Cost: 1.1 (SSD)
Effective IO Concurrency: 200 (SSD)
```

---

## 2. Prisma ORM Configuration

### 2.1 Prisma Schema Structure

```
prisma/
|-- schema.prisma          # Main schema file
|   |-- Generator config   # Prisma Client generation
|   |-- Database config    # PostgreSQL connection
|   |-- System models      # Users, roles, audit
|   |-- Organization       # Branches, settings
|   |-- Product Catalog    # Products, categories, units
|   |-- Inventory          # Stock, movements, warehouses
|   |-- Sales              # Orders, returns, quotations
|   |-- Procurement        # POs, GRN, returns
|   |-- Treasury           # Cash, banks, transfers
|   |-- Accounting         # COA, journals, ledger
|   |-- HR                 # Employees, attendance, payroll
|   |-- CRM                # Leads, activities
|   |-- Logistics          # Vehicles, drivers, trips
|   |-- Production         # MOs, formulas, batches
|   |-- Poultry            # Chicks, sheds, eggs
|
|-- migrations/            # Migration history
|   |-- 20240101000000_init/
|   |-- ...
```

### 2.2 Prisma Configuration

```prisma
// Generator Configuration
generator client {
  provider      = "prisma-client-js"
  output        = "../node_modules/.prisma/client"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}

// Database Configuration
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### 2.3 Connection Pool Settings

```
DATABASE_URL format:
postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public&connection_limit=20&pool_timeout=30

Connection Pool:
- Connection Limit per instance: 20
- Pool Timeout: 30 seconds
- Idle Timeout: 5 minutes
- Statement Cache: Enabled
```

### 2.4 Prisma Client Setup

```typescript
// prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  
  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'stdout', level: 'error' },
        { emit: 'stdout', level: 'warn' },
      ],
      transactionOptions: {
        maxWait: 5000,
        timeout: 15000,
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Enable soft delete filtering globally
  async enableSoftDelete() {
    this.$use(async (params, next) => {
      if (params.action === 'findUnique' || params.action === 'findFirst') {
        params.args.where = { ...params.args.where, deletedAt: null };
      }
      if (params.action === 'findMany') {
        if (!params.args.where) params.args.where = {};
        if (params.args.where.deletedAt === undefined) {
          params.args.where.deletedAt = null;
        }
      }
      return next(params);
    });
  }
}
```

---

## 3. Entity Relationship Diagram

### 3.1 Complete ERD Overview

```
+---------------+       +---------------+       +---------------+
|     User      |------<|   AuditLog    |       |     Role      |
+---------------+       +---------------+       +---------------+
  |    |    |                                        |
  |    |    +------------+                           |
  |    |                 |                    +------+------+
  |    |                 |                    |             |
  |    v                 v              +------v----+  +-----v-----+
  |  +----------------+ +----------+   |Permission |  |UserRole   |
  |  |   Employee     | |  Branch  |   +-----------+  +-----------+
  |  +----------------+ +-----+----+
  |        |                  |
  |        |                  |
  |        v                  v
  |  +----------------+ +----------------+ +----------------+
  |  |  Attendance    | |   Department   | |  ChartOfAccount|
  |  +----------------+ +----------------+ +--------+-------+
  |  |  LeaveRequest  | |   Employee     |          |
  |  +----------------+ |   Document     |          |
  |  |  PayrollRecord | +----------------+          |
  |  +----------------+                             |
  |                                                 |
  v                                                 v
+---------------+                          +------------------+
|SalesOrder     |                          |JournalEntry      |
+---------------+                          +------------------+
  |    |                                         |    |
  |    v                                         |    v
  |  +---------------+                    +------v-----------+
  |  |SalesOrderItem |                    |JournalEntryLine  |
  |  +---------------+                    +------------------+
  |
  v
+---------------+       +---------------+       +---------------+
|DeliveryNote   |------>|   Customer    |       |   Supplier    |
+---------------+       +---------------+       +---------------+
                            |                         |
                            v                         v
                       +---------------+       +---------------+
                       |  CRM Lead     |       |PurchaseOrder  |
                       +---------------+       +---------------+
                       | CRM Activity  |         |    |
                       +---------------+         |    v
                                                 |  +---------------+
                                                 |  |PurchaseOrder  |
                                                 |  |    Item       |
                                                 |  +---------------+
                                                 |
                                                 v
+---------------+       +---------------+       +---------------+
|Product        |------<|ProductCategory|      |     GRN       |
+---------------+       +---------------+       +---------------+
  |    |    |
  |    |    v
  |    |  +---------------+
  |    |  |     Unit      |
  |    |  +---------------+
  |    |
  |    v
  |  +---------------+
  |  |  Barcode      |
  |  +---------------+
  |
  v
+---------------+       +---------------+       +---------------+
|Inventory      |------>|  Warehouse    |<------|StockMovement  |
+---------------+       +---------------+       +---------------+
  |                                              |
  v                                              v
+---------------+       +---------------+       +---------------+
|StockAdjustment|       |Transfer       |       |   FeedFormula |
+---------------+       +---------------+       +---------------+
                                                 |    |
                                                 |    v
                                                 |  +---------------+
                                                 |  | FeedFormula   |
                                                 |  |   Ingredient  |
                                                 |  +---------------+
                                                 |
                                                 v
+---------------+       +---------------+       +---------------+
|Manufacturing  |------>|ProductionBatch|       |ChickBatch     |
|Order          |       +---------------+       +---------------+
+---------------+             |                        |
                              v                        v
                       +---------------+       +---------------+
                       |  BOM / BOM    |       |     Shed      |
                       |    Item       |       +---------------+
                       +---------------+              |
                                                     v
                                              +---------------+
                                              |EggProduction  |
                                              +---------------+
                                              |PoultryMortality|
                                              +---------------+
                                              |PoultryFeeding |
                                              +---------------+

+---------------+       +---------------+       +---------------+
|  CashBox      |------>|CashTransaction|       |     Bank      |
+---------------+       +---------------+       +---------------+
                                                  |
                                                  v
                                          +---------------+
                                          |BankTransaction|
                                          +---------------+

+---------------+       +---------------+       +---------------+
|   Vehicle     |------>|     Trip      |       |    Driver     |
+---------------+       +---------------+       +---------------+
                           |
                           v
                    +---------------+
                    |     Route     |
                    +---------------+
```

### 3.2 Core Relationship Definitions

| Relationship | Type | Description |
|-------------|------|-------------|
| User -> Branch | Many-to-Many | Users can access multiple branches |
| SalesOrder -> Customer | Many-to-One | Each order belongs to one customer |
| SalesOrder -> SalesOrderItem | One-to-Many | Each order has multiple items |
| SalesOrderItem -> Product | Many-to-One | Each item references one product |
| PurchaseOrder -> Supplier | Many-to-One | Each PO belongs to one supplier |
| Inventory -> Product | Many-to-One | Stock record per product per warehouse |
| Inventory -> Warehouse | Many-to-One | Stock at a specific warehouse |
| JournalEntry -> JournalEntryLine | One-to-Many | Each JE has multiple lines |
| JournalEntryLine -> ChartOfAccount | Many-to-One | Each line references one account |
| Employee -> Department | Many-to-One | Employee belongs to one department |
| ChickBatch -> Shed | Many-to-One | Batch housed in one shed |
| ManufacturingOrder -> FeedFormula | Many-to-One | MO follows a formula |
| CashTransaction -> CashBox | Many-to-One | Transaction for one cash box |
| BankTransaction -> Bank | Many-to-One | Transaction for one bank account |
| Trip -> Vehicle | Many-to-One | Trip uses one vehicle |
| Trip -> Driver | Many-to-One | Trip assigned to one driver |

---

## 4. Schema Statistics

### 4.1 Summary Statistics

| Metric | Count |
|--------|-------|
| **Total Models** | 73 |
| **Total Enums** | 54 |
| **Total Indexes** | 332 |
| **Total Relations** | 180+ |
| **Total Fields** | 1,200+ |

### 4.2 Distribution by Module

| Module | Tables | Enums | Indexes |
|--------|--------|-------|---------|
| System & Security | 6 | 8 | 32 |
| Organization | 2 | 3 | 8 |
| Product Catalog | 4 | 4 | 24 |
| Inventory | 7 | 5 | 35 |
| Sales | 8 | 6 | 40 |
| Procurement | 6 | 4 | 30 |
| Treasury & Banking | 5 | 5 | 28 |
| Accounting | 7 | 6 | 42 |
| HR | 8 | 6 | 36 |
| CRM | 2 | 2 | 10 |
| Logistics | 6 | 3 | 22 |
| Production & Feed | 7 | 4 | 30 |
| Poultry | 5 | 3 | 20 |
| Audit & Logs | 1 | 0 | 5 |

### 4.3 Index Statistics

| Index Type | Count |
|-----------|-------|
| Primary Key (B-tree) | 73 |
| Foreign Key (B-tree) | 108 |
| Unique Index | 45 |
| Composite Index | 68 |
| Partial Index | 25 |
| Full-text Index | 13 |

---

## 5. Module-by-Module Schema Breakdown

### 5.1 System & Security Module (6 Tables)

```
+-------------------------------------------------------------------+
|                        SYSTEM & SECURITY                           |
+-------------------------------------------------------------------+

Table: users
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| username     | VARCHAR(50)  | NOT NULL| Unique login name              |
| password     | VARCHAR(255) | NOT NULL| bcrypt hash (12 rounds)        |
| email        | VARCHAR(100) | NULL    | Email address                  |
| fullName     | VARCHAR(100) | NOT NULL| Display name (Arabic/English)  |
| phone        | VARCHAR(20)  | NULL    | Contact phone                  |
| isActive     | BOOLEAN      | NOT NULL| Account enabled flag           |
| lastLogin    | TIMESTAMP    | NULL    | Last successful login          |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL   | User who created               |
| updatedBy    | VARCHAR(36)  | NULL   | User who last updated          |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (username), INDEX (isActive), INDEX (deletedAt)

Table: roles
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| name         | VARCHAR(50)  | NOT NULL| Role name (e.g., "Manager")    |
| description  | VARCHAR(255) | NULL    | Role description               |
| isSystem     | BOOLEAN      | NOT NULL| Built-in role (non-editable)   |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (name)

Table: permissions
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| module       | VARCHAR(50)  | NOT NULL| Module name                    |
| action       | VARCHAR(50)  | NOT NULL| Action (view, create, edit...) |
| resource     | VARCHAR(50)  | NOT NULL| Resource identifier            |
| description  | VARCHAR(255) | NULL    | Human-readable description     |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (module, action, resource)

Table: role_permissions
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| roleId       | VARCHAR(36)  | NOT NULL| FK -> roles.id                 |
| permissionId | VARCHAR(36)  | NOT NULL| FK -> permissions.id           |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (roleId, permissionId), FK (roleId), FK (permissionId)

Table: user_roles
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| userId       | VARCHAR(36)  | NOT NULL| FK -> users.id                 |
| roleId       | VARCHAR(36)  | NOT NULL| FK -> roles.id                 |
| branchId     | VARCHAR(36)  | NULL    | FK -> branches.id (scoped)     |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (userId, roleId, branchId), FK (userId, roleId, branchId)

Table: user_sessions
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| userId       | VARCHAR(36)  | NOT NULL| FK -> users.id                 |
| refreshToken | TEXT         | NOT NULL| Hashed refresh token           |
| ipAddress    | VARCHAR(45)  | NULL    | Client IP                      |
| userAgent    | VARCHAR(255) | NULL    | Browser user agent             |
| expiresAt    | TIMESTAMP    | NOT NULL| Token expiration               |
| createdAt    | TIMESTAMP    | NOT NULL| Session start                  |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (userId), INDEX (refreshToken), INDEX (expiresAt)
```

**System Enums:**
- `UserStatus`: ACTIVE, INACTIVE, SUSPENDED, PENDING
- `SessionStatus`: VALID, EXPIRED, REVOKED
- `PermissionAction`: VIEW, CREATE, EDIT, DELETE, APPROVE, EXPORT, IMPORT, MANAGE
- `LogAction`: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT
- `AuditLevel`: INFO, WARNING, ERROR, CRITICAL

---

### 5.2 Organization Module (2 Tables)

```
+-------------------------------------------------------------------+
|                        ORGANIZATION                                |
+-------------------------------------------------------------------+

Table: branches
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| code         | VARCHAR(20)  | NOT NULL| Unique branch code             |
| name         | VARCHAR(100) | NOT NULL| Branch name (Arabic/English)   |
| nameAr       | VARCHAR(100) | NULL   | Arabic name                    |
| address      | TEXT         | NULL    | Physical address               |
| phone        | VARCHAR(20)  | NULL    | Contact phone                  |
| email        | VARCHAR(100) | NULL    | Contact email                  |
| city         | VARCHAR(50)  | NULL    | City name                      |
| isMain       | BOOLEAN      | NOT NULL| Flag for main branch           |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| settings     | JSONB        | NULL    | Branch-specific settings       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL   | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL   | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (code), INDEX (isActive), INDEX (deletedAt)

Table: branch_settings
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| settingKey   | VARCHAR(50)  | NOT NULL| Setting identifier             |
| settingValue | TEXT         | NULL    | Setting value                  |
| dataType     | VARCHAR(20)  | NOT NULL| STRING, NUMBER, BOOLEAN, JSON  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, settingKey), FK (branchId)
```

**Organization Enums:**
- `BranchType`: HEAD_OFFICE, WAREHOUSE, FACTORY, RETAIL_STORE, DISTRIBUTION_CENTER
- `BranchStatus`: ACTIVE, INACTIVE, CLOSED

---

### 5.3 Product Catalog Module (4 Tables)

```
+-------------------------------------------------------------------+
|                       PRODUCT CATALOG                              |
+-------------------------------------------------------------------+

Table: product_categories
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| code         | VARCHAR(20)  | NOT NULL| Category code                  |
| name         | VARCHAR(100) | NOT NULL| Category name                  |
| nameAr       | VARCHAR(100) | NULL   | Arabic category name           |
| parentId     | VARCHAR(36)  | NULL    | Self-referential FK (hierarchy)|
| description  | TEXT         | NULL    | Category description           |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (parentId), INDEX (isActive), INDEX (deletedAt)

Table: units
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| code         | VARCHAR(20)  | NOT NULL| Unit code (e.g., "KG", "BAG")  |
| name         | VARCHAR(50)  | NOT NULL| Unit name                      |
| nameAr       | VARCHAR(50)  | NULL    | Arabic unit name               |
| conversion   | DECIMAL(10,4)| NOT NULL| Conversion factor to base unit |
| baseUnitId   | VARCHAR(36)  | NULL    | FK -> units.id (for derived)   |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (code), INDEX (isActive)

Table: products
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| code         | VARCHAR(50)  | NOT NULL| SKU/Product code               |
| name         | VARCHAR(200) | NOT NULL| Product name                   |
| nameAr       | VARCHAR(200) | NULL   | Arabic product name            |
| description  | TEXT         | NULL    | Product description            |
| categoryId   | VARCHAR(36)  | NOT NULL| FK -> product_categories.id    |
| unitId       | VARCHAR(36)  | NOT NULL| FK -> units.id                 |
| barcode      | VARCHAR(50)  | NULL    | EAN/UPC barcode                |
| costPrice    | DECIMAL(18,4)| NOT NULL| Unit cost price                |
| salePrice    | DECIMAL(18,4)| NOT NULL| Default sale price             |
| wholesalePrice| DECIMAL(18,4)| NULL   | Wholesale price                |
| minStock     | DECIMAL(12,4)| NULL    | Minimum stock alert level      |
| maxStock     | DECIMAL(12,4)| NULL    | Maximum stock level            |
| isStockable  | BOOLEAN      | NOT NULL| Track inventory flag           |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| attributes   | JSONB        | NULL    | Flexible product attributes    |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (code), INDEX (barcode), INDEX (categoryId),
         INDEX (isActive), INDEX (deletedAt), INDEX (isStockable)

Table: product_barcodes
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| barcode      | VARCHAR(50)  | NOT NULL| Barcode value                  |
| barcodeType  | VARCHAR(20)  | NOT NULL| EAN13, UPC, CODE128, QR        |
| quantity     | DECIMAL(10,4)| NOT NULL| Quantity this barcode repres.  |
| isPrimary    | BOOLEAN      | NOT NULL| Default barcode flag           |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (barcode), INDEX (productId)
```

**Product Enums:**
- `ProductType`: FINISHED_GOODS, RAW_MATERIAL, SERVICE, CONSUMABLE
- `ProductStatus`: ACTIVE, INACTIVE, DISCONTINUED, DRAFT
- `BarcodeType`: EAN13, UPC, CODE128, QR_CODE, CUSTOM
- `UnitType`: WEIGHT, VOLUME, LENGTH, PIECE, BOX, BAG, PALLET

---

### 5.4 Inventory Module (7 Tables)

```
+-------------------------------------------------------------------+
|                         INVENTORY                                  |
+-------------------------------------------------------------------+

Table: warehouses
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Warehouse code                 |
| name         | VARCHAR(100) | NOT NULL| Warehouse name                 |
| nameAr       | VARCHAR(100) | NULL    | Arabic name                    |
| location     | TEXT         | NULL    | Physical location              |
| managerName  | VARCHAR(100) | NULL    | Responsible person             |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId), UNIQUE (branchId, code), INDEX (isActive)

Table: inventory
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| warehouseId  | VARCHAR(36)  | NOT NULL| FK -> warehouses.id            |
| quantity     | DECIMAL(18,4)| NOT NULL| Current stock quantity         |
| reservedQty  | DECIMAL(18,4)| NOT NULL| Reserved/committed quantity    |
| availableQty | DECIMAL(18,4)| NOT NULL| Computed: qty - reserved       |
| avgCostPrice | DECIMAL(18,4)| NOT NULL| Weighted average cost          |
| lastMovement | TIMESTAMP    | NULL    | Last stock movement date       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, productId, warehouseId),
         INDEX (productId), INDEX (warehouseId), INDEX (quantity)

Table: stock_movements
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| warehouseId  | VARCHAR(36)  | NOT NULL| FK -> warehouses.id            |
| movementType | VARCHAR(30)  | NOT NULL| Type of movement               |
| quantity     | DECIMAL(18,4)| NOT NULL| Movement quantity (+/-)        |
| unitCost     | DECIMAL(18,4)| NULL    | Cost at time of movement       |
| referenceType| VARCHAR(50)  | NULL    | Source document type           |
| referenceId  | VARCHAR(36)  | NULL    | Source document ID             |
| notes        | TEXT         | NULL    | Movement notes                 |
| createdBy    | VARCHAR(36)  | NULL   | User who created               |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId, productId, warehouseId),
         INDEX (movementType), INDEX (referenceType, referenceId), INDEX (createdAt)

Table: stock_adjustments
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| warehouseId  | VARCHAR(36)  | NOT NULL| FK -> warehouses.id            |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| oldQuantity  | DECIMAL(18,4)| NOT NULL| Previous quantity              |
| newQuantity  | DECIMAL(18,4)| NOT NULL| Adjusted quantity              |
| difference   | DECIMAL(18,4)| NOT NULL| Computed difference            |
| reason       | TEXT         | NOT NULL| Reason for adjustment          |
| adjustmentDate| TIMESTAMP   | NOT NULL| Date of adjustment             |
| status       | VARCHAR(20)  | NOT NULL| PENDING, APPROVED, REJECTED    |
| approvedBy   | VARCHAR(36)  | NULL    | Approver user                  |
| approvedAt   | TIMESTAMP    | NULL    | Approval timestamp             |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId, warehouseId), INDEX (status), INDEX (createdAt)

Table: transfer_orders
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| fromWarehouseId| VARCHAR(36)| NOT NULL| Source warehouse               |
| toWarehouseId| VARCHAR(36)  | NOT NULL| Destination warehouse          |
| transferNumber| VARCHAR(30) | NOT NULL| Auto-generated number          |
| transferDate | TIMESTAMP    | NOT NULL| Transfer date                  |
| status       | VARCHAR(20)  | NOT NULL| DRAFT, PENDING, SHIPPED,       |
|              |              |         | RECEIVED, CANCELLED            |
| notes        | TEXT         | NULL    | Transfer notes                 |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId), INDEX (status), INDEX (transferDate)

Table: transfer_order_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| transferId   | VARCHAR(36)  | NOT NULL| FK -> transfer_orders.id       |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| quantity     | DECIMAL(18,4)| NOT NULL| Transfer quantity              |
| receivedQty  | DECIMAL(18,4)| NULL   | Actually received quantity     |
| unitCost     | DECIMAL(18,4)| NULL    | Unit cost at transfer          |
| notes        | TEXT         | NULL    | Item notes                     |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (transferId), INDEX (productId)

Table: inventory_counts
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| warehouseId  | VARCHAR(36)  | NOT NULL| FK -> warehouses.id            |
| countNumber  | VARCHAR(30)  | NOT NULL| Auto-generated number          |
| countDate    | TIMESTAMP    | NOT NULL| Physical count date            |
| status       | VARCHAR(20)  | NOT NULL| IN_PROGRESS, COMPLETED,        |
|              |              |         | ADJUSTED, CANCELLED            |
| notes        | TEXT         | NULL    | Count notes                    |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId, warehouseId), INDEX (status)
```

**Inventory Enums:**
- `MovementType`: IN_PURCHASE, IN_PRODUCTION, IN_TRANSFER, IN_ADJUSTMENT, IN_RETURN,
  OUT_SALE, OUT_PRODUCTION, OUT_TRANSFER, OUT_ADJUSTMENT, OUT_RETURN, OUT_FEEDING,
  OUT_MEDICINE, RESERVED, RELEASED
- `StockAdjustmentReason`: COUNT, DAMAGE, EXPIRY, THEFT, OTHER
- `TransferStatus`: DRAFT, PENDING, SHIPPED, IN_TRANSIT, RECEIVED, CANCELLED
- `InventoryCountStatus`: IN_PROGRESS, COMPLETED, ADJUSTED, CANCELLED

---

### 5.5 Sales Module (8 Tables)

```
+-------------------------------------------------------------------+
|                           SALES                                    |
+-------------------------------------------------------------------+

Table: customers
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Customer code                  |
| name         | VARCHAR(200) | NOT NULL| Customer name                  |
| nameAr       | VARCHAR(200) | NULL    | Arabic customer name           |
| contactPerson| VARCHAR(100) | NULL    | Primary contact name           |
| phone        | VARCHAR(20)  | NOT NULL| Primary phone                  |
| phone2       | VARCHAR(20)  | NULL    | Secondary phone                |
| email        | VARCHAR(100) | NULL    | Email address                  |
| address      | TEXT         | NULL    | Billing address                |
| taxNumber    | VARCHAR(50)  | NULL    | VAT/Tax registration           |
| creditLimit  | DECIMAL(18,4)| NULL    | Maximum credit amount          |
| balance      | DECIMAL(18,4)| NOT NULL| Current balance (AR)           |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId, code), INDEX (branchId, name),
         INDEX (phone), INDEX (isActive), INDEX (deletedAt)

Table: sales_orders
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| orderNumber  | VARCHAR(30)  | NOT NULL| Auto-generated SO number       |
| customerId   | VARCHAR(36)  | NOT NULL| FK -> customers.id             |
| orderDate    | TIMESTAMP    | NOT NULL| Order date                     |
| deliveryDate | TIMESTAMP    | NULL    | Expected delivery              |
| status       | VARCHAR(20)  | NOT NULL| DRAFT, CONFIRMED, SHIPPED,     |
|              |              |         | DELIVERED, INVOICED, PAID,     |
|              |              |         | CANCELLED, RETURNED            |
| subTotal     | DECIMAL(18,4)| NOT NULL| Sum of line items              |
| discountAmt  | DECIMAL(18,4)| NOT NULL| Total discount                 |
| taxRate      | DECIMAL(5,4) | NOT NULL| Tax percentage                 |
| taxAmount    | DECIMAL(18,4)| NOT NULL| Calculated tax                 |
| totalAmount  | DECIMAL(18,4)| NOT NULL| Grand total                    |
| paidAmount   | DECIMAL(18,4)| NOT NULL| Amount paid so far             |
| balanceDue   | DECIMAL(18,4)| NOT NULL| Remaining balance              |
| notes        | TEXT         | NULL    | Order notes                    |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, orderNumber), INDEX (branchId, customerId),
         INDEX (status), INDEX (orderDate), INDEX (deletedAt)

Table: sales_order_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| orderId      | VARCHAR(36)  | NOT NULL| FK -> sales_orders.id          |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| description  | VARCHAR(255) | NULL    | Item description override      |
| quantity     | DECIMAL(18,4)| NOT NULL| Ordered quantity               |
| deliveredQty | DECIMAL(18,4)| NOT NULL| Quantity delivered             |
| unitPrice    | DECIMAL(18,4)| NOT NULL| Price per unit                 |
| discountPercent| DECIMAL(5,4)| NULL   | Line discount %                |
| discountAmount| DECIMAL(18,4)| NOT NULL| Line discount value            |
| taxPercent   | DECIMAL(5,4) | NOT NULL| Line tax %                     |
| taxAmount    | DECIMAL(18,4)| NOT NULL| Line tax value                 |
| lineTotal    | DECIMAL(18,4)| NOT NULL| Line total (computed)          |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (orderId), INDEX (productId)

Table: sales_returns
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| returnNumber | VARCHAR(30)  | NOT NULL| Auto-generated number          |
| salesOrderId | VARCHAR(36)  | NOT NULL| FK -> sales_orders.id          |
| customerId   | VARCHAR(36)  | NOT NULL| FK -> customers.id             |
| returnDate   | TIMESTAMP    | NOT NULL| Return date                    |
| status       | VARCHAR(20)  | NOT NULL| DRAFT, APPROVED, REJECTED      |
| totalAmount  | DECIMAL(18,4)| NOT NULL| Total return value             |
| reason       | TEXT         | NULL    | Return reason                  |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, returnNumber), INDEX (salesOrderId)

Table: sales_return_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| returnId     | VARCHAR(36)  | NOT NULL| FK -> sales_returns.id         |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| quantity     | DECIMAL(18,4)| NOT NULL| Returned quantity              |
| unitPrice    | DECIMAL(18,4)| NOT NULL| Price at time of sale          |
| lineTotal    | DECIMAL(18,4)| NOT NULL| Line total                     |
| reason       | TEXT         | NULL    | Item return reason             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (returnId), INDEX (productId)

Table: quotations
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| quoteNumber  | VARCHAR(30)  | NOT NULL| Auto-generated number          |
| customerId   | VARCHAR(36)  | NOT NULL| FK -> customers.id             |
| quoteDate    | TIMESTAMP    | NOT NULL| Quote date                     |
| expiryDate   | TIMESTAMP    | NULL    | Quote validity date            |
| status       | VARCHAR(20)  | NOT NULL| DRAFT, SENT, ACCEPTED,         |
|              |              |         | REJECTED, EXPIRED, CONVERTED   |
| subTotal     | DECIMAL(18,4)| NOT NULL| Sum of line items              |
| totalAmount  | DECIMAL(18,4)| NOT NULL| Grand total                    |
| notes        | TEXT         | NULL    | Quote notes                    |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, quoteNumber), INDEX (status)

Table: quotation_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| quotationId  | VARCHAR(36)  | NOT NULL| FK -> quotations.id            |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| description  | VARCHAR(255) | NULL    | Item description               |
| quantity     | DECIMAL(18,4)| NOT NULL| Quoted quantity                |
| unitPrice    | DECIMAL(18,4)| NOT NULL| Quoted price                   |
| lineTotal    | DECIMAL(18,4)| NOT NULL| Line total                     |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (quotationId), INDEX (productId)

Table: delivery_notes
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| noteNumber   | VARCHAR(30)  | NOT NULL| Auto-generated DN number       |
| salesOrderId | VARCHAR(36)  | NOT NULL| FK -> sales_orders.id          |
| customerId   | VARCHAR(36)  | NOT NULL| FK -> customers.id             |
| deliveryDate | TIMESTAMP    | NOT NULL| Delivery date                  |
| vehicleId    | VARCHAR(36)  | NULL    | FK -> vehicles.id              |
| driverId     | VARCHAR(36)  | NULL    | FK -> drivers.id               |
| status       | VARCHAR(20)  | NOT NULL| PENDING, LOADED, IN_TRANSIT,   |
|              |              |         | DELIVERED, RETURNED            |
| notes        | TEXT         | NULL    | Delivery notes                 |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, noteNumber), INDEX (salesOrderId), INDEX (status)
```

**Sales Enums:**
- `SalesOrderStatus`: DRAFT, CONFIRMED, PICKING, PACKED, SHIPPED, DELIVERED, INVOICED, PAID, CANCELLED, RETURNED, PARTIALLY_RETURNED
- `SalesReturnStatus`: DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, COMPLETED
- `QuotationStatus`: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED, CONVERTED
- `DeliveryStatus`: PENDING, LOADED, IN_TRANSIT, DELIVERED, PARTIALLY_DELIVERED, RETURNED

---

### 5.6 Procurement Module (6 Tables)

```
+-------------------------------------------------------------------+
|                       PROCUREMENT                                  |
+-------------------------------------------------------------------+

Table: suppliers
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Supplier code                  |
| name         | VARCHAR(200) | NOT NULL| Supplier name                  |
| nameAr       | VARCHAR(200) | NULL    | Arabic name                    |
| contactPerson| VARCHAR(100) | NULL    | Primary contact                |
| phone        | VARCHAR(20)  | NOT NULL| Phone number                   |
| phone2       | VARCHAR(20)  | NULL    | Secondary phone                |
| email        | VARCHAR(100) | NULL    | Email                          |
| address      | TEXT         | NULL    | Address                        |
| taxNumber    | VARCHAR(50)  | NULL    | Tax ID                         |
| balance      | DECIMAL(18,4)| NOT NULL| Current balance (AP)           |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId, code), INDEX (phone), INDEX (isActive)

Table: purchase_orders
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| orderNumber  | VARCHAR(30)  | NOT NULL| Auto-generated PO number       |
| supplierId   | VARCHAR(36)  | NOT NULL| FK -> suppliers.id             |
| orderDate    | TIMESTAMP    | NOT NULL| Order date                     |
| expectedDate | TIMESTAMP    | NULL    | Expected delivery              |
| status       | VARCHAR(20)  | NOT NULL| DRAFT, SENT, PARTIAL,          |
|              |              |         | RECEIVED, CANCELLED, CLOSED    |
| subTotal     | DECIMAL(18,4)| NOT NULL| Sum of line items              |
| discountAmt  | DECIMAL(18,4)| NOT NULL| Total discount                 |
| taxRate      | DECIMAL(5,4) | NOT NULL| Tax rate                       |
| taxAmount    | DECIMAL(18,4)| NOT NULL| Tax amount                     |
| totalAmount  | DECIMAL(18,4)| NOT NULL| Grand total                    |
| paidAmount   | DECIMAL(18,4)| NOT NULL| Amount paid                    |
| balanceDue   | DECIMAL(18,4)| NOT NULL| Remaining balance              |
| notes        | TEXT         | NULL    | PO notes                       |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, orderNumber), INDEX (supplierId), INDEX (status)

Table: purchase_order_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| orderId      | VARCHAR(36)  | NOT NULL| FK -> purchase_orders.id       |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| description  | VARCHAR(255) | NULL    | Item description               |
| quantity     | DECIMAL(18,4)| NOT NULL| Ordered quantity               |
| receivedQty  | DECIMAL(18,4)| NOT NULL| Received quantity              |
| unitPrice    | DECIMAL(18,4)| NOT NULL| Price per unit                 |
| discountPercent| DECIMAL(5,4)| NULL   | Line discount %                |
| discountAmount| DECIMAL(18,4)| NOT NULL| Line discount                  |
| lineTotal    | DECIMAL(18,4)| NOT NULL| Line total                     |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (orderId), INDEX (productId)

Table: goods_receipt_notes
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| grnNumber    | VARCHAR(30)  | NOT NULL| Auto-generated GRN number      |
| purchaseOrderId| VARCHAR(36)| NULL    | FK -> purchase_orders.id       |
| supplierId   | VARCHAR(36)  | NOT NULL| FK -> suppliers.id             |
| warehouseId  | VARCHAR(36)  | NOT NULL| FK -> warehouses.id            |
| receiptDate  | TIMESTAMP    | NOT NULL| Receipt date                   |
| status       | VARCHAR(20)  | NOT NULL| PENDING, RECEIVED, INVOICED,   |
|              |              |         | RETURNED, CANCELLED            |
| totalAmount  | DECIMAL(18,4)| NOT NULL| Total receipt value            |
| notes        | TEXT         | NULL    | Receipt notes                  |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, grnNumber), INDEX (purchaseOrderId), INDEX (status)

Table: grn_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| grnId        | VARCHAR(36)  | NOT NULL| FK -> goods_receipt_notes.id   |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id              |
| orderedQty   | DECIMAL(18,4)| NULL   | Quantity ordered (from PO)     |
| receivedQty  | DECIMAL(18,4)| NOT NULL| Quantity actually received     |
| acceptedQty  | DECIMAL(18,4)| NOT NULL| Quantity accepted              |
| rejectedQty  | DECIMAL(18,4)| NOT NULL| Quantity rejected              |
| unitPrice    | DECIMAL(18,4)| NOT NULL| Unit price                     |
| lineTotal    | DECIMAL(18,4)| NOT NULL| Line total                     |
| batchNumber  | VARCHAR(50)  | NULL   | Supplier batch number          |
| expiryDate   | TIMESTAMP    | NULL    | Product expiry date            |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (grnId), INDEX (productId)

Table: purchase_returns
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| returnNumber | VARCHAR(30)  | NOT NULL| Auto-generated number          |
| grnId        | VARCHAR(36)  | NOT NULL| FK -> goods_receipt_notes.id   |
| supplierId   | VARCHAR(36)  | NOT NULL| FK -> suppliers.id             |
| returnDate   | TIMESTAMP    | NOT NULL| Return date                    |
| status       | VARCHAR(20)  | NOT NULL| DRAFT, APPROVED, SHIPPED,      |
|              |              |         | CREDITED, CANCELLED            |
| totalAmount  | DECIMAL(18,4)| NOT NULL| Total return value             |
| reason       | TEXT         | NULL    | Return reason                  |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, returnNumber), INDEX (grnId), INDEX (status)
```

**Procurement Enums:**
- `PurchaseOrderStatus`: DRAFT, SENT, ACKNOWLEDGED, PARTIALLY_RECEIVED, RECEIVED, CANCELLED, CLOSED
- `GRNStatus`: PENDING, RECEIVED, PARTIALLY_INVOICED, INVOICED, RETURNED, CANCELLED
- `PurchaseReturnStatus`: DRAFT, PENDING, APPROVED, SHIPPED, CREDITED, CANCELLED

---

### 5.7 Treasury & Banking Module (5 Tables)

```
+-------------------------------------------------------------------+
|                     TREASURY & BANKING                             |
+-------------------------------------------------------------------+

Table: cash_boxes
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Cash box code                  |
| name         | VARCHAR(100) | NOT NULL| Cash box name                  |
| nameAr       | VARCHAR(100) | NULL    | Arabic name                    |
| balance      | DECIMAL(18,4)| NOT NULL| Current cash balance           |
| currency     | VARCHAR(3)   | NOT NULL| ISO currency code (default SAR)|
| isDefault    | BOOLEAN      | NOT NULL| Default cash box flag          |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, code), INDEX (isActive), INDEX (deletedAt)

Table: cash_transactions
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| cashBoxId    | VARCHAR(36)  | NOT NULL| FK -> cash_boxes.id            |
| transactionNumber| VARCHAR(30)| NOT NULL| Auto-generated number         |
| transactionDate| TIMESTAMP  | NOT NULL| Transaction date               |
| type         | VARCHAR(20)  | NOT NULL| RECEIPT, PAYMENT               |
| category     | VARCHAR(50)  | NULL    | Category classification        |
| amount       | DECIMAL(18,4)| NOT NULL| Transaction amount             |
| description  | TEXT         | NULL    | Transaction description        |
| referenceType| VARCHAR(50)  | NULL    | Source (SALE, PURCHASE, etc.)  |
| referenceId  | VARCHAR(36)  | NULL    | Source document ID             |
| journalEntryId| VARCHAR(36) | NULL    | FK -> journal_entries.id       |
| createdBy    | VARCHAR(36)  | NULL   | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, transactionNumber),
         INDEX (cashBoxId, transactionDate), INDEX (type), INDEX (referenceType, referenceId)

Table: banks
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Bank account code              |
| name         | VARCHAR(100) | NOT NULL| Account name                   |
| bankName     | VARCHAR(100) | NOT NULL| Actual bank name               |
| accountNumber| VARCHAR(50)  | NOT NULL| Bank account number            |
| iban         | VARCHAR(50)  | NULL    | IBAN                           |
| balance      | DECIMAL(18,4)| NOT NULL| Current balance                |
| currency     | VARCHAR(3)   | NOT NULL| Currency code                  |
| isDefault    | BOOLEAN      | NOT NULL| Default bank flag              |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, code), INDEX (accountNumber), INDEX (isActive)

Table: bank_transactions
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| bankId       | VARCHAR(36)  | NOT NULL| FK -> banks.id                 |
| transactionNumber| VARCHAR(30)| NOT NULL| Auto-generated number         |
| transactionDate| TIMESTAMP  | NOT NULL| Transaction date               |
| type         | VARCHAR(20)  | NOT NULL| DEPOSIT, WITHDRAWAL, TRANSFER  |
| amount       | DECIMAL(18,4)| NOT NULL| Transaction amount             |
| description  | TEXT         | NULL    | Transaction description        |
| referenceType| VARCHAR(50)  | NULL    | Source document type           |
| referenceId  | VARCHAR(36)  | NULL    | Source document ID             |
| journalEntryId| VARCHAR(36) | NULL    | FK -> journal_entries.id       |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, transactionNumber),
         INDEX (bankId, transactionDate), INDEX (type), INDEX (referenceType, referenceId)

Table: transfers
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| transferNumber| VARCHAR(30) | NOT NULL| Auto-generated number          |
| fromType     | VARCHAR(20)  | NOT NULL| CASH, BANK                     |
| fromId       | VARCHAR(36)  | NOT NULL| Source account ID              |
| toType       | VARCHAR(20)  | NOT NULL| CASH, BANK                     |
| toId         | VARCHAR(36)  | NOT NULL| Destination account ID         |
| amount       | DECIMAL(18,4)| NOT NULL| Transfer amount                |
| transferDate | TIMESTAMP    | NOT NULL| Transfer date                  |
| status       | VARCHAR(20)  | NOT NULL| PENDING, COMPLETED, CANCELLED  |
| notes        | TEXT         | NULL    | Transfer notes                 |
| journalEntryId| VARCHAR(36) | NULL    | FK -> journal_entries.id       |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, transferNumber), INDEX (status), INDEX (transferDate)
```

**Treasury Enums:**
- `CashTransactionType`: RECEIPT, PAYMENT, TRANSFER_IN, TRANSFER_OUT, ADJUSTMENT
- `BankTransactionType`: DEPOSIT, WITHDRAWAL, TRANSFER_IN, TRANSFER_OUT, CHECK, WIRE, ADJUSTMENT
- `TransferStatus`: PENDING, APPROVED, COMPLETED, CANCELLED, REJECTED
- `TreasuryAccountType`: CASH_BOX, BANK_ACCOUNT

---

### 5.8 Accounting Module (7 Tables)

```
+-------------------------------------------------------------------+
|                         ACCOUNTING                                 |
+-------------------------------------------------------------------+

Table: chart_of_accounts
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NULL    | FK -> branches.id (nullable =  |
|              |              |         | shared across branches)        |
| code         | VARCHAR(50)  | NOT NULL| Account code (e.g., "1200")    |
| name         | VARCHAR(200) | NOT NULL| Account name                   |
| nameAr       | VARCHAR(200) | NULL   | Arabic account name            |
| accountType  | VARCHAR(30)  | NOT NULL| ASSET, LIABILITY, EQUITY,      |
|              |              |         | REVENUE, EXPENSE               |
| parentId     | VARCHAR(36)  | NULL    | Self-referential FK (tree)     |
| level        | INT          | NOT NULL| Hierarchy level (1-5)          |
| isGroup      | BOOLEAN      | NOT NULL| Group heading (non-posting)    |
| isBank       | BOOLEAN      | NOT NULL| Linked to bank account         |
| isCash       | BOOLEAN      | NOT NULL| Linked to cash box             |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| openingBalance| DECIMAL(18,4)| NOT NULL| Opening balance               |
| currentBalance| DECIMAL(18,4)| NOT NULL| Current balance               |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId), INDEX (code), INDEX (accountType),
         INDEX (parentId), INDEX (isGroup), INDEX (isActive)

Table: journal_entries
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| entryNumber  | VARCHAR(30)  | NOT NULL| Auto-generated JE number       |
| entryDate    | TIMESTAMP    | NOT NULL| Accounting date                |
| referenceType| VARCHAR(50)  | NULL    | Source module (SALE, PO, etc.) |
| referenceId  | VARCHAR(36)  | NULL    | Source document ID             |
| description  | TEXT         | NOT NULL| Entry description              |
| totalDebit   | DECIMAL(18,4)| NOT NULL| Sum of debit lines             |
| totalCredit  | DECIMAL(18,4)| NOT NULL| Sum of credit lines            |
| isBalanced   | BOOLEAN      | NOT NULL| DR = CR validation             |
| isPosted     | BOOLEAN      | NOT NULL| Posted to GL flag              |
| postedAt     | TIMESTAMP    | NULL    | Posting timestamp              |
| postedBy     | VARCHAR(36)  | NULL   | User who posted                |
| periodYear   | INT          | NOT NULL| Fiscal year                    |
| periodMonth  | INT          | NOT NULL| Fiscal month (1-12)            |
| isReversing  | BOOLEAN      | NOT NULL| Reversing entry flag           |
| reversedFromId| VARCHAR(36) | NULL    | FK -> journal_entries.id       |
| notes        | TEXT         | NULL    | Additional notes               |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, entryNumber), INDEX (entryDate),
         INDEX (isPosted), INDEX (periodYear, periodMonth), INDEX (referenceType, referenceId)

Table: journal_entry_lines
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| entryId      | VARCHAR(36)  | NOT NULL| FK -> journal_entries.id       |
| accountId    | VARCHAR(36)  | NOT NULL| FK -> chart_of_accounts.id     |
| description  | TEXT         | NULL    | Line description               |
| debit        | DECIMAL(18,4)| NOT NULL| Debit amount (0 if credit)     |
| credit       | DECIMAL(18,4)| NOT NULL| Credit amount (0 if debit)     |
| isDebit      | BOOLEAN      | NOT NULL| Direction flag                 |
| lineOrder    | INT          | NOT NULL| Display order in entry         |
| costCenter   | VARCHAR(50)  | NULL    | Cost center allocation         |
| project      | VARCHAR(50)  | NULL    | Project allocation             |
| reference    | VARCHAR(100) | NULL    | Line reference                 |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (entryId), INDEX (accountId), INDEX (costCenter)

Table: general_ledger
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| accountId    | VARCHAR(36)  | NOT NULL| FK -> chart_of_accounts.id     |
| entryId      | VARCHAR(36)  | NOT NULL| FK -> journal_entries.id       |
| entryLineId  | VARCHAR(36)  | NOT NULL| FK -> journal_entry_lines.id   |
| entryDate    | TIMESTAMP    | NOT NULL| Transaction date               |
| description  | TEXT         | NOT NULL| Transaction description        |
| debit        | DECIMAL(18,4)| NOT NULL| Debit amount                   |
| credit       | DECIMAL(18,4)| NOT NULL| Credit amount                  |
| balance      | DECIMAL(18,4)| NOT NULL| Running balance                |
| periodYear   | INT          | NOT NULL| Fiscal year                    |
| periodMonth  | INT          | NOT NULL| Fiscal month                   |
| costCenter   | VARCHAR(50)  | NULL    | Cost center                    |
| reference    | VARCHAR(100) | NULL    | Reference                      |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId, accountId, entryDate),
         INDEX (entryId), INDEX (periodYear, periodMonth), INDEX (costCenter)

Table: fiscal_periods
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| year         | INT          | NOT NULL| Fiscal year                    |
| month        | INT          | NOT NULL| Month (1-12)                   |
| name         | VARCHAR(50)  | NOT NULL| Period name (e.g., "Jan 2025") |
| startDate    | TIMESTAMP    | NOT NULL| Period start                   |
| endDate      | TIMESTAMP    | NOT NULL| Period end                     |
| isClosed     | BOOLEAN      | NOT NULL| Closed for posting flag        |
| closedBy     | VARCHAR(36)  | NULL   | User who closed                |
| closedAt     | TIMESTAMP    | NULL    | Close timestamp                |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, year, month), INDEX (isClosed)

Table: account_balances
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| accountId    | VARCHAR(36)  | NOT NULL| FK -> chart_of_accounts.id     |
| periodYear   | INT          | NOT NULL| Fiscal year                    |
| periodMonth  | INT          | NOT NULL| Fiscal month                   |
| openingDebit | DECIMAL(18,4)| NOT NULL| Opening debit balance          |
| openingCredit| DECIMAL(18,4)| NOT NULL| Opening credit balance         |
| periodDebit  | DECIMAL(18,4)| NOT NULL| Debit movement in period       |
| periodCredit | DECIMAL(18,4)| NOT NULL| Credit movement in period      |
| closingDebit | DECIMAL(18,4)| NOT NULL| Closing debit balance          |
| closingCredit| DECIMAL(18,4)| NOT NULL| Closing credit balance         |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, accountId, periodYear, periodMonth),
         INDEX (accountId), INDEX (periodYear, periodMonth)

Table: cost_centers
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Cost center code               |
| name         | VARCHAR(100) | NOT NULL| Cost center name               |
| nameAr       | VARCHAR(100) | NULL    | Arabic name                    |
| description  | TEXT         | NULL    | Description                    |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, code), INDEX (isActive), INDEX (deletedAt)
```

**Accounting Enums:**
- `AccountType`: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
- `AccountLevel`: LEVEL_1, LEVEL_2, LEVEL_3, LEVEL_4, LEVEL_5
- `JournalStatus`: DRAFT, PENDING, POSTED, REVERSED
- `EntrySource`: MANUAL, SALES, PURCHASES, INVENTORY, PAYROLL, TREASURY, PRODUCTION

---

### 5.9 HR Module (8 Tables)

```
+-------------------------------------------------------------------+
|                      HUMAN RESOURCES                               |
+-------------------------------------------------------------------+

Table: departments
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| code         | VARCHAR(20)  | NOT NULL| Department code                |
| name         | VARCHAR(100) | NOT NULL| Department name                |
| nameAr       | VARCHAR(100) | NULL    | Arabic department name         |
| parentId     | VARCHAR(36)  | NULL    | Self-referential FK            |
| managerId    | VARCHAR(36)  | NULL    | FK -> employees.id             |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, code), INDEX (parentId), INDEX (isActive)

Table: employees
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| employeeNumber| VARCHAR(20) | NOT NULL| Unique employee number         |
| fullName     | VARCHAR(200) | NOT NULL| Employee full name             |
| fullNameAr   | VARCHAR(200) | NULL   | Arabic full name               |
| departmentId | VARCHAR(36)  | NOT NULL| FK -> departments.id           |
| jobTitle     | VARCHAR(100) | NOT NULL| Job title                      |
| nationalId   | VARCHAR(20)  | NULL   | National ID / Iqama            |
| phone        | VARCHAR(20)  | NULL    | Phone number                   |
| email        | VARCHAR(100) | NULL   | Email address                  |
| address      | TEXT         | NULL    | Home address                   |
| dateOfBirth  | DATE         | NULL    | Birth date                     |
| hireDate     | DATE         | NOT NULL| Employment start date          |
| terminationDate| DATE       | NULL    | Employment end date            |
| basicSalary  | DECIMAL(18,4)| NOT NULL| Base monthly salary            |
| housingAllow | DECIMAL(18,4)| NOT NULL| Housing allowance              |
| transportAllow| DECIMAL(18,4)| NOT NULL| Transport allowance           |
| otherAllow   | DECIMAL(18,4)| NOT NULL| Other allowances               |
| bankAccount  | VARCHAR(50)  | NULL    | Salary bank account            |
| bankName     | VARCHAR(50)  | NULL   | Bank name                      |
| status       | VARCHAR(20)  | NOT NULL| ACTIVE, ON_LEAVE, SUSPENDED,   |
|              |              |         | TERMINATED                     |
| userId       | VARCHAR(36)  | NULL    | FK -> users.id (if has access) |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, employeeNumber), INDEX (departmentId),
         INDEX (status), INDEX (nationalId), INDEX (deletedAt)

Table: attendance
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| employeeId   | VARCHAR(36)  | NOT NULL| FK -> employees.id             |
| attendanceDate| DATE        | NOT NULL| Date of attendance             |
| status       | VARCHAR(20)  | NOT NULL| PRESENT, ABSENT, LATE,         |
|              |              |         | HALF_DAY, ON_LEAVE, HOLIDAY    |
| checkIn      | TIMESTAMP    | NULL   | Check-in time                  |
| checkOut     | TIMESTAMP    | NULL    | Check-out time                 |
| workHours    | DECIMAL(5,2) | NULL   | Hours worked                   |
| overtimeHours| DECIMAL(5,2) | NOT NULL| Overtime hours                 |
| lateMinutes  | INT          | NOT NULL| Minutes late                   |
| notes        | TEXT         | NULL   | Attendance notes               |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (employeeId, attendanceDate),
         INDEX (branchId, attendanceDate), INDEX (status)

Table: leave_requests
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| employeeId   | VARCHAR(36)  | NOT NULL| FK -> employees.id             |
| leaveType    | VARCHAR(30)  | NOT NULL| ANNUAL, SICK, EMERGENCY,       |
|              |              |         | UNPAID, MATERNITY, OTHER       |
| startDate    | DATE         | NOT NULL| Leave start                    |
| endDate      | DATE         | NOT NULL| Leave end                      |
| days         | DECIMAL(5,2) | NOT NULL| Number of days                 |
| reason       | TEXT         | NULL   | Leave reason                   |
| status       | VARCHAR(20)  | NOT NULL| PENDING, APPROVED, REJECTED,   |
|              |              |         | CANCELLED                      |
| approvedBy   | VARCHAR(36)  | NULL   | Approver user                  |
| approvedAt   | TIMESTAMP    | NULL   | Approval date                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (employeeId), INDEX (status), INDEX (startDate, endDate)

Table: payroll_records
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| employeeId   | VARCHAR(36)  | NOT NULL| FK -> employees.id             |
| periodYear   | INT          | NOT NULL| Payroll year                   |
| periodMonth  | INT          | NOT NULL| Payroll month                  |
| basicSalary  | DECIMAL(18,4)| NOT NULL| Basic salary                   |
| housingAllow | DECIMAL(18,4)| NOT NULL| Housing allowance              |
| transportAllow| DECIMAL(18,4)| NOT NULL| Transport allowance            |
| otherEarnings| DECIMAL(18,4)| NOT NULL| Other earnings                 |
| overtimePay  | DECIMAL(18,4)| NOT NULL| Overtime payment               |
| grossSalary  | DECIMAL(18,4)| NOT NULL| Total earnings                 |
| deductions   | DECIMAL(18,4)| NOT NULL| Total deductions               |
| absenceDeduction| DECIMAL(18,4)| NOT NULL| Absence deduction             |
| lateDeduction| DECIMAL(18,4)| NOT NULL| Late deduction                 |
| otherDeductions| DECIMAL(18,4)| NOT NULL| Other deductions              |
| socialInsurance| DECIMAL(18,4)| NOT NULL| GOSI employer share            |
| employeeGOSI | DECIMAL(18,4)| NOT NULL| GOSI employee share            |
| taxableIncome| DECIMAL(18,4)| NOT NULL| Income subject to tax          |
| incomeTax    | DECIMAL(18,4)| NOT NULL| Income tax withheld            |
| netSalary    | DECIMAL(18,4)| NOT NULL| Net take-home pay              |
| paymentStatus| VARCHAR(20)  | NOT NULL| PENDING, APPROVED, PAID        |
| paidAt       | TIMESTAMP    | NULL   | Payment date                   |
| paidBy       | VARCHAR(36)  | NULL   | Paid by user                   |
| journalEntryId| VARCHAR(36) | NULL   | FK -> journal_entries.id       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, employeeId, periodYear, periodMonth),
         INDEX (employeeId), INDEX (periodYear, periodMonth), INDEX (paymentStatus)

Table: salary_components
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| name         | VARCHAR(100) | NOT NULL| Component name                 |
| nameAr       | VARCHAR(100) | NULL    | Arabic name                    |
| type         | VARCHAR(20)  | NOT NULL| EARNING or DEDUCTION           |
| category     | VARCHAR(30)  | NOT NULL| BASIC, ALLOWANCE, BONUS, TAX,  |
|              |              |         | INSURANCE, LOAN, OTHER         |
| isPercentage | BOOLEAN      | NOT NULL| Calculation is percentage      |
| value        | DECIMAL(10,4)| NOT NULL| Fixed amount or percentage     |
| isDefault    | BOOLEAN      | NOT NULL| Included by default            |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId), INDEX (type), INDEX (isActive)

Table: employee_documents
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| employeeId   | VARCHAR(36)  | NOT NULL| FK -> employees.id             |
| documentType | VARCHAR(50)  | NOT NULL| ID, CONTRACT, CERTIFICATE, etc.|
| documentName | VARCHAR(200) | NOT NULL| Document name                  |
| filePath     | TEXT         | NOT NULL| File storage path              |
| issueDate    | DATE         | NULL   | Document issue date            |
| expiryDate   | DATE         | NULL   | Document expiry date           |
| notes        | TEXT         | NULL   | Document notes                 |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (employeeId), INDEX (documentType), INDEX (expiryDate)

Table: employee_benefits
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| employeeId   | VARCHAR(36)  | NOT NULL| FK -> employees.id             |
| benefitType  | VARCHAR(50)  | NOT NULL| MEDICAL, HOUSING, TRANSPORT,   |
|              |              |         | EDUCATION, LOAN, OTHER         |
| amount       | DECIMAL(18,4)| NOT NULL| Benefit value                  |
| startDate    | DATE         | NOT NULL| Benefit start                  |
| endDate      | DATE         | NULL    | Benefit end (null = ongoing)   |
| description  | TEXT         | NULL   | Benefit description            |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (employeeId), INDEX (benefitType), INDEX (isActive)
```

**HR Enums:**
- `EmployeeStatus`: ACTIVE, PROBATION, ON_LEAVE, SUSPENDED, TERMINATED, RESIGNED
- `AttendanceStatus`: PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE, HOLIDAY, OFF_DAY
- `LeaveType`: ANNUAL, SICK, EMERGENCY, UNPAID, MATERNITY, PATERNITY, HAJJ, OTHER
- `PayrollStatus`: DRAFT, APPROVED, PROCESSING, PAID, CANCELLED
- `SalaryComponentType`: EARNING, DEDUCTION

---

### 5.10 CRM Module (2 Tables)

```
+-------------------------------------------------------------------+
|                     CRM (CUSTOMER RELATIONS)                       |
+-------------------------------------------------------------------+

Table: crm_leads
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| leadNumber   | VARCHAR(20)  | NOT NULL| Auto-generated lead number     |
| name         | VARCHAR(200) | NOT NULL| Lead contact name              |
| company      | VARCHAR(200) | NULL   | Company name                   |
| phone        | VARCHAR(20)  | NOT NULL| Phone number                   |
| phone2       | VARCHAR(20)  | NULL   | Secondary phone                |
| email        | VARCHAR(100) | NULL   | Email address                  |
| address      | TEXT         | NULL    | Address                        |
| source       | VARCHAR(50)  | NULL   | WEB, REFERRAL, WALK_IN, CALL,  |
|              |              |         | SOCIAL_MEDIA, OTHER            |
| status       | VARCHAR(20)  | NOT NULL| NEW, CONTACTED, QUALIFIED,     |
|              |              |         | PROPOSAL, NEGOTIATION, WON,    |
|              |              |         | LOST, CANCELLED                |
| priority     | VARCHAR(10)  | NULL    | LOW, MEDIUM, HIGH, URGENT      |
| estimatedValue| DECIMAL(18,4)| NULL   | Estimated deal value           |
| assignedTo   | VARCHAR(36)  | NULL    | FK -> users.id                 |
| notes        | TEXT         | NULL   | Lead notes                     |
| convertedToCustomerId| VARCHAR(36)| NULL| FK -> customers.id           |
| followUpDate | TIMESTAMP    | NULL    | Next follow-up date            |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, leadNumber), INDEX (status),
         INDEX (assignedTo), INDEX (followUpDate), INDEX (deletedAt)

Table: crm_activities
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| leadId       | VARCHAR(36)  | NULL    | FK -> crm_leads.id             |
| customerId   | VARCHAR(36)  | NULL    | FK -> customers.id             |
| activityType | VARCHAR(30)  | NOT NULL| CALL, EMAIL, MEETING, VISIT,   |
|              |              |         | NOTE, TASK, FOLLOW_UP          |
| subject      | VARCHAR(200) | NOT NULL| Activity subject               |
| description  | TEXT         | NULL   | Activity details               |
| activityDate | TIMESTAMP    | NOT NULL| When activity occurred         |
| duration     | INT          | NULL   | Duration in minutes            |
| outcome      | VARCHAR(50)  | NULL   | Activity result                |
| nextAction   | TEXT         | NULL   | Follow-up action               |
| nextActionDate| TIMESTAMP   | NULL   | Next action date               |
| createdBy    | VARCHAR(36)  | NULL   | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (leadId), INDEX (customerId),
         INDEX (activityDate), INDEX (activityType)
```

**CRM Enums:**
- `LeadSource`: WEBSITE, WALK_IN, PHONE, EMAIL, SOCIAL_MEDIA, REFERRAL, ADVERTISEMENT, OTHER
- `LeadStatus`: NEW, CONTACTED, QUALIFIED, PROPOSAL_SENT, NEGOTIATION, WON, LOST, CANCELLED
- `ActivityType`: CALL, EMAIL, MEETING, VISIT, NOTE, TASK, FOLLOW_UP, REMINDER

---

### 5.11 Logistics Module (6 Tables)

```
+-------------------------------------------------------------------+
|                         LOGISTICS                                  |
+-------------------------------------------------------------------+

Table: vehicles
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| vehicleNumber| VARCHAR(30)  | NOT NULL| License plate number           |
| make         | VARCHAR(50)  | NULL   | Vehicle manufacturer           |
| model        | VARCHAR(50)  | NULL   | Vehicle model                  |
| year         | INT          | NULL   | Manufacture year               |
| capacity     | DECIMAL(10,2)| NULL    | Load capacity (kg)             |
| vehicleType  | VARCHAR(30)  | NOT NULL| TRUCK, VAN, PICKUP, TRAILER,   |
|              |              |         | OTHER                          |
| status       | VARCHAR(20)  | NOT NULL| ACTIVE, MAINTENANCE, RETIRED   |
| gpsDeviceId  | VARCHAR(50)  | NULL   | GPS tracking device ID         |
| insuranceExpiry| DATE       | NULL    | Insurance expiration           |
| licenseExpiry| DATE         | NULL    | Vehicle license expiration     |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, vehicleNumber), INDEX (status), INDEX (deletedAt)

Table: drivers
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| employeeId   | VARCHAR(36)  | NULL    | FK -> employees.id             |
| licenseNumber| VARCHAR(30)  | NOT NULL| Driving license number         |
| licenseType  | VARCHAR(20)  | NOT NULL| LICENSE_TYPE (HEAVY, LIGHT)    |
| licenseExpiry| DATE         | NOT NULL| License expiration             |
| experience   | INT          | NULL    | Years of experience            |
| status       | VARCHAR(20)  | NOT NULL| ACTIVE, ON_LEAVE, SUSPENDED,   |
|              |              |         | TERMINATED                     |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, licenseNumber), INDEX (status), INDEX (deletedAt)

Table: delivery_routes
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| routeName    | VARCHAR(100) | NOT NULL| Route name                     |
| routeNameAr  | VARCHAR(100) | NULL    | Arabic route name              |
| startLocation| TEXT         | NOT NULL| Starting point                 |
| endLocation  | TEXT         | NOT NULL| Ending point                   |
| distance     | DECIMAL(10,2)| NULL    | Route distance (km)            |
| estimatedTime| INT          | NULL   | Estimated duration (minutes)   |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (branchId), INDEX (isActive)

Table: trips
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| tripNumber   | VARCHAR(30)  | NOT NULL| Auto-generated trip number     |
| vehicleId    | VARCHAR(36)  | NOT NULL| FK -> vehicles.id              |
| driverId     | VARCHAR(36)  | NOT NULL| FK -> drivers.id               |
| routeId      | VARCHAR(36)  | NULL    | FK -> delivery_routes.id       |
| tripDate     | TIMESTAMP    | NOT NULL| Trip date                      |
| status       | VARCHAR(20)  | NOT NULL| PLANNED, IN_PROGRESS,          |
|              |              |         | COMPLETED, CANCELLED           |
| startTime    | TIMESTAMP    | NULL   | Actual start time              |
| endTime      | TIMESTAMP    | NULL   | Actual end time                |
| distance     | DECIMAL(10,2)| NULL   | Actual distance                |
| fuelCost     | DECIMAL(18,4)| NOT NULL| Fuel cost                      |
| notes        | TEXT         | NULL   | Trip notes                     |
| createdBy    | VARCHAR(36)  | NULL   | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, tripNumber), INDEX (vehicleId),
         INDEX (driverId), INDEX (status), INDEX (tripDate)

Table: trip_stops
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| tripId       | VARCHAR(36)  | NOT NULL| FK -> trips.id                 |
| stopOrder    | INT          | NOT NULL| Stop sequence                  |
| customerId   | VARCHAR(36)  | NOT NULL| FK -> customers.id             |
| deliveryNoteId| VARCHAR(36) | NULL   | FK -> delivery_notes.id        |
| estimatedTime| TIMESTAMP    | NULL   | Estimated arrival              |
| actualTime   | TIMESTAMP    | NULL   | Actual arrival                 |
| status       | VARCHAR(20)  | NOT NULL| PENDING, VISITED, SKIPPED,     |
|              |              |         | DELIVERED                      |
| notes        | TEXT         | NULL   | Stop notes                     |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (tripId), INDEX (customerId), INDEX (status)

Table: vehicle_maintenance
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| vehicleId    | VARCHAR(36)  | NOT NULL| FK -> vehicles.id              |
| maintenanceType| VARCHAR(50)| NOT NULL| SERVICE, REPAIR, INSPECTION,   |
|              |              |         | TIRE_CHANGE, OTHER             |
| description  | TEXT         | NOT NULL| Maintenance description        |
| cost         | DECIMAL(18,4)| NOT NULL| Maintenance cost               |
| serviceDate  | DATE         | NOT NULL| Service date                   |
| nextService  | DATE         | NULL   | Next scheduled service         |
| serviceCenter| VARCHAR(200) | NULL   | Service provider               |
| notes        | TEXT         | NULL   | Additional notes               |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (vehicleId), INDEX (serviceDate), INDEX (nextService)
```

**Logistics Enums:**
- `VehicleType`: TRUCK, VAN, PICKUP, TRAILER, TANKER, OTHER
- `VehicleStatus`: ACTIVE, INACTIVE, MAINTENANCE, RETIRED
- `TripStatus`: PLANNED, LOADING, IN_PROGRESS, COMPLETED, CANCELLED, DELAYED
- `StopStatus`: PENDING, IN_PROGRESS, VISITED, SKIPPED, DELIVERED, FAILED

---

### 5.12 Production & Feed Module (7 Tables)

```
+-------------------------------------------------------------------+
|                    PRODUCTION & FEED MANAGEMENT                    |
+-------------------------------------------------------------------+

Table: feed_formulas
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| formulaCode  | VARCHAR(20)  | NOT NULL| Formula identifier             |
| formulaName  | VARCHAR(200) | NOT NULL| Formula name                   |
| formulaNameAr| VARCHAR(200) | NULL   | Arabic formula name            |
| feedType     | VARCHAR(50)  | NOT NULL| BROILER_STARTER, BROILER,      |
|              |              |         | GROWER, LAYER, BREEDER, OTHER  |
| targetNutrition| JSONB      | NULL   | Nutritional targets            |
| batchSize    | DECIMAL(10,4)| NOT NULL| Default batch size (kg)        |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, formulaCode), INDEX (feedType), INDEX (isActive)

Table: feed_formula_ingredients
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| formulaId    | VARCHAR(36)  | NOT NULL| FK -> feed_formulas.id         |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id (raw mat.)   |
| percentage   | DECIMAL(8,4) | NOT NULL| Ingredient % in formula        |
| quantity     | DECIMAL(12,4)| NOT NULL| Amount for batch size          |
| unitCost     | DECIMAL(18,4)| NOT NULL| Cost per unit                  |
| lineCost     | DECIMAL(18,4)| NOT NULL| Total line cost                |
| sortOrder    | INT          | NOT NULL| Display order                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (formulaId), INDEX (productId)

Table: manufacturing_orders
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| orderNumber  | VARCHAR(30)  | NOT NULL| Auto-generated MO number       |
| formulaId    | VARCHAR(36)  | NOT NULL| FK -> feed_formulas.id         |
| warehouseId  | VARCHAR(36)  | NOT NULL| Production warehouse           |
| plannedQty   | DECIMAL(12,4)| NOT NULL| Planned production quantity    |
| actualQty    | DECIMAL(12,4)| NULL   | Actual production quantity     |
| plannedDate  | TIMESTAMP    | NOT NULL| Planned production date        |
| startDate    | TIMESTAMP    | NULL   | Actual start date              |
| completionDate| TIMESTAMP   | NULL   | Actual completion date         |
| status       | VARCHAR(20)  | NOT NULL| PLANNED, ISSUED, IN_PROGRESS,  |
|              |              |         | COMPLETED, CANCELLED           |
| materialCost | DECIMAL(18,4)| NOT NULL| Total raw material cost        |
| laborCost    | DECIMAL(18,4)| NOT NULL| Labor cost allocated           |
| overheadCost | DECIMAL(18,4)| NOT NULL| Overhead cost allocated        |
| totalCost    | DECIMAL(18,4)| NOT NULL| Total production cost          |
| unitCost     | DECIMAL(18,4)| NULL   | Cost per unit produced         |
| notes        | TEXT         | NULL   | Production notes               |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, orderNumber), INDEX (formulaId),
         INDEX (status), INDEX (plannedDate)

Table: production_batches
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| moId         | VARCHAR(36)  | NOT NULL| FK -> manufacturing_orders.id  |
| batchNumber  | VARCHAR(30)  | NOT NULL| Auto-generated batch number    |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id (finished)   |
| quantity     | DECIMAL(12,4)| NOT NULL| Produced quantity              |
| unitCost     | DECIMAL(18,4)| NOT NULL| Unit production cost           |
| totalCost    | DECIMAL(18,4)| NOT NULL| Total batch cost               |
| productionDate| TIMESTAMP   | NOT NULL| Production date                |
| expiryDate   | TIMESTAMP    | NULL    | Product expiry                 |
| qualityStatus| VARCHAR(20)  | NOT NULL| PENDING, PASSED, FAILED,       |
|              |              |         | HOLD                           |
| notes        | TEXT         | NULL   | Batch notes                    |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, batchNumber), INDEX (moId), INDEX (productId)

Table: bill_of_materials
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id (finished)   |
| version      | INT          | NOT NULL| BOM version number             |
| isDefault    | BOOLEAN      | NOT NULL| Default BOM for product        |
| isActive     | BOOLEAN      | NOT NULL| Active status                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, productId, version), INDEX (productId), INDEX (isActive)

Table: bom_items
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| bomId        | VARCHAR(36)  | NOT NULL| FK -> bill_of_materials.id     |
| productId    | VARCHAR(36)  | NOT NULL| FK -> products.id (component)  |
| quantity     | DECIMAL(12,4)| NOT NULL| Required quantity              |
| wastagePercent| DECIMAL(5,4)| NOT NULL| Wastage allowance %            |
| unitCost     | DECIMAL(18,4)| NOT NULL| Component unit cost            |
| notes        | TEXT         | NULL   | Item notes                     |
| sortOrder    | INT          | NOT NULL| Display order                  |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (bomId), INDEX (productId)

Table: quality_control_checks
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| batchId      | VARCHAR(36)  | NOT NULL| FK -> production_batches.id    |
| checkDate    | TIMESTAMP    | NOT NULL| QC check date                  |
| checkedBy    | VARCHAR(36)  | NOT NULL| User who performed check       |
| moisture     | DECIMAL(5,2) | NULL    | Moisture content %             |
| protein      | DECIMAL(5,2) | NULL    | Protein content %              |
| fat          | DECIMAL(5,2) | NULL    | Fat content %                  |
| fiber        | DECIMAL(5,2) | NULL   | Fiber content %                |
| ash          | DECIMAL(5,2) | NULL    | Ash content %                  |
| pelletDurability| DECIMAL(5,2)| NULL | PDI score                      |
| result       | VARCHAR(20)  | NOT NULL| PASSED, FAILED, CONDITIONAL    |
| notes        | TEXT         | NULL   | QC notes                       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (batchId), INDEX (checkDate), INDEX (result)
```

**Production Enums:**
- `FeedType`: BROILER_STARTER, BROILER_GROWER, BROILER_FINISHER, LAYER, BREEDER, CUSTOM
- `ManufacturingStatus`: PLANNED, ISSUED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD
- `QualityStatus`: PENDING, IN_PROGRESS, PASSED, FAILED, CONDITIONAL, HOLD
- `BOMStatus`: ACTIVE, INACTIVE, DRAFT, OBSOLETE

---

### 5.13 Poultry Module (5 Tables)

```
+-------------------------------------------------------------------+
|                         POULTRY                                    |
+-------------------------------------------------------------------+

Table: sheds
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| shedCode     | VARCHAR(20)  | NOT NULL| Shed identifier                |
| shedName     | VARCHAR(100) | NOT NULL| Shed name                      |
| shedNameAr   | VARCHAR(100) | NULL    | Arabic shed name               |
| shedType     | VARCHAR(20)  | NOT NULL| BROILER, LAYER, BREEDER,       |
|              |              |         | QUAIL, OTHER                   |
| capacity     | INT          | NOT NULL| Bird capacity                  |
| currentCount | INT          | NOT NULL| Current bird count             |
| length       | DECIMAL(8,2) | NULL    | Shed length (meters)           |
| width        | DECIMAL(8,2) | NULL    | Shed width (meters)            |
| area         | DECIMAL(10,2)| NULL   | Total area (sq meters)         |
| ventilationType| VARCHAR(30)| NULL    | NATURAL, TUNNEL, CROSS_VENT    |
| coolingSystem| BOOLEAN      | NOT NULL| Has cooling system             |
| status       | VARCHAR(20)  | NOT NULL| ACTIVE, EMPTY, CLEANING,       |
|              |              |         | MAINTENANCE, INACTIVE          |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| updatedBy    | VARCHAR(36)  | NULL    | Last modifier                  |
| deletedAt    | TIMESTAMP    | NULL    | Soft delete marker             |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, shedCode), INDEX (shedType),
         INDEX (status), INDEX (deletedAt)

Table: chick_batches
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| batchNumber  | VARCHAR(30)  | NOT NULL| Auto-generated batch number    |
| batchName    | VARCHAR(100) | NOT NULL| Batch identifier name          |
| shedId       | VARCHAR(36)  | NOT NULL| FK -> sheds.id                 |
| breed        | VARCHAR(50)  | NOT NULL| Bird breed (COBB, ROSS, etc.)  |
| supplierId   | VARCHAR(36)  | NULL   | FK -> suppliers.id             |
| initialCount | INT          | NOT NULL| Chicks placed                  |
| currentCount | INT          | NOT NULL| Current alive count            |
| arrivalDate  | DATE         | NOT NULL| Date chicks arrived            |
| expectedSaleDate| DATE      | NULL   | Projected sale date            |
| actualSaleDate| DATE        | NULL    | Actual sale date               |
| ageInDays    | INT          | NOT NULL| Current age (auto-calculated)  |
| averageWeight| DECIMAL(8,4) | NULL    | Average bird weight (kg)       |
| fcr          | DECIMAL(6,4) | NULL    | Feed conversion ratio          |
| status       | VARCHAR(20)  | NOT NULL| ACTIVE, SOLD, CULLED,          |
|              |              |         | EMPTIED                        |
| costPerChick | DECIMAL(10,4)| NOT NULL| Purchase cost per chick        |
| totalCost    | DECIMAL(18,4)| NOT NULL| Total batch cost               |
| notes        | TEXT         | NULL   | Batch notes                    |
| createdBy    | VARCHAR(36)  | NULL    | Creator                        |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), UNIQUE (branchId, batchNumber), INDEX (shedId),
         INDEX (status), INDEX (arrivalDate)

Table: egg_production
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| batchId      | VARCHAR(36)  | NOT NULL| FK -> chick_batches.id         |
| shedId       | VARCHAR(36)  | NOT NULL| FK -> sheds.id                 |
| productionDate| DATE        | NOT NULL| Date of collection             |
| totalEggs    | INT          | NOT NULL| Total eggs collected           |
| goodEggs     | INT          | NOT NULL| Grade A/B eggs                 |
| crackedEggs  | INT          | NOT NULL| Damaged eggs                   |
| dirtyEggs    | INT          | NOT NULL| Dirty eggs                     |
| smallEggs    | INT          | NOT NULL| Undersized eggs                |
| brokenEggs   | INT          | NOT NULL| Broken eggs                    |
| productionPercent| DECIMAL(5,2)| NULL | Laying percentage              |
| feedConsumed | DECIMAL(10,4)| NOT NULL| Feed consumed (kg)             |
| notes        | TEXT         | NULL   | Collection notes               |
| recordedBy   | VARCHAR(36)  | NULL   | Recorder                       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
| updatedAt    | TIMESTAMP    | NOT NULL| Last modification              |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (batchId), INDEX (shedId),
         INDEX (productionDate), INDEX (branchId, productionDate)

Table: poultry_mortality
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| batchId      | VARCHAR(36)  | NOT NULL| FK -> chick_batches.id         |
| shedId       | VARCHAR(36)  | NOT NULL| FK -> sheds.id                 |
| mortalityDate| DATE         | NOT NULL| Date of mortality              |
| count        | INT          | NOT NULL| Number of dead birds           |
| cause        | VARCHAR(100) | NULL    | Cause of death                 |
| ageInDays    | INT          | NOT NULL| Bird age at death              |
| notes        | TEXT         | NULL   | Mortality notes                |
| recordedBy   | VARCHAR(36)  | NULL   | Recorder                       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (batchId), INDEX (mortalityDate), INDEX (branchId, mortalityDate)

Table: poultry_feeding
+--------------+--------------+---------+--------------------------------+
| Column       | Type         | Nullable| Description                    |
+--------------+--------------+---------+--------------------------------+
| id           | VARCHAR(36)  | NOT NULL| Primary Key (UUID)             |
| branchId     | VARCHAR(36)  | NOT NULL| FK -> branches.id              |
| batchId      | VARCHAR(36)  | NOT NULL| FK -> chick_batches.id         |
| shedId       | VARCHAR(36)  | NOT NULL| FK -> sheds.id                 |
| feedingDate  | DATE         | NOT NULL| Feeding date                   |
| feedType     | VARCHAR(50)  | NOT NULL| Feed type used                 |
| feedProductId| VARCHAR(36)  | NOT NULL| FK -> products.id              |
| quantity     | DECIMAL(10,4)| NOT NULL| Feed given (kg)                |
| feedConversion| DECIMAL(6,4)| NULL   | FCR for this period            |
| bodyWeight   | DECIMAL(8,4) | NULL   | Average body weight            |
| waterIntake  | DECIMAL(10,4)| NULL    | Water consumed (liters)        |
| temperature  | DECIMAL(4,1) | NULL   | Shed temperature (Celsius)     |
| humidity     | DECIMAL(4,1) | NULL   | Shed humidity %                |
| notes        | TEXT         | NULL   | Feeding notes                  |
| recordedBy   | VARCHAR(36)  | NULL    | Recorder                       |
| createdAt    | TIMESTAMP    | NOT NULL| Record creation                |
+--------------+--------------+---------+--------------------------------+
Indexes: PRIMARY (id), INDEX (batchId), INDEX (feedingDate),
         INDEX (feedProductId), INDEX (branchId, feedingDate)
```

**Poultry Enums:**
- `ShedType`: BROILER, LAYER, BREEDER, QUAIL, BROODER, GROWER, FINISHER
- `BatchStatus`: ACTIVE, SOLD, CULLED, EMPTIED, TRANSFERRED
- `MortalityCause`: DISEASE, HEAT_STRESS, COLD_STRESS, DEHYDRATION, STARVATION, PREDATOR, UNKNOWN, OTHER
- `EggGrade`: AA, A, B, CRACKED, DIRTY, SMALL, DOUBLE_YOLK, BROKEN

---

## 6. Key Design Patterns

### 6.1 Multi-Tenancy via branchId

Every transactional table includes a `branchId` column:

```sql
-- Automatic branch filtering in queries
SELECT * FROM sales_orders
WHERE branchId = 'current-branch-id'
  AND deletedAt IS NULL;

-- Branch isolation enforced at application layer
-- Users can only access branches assigned via user_roles.branchId
```

### 6.2 Soft Delete via deletedAt

Records are never physically deleted:

```sql
-- Instead of: DELETE FROM products WHERE id = 'xxx'
-- Use: UPDATE products SET deletedAt = NOW() WHERE id = 'xxx'

-- All queries automatically filter:
SELECT * FROM products WHERE deletedAt IS NULL;
```

### 6.3 Audit Fields

Every table includes standard audit fields:

| Field | Type | Purpose |
|-------|------|---------|
| `createdAt` | TIMESTAMP | Record creation timestamp |
| `updatedAt` | TIMESTAMP | Last modification timestamp |
| `createdBy` | VARCHAR(36) | User ID who created the record |
| `updatedBy` | VARCHAR(36) | User ID who last modified |

### 6.4 Decimal Precision for Monetary Values

All monetary values use `DECIMAL(18,4)`:
- 18 total digits
- 4 decimal places for precision
- No floating-point rounding errors
- Supports values up to 999,999,999,999.9999

### 6.5 JSON Fields for Flexible Data

JSONB columns for extensible attributes:

| Table | JSONB Column | Purpose |
|-------|-------------|---------|
| `products` | `attributes` | Product-specific attributes |
| `branches` | `settings` | Branch configuration |
| `feed_formulas` | `targetNutrition` | Nutritional targets |

### 6.6 Self-Referential Hierarchies

Tree structures using self-referential foreign keys:

```sql
-- Product categories hierarchy
SELECT * FROM product_categories WHERE parentId = 'parent-category-id';

-- Chart of accounts tree
SELECT * FROM chart_of_accounts WHERE parentId IS NULL; -- Root accounts
SELECT * FROM chart_of_accounts WHERE parentId = 'parent-account-id';

-- Department hierarchy
SELECT * FROM departments WHERE parentId = 'parent-dept-id';
```

---

## 7. Indexing Strategy

### 7.1 Index Categories

```
+-------------------------------------------------------------+
|                      INDEX MAP                              |
+-------------------------------------------------------------+

Primary Indexes (73):
  Every table has PRIMARY KEY on id column (UUID)

Unique Indexes (45):
  - branchId + code combinations (products, accounts, employees)
  - branchId + orderNumber (sales_orders, purchase_orders)
  - Document numbers (entryNumber, batchNumber)
  - Composite unique constraints

Foreign Key Indexes (108):
  - All foreign key columns indexed
  - Cascade delete where appropriate
  - Enables efficient JOIN operations

Composite Indexes (68):
  - branchId + status (common filtering pattern)
  - periodYear + periodMonth (accounting queries)
  - productId + warehouseId (inventory lookups)
  - employeeId + attendanceDate (attendance)

Partial Indexes (25):
  - WHERE isActive = true
  - WHERE deletedAt IS NULL
  - WHERE status IN ('ACTIVE', 'CONFIRMED')

Full-Text Search Indexes (13):
  - product name and description (Arabic + English)
  - customer name search
  - general ledger descriptions
```

### 7.2 Critical Query Paths

| Query Pattern | Index Strategy |
|--------------|----------------|
| Sales order by number | UNIQUE(branchId, orderNumber) |
| Customer lookup by phone | INDEX(phone) |
| Inventory by product + warehouse | UNIQUE(branchId, productId, warehouseId) |
| GL entries by account + date | INDEX(branchId, accountId, entryDate) |
| Attendance by employee + date | UNIQUE(employeeId, attendanceDate) |
| Stock movements by product | INDEX(branchId, productId, createdAt DESC) |
| Journal entries by period | INDEX(branchId, periodYear, periodMonth) |
| Poultry mortality by batch | INDEX(batchId, mortalityDate) |

### 7.3 Index Maintenance

```sql
-- Regular index maintenance (weekly)
REINDEX INDEX CONCURRENTLY idx_inventory_branch_product;

-- Analyze tables for query planner
ANALYZE sales_orders;
ANALYZE inventory;
ANALYZE journal_entries;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## 8. Data Integrity Rules

### 8.1 Database Constraints

| Constraint Type | Count | Examples |
|----------------|-------|----------|
| Primary Keys | 73 | All id columns |
| Foreign Keys | 108 | All relationship columns |
| Unique Constraints | 45 | Document numbers, codes |
| Check Constraints | 30 | Status enums, positive amounts |
| Not Null | 500+ | Required fields |

### 8.2 Business Rules Enforced in Database

```sql
-- Check constraints
ALTER TABLE sales_order_items ADD CONSTRAINT chk_positive_quantity
  CHECK (quantity > 0);

ALTER TABLE journal_entry_lines ADD CONSTRAINT chk_non_negative_amounts
  CHECK (debit >= 0 AND credit >= 0);

ALTER TABLE employees ADD CONSTRAINT chk_salary_positive
  CHECK (basicSalary > 0);

-- Ensure journal entries balance
ALTER TABLE journal_entries ADD CONSTRAINT chk_balanced_entry
  CHECK (totalDebit = totalCredit);

-- Prevent negative inventory
ALTER TABLE inventory ADD CONSTRAINT chk_non_negative_quantity
  CHECK (quantity >= 0);
```

### 8.3 Application-Level Validations

```
1. Sales order total must equal sum of line items
2. Journal entry total debit must equal total credit
3. Inventory quantity cannot go below zero
4. Payroll gross = earnings - deductions
5. Transfer amount must not exceed source balance
6. Egg production breakdown must sum to total
7. Chick batch currentCount <= initialCount
8. Duplicate document numbers prevented per branch
9. Fiscal period must be open for posting
10. Branch isolation enforced on all queries
```

### 8.4 Cascading Rules

| Parent | Child | Cascade Behavior |
|--------|-------|-----------------|
| branches | All child tables | Restrict (prevent deletion) |
| users | createdBy/updatedBy | Set NULL |
| products | sales_order_items | Restrict |
| products | inventory | Restrict |
| customers | sales_orders | Restrict |
| sales_orders | sales_order_items | CASCADE delete |
| chart_of_accounts | journal_entry_lines | Restrict |
| employees | attendance | CASCADE delete |
| employees | payroll_records | Restrict |

---

## 9. Migration Strategy

### 9.1 Prisma Migration Workflow

```
Development:                    Production:
+------------+                  +------------+
| Update     |                  | Review     |
| schema.pris|                  | migration  |
+-----+------+                  | file       |
      |                         +-----+------+
      v                               |
+-----+------+                        v
| prisma     |                  +-----+------+
| migrate dev|                  | prisma     |
| (generate) |                  | migrate    |
+-----+------+                  | deploy     |
      |                         +-----+------+
      v                               |
+-----+------+                        v
| Review     |                  +-----+------+
| migration  |                  | Verify     |
| SQL file   |                  | deployment |
+------------+                  +------------+
```

### 9.2 Migration Commands

```bash
# Development - generate migration from schema changes
npx prisma migrate dev --name add_poultry_module

# Production - apply pending migrations
npx prisma migrate deploy

# Create migration without applying
npx prisma migrate dev --create-only --name add_indexes

# Reset (development only)
npx prisma migrate reset

# Validate schema
npx prisma validate

# Generate client only
npx prisma generate
```

### 9.3 Migration Naming Convention

| Prefix | Usage | Example |
|--------|-------|---------|
| `init` | Initial schema | `20240101000000_init` |
| `add_` | Add tables/columns | `20240201_add_egg_production` |
| `mod_` | Modify existing | `20240215_modify_sales_order_status` |
| `idx_` | Index changes | `20240301_idx_sales_order_date` |
| `seed_` | Data migrations | `20240315_seed_default_accounts` |

### 9.4 Zero-Downtime Migration Guidelines

```sql
-- 1. Add new column as nullable
ALTER TABLE products ADD COLUMN new_field VARCHAR(50);

-- 2. Deploy application code that writes to both old and new
-- 3. Backfill data
UPDATE products SET new_field = old_field WHERE new_field IS NULL;

-- 4. Add NOT NULL constraint
ALTER TABLE products ALTER COLUMN new_field SET NOT NULL;

-- 5. Deploy application code that reads from new field
-- 6. Remove old column (future migration)
```

---

## 10. Backup and Recovery

### 10.1 Backup Strategy

| Backup Type | Frequency | Retention | Storage |
|-------------|-----------|-----------|---------|
| **Full Database** | Daily at 2:00 AM | 30 days | Local + Remote |
| **Schema Only** | Weekly | 90 days | Local |
| **Pre-Deployment** | Before every deploy | Until next deploy | Local |

### 10.2 Backup Script

```bash
#!/bin/bash
# Automated backup script
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/gff-erp/backups"
DB_NAME="gff_erp_db"
DB_USER="gff_erp_user"

# Create backup
pg_dump -U $DB_USER -d $DB_NAME -F c -f "$BACKUP_DIR/gff_erp_$DATE.dump"

# Compress
pigz "$BACKUP_DIR/gff_erp_$DATE.dump"

# Delete old backups (retention: 30 days)
find $BACKUP_DIR -name "gff_erp_*.dump.gz" -mtime +30 -delete

# Sync to remote (if configured)
# aws s3 sync $BACKUP_DIR s3://gff-erp-backups/
```

### 10.3 Recovery Procedures

```bash
# Full restore from backup
dropdb gff_erp_db && createdb gff_erp_db
pg_restore -U gff_erp_user -d gff_erp_db gff_erp_20250115_020000.dump

# Restore specific schema
gunzip < gff_erp_20250115_020000.dump.gz | pg_restore --schema=public

# Point-in-time recovery (requires WAL archiving)
# 1. Restore base backup
# 2. Apply WAL segments up to recovery target time
```

### 10.4 Disaster Recovery RTO/RPO

| Metric | Target |
|--------|--------|
| **RTO (Recovery Time Objective)** | 4 hours |
| **RPO (Recovery Point Objective)** | 24 hours (last daily backup) |
| **Transaction Log Backup** | Every 15 minutes (optional) |

---

## 11. Performance Optimization

### 11.1 Query Optimization Guidelines

```sql
-- Use EXPLAIN ANALYZE for query tuning
EXPLAIN ANALYZE
SELECT so.orderNumber, so.orderDate, c.name, SUM(soi.lineTotal)
FROM sales_orders so
JOIN customers c ON so.customerId = c.id
JOIN sales_order_items soi ON so.id = soi.orderId
WHERE so.branchId = 'xxx'
  AND so.orderDate BETWEEN '2025-01-01' AND '2025-01-31'
GROUP BY so.id, c.name;

-- Optimal query patterns:
-- 1. Filter by branchId first (most selective)
-- 2. Use indexed date ranges
-- 3. Avoid SELECT * on large tables
-- 4. Use JOIN instead of subqueries where possible
-- 5. Limit result sets for pagination
```

### 11.2 Performance Targets

| Operation | Target Response Time |
|-----------|---------------------|
| Simple CRUD (single record) | < 100ms |
| List query (paginated, 50 records) | < 200ms |
| Complex report (aggregated) | < 2 seconds |
| Dashboard KPIs | < 1 second |
| Search (full-text) | < 500ms |
| Bulk import (1,000 records) | < 10 seconds |
| Financial statement generation | < 3 seconds |

### 11.3 Table Size Estimates

| Table | Estimated Rows (Medium) | Row Size | Total Size |
|-------|------------------------|----------|------------|
| sales_orders | 500,000 | 500 B | 250 MB |
| sales_order_items | 2,000,000 | 200 B | 400 MB |
| inventory | 50,000 | 150 B | 7.5 MB |
| stock_movements | 5,000,000 | 200 B | 1 GB |
| journal_entries | 1,000,000 | 400 B | 400 MB |
| general_ledger | 5,000,000 | 200 B | 1 GB |
| products | 5,000 | 500 B | 2.5 MB |
| customers | 50,000 | 300 B | 15 MB |
| employees | 1,000 | 400 B | 400 KB |
| **Total** | ~15M rows | - | ~3.5 GB |

### 11.4 Connection Pool Tuning

```
Prisma Connection Pool:
  connection_limit: 20 per instance
  pool_timeout: 30 seconds

Recommended (Medium deployment, 4 PM2 instances):
  Max Connections: 200 (PostgreSQL setting)
  Used: 20 x 4 instances = 80 connections
  Reserved: 20 for admin/maintenance
  Available: 100 for growth

If using PgBouncer:
  pool_mode: transaction
  max_client_conn: 1000
  default_pool_size: 25
  reserve_pool_size: 5
```

### 11.5 Maintenance Schedule

| Task | Frequency | Command/Method |
|------|-----------|----------------|
| VACUUM ANALYZE | Daily (auto) | autovacuum enabled |
| REINDEX | Monthly | REINDEX INDEX CONCURRENTLY |
| Log cleanup | Weekly | Delete logs older than 30 days |
| Backup verification | Monthly | Test restore on staging |
| Statistics refresh | Daily | ANALYZE on all tables |
| Partition management | Monthly | Create new partitions if needed |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-01 | Technical Team | Initial document |

---

*This document is the property of GFF ERP Enterprise. Unauthorized distribution is prohibited.*
