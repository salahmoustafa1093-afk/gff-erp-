import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardsService {
  private readonly logger = new Logger(DashboardsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private getDateRange(range?: 'today' | 'week' | 'month' | 'year'): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    switch (range) {
      case 'today':
        return { dateFrom: today, dateTo: today };
      case 'week': {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay());
        return { dateFrom: weekStart.toISOString().split('T')[0], dateTo: today };
      }
      case 'year':
        return { dateFrom: `${now.getFullYear()}-01-01`, dateTo: today };
      case 'month':
      default:
        return { dateFrom: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, dateTo: today };
    }
  }

  private branchFilter(branchId?: number): string {
    return branchId ? `AND "branchId" = ${branchId}` : '';
  }

  // ═══════════════════════════════════════════════════════════════
  //  MAIN / OVERVIEW KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Today's key metrics for the main dashboard.
   */
  async getMainKPIs(branchId?: number) {
    const branchCond = this.branchFilter(branchId);
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

    try {
      const todaySales = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "salesAmount"
        FROM "Invoice"
        WHERE DATE("createdAt") = DATE(${today})
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const monthlySales = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "salesAmount"
        FROM "Invoice"
        WHERE "createdAt" >= ${new Date(monthStart)} AND "createdAt" <= ${new Date(today + 'T23:59:59.999Z')}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const activeOrders = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "SalesOrder"
        WHERE "status" IN ('CONFIRMED', 'PROCESSING', 'READY_TO_SHIP')
        ${branchCond}
      `;

      const purchaseOrdersPending = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "PurchaseOrder"
        WHERE "status" IN ('ORDERED', 'PARTIALLY_RECEIVED')
        ${branchCond}
      `;

      const lowStockItems = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE COALESCE(s."quantityOnHand", 0) <= p."reorderLevel"
        AND p."trackInventory" = true
        ${branchCond}
      `;

      const outOfStock = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE COALESCE(s."quantityOnHand", 0) <= 0
        AND p."trackInventory" = true
        ${branchCond}
      `;

      const customersCount = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "Customer"
        WHERE "isActive" = true
        ${branchCond}
      `;

      return {
        today: {
          date: today,
          ...(todaySales as any[])[0],
        },
        monthToDate: {
          startDate: monthStart,
          endDate: today,
          ...(monthlySales as any[])[0],
        },
        operational: {
          activeSalesOrders: (activeOrders as any[])[0]?.count || 0,
          pendingPurchaseOrders: (purchaseOrdersPending as any[])[0]?.count || 0,
          lowStockItems: (lowStockItems as any[])[0]?.count || 0,
          outOfStockItems: (outOfStock as any[])[0]?.count || 0,
          activeCustomers: (customersCount as any[])[0]?.count || 0,
        },
      };
    } catch (error) {
      this.logger.error('Error in getMainKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  SALES KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Sales KPIs: totals, averages, growth, top products/customers.
   */
  async getSalesKPIs(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = dateFrom && dateTo
      ? { dateFrom, dateTo }
      : this.getDateRange('month');
    const branchCond = this.branchFilter(branchId);

    const periodDays = Math.max(1, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)));
    const prevFrom = new Date(new Date(from).getTime() - periodDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const prevTo = new Date(new Date(from).getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    try {
      const currentPeriod = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "totalSales",
          COUNT(*)::int AS "orderCount",
          COALESCE(AVG("netAmount"), 0)::decimal(18,2) AS "avgOrderValue"
        FROM "Invoice"
        WHERE "createdAt" >= ${new Date(from)} AND "createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const previousPeriod = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "totalSales",
          COUNT(*)::int AS "orderCount"
        FROM "Invoice"
        WHERE "createdAt" >= ${new Date(prevFrom)} AND "createdAt" <= ${new Date(prevTo + 'T23:59:59.999Z')}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const topProducts = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          SUM(li.quantity)::decimal(18,2) AS "qtySold",
          COALESCE(SUM(li."lineTotal"), 0)::decimal(18,2) AS "revenue"
        FROM "InvoiceLineItem" li
        JOIN "Invoice" i ON li."invoiceId" = i.id
        JOIN "Product" p ON li."productId" = p.id
        WHERE i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY p.id, p.name
        ORDER BY "revenue" DESC
        LIMIT 5
      `;

      const topCustomers = await this.prisma.$queryRaw`
        SELECT
          c.id AS "customerId",
          c.name AS "customerName",
          COUNT(i.id)::int AS "orderCount",
          COALESCE(SUM(i."netAmount"), 0)::decimal(18,2) AS "totalSpent"
        FROM "Customer" c
        JOIN "Invoice" i ON i."customerId" = c.id
        WHERE i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY c.id, c.name
        ORDER BY "totalSpent" DESC
        LIMIT 5
      `;

      const salesByBranch = branchId
        ? []
        : await this.prisma.$queryRaw`
          SELECT
            b.id AS "branchId",
            b.name AS "branchName",
            COUNT(i.id)::int AS "orderCount",
            COALESCE(SUM(i."netAmount"), 0)::decimal(18,2) AS "totalSales"
          FROM "Branch" b
          LEFT JOIN "Invoice" i ON i."branchId" = b.id
            AND i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
            AND i."status" NOT IN ('DRAFT', 'CANCELLED')
          GROUP BY b.id, b.name
          ORDER BY "totalSales" DESC
        `;

      const curr = (currentPeriod as any[])[0] || {};
      const prev = (previousPeriod as any[])[0] || {};
      const growth = prev.totalSales > 0
        ? Number((((curr.totalSales - prev.totalSales) / prev.totalSales) * 100).toFixed(2))
        : 0;

      return {
        dateRange: { from, to },
        totals: {
          totalSales: Number(curr.totalSales || 0),
          orderCount: Number(curr.orderCount || 0),
          avgOrderValue: Number(curr.avgOrderValue || 0),
        },
        growth: {
          salesGrowth: growth,
          orderGrowth: prev.orderCount > 0
            ? Number((((curr.orderCount - prev.orderCount) / prev.orderCount) * 100).toFixed(2))
            : 0,
          previousPeriod: { from: prevFrom, to: prevTo, totalSales: Number(prev.totalSales || 0), orderCount: Number(prev.orderCount || 0) },
        },
        topProducts: topProducts || [],
        topCustomers: topCustomers || [],
        salesByBranch: salesByBranch || [],
      };
    } catch (error) {
      this.logger.error('Error in getSalesKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  FINANCIAL KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Financial KPIs: cash, bank, receivables, payables.
   */
  async getFinancialKPIs(branchId?: number) {
    const branchCond = this.branchFilter(branchId);

    try {
      const cashPosition = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM(balance), 0)::decimal(18,2) AS "total"
        FROM "CashBox"
        WHERE 1=1
        ${branchCond}
      `;

      const bankPosition = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM(balance), 0)::decimal(18,2) AS "total"
        FROM "BankAccount"
        WHERE 1=1
        ${branchCond}
      `;

      const receivables = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM(balance), 0)::decimal(18,2) AS "totalAR",
          COUNT(*)::int AS "customerCount",
          COALESCE(SUM(CASE WHEN "creditLimit" > 0 AND balance > "creditLimit" THEN balance - "creditLimit" ELSE 0 END), 0)::decimal(18,2) AS "overLimitAmount"
        FROM "Customer"
        WHERE balance > 0
        ${branchCond}
      `;

      const payables = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM(balance), 0)::decimal(18,2) AS "totalAP",
          COUNT(*)::int AS "supplierCount"
        FROM "Supplier"
        WHERE balance > 0
        ${branchCond}
      `;

      const overdueInvoices = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "count",
          COALESCE(SUM("totalAmount" - "paidAmount"), 0)::decimal(18,2) AS "amount"
        FROM "Invoice"
        WHERE "dueDate" < CURRENT_DATE
        AND "totalAmount" > "paidAmount"
        AND "status" NOT IN ('DRAFT', 'CANCELLED', 'PAID')
        ${branchCond}
      `;

      const today = new Date().toISOString().split('T')[0];
      const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

      const expensesThisMonth = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM(jl.debit), 0)::decimal(18,2) AS "total"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        WHERE j."entryDate" >= ${new Date(monthStart)} AND j."entryDate" <= ${new Date(today + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        AND at.name IN ('EXPENSE', 'OPERATING_EXPENSE', 'ADMIN_EXPENSE', 'SELLING_EXPENSE', 'COST_OF_GOODS_SOLD')
        ${branchCond}
      `;

      const cash = Number((cashPosition as any[])[0]?.total || 0);
      const bank = Number((bankPosition as any[])[0]?.total || 0);
      const ar = Number((receivables as any[])[0]?.totalAR || 0);
      const ap = Number((payables as any[])[0]?.totalAP || 0);

      return {
        cash: { total: cash },
        bank: { total: bank },
        totalLiquidAssets: Number((cash + bank).toFixed(2)),
        receivables: {
          totalAR: ar,
          customerCount: (receivables as any[])[0]?.customerCount || 0,
          overLimitAmount: Number((receivables as any[])[0]?.overLimitAmount || 0),
        },
        payables: {
          totalAP: ap,
          supplierCount: (payables as any[])[0]?.supplierCount || 0,
        },
        overdueInvoices: (overdueInvoices as any[])[0] || { count: 0, amount: 0 },
        netPosition: Number((cash + bank + ar - ap).toFixed(2)),
        expensesThisMonth: Number((expensesThisMonth as any[])[0]?.total || 0),
      };
    } catch (error) {
      this.logger.error('Error in getFinancialKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  INVENTORY KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Inventory KPIs: total value, SKUs, stock alerts.
   */
  async getInventoryKPIs(branchId?: number, warehouseId?: number) {
    const branchCond = this.branchFilter(branchId);
    const warehouseCond = warehouseId ? `AND s."warehouseId" = ${warehouseId}` : '';

    try {
      const totals = await this.prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT p.id)::int AS "totalSKUs",
          COALESCE(SUM(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0)), 0)::decimal(18,2) AS "totalInventoryValue",
          COALESCE(SUM(s."quantityOnHand"), 0)::decimal(18,2) AS "totalUnits",
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 1 END)::int AS "outOfStockCount",
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) > 0 AND COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 1 END)::int AS "lowStockCount"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE p."trackInventory" = true
        ${branchCond}
        ${warehouseCond}
      `;

      const topByValue = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          COALESCE(s."quantityOnHand", 0)::decimal(18,2) AS "quantityOnHand",
          COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0)::decimal(18,2) AS "inventoryValue"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE p."trackInventory" = true
        ${branchCond}
        ${warehouseCond}
        ORDER BY "inventoryValue" DESC
        LIMIT 5
      `;

      const stockStatusDist = await this.prisma.$queryRaw`
        SELECT
          CASE
            WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 'OUT_OF_STOCK'
            WHEN COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 'LOW_STOCK'
            ELSE 'NORMAL'
          END AS "status",
          COUNT(*)::int AS "count"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE p."trackInventory" = true
        ${branchCond}
        ${warehouseCond}
        GROUP BY
          CASE
            WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 'OUT_OF_STOCK'
            WHEN COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 'LOW_STOCK'
            ELSE 'NORMAL'
          END
      `;

      return {
        ...((totals as any[])[0] || {}),
        topProductsByValue: topByValue || [],
        stockStatusDistribution: stockStatusDist || [],
      };
    } catch (error) {
      this.logger.error('Error in getInventoryKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  PRODUCTION KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Production KPIs: manufacturing orders, yield, costs.
   */
  async getProductionKPIs(branchId?: number) {
    const branchCond = this.branchFilter(branchId);
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

    try {
      const activeOrders = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "ManufacturingOrder"
        WHERE "status" IN ('PLANNED', 'IN_PROGRESS')
        ${branchCond}
      `;

      const completedToday = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "count",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "quantity"
        FROM "ManufacturingOrder"
        WHERE DATE("actualCompletionDate") = DATE(${today})
        AND "status" = 'COMPLETED'
        ${branchCond}
      `;

      const completedThisWeek = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "count",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "quantity"
        FROM "ManufacturingOrder"
        WHERE "actualCompletionDate" >= ${weekStart}
        AND "status" = 'COMPLETED'
        ${branchCond}
      `;

      const completedThisMonth = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "count",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "quantity",
          COALESCE(SUM("totalCost"), 0)::decimal(18,2) AS "totalCost"
        FROM "ManufacturingOrder"
        WHERE "actualCompletionDate" >= ${new Date(monthStart)}
        AND "status" = 'COMPLETED'
        ${branchCond}
      `;

      const yieldData = await this.prisma.$queryRaw`
        SELECT
          COALESCE(AVG(
            CASE WHEN "plannedQuantity" > 0
              THEN ("actualQuantity" / "plannedQuantity") * 100
              ELSE 0
            END
          ), 0)::decimal(18,2) AS "avgYieldPercent"
        FROM "ManufacturingOrder"
        WHERE "status" = 'COMPLETED'
        AND "actualCompletionDate" >= ${new Date(monthStart)}
        ${branchCond}
      `;

      const todayCost = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM("totalCost"), 0)::decimal(18,2) AS "cost"
        FROM "ManufacturingOrder"
        WHERE DATE("createdAt") = DATE(${today})
        ${branchCond}
      `;

      const byStatus = await this.prisma.$queryRaw`
        SELECT
          "status",
          COUNT(*)::int AS "count"
        FROM "ManufacturingOrder"
        WHERE 1=1
        ${branchCond}
        GROUP BY "status"
        ORDER BY "count" DESC
      `;

      return {
        activeOrders: (activeOrders as any[])[0]?.count || 0,
        completedToday: (completedToday as any[])[0] || { count: 0, quantity: 0 },
        completedThisWeek: (completedThisWeek as any[])[0] || { count: 0, quantity: 0 },
        completedThisMonth: (completedThisMonth as any[])[0] || { count: 0, quantity: 0, totalCost: 0 },
        avgYieldPercent: (yieldData as any[])[0]?.avgYieldPercent || 0,
        todayProductionCost: (todayCost as any[])[0]?.cost || 0,
        byStatus: byStatus || [],
      };
    } catch (error) {
      this.logger.error('Error in getProductionKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  WAREHOUSE KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Warehouse KPIs: items, capacity, transfers.
   */
  async getWarehouseKPIs(branchId?: number, warehouseId?: number) {
    const branchCond = this.branchFilter(branchId);
    const warehouseCond = warehouseId ? `AND "warehouseId" = ${warehouseId}` : '';

    try {
      const totalItems = await this.prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT "productId")::int AS "skuCount",
          COALESCE(SUM("quantityOnHand"), 0)::decimal(18,2) AS "totalUnits"
        FROM "StockLevel"
        WHERE 1=1
        ${warehouseCond}
      `;

      const incomingTransfers = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "count",
          COALESCE(SUM(total_quantity), 0)::decimal(18,2) AS "totalQuantity"
        FROM (
          SELECT ti.id, SUM(tii.quantity) as total_quantity
          FROM "TransferInward" ti
          JOIN "TransferInwardItem" tii ON tii."transferInwardId" = ti.id
          WHERE ti."status" = 'PENDING'
          ${branchCond}
          GROUP BY ti.id
        ) sub
      `;

      const outgoingTransfers = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "count",
          COALESCE(SUM(total_quantity), 0)::decimal(18,2) AS "totalQuantity"
        FROM (
          SELECT to2.id, SUM(toi.quantity) as total_quantity
          FROM "TransferOutward" to2
          JOIN "TransferOutwardItem" toi ON toi."transferOutwardId" = to2.id
          WHERE to2."status" = 'PENDING'
          ${branchCond}
          GROUP BY to2.id
        ) sub
      `;

      const warehouses = await this.prisma.$queryRaw`
        SELECT
          w.id AS "warehouseId",
          w.name AS "warehouseName",
          COUNT(DISTINCT s."productId")::int AS "skuCount",
          COALESCE(SUM(s."quantityOnHand"), 0)::decimal(18,2) AS "totalUnits"
        FROM "Warehouse" w
        LEFT JOIN "StockLevel" s ON s."warehouseId" = w.id
        WHERE 1=1
        ${branchCond}
        GROUP BY w.id, w.name
        ORDER BY "totalUnits" DESC
      `;

      return {
        totalItems: (totalItems as any[])[0] || { skuCount: 0, totalUnits: 0 },
        incomingTransfersPending: (incomingTransfers as any[])[0] || { count: 0, totalQuantity: 0 },
        outgoingTransfersPending: (outgoingTransfers as any[])[0] || { count: 0, totalQuantity: 0 },
        warehouses: warehouses || [],
      };
    } catch (error) {
      this.logger.error('Error in getWarehouseKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  BRANCH KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Branch KPIs: employees, customers, sales, expenses, profit.
   */
  async getBranchKPIs(branchId?: number) {
    const branchCond = this.branchFilter(branchId);
    const today = new Date().toISOString().split('T')[0];
    const monthStart = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`;

    try {
      const employeeCount = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "total",
          COUNT(CASE WHEN "status" = 'ACTIVE' THEN 1 END)::int AS "active"
        FROM "Employee"
        WHERE 1=1
        ${branchCond}
      `;

      const customers = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "Customer"
        WHERE "isActive" = true
        ${branchCond}
      `;

      const monthlySales = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "amount"
        FROM "Invoice"
        WHERE "createdAt" >= ${new Date(monthStart)} AND "createdAt" <= ${new Date(today + 'T23:59:59.999Z')}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const monthlyExpenses = await this.prisma.$queryRaw`
        SELECT COALESCE(SUM(jl.debit), 0)::decimal(18,2) AS "amount"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        WHERE j."entryDate" >= ${new Date(monthStart)} AND j."entryDate" <= ${new Date(today + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        AND at.name IN ('EXPENSE', 'OPERATING_EXPENSE', 'ADMIN_EXPENSE', 'SELLING_EXPENSE', 'COST_OF_GOODS_SOLD')
        ${branchCond}
      `;

      const salesAmount = Number((monthlySales as any[])[0]?.amount || 0);
      const expensesAmount = Number((monthlyExpenses as any[])[0]?.amount || 0);

      return {
        employees: (employeeCount as any[])[0] || { total: 0, active: 0 },
        activeCustomers: (customers as any[])[0]?.count || 0,
        monthlySales: salesAmount,
        monthlyExpenses: expensesAmount,
        netProfit: Number((salesAmount - expensesAmount).toFixed(2)),
        profitMargin: salesAmount > 0 ? Number((((salesAmount - expensesAmount) / salesAmount) * 100).toFixed(2)) : 0,
      };
    } catch (error) {
      this.logger.error('Error in getBranchKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  POULTRY KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Poultry KPIs: chicks batches, mortality, egg production.
   */
  async getPoultryKPIs(branchId?: number) {
    const branchCond = this.branchFilter(branchId);
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    try {
      const chicks = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "activeBatchCount",
          COALESCE(SUM("initialQuantity"), 0)::int AS "totalInitial",
          COALESCE(SUM("currentQuantity"), 0)::int AS "totalCurrent",
          COALESCE(AVG("ageInDays"), 0)::decimal(18,2) AS "avgAgeDays",
          CASE WHEN COALESCE(SUM("initialQuantity"), 0) > 0
            THEN ROUND(((SUM("initialQuantity" - "currentQuantity")::decimal) / SUM("initialQuantity")) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "mortalityRate"
        FROM "ChicksBatch"
        WHERE "status" IN ('ACTIVE', 'GROWING')
        ${branchCond}
      `;

      const todaysEggs = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM("totalEggs"), 0)::int AS "totalEggs",
          COALESCE(AVG("productionRate"), 0)::decimal(18,2) AS "avgProductionRate",
          COALESCE(SUM("goodEggs"), 0)::int AS "goodEggs",
          COALESCE(SUM("crackedEggs"), 0)::int AS "crackedEggs",
          COALESCE(SUM("dirtyEggs"), 0)::int AS "dirtyEggs"
        FROM "EggProduction"
        WHERE "date" = DATE(${today})
        ${branchCond}
      `;

      const weeklyEggTrend = await this.prisma.$queryRaw`
        SELECT
          "date" AS "date",
          COALESCE(SUM("totalEggs"), 0)::int AS "totalEggs",
          COALESCE(AVG("productionRate"), 0)::decimal(18,2) AS "productionRate"
        FROM "EggProduction"
        WHERE "date" >= ${weekStart}
        ${branchCond}
        GROUP BY "date"
        ORDER BY "date"
      `;

      const houses = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalHouses",
          COUNT(CASE WHEN "status" = 'ACTIVE' THEN 1 END)::int AS "activeHouses",
          COALESCE(SUM("capacity"), 0)::int AS "totalCapacity",
          COALESCE(SUM("currentBirdCount"), 0)::int AS "currentBirds"
        FROM "PoultryHouse"
        WHERE 1=1
        ${branchCond}
      `;

      return {
        chicks: (chicks as any[])[0] || {},
        todaysEggs: (todaysEggs as any[])[0] || {},
        weeklyEggTrend: weeklyEggTrend || [],
        houses: (houses as any[])[0] || {},
      };
    } catch (error) {
      this.logger.error('Error in getPoultryKPIs:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  LOGISTICS KPIs
  // ═══════════════════════════════════════════════════════════════

  /**
   * Logistics KPIs: trips, deliveries, fuel, maintenance.
   */
  async getLogisticsKPIs(branchId?: number) {
    const branchCond = this.branchFilter(branchId);
    const today = new Date().toISOString().split('T')[0];
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);

    try {
      const activeTrips = await this.prisma.$queryRaw`
        SELECT COUNT(*)::int AS "count"
        FROM "Trip"
        WHERE "status" IN ('SCHEDULED', 'IN_PROGRESS')
        ${branchCond}
      `;

      const todayTrips = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalTrips",
          COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END)::int AS "completedTrips",
          COALESCE(SUM(distance), 0)::decimal(18,2) AS "totalDistance",
          COALESCE(AVG(duration), 0)::decimal(18,2) AS "avgDuration",
          COALESCE(SUM("fuelCost"), 0)::decimal(18,2) AS "fuelCost"
        FROM "Trip"
        WHERE DATE("startDate") = DATE(${today})
        ${branchCond}
      `;

      const weeklyTrips = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "tripCount",
          COALESCE(AVG(duration), 0)::decimal(18,2) AS "avgDeliveryTime",
          COALESCE(SUM("fuelCost"), 0)::decimal(18,2) AS "fuelCost",
          COALESCE(SUM(distance), 0)::decimal(18,2) AS "totalDistance",
          CASE WHEN COUNT(*) > 0
            THEN ROUND((COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END)::decimal / COUNT(*)) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "completionRate"
        FROM "Trip"
        WHERE "startDate" >= ${weekStart}
        ${branchCond}
      `;

      const vehicleStatus = await this.prisma.$queryRaw`
        SELECT
          "status",
          COUNT(*)::int AS "count"
        FROM "Vehicle"
        WHERE 1=1
        ${branchCond}
        GROUP BY "status"
      `;

      const maintenanceAlerts = await this.prisma.$queryRaw`
        SELECT
          v.id AS "vehicleId",
          v."plateNumber" AS "plateNumber",
          v.make AS "make",
          v.model AS "model",
          MAX(vm."serviceDate") AS "lastServiceDate",
          v."nextServiceDate" AS "nextServiceDate",
          CASE WHEN v."nextServiceDate" < CURRENT_DATE THEN 'OVERDUE'
               WHEN v."nextServiceDate" <= CURRENT_DATE + INTERVAL '7 days' THEN 'DUE_SOON'
               ELSE 'OK'
          END AS "alertStatus"
        FROM "Vehicle" v
        LEFT JOIN "VehicleMaintenance" vm ON vm."vehicleId" = v.id
        WHERE v."status" = 'ACTIVE'
        ${branchCond}
        GROUP BY v.id, v."plateNumber", v.make, v.model, v."nextServiceDate"
        HAVING v."nextServiceDate" <= CURRENT_DATE + INTERVAL '7 days'
        ORDER BY v."nextServiceDate"
        LIMIT 10
      `;

      return {
        activeTrips: (activeTrips as any[])[0]?.count || 0,
        todayTrips: (todayTrips as any[])[0] || {},
        weeklyTrips: (weeklyTrips as any[])[0] || {},
        vehicleStatus: vehicleStatus || [],
        maintenanceAlerts: maintenanceAlerts || [],
      };
    } catch (error) {
      this.logger.error('Error in getLogisticsKPIs:', error);
      throw error;
    }
  }

  /**
   * Get all dashboard KPIs at once for the main dashboard page.
   */
  async getAllKPIs(branchId?: number) {
    try {
      const [
        main,
        sales,
        financial,
        inventory,
        production,
        warehouse,
        branch,
        poultry,
        logistics,
      ] = await Promise.all([
        this.getMainKPIs(branchId),
        this.getSalesKPIs(branchId),
        this.getFinancialKPIs(branchId),
        this.getInventoryKPIs(branchId),
        this.getProductionKPIs(branchId),
        this.getWarehouseKPIs(branchId),
        this.getBranchKPIs(branchId),
        this.getPoultryKPIs(branchId),
        this.getLogisticsKPIs(branchId),
      ]);

      return {
        generatedAt: new Date().toISOString(),
        branchId,
        main,
        sales,
        financial,
        inventory,
        production,
        warehouse,
        branch,
        poultry,
        logistics,
      };
    } catch (error) {
      this.logger.error('Error in getAllKPIs:', error);
      throw error;
    }
  }
}
