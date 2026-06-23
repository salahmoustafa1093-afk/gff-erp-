# GFF ERP Enterprise - API Documentation

**Document Version:** 1.0  
**Date:** June 2025  
**API Version:** v1  
**Base URL:** `https://api.gff-erp.com/api`  
**Status:** Production Ready

---

## Table of Contents

1. [API Overview](#1-api-overview)
2. [Authentication](#2-authentication)
3. [Request/Response Format](#3-requestresponse-format)
4. [Pagination](#4-pagination)
5. [Error Codes](#5-error-codes)
6. [Module API Endpoints](#6-module-api-endpoints)
7. [Rate Limiting](#7-rate-limiting)
8. [API Versioning](#8-api-versioning)
9. [Webhook Support](#9-webhook-support)

---

## 1. API Overview

### 1.1 Base Configuration

| Attribute | Value |
|-----------|-------|
| **Protocol** | HTTPS |
| **Base URL** | `https://api.gff-erp.com/api` |
| **Content Type** | `application/json` |
| **Character Encoding** | UTF-8 |
| **Request Timeout** | 30 seconds |
| **Max Request Body Size** | 10 MB |

### 1.2 Standard Headers

All API requests must include the following headers:

| Header | Required | Description | Example |
|--------|----------|-------------|---------|
| `Content-Type` | Yes | Request body format | `application/json` |
| `Authorization` | Yes (except auth) | Bearer token | `Bearer eyJhbGciOiJIUzI1NiIs...` |
| `X-Branch-Id` | Yes (except admin) | Active branch context | `550e8400-e29b-41d4-a716-446655440000` |
| `Accept-Language` | No | Response language | `ar` or `en` (default: `ar`) |
| `X-Request-Id` | No | Client request ID for tracing | `req-12345` |

### 1.3 HTTP Methods

| Method | Usage |
|--------|-------|
| `GET` | Retrieve resources |
| `POST` | Create new resources |
| `PUT` | Full resource update |
| `PATCH` | Partial resource update |
| `DELETE` | Soft delete resource |

---

## 2. Authentication

### 2.1 Authentication Flow

The API uses JWT (JSON Web Token) authentication with refresh token support.

### 2.2 Login

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
    "expiresIn": 900,
    "tokenType": "Bearer",
    "user": {
      "id": "uuid",
      "username": "admin",
      "fullName": "System Administrator",
      "email": "admin@gff-erp.com",
      "roles": ["admin"],
      "permissions": ["*"],
      "branches": [
        {
          "id": "branch-uuid",
          "name": "Main Branch",
          "isMain": true
        }
      ]
    }
  }
}
```

### 2.3 Refresh Token

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

### 2.4 Logout

```http
POST /api/auth/logout
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": { "message": "Logged out successfully" }
}
```

### 2.5 Change Password

```http
POST /api/auth/change-password
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "currentPassword": "old-password",
  "newPassword": "new-password",
  "confirmPassword": "new-password"
}
```

### 2.6 Token Specifications

| Token Type | Expiry | Storage | Usage |
|-----------|--------|---------|-------|
| Access Token | 15 minutes | Memory only | API request authorization |
| Refresh Token | 7 days | httpOnly cookie + DB | Token renewal |

---

## 3. Request/Response Format

### 3.1 Success Response

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2025-06-01T12:00:00.000Z",
    "requestId": "req-12345",
    "version": "v1"
  }
}
```

### 3.2 Paginated Response

```json
{
  "success": true,
  "data": [
    { "id": "1", "name": "Item 1" },
    { "id": "2", "name": "Item 2" }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false,
    "timestamp": "2025-06-01T12:00:00.000Z"
  }
}
```

### 3.3 Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": [
      { "field": "customerId", "message": "Customer ID is required" },
      { "field": "items", "message": "At least one item is required" }
    ],
    "timestamp": "2025-06-01T12:00:00.000Z"
  }
}
```

---

## 4. Pagination

### 4.1 Pagination Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | 1 | Page number (1-based) |
| `limit` | integer | 20 | Items per page (max 100) |
| `sort` | string | `createdAt` | Sort field |
| `order` | string | `desc` | Sort direction: `asc` or `desc` |

### 4.2 Query Parameters

```http
GET /api/sales-orders?page=1&limit=20&sort=orderDate&order=desc&status=CONFIRMED&customerId=xxx
```

### 4.3 Filtering

| Filter Type | Format | Example |
|-------------|--------|---------|
| Equality | `field=value` | `status=CONFIRMED` |
| Range | `field[gte]=value&field[lte]=value` | `orderDate[gte]=2025-01-01&orderDate[lte]=2025-01-31` |
| In List | `field[in]=v1,v2` | `status[in]=CONFIRMED,SHIPPED` |
| Search | `q=searchterm` | `q=John` (searches name, phone) |
| Null | `field[isNull]=true` | `deliveryDate[isNull]=true` |

### 4.4 Pagination Example

```http
GET /api/products?page=2&limit=10&sort=name&order=asc&categoryId=xxx&isActive=true

Response:
{
  "success": true,
  "data": [ ...10 products... ],
  "meta": {
    "page": 2,
    "limit": 10,
    "total": 150,
    "totalPages": 15,
    "hasNextPage": true,
    "hasPrevPage": true,
    "timestamp": "2025-06-01T12:00:00.000Z"
  }
}
```

---

## 5. Error Codes

### 5.1 HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 204 | No Content | Resource deleted/updated (no body) |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict (duplicate) |
| 422 | Unprocessable Entity | Business rule violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### 5.2 Application Error Codes

| Error Code | HTTP Status | Description |
|-----------|-------------|-------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Username or password incorrect |
| `AUTH_TOKEN_EXPIRED` | 401 | Access token has expired |
| `AUTH_TOKEN_INVALID` | 401 | Token signature invalid |
| `AUTH_REFRESH_EXPIRED` | 401 | Refresh token expired |
| `AUTH_ACCOUNT_LOCKED` | 403 | Account locked after failed attempts |
| `FORBIDDEN` | 403 | User lacks required permission |
| `BRANCH_ACCESS_DENIED` | 403 | User cannot access this branch |
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource does not exist |
| `DUPLICATE_ENTRY` | 409 | Unique constraint violation |
| `INSUFFICIENT_STOCK` | 422 | Not enough inventory for operation |
| `BALANCE_MISMATCH` | 422 | Accounting entry does not balance |
| `FISCAL_PERIOD_CLOSED` | 422 | Cannot post to closed period |
| `DEPENDENT_RECORDS` | 422 | Cannot delete - has child records |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## 6. Module API Endpoints

### 6.1 Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|--------------|
| `POST` | `/api/auth/login` | User login | No |
| `POST` | `/api/auth/refresh` | Refresh access token | No |
| `POST` | `/api/auth/logout` | User logout | Yes |
| `POST` | `/api/auth/change-password` | Change password | Yes |
| `GET` | `/api/auth/me` | Get current user | Yes |
| `GET` | `/api/auth/sessions` | List active sessions | Yes |
| `DELETE` | `/api/auth/sessions/:id` | Revoke session | Yes |

### 6.2 Users Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users` | List all users (paginated) |
| `GET` | `/api/users/:id` | Get user by ID |
| `POST` | `/api/users` | Create new user |
| `PUT` | `/api/users/:id` | Update user |
| `PATCH` | `/api/users/:id/status` | Activate/deactivate user |
| `DELETE` | `/api/users/:id` | Soft delete user |
| `GET` | `/api/users/:id/roles` | Get user roles |
| `PUT` | `/api/users/:id/roles` | Assign roles to user |
| `GET` | `/api/users/:id/branches` | Get user branches |
| `PUT` | `/api/users/:id/branches` | Assign branches to user |

### 6.3 Branches Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/branches` | List all branches |
| `GET` | `/api/branches/:id` | Get branch by ID |
| `POST` | `/api/branches` | Create new branch |
| `PUT` | `/api/branches/:id` | Update branch |
| `PATCH` | `/api/branches/:id/status` | Activate/deactivate branch |
| `DELETE` | `/api/branches/:id` | Soft delete branch |
| `GET` | `/api/branches/:id/statistics` | Get branch statistics |
| `GET` | `/api/branches/:id/settings` | Get branch settings |
| `PUT` | `/api/branches/:id/settings` | Update branch settings |

### 6.4 Products Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/products` | List products (paginated, searchable) |
| `GET` | `/api/products/:id` | Get product by ID |
| `POST` | `/api/products` | Create product |
| `PUT` | `/api/products/:id` | Update product |
| `PATCH` | `/api/products/:id/price` | Update product pricing |
| `DELETE` | `/api/products/:id` | Soft delete product |
| `GET` | `/api/products/search?q=term` | Search products |
| `GET` | `/api/products/:id/inventory` | Get product inventory across warehouses |
| `GET` | `/api/products/:id/movements` | Get product stock movements |
| `GET` | `/api/products/barcode/:barcode` | Get product by barcode |

### 6.5 Product Categories Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/product-categories` | List categories (tree) |
| `GET` | `/api/product-categories/:id` | Get category |
| `POST` | `/api/product-categories` | Create category |
| `PUT` | `/api/product-categories/:id` | Update category |
| `DELETE` | `/api/product-categories/:id` | Delete category |

### 6.6 Inventory Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/inventory` | List current stock levels |
| `GET` | `/api/inventory/low-stock` | List items below minimum stock |
| `GET` | `/api/inventory/:productId` | Get stock for specific product |
| `POST` | `/api/inventory/adjustment` | Create stock adjustment |
| `GET` | `/api/inventory/movements` | List stock movements |
| `GET` | `/api/inventory/movements/:id` | Get movement details |
| `POST` | `/api/inventory/count` | Initiate inventory count |
| `GET` | `/api/inventory/count/:id` | Get count details |
| `POST` | `/api/inventory/count/:id/complete` | Complete inventory count |

### 6.7 Warehouses Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/warehouses` | List warehouses |
| `GET` | `/api/warehouses/:id` | Get warehouse |
| `POST` | `/api/warehouses` | Create warehouse |
| `PUT` | `/api/warehouses/:id` | Update warehouse |
| `DELETE` | `/api/warehouses/:id` | Delete warehouse |
| `GET` | `/api/warehouses/:id/inventory` | Get warehouse inventory |

### 6.8 Sales Orders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sales-orders` | List sales orders (paginated, filterable) |
| `GET` | `/api/sales-orders/:id` | Get sales order with items |
| `POST` | `/api/sales-orders` | Create sales order |
| `PUT` | `/api/sales-orders/:id` | Update sales order (draft only) |
| `PATCH` | `/api/sales-orders/:id/status` | Change order status |
| `DELETE` | `/api/sales-orders/:id` | Cancel/delete sales order |
| `POST` | `/api/sales-orders/:id/confirm` | Confirm sales order |
| `POST` | `/api/sales-orders/:id/ship` | Mark as shipped |
| `POST` | `/api/sales-orders/:id/deliver` | Mark as delivered |
| `POST` | `/api/sales-orders/:id/invoice` | Generate invoice |
| `POST` | `/api/sales-orders/:id/return` | Process return |
| `GET` | `/api/sales-orders/:id/print` | Generate printable PDF |
| `GET` | `/api/sales-orders/statistics` | Sales statistics |

### 6.9 Sales Returns Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sales-returns` | List sales returns |
| `GET` | `/api/sales-returns/:id` | Get return details |
| `POST` | `/api/sales-returns` | Create sales return |
| `PATCH` | `/api/sales-returns/:id/status` | Approve/reject return |

### 6.10 Quotations Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/quotations` | List quotations |
| `GET` | `/api/quotations/:id` | Get quotation |
| `POST` | `/api/quotations` | Create quotation |
| `PUT` | `/api/quotations/:id` | Update quotation |
| `POST` | `/api/quotations/:id/convert` | Convert to sales order |
| `DELETE` | `/api/quotations/:id` | Delete quotation |

### 6.11 Delivery Notes Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/delivery-notes` | List delivery notes |
| `GET` | `/api/delivery-notes/:id` | Get delivery note |
| `POST` | `/api/delivery-notes` | Create delivery note |
| `PATCH` | `/api/delivery-notes/:id/status` | Update delivery status |
| `GET` | `/api/delivery-notes/:id/print` | Print delivery note |

### 6.12 Customers Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/customers` | List customers (paginated, searchable) |
| `GET` | `/api/customers/:id` | Get customer details |
| `POST` | `/api/customers` | Create customer |
| `PUT` | `/api/customers/:id` | Update customer |
| `DELETE` | `/api/customers/:id` | Delete customer |
| `GET` | `/api/customers/:id/statement` | Get customer statement |
| `GET` | `/api/customers/:id/orders` | Get customer orders |
| `GET` | `/api/customers/:id/balance` | Get customer balance |
| `GET` | `/api/customers/search?q=term` | Search customers |

### 6.13 Purchase Orders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/purchase-orders` | List purchase orders |
| `GET` | `/api/purchase-orders/:id` | Get PO with items |
| `POST` | `/api/purchase-orders` | Create purchase order |
| `PUT` | `/api/purchase-orders/:id` | Update PO (draft) |
| `PATCH` | `/api/purchase-orders/:id/status` | Change PO status |
| `DELETE` | `/api/purchase-orders/:id` | Cancel/delete PO |
| `POST` | `/api/purchase-orders/:id/receive` | Record partial receipt |
| `GET` | `/api/purchase-orders/:id/print` | Print PO |

### 6.14 Goods Receipt Notes (GRN) Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/grn` | List GRNs |
| `GET` | `/api/grn/:id` | Get GRN details |
| `POST` | `/api/grn` | Create GRN |
| `PATCH` | `/api/grn/:id/status` | Update GRN status |

### 6.15 Suppliers Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/suppliers` | List suppliers |
| `GET` | `/api/suppliers/:id` | Get supplier |
| `POST` | `/api/suppliers` | Create supplier |
| `PUT` | `/api/suppliers/:id` | Update supplier |
| `DELETE` | `/api/suppliers/:id` | Delete supplier |
| `GET` | `/api/suppliers/:id/statement` | Get supplier statement |
| `GET` | `/api/suppliers/:id/orders` | Get supplier POs |

### 6.16 Treasury Positions Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/treasury/positions` | Get treasury position summary |
| `GET` | `/api/treasury/positions/:type/:id` | Get specific account position |

### 6.17 Cash Boxes Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/cash-boxes` | List cash boxes |
| `GET` | `/api/cash-boxes/:id` | Get cash box |
| `POST` | `/api/cash-boxes` | Create cash box |
| `PUT` | `/api/cash-boxes/:id` | Update cash box |
| `GET` | `/api/cash-boxes/:id/transactions` | Get cash transactions |
| `POST` | `/api/cash-boxes/:id/receipt` | Record cash receipt |
| `POST` | `/api/cash-boxes/:id/payment` | Record cash payment |
| `GET` | `/api/cash-boxes/:id/statement` | Get cash box statement |

### 6.18 Banks Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/banks` | List bank accounts |
| `GET` | `/api/banks/:id` | Get bank account |
| `POST` | `/api/banks` | Create bank account |
| `PUT` | `/api/banks/:id` | Update bank account |
| `GET` | `/api/banks/:id/transactions` | Get bank transactions |
| `POST` | `/api/banks/:id/deposit` | Record deposit |
| `POST` | `/api/banks/:id/withdrawal` | Record withdrawal |
| `GET` | `/api/banks/:id/statement` | Get bank statement |

### 6.19 Transfers Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transfers` | List transfers |
| `GET` | `/api/transfers/:id` | Get transfer |
| `POST` | `/api/transfers` | Create transfer |
| `PATCH` | `/api/transfers/:id/approve` | Approve transfer |
| `PATCH` | `/api/transfers/:id/complete` | Complete transfer |
| `PATCH` | `/api/transfers/:id/cancel` | Cancel transfer |

### 6.20 Chart of Accounts Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chart-of-accounts` | List accounts (tree structure) |
| `GET` | `/api/chart-of-accounts/:id` | Get account details |
| `POST` | `/api/chart-of-accounts` | Create account |
| `PUT` | `/api/chart-of-accounts/:id` | Update account |
| `DELETE` | `/api/chart-of-accounts/:id` | Delete account (if no entries) |
| `GET` | `/api/chart-of-accounts/:id/balance` | Get account balance |
| `GET` | `/api/chart-of-accounts/:id/ledger` | Get account ledger |
| `GET` | `/api/chart-of-accounts/:id/balances` | Get monthly balances |

### 6.21 Journal Entries Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/journal-entries` | List journal entries (paginated) |
| `GET` | `/api/journal-entries/:id` | Get journal entry with lines |
| `POST` | `/api/journal-entries` | Create journal entry |
| `PUT` | `/api/journal-entries/:id` | Update journal entry (unposted) |
| `DELETE` | `/api/journal-entries/:id` | Delete journal entry (unposted) |
| `POST` | `/api/journal-entries/:id/post` | Post journal entry to GL |
| `POST` | `/api/journal-entries/:id/reverse` | Create reversing entry |
| `GET` | `/api/journal-entries/:id/print` | Print journal entry |
| `GET` | `/api/journal-entries/unposted` | List unposted entries |
| `GET` | `/api/journal-entries/balance-check` | Verify trial balance |

### 6.22 General Ledger Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/general-ledger` | Query GL entries (filterable) |
| `GET` | `/api/general-ledger/account/:accountId` | GL by account |
| `GET` | `/api/general-ledger/date-range` | GL by date range |
| `GET` | `/api/general-ledger/trial-balance` | Generate trial balance |

### 6.23 Financial Statements Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/financial-statements/trial-balance` | Trial balance |
| `GET` | `/api/financial-statements/balance-sheet` | Balance sheet |
| `GET` | `/api/financial-statements/income-statement` | Profit & loss |
| `GET` | `/api/financial-statements/cash-flow` | Cash flow statement |
| `GET` | `/api/financial-statements/changes-in-equity` | Equity changes |

### 6.24 Fiscal Periods Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fiscal-periods` | List fiscal periods |
| `POST` | `/api/fiscal-periods` | Create fiscal period |
| `POST` | `/api/fiscal-periods/:id/close` | Close fiscal period |
| `POST` | `/api/fiscal-periods/:id/reopen` | Reopen fiscal period (admin) |

### 6.25 Employees Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/employees` | List employees |
| `GET` | `/api/employees/:id` | Get employee details |
| `POST` | `/api/employees` | Create employee |
| `PUT` | `/api/employees/:id` | Update employee |
| `DELETE` | `/api/employees/:id` | Delete employee |
| `GET` | `/api/employees/:id/documents` | Get employee documents |
| `POST` | `/api/employees/:id/documents` | Upload document |
| `PATCH` | `/api/employees/:id/status` | Update employment status |
| `GET` | `/api/employees/:id/salary` | Get salary details |

### 6.26 Attendance Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/attendance` | List attendance records |
| `GET` | `/api/attendance/:id` | Get attendance record |
| `POST` | `/api/attendance/check-in` | Record check-in |
| `POST` | `/api/attendance/check-out` | Record check-out |
| `GET` | `/api/attendance/report` | Attendance report |
| `POST` | `/api/attendance/bulk` | Bulk attendance import |
| `GET` | `/api/attendance/summary` | Attendance summary |

### 6.27 Leave Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/leave` | List leave requests |
| `GET` | `/api/leave/:id` | Get leave request |
| `POST` | `/api/leave` | Submit leave request |
| `PATCH` | `/api/leave/:id/approve` | Approve leave |
| `PATCH` | `/api/leave/:id/reject` | Reject leave |
| `GET` | `/api/leave/balance/:employeeId` | Get leave balance |

### 6.28 Payroll Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/payroll` | List payroll records |
| `GET` | `/api/payroll/:id` | Get payroll record |
| `POST` | `/api/payroll/calculate` | Calculate payroll for period |
| `POST` | `/api/payroll/:id/process` | Process payroll |
| `POST` | `/api/payroll/:id/approve` | Approve payroll |
| `POST` | `/api/payroll/:id/pay` | Execute payment |
| `GET` | `/api/payroll/:id/payslip` | Generate payslip |
| `POST` | `/api/payroll/:id/post` | Post to accounting |
| `GET` | `/api/payroll/summary` | Payroll summary report |

### 6.29 Departments Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/departments` | List departments |
| `POST` | `/api/departments` | Create department |
| `PUT` | `/api/departments/:id` | Update department |
| `DELETE` | `/api/departments/:id` | Delete department |

### 6.30 CRM Leads Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/crm/leads` | List leads (paginated, filterable) |
| `GET` | `/api/crm/leads/:id` | Get lead details |
| `POST` | `/api/crm/leads` | Create lead |
| `PUT` | `/api/crm/leads/:id` | Update lead |
| `PATCH` | `/api/crm/leads/:id/status` | Update lead status |
| `DELETE` | `/api/crm/leads/:id` | Delete lead |
| `POST` | `/api/crm/leads/:id/convert` | Convert lead to customer |
| `POST` | `/api/crm/leads/:id/assign` | Assign lead to user |
| `GET` | `/api/crm/leads/dashboard` | Lead dashboard data |

### 6.31 CRM Activities Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/crm/activities` | List activities |
| `GET` | `/api/crm/activities/:id` | Get activity |
| `POST` | `/api/crm/activities` | Create activity |
| `PUT` | `/api/crm/activities/:id` | Update activity |
| `DELETE` | `/api/crm/activities/:id` | Delete activity |
| `GET` | `/api/crm/activities/calendar` | Activity calendar view |
| `GET` | `/api/crm/activities/upcoming` | Upcoming follow-ups |

### 6.32 Vehicles Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vehicles` | List vehicles |
| `GET` | `/api/vehicles/:id` | Get vehicle |
| `POST` | `/api/vehicles` | Create vehicle |
| `PUT` | `/api/vehicles/:id` | Update vehicle |
| `DELETE` | `/api/vehicles/:id` | Delete vehicle |
| `GET` | `/api/vehicles/:id/maintenance` | Get maintenance history |
| `POST` | `/api/vehicles/:id/maintenance` | Record maintenance |

### 6.33 Drivers Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/drivers` | List drivers |
| `GET` | `/api/drivers/:id` | Get driver |
| `POST` | `/api/drivers` | Create driver |
| `PUT` | `/api/drivers/:id` | Update driver |
| `DELETE` | `/api/drivers/:id` | Delete driver |

### 6.34 Trips Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/trips` | List trips |
| `GET` | `/api/trips/:id` | Get trip |
| `POST` | `/api/trips` | Create trip |
| `PUT` | `/api/trips/:id` | Update trip |
| `PATCH` | `/api/trips/:id/status` | Update trip status |
| `GET` | `/api/trips/:id/stops` | Get trip stops |
| `POST` | `/api/trips/:id/stops` | Add trip stop |

### 6.35 Feed Formulas Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/feed-formulas` | List feed formulas |
| `GET` | `/api/feed-formulas/:id` | Get formula with ingredients |
| `POST` | `/api/feed-formulas` | Create formula |
| `PUT` | `/api/feed-formulas/:id` | Update formula |
| `DELETE` | `/api/feed-formulas/:id` | Delete formula |
| `GET` | `/api/feed-formulas/:id/cost` | Calculate formula cost |

### 6.36 Manufacturing Orders Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/manufacturing-orders` | List MOs |
| `GET` | `/api/manufacturing-orders/:id` | Get MO details |
| `POST` | `/api/manufacturing-orders` | Create MO |
| `PATCH` | `/api/manufacturing-orders/:id/status` | Update MO status |
| `POST` | `/api/manufacturing-orders/:id/start` | Start production |
| `POST` | `/api/manufacturing-orders/:id/complete` | Complete production |
| `GET` | `/api/manufacturing-orders/:id/cost` | Get production cost |

### 6.37 Production Batches Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/production-batches` | List production batches |
| `GET` | `/api/production-batches/:id` | Get batch details |
| `POST` | `/api/production-batches/:id/qc` | Submit QC check |

### 6.38 Chick Batches Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/chick-batches` | List chick batches |
| `GET` | `/api/chick-batches/:id` | Get batch details |
| `POST` | `/api/chick-batches` | Create chick batch |
| `PUT` | `/api/chick-batches/:id` | Update batch |
| `PATCH` | `/api/chick-batches/:id/status` | Update batch status |
| `POST` | `/api/chick-batches/:id/transfer` | Transfer to shed |
| `GET` | `/api/chick-batches/:id/performance` | Get performance metrics |

### 6.39 Sheds Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sheds` | List sheds |
| `GET` | `/api/sheds/:id` | Get shed details |
| `POST` | `/api/sheds` | Create shed |
| `PUT` | `/api/sheds/:id` | Update shed |
| `DELETE` | `/api/sheds/:id` | Delete shed |
| `GET` | `/api/sheds/:id/batches` | Get shed batches |
| `GET` | `/api/sheds/:id/environment` | Get environmental data |

### 6.40 Egg Production Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/egg-production` | List production records |
| `GET` | `/api/egg-production/:id` | Get production record |
| `POST` | `/api/egg-production` | Record daily production |
| `PUT` | `/api/egg-production/:id` | Update production record |
| `GET` | `/api/egg-production/summary` | Production summary |
| `GET` | `/api/egg-production/trends` | Production trends |
| `GET` | `/api/egg-production/by-batch` | Production by batch |

### 6.41 Poultry Mortality Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/poultry-mortality` | List mortality records |
| `POST` | `/api/poultry-mortality` | Record mortality |
| `GET` | `/api/poultry-mortality/summary` | Mortality summary |
| `GET` | `/api/poultry-mortality/trends` | Mortality trends |

### 6.42 Poultry Feeding Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/poultry-feeding` | List feeding records |
| `POST` | `/api/poultry-feeding` | Record feeding |
| `GET` | `/api/poultry-feeding/fcr` | Feed conversion ratio |

### 6.43 Reports Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/reports/sales-summary` | Sales summary report |
| `GET` | `/api/reports/sales-by-product` | Sales by product |
| `GET` | `/api/reports/sales-by-customer` | Sales by customer |
| `GET` | `/api/reports/purchase-summary` | Purchase summary |
| `GET` | `/api/reports/inventory-valuation` | Inventory valuation |
| `GET` | `/api/reports/stock-movement` | Stock movement report |
| `GET` | `/api/reports/customer-balance` | Customer balance report |
| `GET` | `/api/reports/supplier-balance` | Supplier balance report |
| `GET` | `/api/reports/trial-balance` | Trial balance |
| `GET` | `/api/reports/balance-sheet` | Balance sheet |
| `GET` | `/api/reports/income-statement` | Income statement |
| `GET` | `/api/reports/cash-flow` | Cash flow report |
| `GET` | `/api/reports/payroll-summary` | Payroll summary |
| `GET` | `/api/reports/employee-attendance` | Attendance report |
| `GET` | `/api/reports/poultry-performance` | Poultry performance |
| `GET` | `/api/reports/egg-production` | Egg production report |
| `GET` | `/api/reports/feed-consumption` | Feed consumption report |

### 6.44 Dashboard Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard/kpi` | Main KPI summary |
| `GET` | `/api/dashboard/sales` | Sales dashboard data |
| `GET` | `/api/dashboard/inventory` | Inventory dashboard data |
| `GET` | `/api/dashboard/financial` | Financial dashboard data |
| `GET` | `/api/dashboard/hr` | HR dashboard data |
| `GET` | `/api/dashboard/poultry` | Poultry dashboard data |
| `GET` | `/api/dashboard/recent-activity` | Recent system activity |
| `GET` | `/api/dashboard/alerts` | Active alerts and warnings |

### 6.45 Audit Logs Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/audit-logs` | List audit log entries |
| `GET` | `/api/audit-logs/:id` | Get audit log details |
| `GET` | `/api/audit-logs/entity/:type/:id` | Audit for specific entity |
| `GET` | `/api/audit-logs/user/:userId` | Audit by user |
| `GET` | `/api/audit-logs/export` | Export audit log |

### 6.46 Settings Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/settings` | Get system settings |
| `PUT` | `/api/settings` | Update system settings |
| `GET` | `/api/settings/company` | Get company profile |
| `PUT` | `/api/settings/company` | Update company profile |

### 6.47 Roles & Permissions Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/roles` | List roles |
| `GET` | `/api/roles/:id` | Get role with permissions |
| `POST` | `/api/roles` | Create role |
| `PUT` | `/api/roles/:id` | Update role |
| `DELETE` | `/api/roles/:id` | Delete role |
| `GET` | `/api/permissions` | List all permissions |

### 6.48 Notifications Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/notifications` | List user notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark as read |
| `PATCH` | `/api/notifications/read-all` | Mark all as read |

---

## 7. Rate Limiting

### 7.1 Rate Limit Configuration

| Tier | Requests/Minute | Burst | Scope |
|------|----------------|-------|-------|
| **General API** | 120 | 150 | Per IP + User |
| **Auth Endpoints** | 10 | 15 | Per IP |
| **Report Generation** | 10 | 15 | Per User |
| **Bulk Operations** | 5 | 10 | Per User |
| **Export** | 30 | 40 | Per User |

### 7.2 Rate Limit Headers

```http
HTTP/1.1 200 OK
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 98
X-RateLimit-Reset: 1717227600
X-RateLimit-Retry-After: 45
```

### 7.3 Rate Limit Exceeded Response

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again in 60 seconds.",
    "retryAfter": 60
  }
}
```

---

## 8. API Versioning

### 8.1 Versioning Strategy

The API uses URL-based versioning. Current version is **v1**.

```
/api/v1/users        -> Version 1 (current)
/api/v2/users        -> Version 2 (future)
/api/users           -> Alias to current version
```

### 8.2 Deprecation Policy

| Phase | Duration | Behavior |
|-------|----------|----------|
| **Active** | Current | Full support, new features |
| **Deprecated** | 6 months | Works but warns in headers |
| **Sunset** | 3 months | Returns 410 Gone with migration guide |
| **Retired** | - | No longer available |

### 8.3 Deprecation Headers

```http
Deprecation: true
Sunset: Wed, 01 Jan 2026 00:00:00 GMT
Link: </api/v2/users>; rel="successor-version"
```

---

## 9. Webhook Support

### 9.1 Webhook Events

The system can send webhook notifications for the following events:

| Event | Description | Payload |
|-------|-------------|---------|
| `sales_order.created` | New sales order created | Order details |
| `sales_order.confirmed` | Sales order confirmed | Order + status |
| `sales_order.shipped` | Order shipped | Order + delivery |
| `sales_order.invoiced` | Invoice generated | Invoice details |
| `purchase_order.created` | New PO created | PO details |
| `purchase_order.received` | PO fully received | GRN details |
| `inventory.low_stock` | Item below minimum | Product + current stock |
| `payment.received` | Payment recorded | Payment details |
| `journal_entry.posted` | JE posted to GL | Entry details |
| `payroll.processed` | Payroll processed | Payroll summary |

### 9.2 Webhook Configuration

```http
POST /api/settings/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-system.com/webhook",
  "events": ["sales_order.created", "sales_order.invoiced"],
  "secret": "your-webhook-secret",
  "isActive": true
}
```

### 9.3 Webhook Payload Format

```json
{
  "event": "sales_order.created",
  "timestamp": "2025-06-01T12:00:00.000Z",
  "webhookId": "wh-12345",
  "data": {
    "orderId": "uuid",
    "orderNumber": "SO-2025-0001",
    "customerName": "Customer Name",
    "totalAmount": 15000.00,
    "status": "CONFIRMED",
    "branchId": "branch-uuid"
  }
}
```

### 9.4 Webhook Security

Webhooks are signed using HMAC-SHA256:

```
X-Webhook-Signature: sha256=<signature>

Verification:
signature = HMAC-SHA256(webhook_secret, request_body)
```

### 9.5 Webhook Retry Policy

| Attempt | Delay |
|---------|-------|
| 1st | Immediate |
| 2nd | 5 seconds |
| 3rd | 30 seconds |
| 4th | 5 minutes |
| 5th | 30 minutes |

After 5 failed attempts, webhook is marked as failed and requires manual retry.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-01 | Technical Team | Initial document |

---

*This document is the property of GFF ERP Enterprise. Unauthorized distribution is prohibited.*
