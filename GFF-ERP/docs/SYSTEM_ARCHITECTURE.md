# GFF ERP Enterprise - System Architecture Document

**Document Version:** 1.0  
**Date:** June 2025  
**Classification:** Technical Architecture  
**Status:** Production Ready

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Business Domain](#3-business-domain)
4. [Architecture Patterns](#4-architecture-patterns)
5. [Technology Stack](#5-technology-stack)
6. [System Architecture Diagram](#6-system-architecture-diagram)
7. [Backend Architecture](#7-backend-architecture)
8. [Frontend Architecture](#8-frontend-architecture)
9. [Security Architecture](#9-security-architecture)
10. [Data Flow Diagrams](#10-data-flow-diagrams)
11. [Integration Points](#11-integration-points)
12. [Scalability Considerations](#12-scalability-considerations)
13. [Deployment Architecture](#13-deployment-architecture)

---

## 1. Executive Summary

GFF ERP Enterprise is a comprehensive, modular Enterprise Resource Planning system purpose-built for feed distribution, manufacturing, and poultry management operations. The system provides end-to-end business process automation across accounting, inventory, sales, procurement, human resources, customer relationship management, logistics, production, and poultry lifecycle management.

Built on modern web technologies with a React frontend and NestJS backend, GFF ERP delivers a responsive, Arabic/English bilingual interface with robust multi-tenant support enabling branch-level data isolation. The architecture follows Clean Architecture principles ensuring maintainability, testability, and long-term scalability.

**Key Capabilities:**
- Multi-branch operations with complete data isolation
- Real-time inventory tracking with automatic stock movements
- Full accounting suite (general ledger, chart of accounts, journal entries, financial statements)
- Sales and procurement lifecycle management
- Manufacturing and feed formula management
- Poultry batch lifecycle tracking (chicks to eggs)
- HR management with attendance and payroll processing
- Comprehensive audit logging for all mutations
- Role-based access control with granular permissions

---

## 2. System Overview

### 2.1 System Identification

| Attribute | Value |
|-----------|-------|
| **System Name** | GFF ERP Enterprise |
| **Version** | 1.0.0 |
| **Type** | Enterprise Resource Planning (ERP) |
| **Deployment Model** | On-premises / Private Cloud |
| **License** | Proprietary |
| **Primary Language** | Arabic (with English support) |

### 2.2 System Context

```
+------------------+     +------------------+     +------------------+
|   End Users      |     |   System Admin   |     |   Management     |
| (Sales, Inventory|     | (IT Operations)  |     | (Reports, KPIs)  |
|  Accounting, HR) |     |                  |     |                  |
+--------+---------+     +--------+---------+     +--------+---------+
         |                        |                        |
         +------------------------+------------------------+
                                  |
                    +-------------v-------------+
                    |     GFF ERP Enterprise    |
                    |    (React + NestJS +      |
                    |     PostgreSQL + Nginx)   |
                    +-------------+-------------+
                                  |
                    +-------------v-------------+
                    |    PostgreSQL 16 Database |
                    +---------------------------+
```

### 2.3 High-Level Capabilities

| Domain | Capability Description |
|--------|----------------------|
| **Authentication** | JWT-based authentication with refresh tokens, role-based access control |
| **Organization** | Multi-branch management with isolated data per branch |
| **Product Catalog** | Hierarchical product categories, unit management, barcode support |
| **Inventory** | Real-time stock tracking, warehouse management, stock movements, adjustments |
| **Sales** | Sales orders, quotations, delivery notes, invoices, returns |
| **Procurement** | Purchase orders, goods receipt notes, supplier management |
| **Treasury** | Cash boxes, bank accounts, transfers, position tracking |
| **Accounting** | Chart of accounts, journal entries, general ledger, financial statements |
| **Human Resources** | Employee management, attendance tracking, leave management, payroll |
| **CRM** | Lead management, customer activities, follow-ups |
| **Logistics** | Vehicle fleet, drivers, trip management, delivery tracking |
| **Production** | Manufacturing orders, feed formulas, production batches |
| **Poultry** | Chick batches, shed management, egg production, mortality tracking |
| **Reporting** | Comprehensive reports across all modules with export support |

---

## 3. Business Domain

### 3.1 Domain Overview

GFF ERP operates in the **Animal Feed & Poultry Industry**, serving businesses involved in:

1. **Feed Manufacturing** - Production of animal/poultry feed formulas
2. **Feed Distribution** - Wholesale and retail distribution of feed products
3. **Poultry Operations** - Broiler and layer farm management

### 3.2 Business Processes

```
+------------------+    +------------------+    +------------------+
|   PROCUREMENT    |--->|   INVENTORY      |--->|   SALES          |
|   (Buy Feed/     |    |   (Stock         |    |   (Sell to       |
|    Materials)    |    |    Management)   |    |    Customers)    |
+--------+---------+    +--------+---------+    +--------+---------+
         |                       |                       |
         v                       v                       v
+------------------+    +------------------+    +------------------+
|   TREASURY       |<---|   ACCOUNTING     |<---|   MANUFACTURING  |
|   (Payments/     |    |   (Financial     |    |   (Feed          |
|    Banking)      |    |    Records)      |    |    Production)   |
+------------------+    +------------------+    +--------+---------+
                                                          |
+------------------+    +------------------+              |
|   HR & PAYROLL   |    |   POULTRY        |<-------------+
|   (Staff Mgmt)   |    |   (Farm Ops)     |
+------------------+    +------------------+
```

### 3.3 Core Business Entities

| Entity | Description | Key Attributes |
|--------|-------------|----------------|
| Product | Feed products, materials, medicines | SKU, barcode, unit, price, category |
| Warehouse | Storage locations | Name, location, capacity, manager |
| Stock | Inventory records | Product, warehouse, quantity, reserved |
| Customer | B2B and B2C buyers | Name, phone, address, credit limit, balance |
| Supplier | Vendors and manufacturers | Name, phone, address, balance |
| Sales Order | Customer order document | Customer, items, total, status, date |
| Purchase Order | Supplier order document | Supplier, items, total, status, date |
| Journal Entry | Accounting transaction | Date, entries (debit/credit), reference |
| Employee | Staff record | Name, department, salary, join date |
| Chick Batch | Poultry batch | Breed, quantity, arrival date, shed |

### 3.4 Multi-Language Support

The system fully supports **Arabic (RTL)** as the primary interface language with English as secondary:
- All UI labels and messages stored in translation files
- RTL layout direction for Arabic interface
- Bilingual reporting with Arabic numerals
- Date formatting per locale (Hijri calendar support planned)

---

## 4. Architecture Patterns

### 4.1 Clean Architecture / Layered Architecture

The backend follows **Clean Architecture** principles with clear separation of concerns:

```
+-----------------------------+
|     Presentation Layer      |
|  (Controllers / DTOs /      |
|   Validation / Guards)      |
+-------------+---------------+
              |
+-------------v---------------+
|      Application Layer      |
|  (Services / Use Cases /    |
|   Business Logic)           |
+-------------+---------------+
              |
+-------------v---------------+
|       Domain Layer          |
|  (Entities / Enums /        |
|   Domain Rules)             |
+-------------+---------------+
              |
+-------------v---------------+
|    Infrastructure Layer     |
|  (Repository / Database /   |
|   External Services)        |
+-----------------------------+
```

**Dependency Rule:** Dependencies point inward. The Domain layer has no external dependencies.

### 4.2 Modular Monolith (NestJS Modules)

The system is organized as a **Modular Monolith** using NestJS modules:

```
+-------------------------------+
|         App Module            |
|  (Root module - imports all)  |
+------+----+----+----+---------+
       |    |    |    |
+------v+ +-v----+ +v------+ +v-------+
|Auth   | |User  | |Branch | |Product |
|Module | |Module| |Module | |Module  |
+-------+ +------+ +-------+ +--------+
       |    |    |    |
+------v+ +-v----+ +v------+ +v-------+
|Sales  | |Purch.| |Inv.   | |Treasury|
|Module | |Module| |Module | |Module  |
+-------+ +------+ +-------+ +--------+
       |    |    |    |
+------v+ +-v----+ +v------+ +v-------+
|Acct.  | |HR    | |CRM    | |Logistic|
|Module | |Module| |Module | |Module  |
+-------+ +------+ +-------+ +--------+
       |         |
+------v+ +------v+
|Prod.  | |Poultry |
|Module | |Module |
+-------+ +-------+
```

**Module Structure per Domain:**
```
src/
  modules/
    auth/
      auth.module.ts
      auth.controller.ts
      auth.service.ts
      dto/
        login.dto.ts
        refresh-token.dto.ts
      guards/
        jwt-auth.guard.ts
        roles.guard.ts
      strategies/
        jwt.strategy.ts
```

### 4.3 Domain-Driven Design Principles

DDD patterns applied throughout the system:

| DDD Pattern | Implementation |
|-------------|---------------|
| **Bounded Context** | Each NestJS module represents a bounded context |
| **Aggregates** | Transactional consistency boundaries (e.g., SalesOrder + SalesOrderItems) |
| **Entities** | Prisma models with unique identity (id fields) |
| **Value Objects** | DTOs for data transfer, embedded types |
| **Repositories** | Prisma ORM as the repository layer |
| **Domain Services** | Service classes containing business logic |
| **Application Services** | Controller methods orchestrating use cases |

---

## 5. Technology Stack

### 5.1 Complete Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | React | 18.x | UI framework |
| **Frontend Build** | Vite | 5.x | Build tool and dev server |
| **UI Library** | Material-UI (MUI) | 5.x | Component library |
| **State Management** | Redux Toolkit | 2.x | Global state management |
| **Server State** | React Query | 5.x | API data caching and synchronization |
| **Routing** | React Router | 6.x | Client-side routing |
| **Forms** | React Hook Form | 7.x | Form handling and validation |
| **HTTP Client** | Axios | 1.x | API communication |
| **Charts** | Recharts | 2.x | Data visualization |
| **Backend** | NestJS | 10.x | Server framework |
| **Language** | TypeScript | 5.x | Type-safe development |
| **ORM** | Prisma | 5.x | Database ORM and migrations |
| **Database** | PostgreSQL | 16.x | Primary data store |
| **Authentication** | Passport.js | 0.7.x | Authentication middleware |
| **JWT** | @nestjs/jwt | 10.x | Token generation and validation |
| **Validation** | class-validator | 0.14.x | DTO validation |
| **API Docs** | Swagger/OpenAPI | 7.x | API documentation |
| **Web Server** | Nginx | 1.24+ | Reverse proxy and static files |
| **Process Manager** | PM2 | 5.x | Node.js process management |
| **SSL** | Certbot/Let's Encrypt | Latest | SSL certificate management |
| **OS** | Ubuntu Server | 24.04 LTS | Server operating system |

### 5.2 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| Prettier | Code formatting |
| Jest | Unit and integration testing |
| Supertest | API endpoint testing |
| Playwright | End-to-end testing |
| Prisma Studio | Database management UI |
| Swagger UI | API documentation and testing |

---

## 6. System Architecture Diagram

### 6.1 Complete System Architecture

```
+------------------------------------------------------------------------+
|                              CLIENT LAYER                               |
|  +------------------+  +------------------+  +------------------+      |
|  |   Web Browser    |  |   Web Browser    |  |   Web Browser    |      |
|  | (Admin User)     |  | (Sales Staff)    |  | (Accountant)     |      |
|  +--------+---------+  +--------+---------+  +--------+---------+      |
|           |                     |                     |                |
+-----------+---------------------+---------------------+----------------+
            |                     |                     |
            |    HTTPS (443)      |                     |
+-----------v---------------------v---------------------v----------------+
|                           NGINX SERVER                                |
|  +------------------+  +------------------+  +---------------------+ |
|  |   Rate Limiting  |  |   SSL/TLS        |  |   Security Headers  | |
|  |   (req/min)      |  |   (Let's Encrypt)|  |   (CSP/HSTS/etc)   | |
|  +------------------+  +------------------+  +---------------------+ |
|                                                                       |
|  +-----------------------------+  +------------------------------+   |
|  |   Frontend Static Files     |  |   API Reverse Proxy          |   |
|  |   /var/www/gff-erp          |  |   -> localhost:3000          |   |
|  |   (React SPA build)         |  |   /api/*                     |   |
|  +-----------------------------+  +------------------------------+   |
+----------------------------------+------------------------------------+
                                   |
                                   | HTTP (3000)
                                   |
+----------------------------------v------------------------------------+
|                          NESTJS BACKEND                               |
|                         (PM2 Cluster Mode)                            |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Middleware      |  |  Authentication  |  |  Validation Pipe    | |
|  |  - CORS          |  |  - JWT Guard     |  |  - class-validator  | |
|  |  - Helmet        |  |  - RBAC Guard    |  |  - Transformation   | |
|  |  - Compression   |  |  - Branch Scope  |  |  - Whitelist        | |
|  +------------------+  +------------------+  +---------------------+ |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Auth Module     |  |  User Module     |  |  Branch Module      | |
|  +------------------+  +------------------+  +---------------------+ |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Product Module  |  |  Inventory Module|  |  Sales Module       | |
|  +------------------+  +------------------+  +---------------------+ |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Purchase Module |  |  Treasury Module |  |  Bank Module        | |
|  +------------------+  +------------------+  +---------------------+ |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Accounting Module|  |  HR Module      |  |  CRM Module         | |
|  +------------------+  +------------------+  +---------------------+ |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Logistics Module|  |  Production Module|  |  Poultry Module    | |
|  +------------------+  +------------------+  +---------------------+ |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Report Module   |  |  Dashboard Module|  |  Audit Log Module   | |
|  +------------------+  +------------------+  +---------------------+ |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+ |
|  |  Exception Filter|  |  Interceptor     |  |  Audit Interceptor  | |
|  |  (Global)        |  |  (Transform)     |  |  (Auto-log)         | |
|  +------------------+  +------------------+  +---------------------+ |
+----------------------------------+------------------------------------+
                                   |
                                   | Prisma ORM
                                   |
+----------------------------------v------------------------------------+
|                       POSTGRESQL 16 DATABASE                          |
|                                                                       |
|  +------------------+  +------------------+  +---------------------+ |
|  |  73 Models       |  |  54 Enums        |  |  332 Indexes        | |
|  |  (Tables)        |  |  (Type-safe)     |  |  (Performance)      | |
|  +------------------+  +------------------+  +---------------------+ |
|                                                                       |
|  Schema Modules:                                                      |
|  - System (6) + Organization (2) + Products (4) + Inventory (7)      |
|  - Sales (8) + Procurement (6) + Treasury (5) + Accounting (7)       |
|  - HR (8) + CRM (2) + Logistics (6) + Production (7) + Poultry (5)  |
|                                                                       |
+-----------------------------------------------------------------------+
```

### 6.2 Authentication Flow

```
+--------+                                  +---------------+
| Client |                                  | GFF ERP       |
|        |                                  | Backend       |
+---+----+                                  +-------+-------+
    |                                               |
    |  1. POST /api/auth/login                      |
    |     { username, password }                    |
    +---------------------------------------------->|
    |                                               |
    |  2. Validate credentials                      |
    |     - Find user by username                   |
    |     - Compare bcrypt hash                     |
    |     - Check active status                     |
    |                                               |
    |  3. Generate tokens                           |
    |     - Access token (JWT, 15 min)              |
    |     - Refresh token (JWT, 7 days)             |
    |                                               |
    |                    4. { accessToken,          |
    |                       refreshToken, user }    |
    |<----------------------------------------------+
    |                                               |
    |  5. Store tokens (httpOnly cookie + memory)   |
    |                                               |
    |  6. Subsequent requests with                  |
    |     Authorization: Bearer <accessToken>       |
    +---------------------------------------------->|
    |                                               |
    |  7. JWT Guard validates token                 |
    |     - Extract from header                     |
    |     - Verify signature                        |
    |     - Attach user to request                  |
    |                                               |
    |  8. RBAC Guard checks permissions             |
    |     - Required roles/permissions              |
    |     - User's assigned roles                   |
    |                                               |
    |  9. Branch Scoping Middleware                 |
    |     - Extract X-Branch-Id header              |
    |     - Validate user access to branch          |
    |     - Add branch filter to queries            |
    |                                               |
    |                              10. Process request
    |<----------------------------------------------+
    |                                               |
    |  11. Token expired (401)                      |
    |<----------------------------------------------+
    |                                               |
    |  12. POST /api/auth/refresh                   |
    |     { refreshToken }                          |
    +---------------------------------------------->|
    |                                               |
    |                    13. New access token       |
    |<----------------------------------------------+
```

### 6.3 Multi-Tenant Branch Isolation

```
+------------------------------------------------------------------+
|                         COMPANY LEVEL                             |
|                    (Shared Configuration)                         |
|         Products, Chart of Accounts, Users, Roles                 |
+-----------+--------------+--------------+--------------+---------+
            |              |              |              |
+-----------v--+  +--------v-----+  +-----v--------+  +--v--------+
|  Branch A    |  |  Branch B    |  |  Branch C    |  |  Branch D |
|  (Main)      |  |  (Warehouse) |  |  (Factory)   |  |  (Store)  |
|              |  |              |  |              |  |           |
|  - Customers |  |  - Customers |  |  - Customers |  |  - Customers|
|  - Suppliers |  |  - Suppliers |  |  - Suppliers |  |  - Suppliers|
|  - Inventory |  |  - Inventory |  |  - Inventory |  |  - Inventory|
|  - Sales     |  |  - Sales     |  |  - Sales     |  |  - Sales  |
|  - Purchases |  |  - Purchases |  |  - Purchases |  |  - Purchases|
|  - Journal   |  |  - Journal   |  |  - Journal   |  |  - Journal|
|    Entries   |  |    Entries   |  |    Entries   |  |    Entries|
|  - Employees |  |  - Employees |  |  - Employees |  |  - Employees|
|  - Cash Boxes|  |  - Cash Boxes|  |  - Cash Boxes|  |  - Cash Boxes|
+--------------+  +--------------+  +--------------+  +-----------+

ISOLATION MECHANISM:
- Every transaction table has a branchId column
- API middleware extracts X-Branch-Id header from requests
- Repository layer automatically filters by branchId
- Users can only access branches assigned to them
- Aggregated reports require explicit cross-branch permissions
```

---

## 7. Backend Architecture

### 7.1 Module Structure (40+ Modules)

```
src/
|-- app.module.ts                    # Root application module
|-- main.ts                          # Application bootstrap
|
|-- common/                          # Shared utilities
|   |-- decorators/                  # Custom decorators
|   |-- enums/                       # Shared enums
|   |-- filters/                     # Exception filters
|   |-- guards/                      # Authentication & authorization guards
|   |-- interceptors/                # Request/response interceptors
|   |-- middleware/                  # Express middleware
|   |-- pipes/                       # Validation & transformation pipes
|   |-- utils/                       # Helper functions
|   |-- constants.ts                 # System constants
|
|-- config/                          # Configuration management
|   |-- app.config.ts
|   |-- database.config.ts
|   |-- jwt.config.ts
|
|-- modules/                         # Business domain modules
|   |
|   |-- auth/                        # Authentication module
|   |   |-- auth.controller.ts
|   |   |-- auth.service.ts
|   |   |-- auth.module.ts
|   |   |-- dto/
|   |   |-- strategies/
|   |   |-- guards/
|   |
|   |-- users/                       # User management
|   |   |-- users.controller.ts
|   |   |-- users.service.ts
|   |   |-- users.module.ts
|   |   |-- dto/
|   |   |-- entities/
|   |
|   |-- branches/                    # Branch management
|   |   |-- branches.controller.ts
|   |   |-- branches.service.ts
|   |   |-- branches.module.ts
|   |   |-- dto/
|   |
|   |-- roles/                       # Role & permission management
|   |   |-- roles.controller.ts
|   |   |-- roles.service.ts
|   |   |-- roles.module.ts
|   |
|   |-- permissions/                 # Permission definitions
|   |   |-- permissions.controller.ts
|   |   |-- permissions.service.ts
|   |   |-- permissions.module.ts
|   |
|   |-- products/                    # Product catalog
|   |   |-- products.controller.ts
|   |   |-- products.service.ts
|   |   |-- products.module.ts
|   |   |-- dto/
|   |
|   |-- product-categories/          # Category management
|   |   |-- product-categories.controller.ts
|   |   |-- product-categories.service.ts
|   |
|   |-- units/                       # Unit of measurement
|   |   |-- units.controller.ts
|   |   |-- units.service.ts
|   |
|   |-- inventory/                   # Inventory management
|   |   |-- inventory.controller.ts
|   |   |-- inventory.service.ts
|   |   |-- inventory.module.ts
|   |
|   |-- warehouses/                  # Warehouse management
|   |   |-- warehouses.controller.ts
|   |   |-- warehouses.service.ts
|   |
|   |-- stock-movements/             # Stock movement tracking
|   |   |-- stock-movements.controller.ts
|   |   |-- stock-movements.service.ts
|   |
|   |-- sales-orders/                # Sales order management
|   |   |-- sales-orders.controller.ts
|   |   |-- sales-orders.service.ts
|   |   |-- dto/
|   |
|   |-- sales-order-items/           # Sales line items
|   |   |-- sales-order-items.controller.ts
|   |   |-- sales-order-items.service.ts
|   |
|   |-- sales-returns/               # Sales returns
|   |   |-- sales-returns.controller.ts
|   |   |-- sales-returns.service.ts
|   |
|   |-- quotations/                  # Customer quotations
|   |   |-- quotations.controller.ts
|   |   |-- quotations.service.ts
|   |
|   |-- delivery-notes/              # Delivery documentation
|   |   |-- delivery-notes.controller.ts
|   |   |-- delivery-notes.service.ts
|   |
|   |-- purchase-orders/             # Purchase management
|   |   |-- purchase-orders.controller.ts
|   |   |-- purchase-orders.service.ts
|   |
|   |-- purchase-order-items/        # Purchase line items
|   |   |-- purchase-order-items.controller.ts
|   |   |-- purchase-order-items.service.ts
|   |
|   |-- purchase-returns/            # Purchase returns
|   |   |-- purchase-returns.controller.ts
|   |   |-- purchase-returns.service.ts
|   |
|   |-- grn/                         # Goods receipt notes
|   |   |-- grn.controller.ts
|   |   |-- grn.service.ts
|   |
|   |-- suppliers/                   # Supplier management
|   |   |-- suppliers.controller.ts
|   |   |-- suppliers.service.ts
|   |
|   |-- customers/                   # Customer management
|   |   |-- customers.controller.ts
|   |   |-- customers.service.ts
|   |
|   |-- cash-boxes/                  # Cash management
|   |   |-- cash-boxes.controller.ts
|   |   |-- cash-boxes.service.ts
|   |
|   |-- cash-transactions/           # Cash operations
|   |   |-- cash-transactions.controller.ts
|   |   |-- cash-transactions.service.ts
|   |
|   |-- banks/                       # Bank management
|   |   |-- banks.controller.ts
|   |   |-- banks.service.ts
|   |
|   |-- bank-transactions/           # Bank operations
|   |   |-- bank-transactions.controller.ts
|   |   |-- bank-transactions.service.ts
|   |
|   |-- transfers/                   # Fund transfers
|   |   |-- transfers.controller.ts
|   |   |-- transfers.service.ts
|   |
|   |-- treasury-positions/          # Treasury reporting
|   |   |-- treasury-positions.controller.ts
|   |   |-- treasury-positions.service.ts
|   |
|   |-- chart-of-accounts/           # Account management
|   |   |-- chart-of-accounts.controller.ts
|   |   |-- chart-of-accounts.service.ts
|   |
|   |-- journal-entries/             # Journal management
|   |   |-- journal-entries.controller.ts
|   |   |-- journal-entries.service.ts
|   |
|   |-- journal-entry-lines/         # Journal lines
|   |   |-- journal-entry-lines.controller.ts
|   |   |-- journal-entry-lines.service.ts
|   |
|   |-- general-ledger/              # GL queries
|   |   |-- general-ledger.controller.ts
|   |   |-- general-ledger.service.ts
|   |
|   |-- financial-statements/        # Reports
|   |   |-- financial-statements.controller.ts
|   |   |-- financial-statements.service.ts
|   |
|   |-- employees/                   # Employee records
|   |   |-- employees.controller.ts
|   |   |-- employees.service.ts
|   |
|   |-- departments/                 # Organizational structure
|   |   |-- departments.controller.ts
|   |   |-- departments.service.ts
|   |
|   |-- attendance/                  # Time tracking
|   |   |-- attendance.controller.ts
|   |   |-- attendance.service.ts
|   |
|   |-- leave-management/            # Leave requests
|   |   |-- leave-management.controller.ts
|   |   |-- leave-management.service.ts
|   |
|   |-- payroll/                     # Salary processing
|   |   |-- payroll.controller.ts
|   |   |-- payroll.service.ts
|   |
|   |-- salary-components/           # Salary structure
|   |   |-- salary-components.controller.ts
|   |   |-- salary-components.service.ts
|   |
|   |-- crm-leads/                   # Lead management
|   |   |-- crm-leads.controller.ts
|   |   |-- crm-leads.service.ts
|   |
|   |-- crm-activities/              # Customer activities
|   |   |-- crm-activities.controller.ts
|   |   |-- crm-activities.service.ts
|   |
|   |-- vehicles/                    # Fleet management
|   |   |-- vehicles.controller.ts
|   |   |-- vehicles.service.ts
|   |
|   |-- drivers/                     # Driver management
|   |   |-- drivers.controller.ts
|   |   |-- drivers.service.ts
|   |
|   |-- trips/                       # Trip scheduling
|   |   |-- trips.controller.ts
|   |   |-- trips.service.ts
|   |
|   |-- routes/                      # Route planning
|   |   |-- routes.controller.ts
|   |   |-- routes.service.ts
|   |
|   |-- manufacturing-orders/        # Production orders
|   |   |-- manufacturing-orders.controller.ts
|   |   |-- manufacturing-orders.service.ts
|   |
|   |-- feed-formulas/               # Feed recipes
|   |   |-- feed-formulas.controller.ts
|   |   |-- feed-formulas.service.ts
|   |
|   |-- production-batches/          # Batch tracking
|   |   |-- production-batches.controller.ts
|   |   |-- production-batches.service.ts
|   |
|   |-- bill-of-materials/           # BOM management
|   |   |-- bill-of-materials.controller.ts
|   |   |-- bill-of-materials.service.ts
|   |
|   |-- chick-batches/               # Poultry batches
|   |   |-- chick-batches.controller.ts
|   |   |-- chick-batches.service.ts
|   |
|   |-- sheds/                       # Shed management
|   |   |-- sheds.controller.ts
|   |   |-- sheds.service.ts
|   |
|   |-- egg-production/              # Egg collection
|   |   |-- egg-production.controller.ts
|   |   |-- egg-production.service.ts
|   |
|   |-- poultry-mortality/           # Mortality tracking
|   |   |-- poultry-mortality.controller.ts
|   |   |-- poultry-mortality.service.ts
|   |
|   |-- poultry-feeding/             # Feeding records
|   |   |-- poultry-feeding.controller.ts
|   |   |-- poultry-feeding.service.ts
|   |
|   |-- reports/                     # Report engine
|   |   |-- reports.controller.ts
|   |   |-- reports.service.ts
|   |
|   |-- dashboards/                  # KPI dashboards
|   |   |-- dashboards.controller.ts
|   |   |-- dashboards.service.ts
|   |
|   |-- audit-logs/                  # Audit trail
|   |   |-- audit-logs.controller.ts
|   |   |-- audit-logs.service.ts
|   |
|   |-- settings/                    # System configuration
|   |   |-- settings.controller.ts
|   |   |-- settings.service.ts
|   |
|   |-- notifications/               # System notifications
|   |   |-- notifications.controller.ts
|   |   |-- notifications.service.ts
|   |
|   |-- file-upload/                 # Document management
|   |   |-- file-upload.controller.ts
|   |   |-- file-upload.service.ts
|
|-- prisma/
|   |-- schema.prisma                # Complete database schema
|   |-- migrations/                  # Migration history
|
|-- database/
|   |-- seeds/                       # Seed data for initial setup
|   |-- factories/                   # Test data factories
```

### 7.2 Controller -> Service -> Repository Pattern

```
+------------+     +------------+     +------------+     +------------+
|  HTTP      |     | Controller |     |  Service   |     |  Prisma    |
|  Request   | --> | (Handle    | --> | (Business  | --> | (Database  |
|            |     |  routing,  |     |  logic)    |     |  access)   |
|            |     |  DTO,      |     |            |     |            |
|            |     |  params)   |     |            |     |            |
+------------+     +------------+     +------------+     +------------+
       |                  |                  |                  |
       | Validate DTO     | Call service     | Execute query    |
       | Authorize        | Return result    | Return data      |
       | Return response  |                  |                  |

Example Flow:
-------------+
POST /api/sales-orders
{ customerId, items, branchId }

  |
  v
SalesOrdersController.create()
  - Apply ValidationPipe
  - Check JWT auth
  - Verify branch access

  |
  v
SalesOrdersService.create(createDto)
  - Validate customer exists
  - Calculate totals, tax, discounts
  - Check product availability
  - Create sales order (transaction)
  - Create sales order items
  - Auto-generate journal entry for revenue
  - Update inventory (reserve stock)
  - Log audit entry

  |
  v
Prisma (Repository)
  - BEGIN TRANSACTION
  - INSERT INTO sales_orders
  - INSERT INTO sales_order_items
  - INSERT INTO journal_entries
  - INSERT INTO journal_entry_lines
  - UPDATE inventory SET quantity
  - INSERT INTO audit_logs
  - COMMIT

  |
  v
Response: { success: true, data: salesOrder }
```

### 7.3 DTO Validation Pipeline

```
Request Body
     |
     v
+----+--------------------+
|  ValidationPipe         |
|  (Global, auto-apply)   |
|                         |
|  1. class-transformer   |
|     -> Transform plain  |
|        object to DTO    |
|        instance         |
|                         |
|  2. class-validator     |
|     -> @IsString()      |
|     -> @IsNumber()      |
|     -> @IsOptional()    |
|     -> @IsEnum()        |
|     -> @Length()        |
|     -> @Min() / @Max()  |
|     -> @IsEmail()       |
|     -> Custom validators|
|                         |
|  3. whitelist: true     |
|     -> Strip undefined  |
|        properties       |
|                         |
|  4. forbidNonWhitelisted|
|     -> Error on unknown |
|        properties       |
+----+--------------------+
     |
     v
  Validated DTO
     |
     v
  Controller / Service
```

**Example DTO:**
```typescript
export class CreateSalesOrderDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderItemDto)
  items: CreateSalesOrderItemDto[];

  @IsEnum(SalesOrderStatus)
  @IsOptional()
  status?: SalesOrderStatus;
}

export class CreateSalesOrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  discountPercent?: number;
}
```

### 7.4 Middleware Pipeline

```
Incoming Request
       |
       v
+------------------+
|  1. CORS         |  Enable cross-origin requests
|     Middleware   |  from configured origins
+------------------+
       |
       v
+------------------+
|  2. Helmet       |  Security headers:
|     Middleware   |  X-Content-Type-Options,
|                  |  X-Frame-Options, CSP,
|                  |  HSTS, Referrer-Policy
+------------------+
       |
       v
+------------------+
|  3. Compression  |  Gzip compression for
|     Middleware   |  response bodies
+------------------+
       |
       v
+------------------+
|  4. JWT Auth     |  Validate Bearer token,
|     Guard        |  attach user to request
+------------------+
       |
       v
+------------------+
|  5. RBAC Guard   |  Check if user has
|                  |  required role/permission
+------------------+
       |
       v
+------------------+
|  6. Branch Scope |  Extract X-Branch-Id,
|     Middleware   |  validate, add to query
+------------------+
       |
       v
+------------------+
|  7. Audit Log    |  Record mutation
|     Interceptor  |  (POST/PUT/DELETE)
+------------------+
       |
       v
+------------------+
|  8. Soft Delete  |  Filter deletedAt IS NULL
|     Interceptor  |  on all queries
+------------------+
       |
       v
   Controller
```

### 7.5 Exception Handling

```
+----------------------------+
|   Global Exception Filter   |
+----------------------------+
            |
    +-------+-------+-------+-------+
    |               |       |       |
    v               v       v       v
HttpException  Prisma   Validation  Default
(4xx, 5xx)    Errors   Errors      (500)

Response Format:
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Resource not found",
    "details": { ... },
    "timestamp": "2025-01-01T12:00:00.000Z"
  }
}
```

**Exception Hierarchy:**
| Exception Type | HTTP Code | Trigger |
|---------------|-----------|---------|
| BadRequestException | 400 | Invalid input data |
| UnauthorizedException | 401 | Invalid/missing token |
| ForbiddenException | 403 | Insufficient permissions |
| NotFoundException | 404 | Resource not found |
| ConflictException | 409 | Duplicate/constraint violation |
| UnprocessableEntity | 422 | Business rule violation |
| InternalServerError | 500 | Unexpected error |

---

## 8. Frontend Architecture

### 8.1 Component Hierarchy

```
+------------------------------------------+
|              App.tsx (Root)               |
|  - ThemeProvider (MUI, RTL for Arabic)   |
|  - Redux Provider                         |
|  - QueryClientProvider (React Query)      |
|  - RouterProvider                         |
|  - Toast/Notification Container           |
+------------------------------------------+
                    |
    +---------------+---------------+
    |                               |
+---v-----------+          +--------v------+
|  AuthLayout   |          |  MainLayout   |
|  (Login Page) |          |  (Sidebar +   |
+---------------+          |   AppBar +    |
                           |   Content)    |
                           +--------+------+
                                    |
                    +---------------+---------------+
                    |               |               |
            +-------v------+ +------v------+ +-----v-------+
            |  Dashboard   | |  Module     | |  Settings   |
            |  (KPI Cards, | |  Pages      | |  Pages      |
            |   Charts)    | |             | |             |
            +--------------+ +------+------+ +-------------+
                                    |
                            +-------v-------+
                            |  Page Layout  |
                            |  - Breadcrumbs|
                            |  - Page Title |
                            |  - Actions Bar|
                            |  - Content    |
                            +-------+-------+
                                    |
                    +---------------+---------------+
                    |               |               |
            +-------v------+ +------v------+ +-----v-------+
            |  Data Table  | |  Form       | |  Detail     |
            |  - Sorting   | |  - Inputs   | |  - Cards    |
            |  - Filtering | |  - Validation| |  - Timeline |
            |  - Pagination| |  - Submit   | |  - Related  |
            |  - Export    | |             | |    Data     |
            +--------------+ +-------------+ +-------------+
```

### 8.2 State Management (Redux + React Query)

```
+-----------------------------------------------------------+
|                     STATE ARCHITECTURE                     |
+-----------------------------------------------------------+
                                                            |
+----------------------------+  +----------------------------+
|    REDUX (Global State)    |  |  REACT QUERY (Server State) |
+----------------------------+  +----------------------------+
|                            |  |                            |
|  - auth (user, token)      |  |  - products (list, cache)  |
|  - app (sidebar, theme,    |  |  - customers (list, cache) |
|    language, breadcrumbs)  |  |  - sales orders (paginated)|
|  - notifications           |  |  - inventory data          |
|  - permissions             |  |  - reports data            |
|  - ui (modals, drawers)    |  |  - auto-refetch, staleTime |
|                            |  |  - background updates      |
+----------------------------+  +----------------------------+
|                            |  |                            |
|  Persists across           |  |  Cache with TTL            |
|  navigation                |  |  Optimistic updates        |
|  Redux DevTools            |  |  Devtools integration      |
+----------------------------+  +----------------------------+
```

**React Query Configuration:**
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 minutes
      cacheTime: 1000 * 60 * 30,     // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 8.3 Routing Structure

```
/                          -> Dashboard (KPI overview)
/auth/login                -> Login page

/sales                     -> Sales module
/sales/orders              -> Sales orders list
/sales/orders/new          -> Create sales order
/sales/orders/:id          -> Sales order detail
/sales/orders/:id/edit     -> Edit sales order
/sales/returns             -> Sales returns
/sales/quotations          -> Quotations
/sales/delivery-notes      -> Delivery notes

/purchases                 -> Procurement module
/purchases/orders          -> Purchase orders
/purchases/returns         -> Purchase returns
/purchases/grn             -> Goods receipt notes

/inventory                 -> Inventory module
/inventory/stock           -> Current stock
/inventory/movements       -> Stock movements
/inventory/adjustments     -> Stock adjustments
/inventory/warehouses      -> Warehouses

/products                  -> Product catalog
/products/list             -> Product list
/products/categories       -> Categories
/products/units            -> Units of measure

/customers                 -> Customer management
/suppliers                 -> Supplier management

/treasury                  -> Treasury module
/treasury/cash-boxes       -> Cash management
/treasury/banks            -> Bank accounts
/treasury/transfers        -> Fund transfers
/treasury/positions        -> Treasury positions

/accounting                -> Accounting module
/accounting/chart          -> Chart of accounts
/accounting/journal        -> Journal entries
/accounting/ledger         -> General ledger
/accounting/trial-balance  -> Trial balance
/accounting/balance-sheet  -> Balance sheet
/accounting/pnl            -> Profit & loss

/hr                        -> HR module
/hr/employees              -> Employee records
/hr/departments            -> Departments
/hr/attendance             -> Attendance tracking
/hr/leave                  -> Leave management
/hr/payroll                -> Payroll processing

/crm                       -> CRM module
/crm/leads                 -> Lead management
/crm/activities            -> Customer activities

/logistics                 -> Logistics module
/logistics/vehicles        -> Vehicle fleet
/logistics/drivers         -> Drivers
/logistics/trips           -> Trips
/logistics/routes          -> Routes

/production                -> Production module
/production/orders         -> Manufacturing orders
/production/formulas       -> Feed formulas
/production/batches        -> Production batches

/poultry                   -> Poultry module
/poultry/chick-batches     -> Chick batches
/poultry/sheds             -> Sheds
/poultry/egg-production    -> Egg collection
/poultry/mortality         -> Mortality records
/poultry/feeding           -> Feeding records

/reports                   -> Report center
/reports/sales             -> Sales reports
/reports/inventory         -> Inventory reports
/reports/financial         -> Financial reports
/reports/hr                -> HR reports

/settings                  -> System settings
/settings/branches         -> Branch management
/settings/users            -> User management
/settings/roles            -> Role & permissions
/settings/audit-logs       -> Audit trail
```

### 8.4 API Integration Pattern

```
+--------------------------------------------------+
|              API INTEGRATION PATTERN              |
+--------------------------------------------------+

Frontend Component
       |
       v
+------+---------+     +------------------+     +--------------+
|  Custom Hook   | --> |  React Query     | --> |  Axios       |
|  (useProducts) |     |  (useQuery/      |     |  (HTTP       |
|                |     |   useMutation)   |     |   Client)    |
+----------------+     +--------+---------+     +------+-------+
                                |                        |
                                v                        v
                       +--------+---------+     +--------+-------+
                       |  Cache Store     |     |  Request       |
                       |  (In-memory)     |     |  - Base URL    |
                       |                  |     |  - Headers     |
                       |  - Auto-refetch  |     |  - Interceptors|
                       |  - Deduping      |     |    (Auth,      |
                       |  - Background    |     |     Error)     |
                       |    updates       |     |  - Transform   |
                       +------------------+     +--------+-------+
                                                         |
                                                         v
                                                +--------+-------+
                                                |  Backend API    |
                                                |  (NestJS)       |
                                                +-----------------+

Axios Interceptors:
-------------------
Request Interceptor:
  - Add Authorization: Bearer <token> header
  - Add X-Branch-Id header from Redux store
  - Add Content-Type: application/json

Response Interceptor:
  - 401: Trigger token refresh or logout
  - 403: Show permission denied message
  - 500: Show generic error toast
  - Success: Return response.data
```

---

## 9. Security Architecture

### 9.1 Security Architecture Overview

```
+-----------------------------------------------------------+
|                    SECURITY LAYERS                         |
+-----------------------------------------------------------+

Layer 1: Network
  - HTTPS/TLS 1.3 encryption
  - WAF (Web Application Firewall)
  - IP-based access restrictions (optional)
  - DDoS protection via Nginx rate limiting

Layer 2: Application Gateway
  - Nginx rate limiting (per IP)
  - Request size limits
  - Security headers (HSTS, CSP, X-Frame)
  - CORS policy enforcement

Layer 3: Authentication
  - JWT access tokens (15 min expiry)
  - JWT refresh tokens (7 day expiry)
  - bcrypt password hashing (12 rounds)
  - Account lockout after 5 failed attempts

Layer 4: Authorization
  - Role-Based Access Control (RBAC)
  - Permission matrix (60+ permissions)
  - Branch-level data isolation
  - Resource ownership verification

Layer 5: Data Protection
  - Input validation (class-validator)
  - Parameterized queries (Prisma ORM)
  - XSS prevention (output encoding)
  - CSRF token validation

Layer 6: Audit
  - Complete mutation logging
  - User action tracking
  - Data change history
  - Immutable audit trail
```

### 9.2 Permission Matrix

| Permission | Admin | Manager | Accountant | Sales | Inventory | HR |
|-----------|-------|---------|-----------|-------|-----------|-----|
| users.view | x | x | | | | |
| users.create | x | | | | | |
| users.edit | x | | | | | |
| users.delete | x | | | | | |
| roles.manage | x | | | | | |
| branches.view | x | x | x | x | x | x |
| branches.manage | x | | | | | |
| products.view | x | x | x | x | x | |
| products.create | x | x | | | | |
| products.edit | x | x | | | | |
| products.delete | x | | | | | |
| inventory.view | x | x | x | | x | |
| inventory.adjust | x | x | | | x | |
| sales.create | x | x | | x | | |
| sales.approve | x | x | | | | |
| purchases.create | x | x | | | x | |
| purchases.approve | x | x | | | | |
| accounting.view | x | x | x | | | |
| journal.create | x | x | x | | | |
| journal.post | x | x | | | | |
| reports.view | x | x | x | | | |
| reports.all_branches | x | | | | | |
| hr.view | x | | | | | x |
| payroll.process | x | | | | | x |
| settings.view | x | | | | | |
| settings.edit | x | | | | | |

### 9.3 Audit Logging

Every mutation operation is automatically logged:

```
+-------------------+----------------------------------+
| Audit Log Field   | Description                      |
+-------------------+----------------------------------+
| id                | Unique identifier                |
| userId            | Who performed the action         |
| userName          | Username for display             |
| branchId          | In which branch                  |
| action            | CREATE / UPDATE / DELETE         |
| entityType        | Table/model name                 |
| entityId          | Record identifier                |
| oldData           | JSON - previous state            |
| newData           | JSON - new state                 |
| ipAddress         | Client IP address                |
| userAgent         | Browser/client info              |
| createdAt         | Timestamp                        |
+-------------------+----------------------------------+
```

---

## 10. Data Flow Diagrams

### 10.1 Sales Order Flow

```
+--------+   +----------+   +----------+   +----------+   +----------+
|Customer|   | Sales    |   | Inventory|   | Accounting|  | Treasury |
+---+----+   +----+-----+   +----+-----+   +----+-----+   +----+-----+
    |             |               |               |               |
    | 1. Create   |               |               |               |
    |    Order    |               |               |               |
    +------------>|               |               |               |
    |             | 2. Check      |               |               |
    |             |    Stock      |               |               |
    |             +-------------->|               |               |
    |             | 3. Reserve    |               |               |
    |             |    Stock      |               |               |
    |             +-------------->|               |               |
    |             |               |               |               |
    |             | 4. Create     |               |               |
    |             |    Journal    |               |               |
    |             +------------------------------>|               |
    |             |               |               |               |
    | 5. Approve  |               |               |               |
    +------------>|               |               |               |
    |             | 6. Confirm    |               |               |
    |             |    Stock Ded. |               |               |
    |             +-------------->|               |               |
    |             |               |               |               |
    |             | 7. Post       |               |               |
    |             |    Journal    |               |               |
    |             +------------------------------>|               |
    |             |               |               |               |
    | 8. Invoice  |               |               |               |
    +------------>|               |               |               |
    |             | 9. Create     |               |               |
    |             |    AR Entry   |               |               |
    |             +------------------------------>|               |
    |             |               |               |               |
    | 10. Payment |               |               |               |
    +------------>|               |               |               |
    |             | 11. Record    |               |               |
    |             |     Payment   |               |               |
    |             +---------------------------------------------->|
    |             |               |               |               |
    | 12. Complete|               |               |               |
    |<------------+               |               |               |
```

### 10.2 Purchase Order Flow

```
+----------+   +----------+   +----------+   +----------+
| Supplier |   | Purchase |   | Inventory|   | Accounting|
+----+-----+   +----+-----+   +----+-----+   +----+-----+
     |              |               |               |
     | 1. Create    |               |               |
     |    PO        |               |               |
     +------------->|               |               |
     |              |               |               |
     | 2. Send to   |               |               |
     |    Supplier  |               |               |
     |<-------------+               |               |
     |              |               |               |
     | 3. Deliver   |               |               |
     +------------->|               |               |
     |              | 4. Create     |               |
     |              |    GRN        |               |
     |              +-------------->|               |
     |              |               |               |
     |              | 5. Update     |               |
     |              |    Inventory  |               |
     |              +-------------->|               |
     |              |               |               |
     |              | 6. Create     |               |
     |              |    AP Entry   |               |
     |              +------------------------------>|
     |              |               |               |
     | 7. Invoice   |               |               |
     +------------->|               |               |
     |              |               |               |
     | 8. Pay       |               |               |
     +------------->|               |               |
     |              | 9. Record     |               |
     |              |    Payment    |               |
     |              +------------------------------>|
     |              |               |               |
     | 10. Complete |               |               |
     |<-------------+               |               |
```

### 10.3 Manufacturing Flow

```
+----------+   +----------+   +----------+   +----------+   +----------+
| Feed     |   | Manufacturing|  | Inventory|   | Accounting|  | Poultry  |
| Formula  |   | Orders       |  |          |   |          |  | (Feeding)|
+----+-----+   +----+-----+   +----+-----+   +----+-----+   +----+-----+
     |              |               |               |               |
     | 1. Select    |               |               |               |
     |    Formula   |               |               |               |
     +------------->|               |               |               |
     |              |               |               |               |
     | 2. Calculate |               |               |               |
     |    Materials |               |               |               |
     |<-------------+               |               |               |
     |              |               |               |               |
     |              | 3. Check      |               |               |
     |              |    Raw Stock  |               |               |
     |              +-------------->|               |               |
     |              |               |               |               |
     |              | 4. Reserve    |               |               |
     |              |    Materials  |               |               |
     |              +-------------->|               |               |
     |              |               |               |               |
     |              | 5. Create     |               |               |
     |              |    MO         |               |               |
     |              +------------------------------>|               |
     |              |               |               |               |
     |              | 6. Execute    |               |               |
     |              |    Production |               |               |
     |              |               |               |               |
     |              | 7. Deduct     |               |               |
     |              |    Raw Stock  |               |               |
     |              +-------------->|               |               |
     |              |               |               |               |
     |              | 8. Add        |               |               |
     |              |    Finished   |               |               |
     |              |    Goods      |               |               |
     |              +-------------->|               |               |
     |              |               |               |               |
     |              | 9. Record     |               |               |
     |              |    WIP Entry  |               |               |
     |              +------------------------------>|               |
     |              |               |               |               |
     |              | 10. Transfer  |               |               |
     |              |     to Poultry|               |               |
     |              +------------------------------+-------------->|
```

### 10.4 Accounting Journal Entry Flow

```
+----------+   +----------+   +----------+   +----------+
| Business |   | Journal  |   | General  |   | Financial|
| Event    |   | Entry    |   | Ledger   |   | Statements|
+----+-----+   +----+-----+   +----+-----+   +----+-----+
     |              |               |               |
     | 1. Trigger   |               |               |
     |    (Sale/    |               |               |
     |    Purchase/ |               |               |
     |    Payroll)  |               |               |
     +------------->|               |               |
     |              |               |               |
     |              | 2. Create     |               |
     |              |    Entries    |               |
     |              |    (DR/CR)    |               |
     |              |               |               |
     |              | 3. Validate   |               |
     |              |    Balance    |               |
     |              |    DR = CR    |               |
     |              |               |               |
     |              | 4. Post to    |               |
     |              |    GL         |               |
     |              +-------------->|               |
     |              |               |               |
     |              | 5. Update     |               |
     |              |    Account    |               |
     |              |    Balances   |               |
     |              +-------------->|               |
     |              |               |               |
     |              |               | 6. Available  |
     |              |               |    for        |
     |              |               |    Reports    |
     |              |               +-------------->|
     |              |               |               |
     |              |               | 7. TB/BS/PL   |
     |              |               |    Generated  |
     |<-------------+---------------+---------------+
```

### 10.5 Payroll Flow

```
+--------+   +----------+   +----------+   +----------+   +----------+
|Employee|   | Attendance|  | Payroll  |   | Accounting|  | Treasury |
+---+----+   +----+-----+   +----+-----+   +----+-----+   +----+-----+
    |             |               |               |               |
    | 1. Clock    |               |               |               |
    |    In/Out   |               |               |               |
    +------------>|               |               |               |
    |             |               |               |               |
    | 2. Leave    |               |               |               |
    |    Request  |               |               |               |
    +------------>|               |               |               |
    |             |               |               |               |
    |             | 3. Calculate  |               |               |
    |             |    Period     |               |               |
    |             +-------------->|               |               |
    |             |               |               |               |
    |             | 4. Get        |               |               |
    |             |    Attendance |               |               |
    |             +-------------->|               |               |
    |             |               |               |               |
    |             | 5. Compute    |               |               |
    |             |    Salary     |               |               |
    |             |    Components |               |               |
    |             |    - Basic    |               |               |
    |             |    - Allowance|               |               |
    |             |    - Deduction|               |               |
    |             |    - Overtime |               |               |
    |             |    - Absence  |               |               |
    |             |               |               |               |
    |             |               | 6. Create     |               |
    |             |               |    JE: Salary |               |
    |             |               |    Expense    |               |
    |             |               +-------------->|               |
    |             |               |               |               |
    |             |               | 7. Create     |               |
    |             |               |    JE: Payable|               |
    |             |               +-------------->|               |
    |             |               |               |               |
    |             |               |               | 8. Process    |
    |             |               |               |    Payment    |
    |             |               |               +-------------->|
    |             |               |               |               |
    |             |               |               | 9. Pay        |
    |             |               |               |    Salaries   |
    |             |               |               |               |
    | 10. Payslip |               |               |               |
    |<-------------+---------------+---------------+---------------+
```

---

## 11. Integration Points

### 11.1 Module-to-Module Communication

```
+-----------------------------------------------------------+
|               MODULE INTEGRATION MAP                       |
+-----------------------------------------------------------+

Sales Module:
  --> Inventory (stock reservation, deduction)
  --> Accounting (revenue journal, accounts receivable)
  --> Treasury (payment recording, cash/bank receipt)
  --> Customers (balance update, statement)
  --> Logistics (delivery scheduling, trip assignment)

Purchase Module:
  --> Inventory (stock addition via GRN)
  --> Accounting (expense journal, accounts payable)
  --> Treasury (payment recording, cash/bank payment)
  --> Suppliers (balance update, statement)

Production Module:
  --> Inventory (raw material deduction, finished goods addition)
  --> Accounting (WIP journal, cost of goods manufactured)
  --> Feed Formulas (recipe loading, ingredient calculation)
  --> Poultry (feed transfer for poultry operations)

Payroll Module:
  --> HR (employee data, attendance)
  --> Accounting (salary expense journal, salary payable)
  --> Treasury (salary payment disbursement)

Treasury Module:
  --> Accounting (all transactions auto-generate journal entries)
  --> Banks (bank reconciliation data)

Poultry Module:
  --> Inventory (feed consumption, medicine usage)
  --> Production (egg collection as production output)
  --> Accounting (farm expense allocation)
```

### 11.2 Accounting Auto-Generation

| Source Transaction | Auto-Generated Journal | Accounts Involved |
|-------------------|----------------------|-------------------|
| Sales Invoice | Revenue Journal | DR: Accounts Receivable / Cash, CR: Sales Revenue, CR: Tax Payable |
| Sales Return | Revenue Reversal | DR: Sales Returns, CR: Accounts Receivable |
| Purchase Invoice | Expense Journal | DR: Inventory / Expense, CR: Accounts Payable |
| Purchase Return | Expense Reversal | DR: Accounts Payable, CR: Inventory |
| Cash Receipt | Cash Journal | DR: Cash Box, CR: AR / Revenue |
| Cash Payment | Cash Journal | DR: Expense / AP, CR: Cash Box |
| Bank Deposit | Bank Journal | DR: Bank Account, CR: Cash / AR |
| Bank Withdrawal | Bank Journal | DR: Expense / AP, CR: Bank Account |
| Transfer (Cash<>Bank) | Transfer Journal | DR: Destination, CR: Source |
| Payroll Processing | Salary Journal | DR: Salary Expense, CR: Salary Payable |
| Manufacturing Completion | WIP Journal | DR: Finished Goods, CR: Raw Materials, CR: WIP |
| Stock Adjustment | Adjustment Journal | DR/CR: Adjustment Account, CR/DR: Inventory |

### 11.3 Inventory Auto-Update

| Business Event | Inventory Action | Stock Movement Type |
|---------------|-----------------|-------------------|
| Sales Order Approved | Reserve Stock | RESERVED |
| Delivery Note Created | Deduct Stock | OUT_SALE |
| GRN Created | Add Stock | IN_PURCHASE |
| Purchase Return Approved | Deduct Stock | OUT_PURCHASE_RETURN |
| Manufacturing Order Started | Reserve Raw Materials | RESERVED |
| Manufacturing Completed | Deduct Raw, Add Finished | OUT_PRODUCTION / IN_PRODUCTION |
| Stock Adjustment | Adjust Quantity | ADJUSTMENT |
| Internal Transfer | Transfer Between Warehouses | TRANSFER_OUT / TRANSFER_IN |
| Poultry Feeding | Deduct Feed Stock | OUT_FEEDING |
| Poultry Medicine | Deduct Medicine Stock | OUT_MEDICINE |

---

## 12. Scalability Considerations

### 12.1 Horizontal Scaling

```
                    +-------------+
                    |   Nginx     |
                    |   (LB)      |
                    +------+------+
                           |
            +--------------+--------------+
            |              |              |
     +------v------+ +-----v------+ +-----v------+
     |  NestJS     | |  NestJS    | |  NestJS    |
     |  Instance 1 | |  Instance 2| |  Instance 3|
     |  (PM2)      | |  (PM2)     | |  (PM2)     |
     +------+------+ +-----+------+ +-----+------+
            |              |              |
            +--------------+--------------+
                           |
                    +------v------+
                    |  PostgreSQL |
                    |  (Primary)  |
                    +------+------+
                           |
                    +------v------+
                    |  PostgreSQL |
                    |  (Replica)  |
                    +-------------+
```

### 12.2 Database Scaling Strategies

| Strategy | Implementation | When to Use |
|----------|---------------|-------------|
| **Connection Pooling** | PgBouncer | High concurrent connections |
| **Read Replicas** | PostgreSQL streaming replication | Read-heavy workloads |
| **Partitioning** | By date (partition journal entries) | Large tables >10M rows |
| **Indexing** | 332 indexes defined | Query optimization |
| **Query Optimization** | Prisma query tuning | Slow query remediation |

### 12.3 Application Caching Strategy

| Cache Level | Technology | Use Case | TTL |
|------------|-----------|----------|-----|
| Client State | React Query | API response caching | 5 min |
| Application | In-memory (Map) | Reference data (products, accounts) | 15 min |
| Future: Redis | Redis | Session store, rate limiting, distributed cache | Varies |

---

## 13. Deployment Architecture

### 13.1 Server Architecture (Single Server)

```
+------------------------------------------------------------------+
|                        Ubuntu 24.04 LTS                           |
|                                                                   |
|  +-------------------+  +-------------------+  +----------------+ |
|  |   Nginx           |  |   PM2 (Cluster)   |  |  PostgreSQL 16 | |
|  |   - Port 80/443   |  |   - Port 3000     |  |  - Port 5432   | |
|  |   - Static files  |  |   - 4 instances   |  |  - Local auth  | |
|  |   - Reverse proxy |  |   - Auto-restart  |  |  - Daily backup| |
|  |   - SSL/TLS       |  |   - Log rotation  |  |  - 32GB+ RAM   | |
|  +-------------------+  +-------------------+  +----------------+ |
|                                                                   |
|  +-------------------+  +-------------------+                     |
|  |   Systemd         |  |   UFW Firewall    |                     |
|  |   - Nginx service |  |   - Allow 22/80   |                     |
|  |   - PostgreSQL    |  |   - Allow 443     |                     |
|  |   - PM2 startup   |  |   - Deny others   |                     |
|  +-------------------+  +-------------------+                     |
|                                                                   |
|  Directory Structure:                                             |
|  /var/www/gff-erp/          - Frontend build files               |
|  /opt/gff-erp/backend/      - Backend application                |
|  /opt/gff-erp/logs/         - Application logs                   |
|  /opt/gff-erp/backups/      - Database backups                   |
|  /etc/nginx/sites-available/- Nginx configuration                |
+------------------------------------------------------------------+
```

### 13.2 Recommended Server Specifications

| Environment | CPU | RAM | Disk | Network |
|------------|-----|-----|------|---------|
| **Small** (< 50 users) | 4 cores | 8 GB | 100 GB SSD | 100 Mbps |
| **Medium** (50-150 users) | 8 cores | 16 GB | 250 GB SSD | 1 Gbps |
| **Large** (150-500 users) | 16 cores | 32 GB | 500 GB SSD | 1 Gbps |
| **Enterprise** (500+ users) | 32 cores | 64 GB | 1 TB NVMe | 10 Gbps |

### 13.3 Backup Architecture

```
Daily Automated Backup:
+------------------+     +------------------+     +------------------+
|  PostgreSQL      | --> |  pg_dump         | --> |  Compressed .sql |
|  (gff_erp_db)    |     |  (custom format) |     |  (.gz)           |
+------------------+     +------------------+     +------------------+
                                                         |
                                            +------------v------------+
                                            |  Retention: 30 days    |
                                            |  Schedule: 2:00 AM     |
                                            |  Location: /opt/backups|
                                            +------------------------+
                                                         |
                                            (Optional: Sync to S3/MinIO)
```

### 13.4 Monitoring Points

| Component | Metric | Alert Threshold |
|-----------|--------|----------------|
| CPU Usage | Percentage | > 80% for 5 min |
| Memory Usage | Percentage | > 85% for 5 min |
| Disk Usage | Percentage | > 80% used |
| Nginx | 5xx error rate | > 1% in 5 min |
| Application | Response time | > 2 seconds avg |
| Database | Connection count | > 80% of max |
| Database | Replication lag | > 30 seconds |
| PM2 | Process restarts | > 3 in 10 min |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-01 | Technical Team | Initial document |

---

*This document is the property of GFF ERP Enterprise. Unauthorized distribution is prohibited.*
