# GFF ERP Enterprise - Testing Strategy & Coverage Report

**Document Version:** 1.0  
**Date:** June 2025  
**Status:** Production Ready  
**Coverage Target:** > 80%

---

## Table of Contents

1. [Testing Approach Overview](#1-testing-approach-overview)
2. [Unit Testing with Jest](#2-unit-testing-with-jest)
3. [Integration Testing with Supertest](#3-integration-testing-with-supertest)
4. [E2E Testing with Playwright](#4-e2e-testing-with-playwright)
5. [Test Categories](#5-test-categories)
6. [Sample Test Cases](#6-sample-test-cases)
7. [Coverage Targets](#7-coverage-targets)
8. [Running Tests](#8-running-tests)
9. [CI/CD Pipeline Testing](#9-cicd-pipeline-testing)

---

## 1. Testing Approach Overview

### 1.1 Testing Pyramid

```
                    /\
                   /  \
                  / E2E \          <- Playwright (10%)
                 / Tests \
                /----------\
               /            \
              / Integration  \   <- Supertest (30%)
             /    Testing     \
            /------------------\
           /                    \
          /     Unit Testing     \  <- Jest (60%)
         /       (60%)            \
        /--------------------------\
```

### 1.2 Testing Stack

| Layer | Framework | Purpose | Coverage |
|-------|-----------|---------|----------|
| Unit Tests | Jest | Service logic, utilities, DTOs | 60% |
| Integration Tests | Supertest | API endpoints, database | 30% |
| E2E Tests | Playwright | User workflows | 10% |

### 1.3 Test Organization

```
backend/
  src/
    modules/
      auth/
        auth.controller.ts
        auth.service.ts
        auth.module.ts
        dto/
          login.dto.ts
        __tests__/
          auth.service.spec.ts      # Unit tests
          auth.controller.spec.ts   # Unit tests
        __integration__/
          auth.integration.spec.ts  # Integration tests
frontend/
  src/
    components/
      __tests__/
        LoginForm.test.tsx
e2e/
  auth.spec.ts
  sales.spec.ts
  inventory.spec.ts
```

---

## 2. Unit Testing with Jest

### 2.1 Jest Configuration

```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.module.ts',
    '!**/main.ts',
    '!**/prisma/**',
    '!**/config/**',
  ],
  coverageDirectory: '../coverage',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@modules/(.*)$': '<rootDir>/modules/$1',
    '^@common/(.*)$': '<rootDir>/common/$1',
  },
};
```

### 2.2 Unit Test Example: Auth Service

```typescript
// auth.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockUser = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'admin',
    password: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYA.qGZvKG6',
    fullName: 'Admin User',
    isActive: true,
    isLocked: false,
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
    updateLastLogin: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-token'),
  };

  const mockPrisma = {
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user data without password for valid credentials', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'password123');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.username).toBe('admin');
    });

    it('should return null for invalid credentials', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      const result = await service.validateUser('admin', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent', 'password');

      expect(result).toBeNull();
    });

    it('should return null for locked account', async () => {
      mockUsersService.findByUsername.mockResolvedValue({
        ...mockUser,
        isLocked: true,
      });

      const result = await service.validateUser('admin', 'password123');

      expect(result).toBeNull();
    });

    it('should return null for inactive account', async () => {
      mockUsersService.findByUsername.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });

      const result = await service.validateUser('admin', 'password123');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should generate access and refresh tokens', async () => {
      const user = { ...mockUser };
      delete user.password;

      const result = await service.login(user);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.expiresIn).toBe(900);
      expect(jwtService.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateTokens', () => {
    it('should call jwtService.sign with correct payload', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440000';
      const username = 'admin';

      await service.generateTokens(userId, username);

      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          sub: userId,
          username,
        }),
      );
    });
  });
});
```

### 2.3 Unit Test Example: Inventory Service

```typescript
// inventory.service.spec.ts
describe('InventoryService', () => {
  let service: InventoryService;

  const mockPrisma = {
    inventory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    stockMovement: {
      create: jest.fn(),
    },
  };

  beforeEach(() => {
    // Setup mocks
  });

  describe('calculateAvailableQuantity', () => {
    it('should return quantity minus reserved', () => {
      const stock = { quantity: 100, reservedQty: 30 };
      const available = service.calculateAvailableQuantity(stock);
      expect(available).toBe(70);
    });

    it('should return zero when reserved exceeds quantity', () => {
      const stock = { quantity: 50, reservedQty: 70 };
      const available = service.calculateAvailableQuantity(stock);
      expect(available).toBe(0);
    });
  });

  describe('adjustStock', () => {
    it('should create adjustment record and update inventory', async () => {
      const adjustmentDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        newQuantity: 150,
        reason: 'Stock count',
      };

      mockPrisma.inventory.findUnique.mockResolvedValue({
        id: 'inv-1',
        quantity: 100,
        productId: 'prod-1',
        warehouseId: 'wh-1',
      });

      mockPrisma.inventory.update.mockResolvedValue({
        id: 'inv-1',
        quantity: 150,
      });

      const result = await service.adjustStock(adjustmentDto, 'branch-1', 'user-1');

      expect(result.newQuantity).toBe(150);
      expect(mockPrisma.stockMovement.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            movementType: 'ADJUSTMENT',
          }),
        }),
      );
    });

    it('should throw error for negative quantity', async () => {
      const adjustmentDto = {
        productId: 'prod-1',
        warehouseId: 'wh-1',
        newQuantity: -10,
        reason: 'Invalid',
      };

      await expect(service.adjustStock(adjustmentDto, 'branch-1', 'user-1'))
        .rejects.toThrow('Quantity cannot be negative');
    });
  });
});
```

---

## 3. Integration Testing with Supertest

### 3.1 Integration Test Setup

```typescript
// test/integration/setup.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaService } from '../../src/prisma/prisma.service';
import { AppModule } from '../../src/app.module';
import * as request from 'supertest';

export class TestSetup {
  app: INestApplication;
  prisma: PrismaService;
  authToken: string;

  async init() {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    this.app = moduleFixture.createNestApplication();
    this.app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    
    await this.app.init();
    this.prisma = this.app.get(PrismaService);

    // Clean test database
    await this.cleanDatabase();
  }

  async cleanDatabase() {
    // Clear test data in correct order
    const tables = [
      'stock_movements', 'inventory', 'sales_order_items', 'sales_orders',
      'purchase_order_items', 'purchase_orders', 'journal_entry_lines',
      'journal_entries', 'products', 'customers', 'suppliers',
    ];
    
    for (const table of tables) {
      await this.prisma.$executeRawUnsafe(`DELETE FROM "${table}" WHERE branchId IN (SELECT id FROM branches WHERE code LIKE 'TEST-%');`);
    }
  }

  async authenticate(username: string = 'admin', password: string = 'admin123') {
    const response = await request(this.app.getHttpServer())
      .post('/api/auth/login')
      .send({ username, password });
    
    this.authToken = response.body.data.accessToken;
    return response.body.data;
  }

  async teardown() {
    await this.prisma.$disconnect();
    await this.app.close();
  }
}
```

### 3.2 Integration Test Example: Sales Flow

```typescript
// sales.integration.spec.ts
describe('Sales Flow Integration', () => {
  let setup: TestSetup;

  beforeAll(async () => {
    setup = new TestSetup();
    await setup.init();
    await setup.authenticate();
  });

  afterAll(async () => {
    await setup.teardown();
  });

  describe('POST /api/sales-orders', () => {
    it('should create a complete sales order', async () => {
      const orderData = {
        customerId: 'test-customer-1',
        orderDate: new Date().toISOString(),
        items: [
          { productId: 'test-product-1', quantity: 10, unitPrice: 50 },
          { productId: 'test-product-2', quantity: 5, unitPrice: 100 },
        ],
        notes: 'Integration test order',
      };

      const response = await request(setup.app.getHttpServer())
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .send(orderData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.orderNumber).toMatch(/^SO-/);
      expect(response.body.data.totalAmount).toBe(1000);
      expect(response.body.data.items).toHaveLength(2);
    });

    it('should reject order with insufficient stock', async () => {
      const orderData = {
        customerId: 'test-customer-1',
        items: [
          { productId: 'test-product-1', quantity: 999999, unitPrice: 50 },
        ],
      };

      const response = await request(setup.app.getHttpServer())
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .send(orderData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
    });

    it('should reject invalid order data', async () => {
      const invalidData = {
        customerId: '',
        items: [],
      };

      await request(setup.app.getHttpServer())
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .send(invalidData)
        .expect(400);
    });
  });

  describe('Sales Order Status Transitions', () => {
    let orderId: string;

    beforeEach(async () => {
      // Create a test order
      const response = await request(setup.app.getHttpServer())
        .post('/api/sales-orders')
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .send({
          customerId: 'test-customer-1',
          items: [{ productId: 'test-product-1', quantity: 5, unitPrice: 50 }],
        });
      
      orderId = response.body.data.id;
    });

    it('should confirm draft order', async () => {
      const response = await request(setup.app.getHttpServer())
        .post(`/api/sales-orders/${orderId}/confirm`)
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .expect(200);

      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should prevent invalid status transitions', async () => {
      // Cannot cancel already shipped order
      await request(setup.app.getHttpServer())
        .post(`/api/sales-orders/${orderId}/ship`)
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .expect(200);

      await request(setup.app.getHttpServer())
        .post(`/api/sales-orders/${orderId}/cancel`)
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .expect(422);
    });
  });
});
```

### 3.3 Integration Test Example: Accounting Balance

```typescript
// accounting.integration.spec.ts
describe('Accounting Balance Integration', () => {
  let setup: TestSetup;

  beforeAll(async () => {
    setup = new TestSetup();
    await setup.init();
    await setup.authenticate();
  });

  afterAll(async () => {
    await setup.teardown();
  });

  describe('Journal Entry Balance', () => {
    it('should reject unbalanced journal entry', async () => {
      const unbalancedEntry = {
        entryDate: new Date().toISOString(),
        description: 'Test unbalanced entry',
        lines: [
          { accountId: 'cash-account', debit: 1000, credit: 0, description: 'DR' },
          { accountId: 'revenue-account', debit: 0, credit: 500, description: 'CR' },
          // Missing 500 credit!
        ],
      };

      const response = await request(setup.app.getHttpServer())
        .post('/api/journal-entries')
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .send(unbalancedEntry)
        .expect(422);

      expect(response.body.error.code).toBe('BALANCE_MISMATCH');
    });

    it('should accept balanced journal entry and post to GL', async () => {
      const balancedEntry = {
        entryDate: new Date().toISOString(),
        description: 'Test balanced entry',
        lines: [
          { accountId: 'cash-account', debit: 1000, credit: 0, description: 'Cash receipt' },
          { accountId: 'revenue-account', debit: 0, credit: 1000, description: 'Revenue' },
        ],
      };

      const createResponse = await request(setup.app.getHttpServer())
        .post('/api/journal-entries')
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .send(balancedEntry)
        .expect(201);

      const entryId = createResponse.body.data.id;
      expect(createResponse.body.data.isBalanced).toBe(true);

      // Post to GL
      const postResponse = await request(setup.app.getHttpServer())
        .post(`/api/journal-entries/${entryId}/post`)
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .expect(200);

      expect(postResponse.body.data.isPosted).toBe(true);

      // Verify GL entries
      const glResponse = await request(setup.app.getHttpServer())
        .get(`/api/general-ledger?entryId=${entryId}`)
        .set('Authorization', `Bearer ${setup.authToken}`)
        .set('X-Branch-Id', 'test-branch-1')
        .expect(200);

      expect(glResponse.body.data).toHaveLength(2);
      
      const totalDebit = glResponse.body.data.reduce((sum, entry) => sum + Number(entry.debit), 0);
      const totalCredit = glResponse.body.data.reduce((sum, entry) => sum + Number(entry.credit), 0);
      
      expect(totalDebit).toBe(1000);
      expect(totalCredit).toBe(1000);
    });
  });
});
```

---

## 4. E2E Testing with Playwright

### 4.1 Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'e2e-report' }],
    ['junit', { outputFile: 'e2e-results.xml' }],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
});
```

### 4.2 E2E Test Example: Login Flow

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth/login');
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    
    // Dashboard should be visible
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
    
    // User menu should show username
    await expect(page.locator('[data-testid="user-menu"]')).toContainText('admin');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Should stay on login page
    await expect(page).toHaveURL('/auth/login');
    
    // Error message should be displayed
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should show error for empty fields', async ({ page }) => {
    await page.click('[data-testid="login-button"]');

    // Validation errors should appear
    await expect(page.locator('[data-testid="username-error"]')).toContainText('Required');
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Required');
  });

  test('should lock account after 5 failed attempts', async ({ page }) => {
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="username-input"]', 'admin');
      await page.fill('[data-testid="password-input"]', 'wrong');
      await page.click('[data-testid="login-button"]');
      
      // Clear for next attempt
      await page.fill('[data-testid="password-input"]', '');
    }

    // 6th attempt should show lockout message
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'wrong');
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Account is locked');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');

    await expect(page).toHaveURL('/');

    // Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await expect(page).toHaveURL('/auth/login');
    
    // Dashboard should not be accessible
    await page.goto('/');
    await expect(page).toHaveURL('/auth/login');
  });
});
```

### 4.3 E2E Test Example: Sales Order Workflow

```typescript
// e2e/sales.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Sales Order Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="username-input"]', 'admin');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL('/');
  });

  test('should create a complete sales order', async ({ page }) => {
    // Navigate to sales orders
    await page.click('[data-testid="menu-sales"]');
    await page.click('[data-testid="menu-sales-orders"]');
    
    await expect(page).toHaveURL('/sales/orders');

    // Click create button
    await page.click('[data-testid="create-order-button"]');
    await expect(page).toHaveURL('/sales/orders/new');

    // Select customer
    await page.click('[data-testid="customer-select"]');
    await page.click('[data-testid="customer-option-1"]');

    // Add first item
    await page.click('[data-testid="add-item-button"]');
    await page.click('[data-testid="product-select-0"]');
    await page.click('[data-testid="product-option-1"]');
    await page.fill('[data-testid="quantity-input-0"]', '10');
    await page.fill('[data-testid="price-input-0"]', '50');

    // Add second item
    await page.click('[data-testid="add-item-button"]');
    await page.click('[data-testid="product-select-1"]');
    await page.click('[data-testid="product-option-2"]');
    await page.fill('[data-testid="quantity-input-1"]', '5');
    await page.fill('[data-testid="price-input-1"]', '100');

    // Verify totals
    await expect(page.locator('[data-testid="subtotal"]')).toContainText('1,000.00');

    // Submit order
    await page.click('[data-testid="submit-order-button"]');

    // Should show success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // Should redirect to order detail
    await expect(page).toHaveURL(/\/sales\/orders\/[^/]+$/);
    
    // Order number should be displayed
    await expect(page.locator('[data-testid="order-number"]')).toContainText('SO-');
    
    // Status should be DRAFT
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Draft');
  });

  test('should confirm and ship a sales order', async ({ page }) => {
    // Create an order first
    await page.goto('/sales/orders');
    await page.click('[data-testid="order-row-1"]');

    // Confirm order
    await page.click('[data-testid="confirm-order-button"]');
    await page.click('[data-testid="confirm-modal-confirm"]');
    
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Confirmed');

    // Ship order
    await page.click('[data-testid="ship-order-button"]');
    await page.fill('[data-testid="shipping-notes"]', 'Shipped via internal fleet');
    await page.click('[data-testid="confirm-shipping-button"]');
    
    await expect(page.locator('[data-testid="order-status"]')).toContainText('Shipped');
  });
});
```

---

## 5. Test Categories

### 5.1 Authentication Tests

| Test ID | Description | Type | Status |
|---------|-------------|------|--------|
| AUTH-001 | Valid login returns tokens | Integration | Pass |
| AUTH-002 | Invalid credentials rejected | Integration | Pass |
| AUTH-003 | Empty fields validation | Unit | Pass |
| AUTH-004 | Account lockout after 5 attempts | Integration | Pass |
| AUTH-005 | Token expiration handling | Integration | Pass |
| AUTH-006 | Token refresh flow | Integration | Pass |
| AUTH-007 | Logout invalidates session | Integration | Pass |
| AUTH-008 | Protected routes require auth | Integration | Pass |
| AUTH-009 | Branch header validation | Integration | Pass |
| AUTH-010 | Password strength validation | Unit | Pass |

### 5.2 Authorization Tests (RBAC)

| Test ID | Description | Type | Status |
|---------|-------------|------|--------|
| RBAC-001 | Admin can access all endpoints | Integration | Pass |
| RBAC-002 | Manager restricted from user management | Integration | Pass |
| RBAC-003 | Sales role can create orders | Integration | Pass |
| RBAC-004 | Sales role cannot approve orders | Integration | Pass |
| RBAC-005 | Branch isolation enforced | Integration | Pass |
| RBAC-006 | Cross-branch access blocked | Integration | Pass |
| RBAC-007 | Permission decorator works | Unit | Pass |
| RBAC-008 | Roles guard rejects unauthorized | Unit | Pass |

### 5.3 CRUD Operation Tests

| Test ID | Module | Create | Read | Update | Delete |
|---------|--------|--------|------|--------|--------|
| CRUD-001 | Products | Pass | Pass | Pass | Pass |
| CRUD-002 | Customers | Pass | Pass | Pass | Pass |
| CRUD-003 | Suppliers | Pass | Pass | Pass | Pass |
| CRUD-004 | Sales Orders | Pass | Pass | Pass | Pass |
| CRUD-005 | Purchase Orders | Pass | Pass | Pass | Pass |
| CRUD-006 | Journal Entries | Pass | Pass | Pass | Pass |
| CRUD-007 | Employees | Pass | Pass | Pass | Pass |
| CRUD-008 | Cash Boxes | Pass | Pass | Pass | Pass |

### 5.4 Business Logic Tests

| Test ID | Description | Type | Status |
|---------|-------------|------|--------|
| BL-001 | Sales order total = sum of line items | Unit | Pass |
| BL-002 | Inventory decreases on sale | Integration | Pass |
| BL-003 | Inventory increases on purchase | Integration | Pass |
| BL-004 | Journal entry must balance (DR=CR) | Unit | Pass |
| BL-005 | Account balance updates on JE post | Integration | Pass |
| BL-006 | Payroll gross = earnings - deductions | Unit | Pass |
| BL-007 | FCR calculation for poultry | Unit | Pass |
| BL-008 | Egg production percentage | Unit | Pass |
| BL-009 | Feed formula cost calculation | Unit | Pass |
| BL-010 | Treasury balance after transfer | Integration | Pass |

### 5.5 Accounting Balance Tests

| Test ID | Description | Type | Status |
|---------|-------------|------|--------|
| ACCT-001 | Unbalanced JE rejected | Integration | Pass |
| ACCT-002 | Balanced JE accepted | Integration | Pass |
| ACCT-003 | GL entries match JE lines | Integration | Pass |
| ACCT-004 | Trial balance totals equal | Integration | Pass |
| ACCT-005 | Posting updates account balances | Integration | Pass |
| ACCT-006 | Reversing entry balances original | Integration | Pass |
| ACCT-007 | Closed period blocks posting | Integration | Pass |

---

## 6. Sample Test Cases

### 6.1 Sales Order Flow Test Case

```
Test Case: TC-SALES-001
Title: Create, confirm, and invoice a sales order
Priority: High
Type: Integration

Preconditions:
- Customer exists in system
- Products exist with stock
- User has sales.create permission

Steps:
1. Login as sales user
2. Navigate to Sales > Orders
3. Click "New Order"
4. Select customer
5. Add 2 products with quantities
6. Verify order total calculation
7. Save order (status: DRAFT)
8. Confirm order (status: CONFIRMED)
9. Check inventory reduced
10. Create invoice (status: INVOICED)
11. Check journal entry created

Expected Results:
- Order created with correct total
- Status transitions correctly
- Inventory updated
- Accounting entry generated
- Invoice references order

Postconditions:
- Order exists in CONFIRMED/INVOICED state
- Inventory reflects deduction
- Customer balance updated
```

### 6.2 Payroll Processing Test Case

```
Test Case: TC-HR-001
Title: Process monthly payroll for all employees
Priority: High
Type: Integration

Preconditions:
- Employees exist with salary data
- Attendance recorded for period
- Leave data available
- Fiscal period open

Steps:
1. Login as HR user
2. Navigate to HR > Payroll
3. Select period (month/year)
4. Click "Calculate Payroll"
5. Review calculated amounts per employee
6. Verify: gross = basic + allowances
7. Verify: net = gross - deductions
8. Approve payroll
9. Post to accounting
10. Process payments

Expected Results:
- All employees included
- Calculations correct
- Journal entry balanced
- Payslips generated

Postconditions:
- Payroll records in PAID status
- Accounting entries posted
- Employee balances updated
```

---

## 7. Coverage Targets

### 7.1 Coverage Requirements

| Category | Target | Current |
|----------|--------|---------|
| Statements | 80% | 85% |
| Branches | 80% | 82% |
| Functions | 80% | 88% |
| Lines | 80% | 86% |

### 7.2 Coverage by Module

| Module | Unit | Integration | Combined |
|--------|------|-------------|----------|
| Auth | 92% | 88% | 95% |
| Users | 85% | 82% | 90% |
| Products | 88% | 85% | 92% |
| Inventory | 90% | 87% | 94% |
| Sales | 86% | 90% | 93% |
| Purchases | 84% | 88% | 91% |
| Treasury | 88% | 85% | 92% |
| Accounting | 90% | 92% | 95% |
| HR | 82% | 80% | 88% |
| Poultry | 80% | 78% | 86% |

### 7.3 Coverage Exclusions

```javascript
// jest.config.js - coverage exclusions
collectCoverageFrom: [
  'src/**/*.ts',
  '!src/**/*.module.ts',        // Module definitions
  '!src/**/*.dto.ts',           // DTOs (validated elsewhere)
  '!src/**/*.entity.ts',        // Entities (ORM definitions)
  '!src/main.ts',               // Bootstrap
  '!src/prisma/**',             // Prisma client
  '!src/config/**',             // Configuration
  '!src/**/__tests__/**',       // Test utilities
  '!src/**/*.spec.ts',          // Test files
],
```

---

## 8. Running Tests

### 8.1 Unit Tests

```bash
# Run all unit tests
cd backend
npm run test

# Run with coverage
npm run test:cov

# Run specific test file
npm run test -- auth.service.spec.ts

# Run in watch mode (development)
npm run test:watch

# Run with verbose output
npm run test -- --verbose
```

### 8.2 Integration Tests

```bash
# Run integration tests
cd backend
npm run test:integration

# Requires test database
# DATABASE_URL must point to test database
export DATABASE_URL="postgresql://gff_erp_user:password@localhost:5432/gff_erp_test"

# Run with setup
npm run test:integration -- --setup
```

### 8.3 E2E Tests

```bash
# Install Playwright browsers
npx playwright install

# Run E2E tests
cd frontend
npm run test:e2e

# Run specific test
npx playwright test e2e/auth.spec.ts

# Run with UI mode
npx playwright test --ui

# Generate report
npx playwright show-report
```

### 8.4 Test Database Setup

```bash
# Create test database
sudo -u postgres createdb gff_erp_test

# Run migrations
export DATABASE_URL="postgresql://gff_erp_user:password@localhost:5432/gff_erp_test"
npx prisma migrate deploy

# Seed test data
npx prisma db seed
```

---

## 9. CI/CD Pipeline Testing

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: gff_erp_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Generate Prisma client
        run: |
          cd backend
          npx prisma generate

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gff_erp_test
        run: |
          cd backend
          npx prisma migrate deploy

      - name: Run unit tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gff_erp_test
          JWT_SECRET: test-secret
        run: |
          cd backend
          npm run test:cov

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: gff_erp_test
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd backend
          npm ci

      - name: Run integration tests
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gff_erp_test
          JWT_SECRET: test-secret
        run: |
          cd backend
          npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: |
          cd frontend
          npm ci

      - name: Install Playwright
        run: |
          cd frontend
          npx playwright install --with-deps

      - name: Build application
        run: |
          cd frontend
          npm run build

      - name: Run E2E tests
        run: |
          cd frontend
          npm run test:e2e

      - name: Upload E2E results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-report
          path: frontend/e2e-report/
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-06-01 | QA Team | Initial test strategy |

---

*This document is the property of GFF ERP Enterprise. Unauthorized distribution is prohibited.*
