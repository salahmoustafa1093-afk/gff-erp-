import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ─── Utility Helpers ───────────────────────────────────────────

  private getDateRangeDefaults(
    dateFrom?: string,
    dateTo?: string,
  ): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const from = dateFrom
      ? new Date(dateFrom)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const to = dateTo ? new Date(dateTo) : now;
    return {
      dateFrom: from.toISOString().split('T')[0],
      dateTo: to.toISOString().split('T')[0],
    };
  }

  private branchFilter(branchId?: number): string {
    return branchId ? `AND "branchId" = ${branchId}` : '';
  }

  private warehouseFilter(warehouseId?: number): string {
    return warehouseId ? `AND "warehouseId" = ${warehouseId}` : '';
  }

  // ═══════════════════════════════════════════════════════════════
  //  SALES REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Daily sales summary: invoices, returns, net amount, payment methods.
   */
  async getDailySales(branchId?: number, date?: string) {
    const reportDate = date || new Date().toISOString().split('T')[0];
    const branchCond = this.branchFilter(branchId);

    try {
      const invoices = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount",
          COALESCE(SUM("discountTotal"), 0)::decimal(18,2) AS "totalDiscount",
          COALESCE(SUM("taxTotal"), 0)::decimal(18,2) AS "totalTax",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount",
          COALESCE(SUM(CASE WHEN "paymentType" = 'CASH' THEN "netAmount" ELSE 0 END), 0)::decimal(18,2) AS "cashSales",
          COALESCE(SUM(CASE WHEN "paymentType" = 'CREDIT' THEN "netAmount" ELSE 0 END), 0)::decimal(18,2) AS "creditSales",
          COALESCE(SUM(CASE WHEN "paymentType" = 'BANK_TRANSFER' THEN "netAmount" ELSE 0 END), 0)::decimal(18,2) AS "bankSales"
        FROM "Invoice"
        WHERE DATE("createdAt") = DATE(${reportDate})
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const salesReturns = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "returnCount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "returnAmount"
        FROM "SalesReturn"
        WHERE DATE("createdAt") = DATE(${reportDate})
        AND "status" = 'COMPLETED'
        ${branchCond}
      `;

      const topProducts = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          SUM(li.quantity)::decimal(18,2) AS "totalQty",
          COALESCE(SUM(li."lineTotal"), 0)::decimal(18,2) AS "totalRevenue"
        FROM "InvoiceLineItem" li
        JOIN "Invoice" i ON li."invoiceId" = i.id
        JOIN "Product" p ON li."productId" = p.id
        WHERE DATE(i."createdAt") = DATE(${reportDate})
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY p.id, p.name
        ORDER BY "totalRevenue" DESC
        LIMIT 10
      `;

      return {
        date: reportDate,
        invoices: (invoices as any[])[0] || {},
        salesReturns: (salesReturns as any[])[0] || {},
        topProducts: topProducts || [],
      };
    } catch (error) {
      this.logger.error('Error in getDailySales:', error);
      throw error;
    }
  }

  /**
   * Monthly sales with day-by-day breakdown.
   */
  async getMonthlySales(branchId?: number, year?: number, month?: number) {
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth() + 1;
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount",
          COALESCE(SUM("discountTotal"), 0)::decimal(18,2) AS "totalDiscount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount"
        FROM "Invoice"
        WHERE EXTRACT(YEAR FROM "createdAt") = ${y}
        AND EXTRACT(MONTH FROM "createdAt") = ${m}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const dailyBreakdown = await this.prisma.$queryRaw`
        SELECT
          EXTRACT(DAY FROM "createdAt")::int AS "day",
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount"
        FROM "Invoice"
        WHERE EXTRACT(YEAR FROM "createdAt") = ${y}
        AND EXTRACT(MONTH FROM "createdAt") = ${m}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY EXTRACT(DAY FROM "createdAt")
        ORDER BY "day"
      `;

      return {
        year: y,
        month: m,
        summary: (summary as any[])[0] || {},
        dailyBreakdown: dailyBreakdown || [],
      };
    } catch (error) {
      this.logger.error('Error in getMonthlySales:', error);
      throw error;
    }
  }

  /**
   * Yearly sales with month-by-month breakdown.
   */
  async getYearlySales(branchId?: number, year?: number) {
    const y = year || new Date().getFullYear();
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount",
          COALESCE(SUM("discountTotal"), 0)::decimal(18,2) AS "totalDiscount"
        FROM "Invoice"
        WHERE EXTRACT(YEAR FROM "createdAt") = ${y}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const monthlyBreakdown = await this.prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM "createdAt")::int AS "month",
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount"
        FROM "Invoice"
        WHERE EXTRACT(YEAR FROM "createdAt") = ${y}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY EXTRACT(MONTH FROM "createdAt")
        ORDER BY "month"
      `;

      return {
        year: y,
        summary: (summary as any[])[0] || {},
        monthlyBreakdown: monthlyBreakdown || [],
      };
    } catch (error) {
      this.logger.error('Error in getYearlySales:', error);
      throw error;
    }
  }

  /**
   * Top selling products with quantities and revenue.
   */
  async getSalesByProduct(
    branchId?: number,
    dateFrom?: string,
    dateTo?: string,
    limit = 50,
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const products = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          p."unitPrice" AS "unitPrice",
          SUM(li.quantity)::decimal(18,2) AS "totalQtySold",
          COALESCE(AVG(li."unitPrice"), 0)::decimal(18,2) AS "avgSellingPrice",
          COALESCE(SUM(li."lineTotal"), 0)::decimal(18,2) AS "totalRevenue",
          COALESCE(SUM(li.quantity * COALESCE(p."averageCost", p."unitPrice", 0)), 0)::decimal(18,2) AS "estimatedCost",
          COALESCE(SUM(li."lineTotal") - SUM(li.quantity * COALESCE(p."averageCost", p."unitPrice", 0)), 0)::decimal(18,2) AS "estimatedProfit"
        FROM "InvoiceLineItem" li
        JOIN "Invoice" i ON li."invoiceId" = i.id
        JOIN "Product" p ON li."productId" = p.id
        WHERE i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY p.id, p.name, p.sku, p."unitPrice"
        ORDER BY "totalRevenue" DESC
        LIMIT ${limit}
      `;

      return { dateRange: { from, to }, products: products || [] };
    } catch (error) {
      this.logger.error('Error in getSalesByProduct:', error);
      throw error;
    }
  }

  /**
   * Top customers with purchase amounts.
   */
  async getSalesByCustomer(
    branchId?: number,
    dateFrom?: string,
    dateTo?: string,
    limit = 50,
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const customers = await this.prisma.$queryRaw`
        SELECT
          c.id AS "customerId",
          c.name AS "customerName",
          c.phone AS "phone",
          COUNT(i.id)::int AS "invoiceCount",
          COALESCE(SUM(i."totalAmount"), 0)::decimal(18,2) AS "totalPurchases",
          COALESCE(SUM(i."netAmount"), 0)::decimal(18,2) AS "netPurchases",
          COALESCE(AVG(i."netAmount"), 0)::decimal(18,2) AS "avgInvoiceValue",
          MAX(i."createdAt") AS "lastPurchaseDate"
        FROM "Customer" c
        JOIN "Invoice" i ON i."customerId" = c.id
        WHERE i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY c.id, c.name, c.phone
        ORDER BY "totalPurchases" DESC
        LIMIT ${limit}
      `;

      return { dateRange: { from, to }, customers: customers || [] };
    } catch (error) {
      this.logger.error('Error in getSalesByCustomer:', error);
      throw error;
    }
  }

  /**
   * Sales performance by sales representative.
   */
  async getSalesBySalesRep(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const reps = await this.prisma.$queryRaw`
        SELECT
          u.id AS "userId",
          u.name AS "repName",
          u.email AS "email",
          COUNT(i.id)::int AS "invoiceCount",
          COALESCE(SUM(i."totalAmount"), 0)::decimal(18,2) AS "totalSales",
          COALESCE(SUM(i."netAmount"), 0)::decimal(18,2) AS "netSales",
          COALESCE(AVG(i."netAmount"), 0)::decimal(18,2) AS "avgOrderValue",
          COALESCE(SUM(CASE WHEN i."paymentType" = 'CASH' THEN i."netAmount" ELSE 0 END), 0)::decimal(18,2) AS "cashSales",
          COALESCE(SUM(CASE WHEN i."paymentType" = 'CREDIT' THEN i."netAmount" ELSE 0 END), 0)::decimal(18,2) AS "creditSales"
        FROM "User" u
        JOIN "Invoice" i ON i."salesRepId" = u.id
        WHERE i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY u.id, u.name, u.email
        ORDER BY "totalSales" DESC
      `;

      return { dateRange: { from, to }, salesReps: reps || [] };
    } catch (error) {
      this.logger.error('Error in getSalesBySalesRep:', error);
      throw error;
    }
  }

  /**
   * Compare branches by sales performance.
   */
  async getBranchPerformance(dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);

    try {
      const branches = await this.prisma.$queryRaw`
        SELECT
          b.id AS "branchId",
          b.name AS "branchName",
          COUNT(i.id)::int AS "invoiceCount",
          COALESCE(SUM(i."totalAmount"), 0)::decimal(18,2) AS "totalSales",
          COALESCE(SUM(i."netAmount"), 0)::decimal(18,2) AS "netSales",
          COALESCE(SUM(i."discountTotal"), 0)::decimal(18,2) AS "totalDiscounts",
          COALESCE(AVG(i."netAmount"), 0)::decimal(18,2) AS "avgOrderValue",
          COUNT(DISTINCT i."customerId")::int AS "uniqueCustomers"
        FROM "Branch" b
        LEFT JOIN "Invoice" i ON i."branchId" = b.id
          AND i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
          AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        GROUP BY b.id, b.name
        ORDER BY "totalSales" DESC
      `;

      return { dateRange: { from, to }, branches: branches || [] };
    } catch (error) {
      this.logger.error('Error in getBranchPerformance:', error);
      throw error;
    }
  }

  /**
   * Sales trend analysis grouped by day/week/month.
   */
  async getSalesTrends(
    dateFrom?: string,
    dateTo?: string,
    branchId?: number,
    groupBy: 'day' | 'week' | 'month' = 'month',
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    let dateGroup: string;
    if (groupBy === 'day') {
      dateGroup = `DATE("createdAt")`;
    } else if (groupBy === 'week') {
      dateGroup = `DATE_TRUNC('week', "createdAt")`;
    } else {
      dateGroup = `DATE_TRUNC('month', "createdAt")`;
    }

    try {
      const trends = await this.prisma.$queryRaw`
        SELECT
          ${dateGroup} AS "period",
          COUNT(*)::int AS "invoiceCount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount",
          COALESCE(SUM("discountTotal"), 0)::decimal(18,2) AS "totalDiscounts",
          COALESCE(AVG("netAmount"), 0)::decimal(18,2) AS "avgOrderValue"
        FROM "Invoice"
        WHERE "createdAt" >= ${new Date(from)} AND "createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY ${dateGroup}
        ORDER BY "period"
      `;

      return { dateRange: { from, to }, groupBy, trends: trends || [] };
    } catch (error) {
      this.logger.error('Error in getSalesTrends:', error);
      throw error;
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  PURCHASE REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Purchase summary overview: total purchases, orders, average order value.
   */
  async getPurchaseSummary(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "orderCount",
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalAmount",
          COALESCE(SUM("discountTotal"), 0)::decimal(18,2) AS "totalDiscount",
          COALESCE(SUM("taxTotal"), 0)::decimal(18,2) AS "totalTax",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netAmount",
          COALESCE(AVG("netAmount"), 0)::decimal(18,2) AS "avgOrderValue",
          COALESCE(SUM(CASE WHEN "status" = 'RECEIVED' THEN "netAmount" ELSE 0 END), 0)::decimal(18,2) AS "receivedAmount",
          COALESCE(SUM(CASE WHEN "status" = 'ORDERED' THEN "netAmount" ELSE 0 END), 0)::decimal(18,2) AS "pendingAmount"
        FROM "PurchaseOrder"
        WHERE "orderDate" >= ${new Date(from)} AND "orderDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const byStatus = await this.prisma.$queryRaw`
        SELECT
          "status",
          COUNT(*)::int AS "count",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "amount"
        FROM "PurchaseOrder"
        WHERE "orderDate" >= ${new Date(from)} AND "orderDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY "status"
        ORDER BY "count" DESC
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        byStatus: byStatus || [],
      };
    } catch (error) {
      this.logger.error('Error in getPurchaseSummary:', error);
      throw error;
    }
  }

  /**
   * Top suppliers by purchase volume.
   */
  async getPurchasesBySupplier(
    branchId?: number,
    dateFrom?: string,
    dateTo?: string,
    limit = 50,
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const suppliers = await this.prisma.$queryRaw`
        SELECT
          s.id AS "supplierId",
          s.name AS "supplierName",
          s.phone AS "phone",
          s.email AS "email",
          COUNT(po.id)::int AS "orderCount",
          COALESCE(SUM(po."totalAmount"), 0)::decimal(18,2) AS "totalPurchases",
          COALESCE(SUM(po."netAmount"), 0)::decimal(18,2) AS "netPurchases",
          COALESCE(AVG(po."netAmount"), 0)::decimal(18,2) AS "avgOrderValue",
          MAX(po."orderDate") AS "lastPurchaseDate"
        FROM "Supplier" s
        JOIN "PurchaseOrder" po ON po."supplierId" = s.id
        WHERE po."orderDate" >= ${new Date(from)} AND po."orderDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY s.id, s.name, s.phone, s.email
        ORDER BY "totalPurchases" DESC
        LIMIT ${limit}
      `;

      return { dateRange: { from, to }, suppliers: suppliers || [] };
    } catch (error) {
      this.logger.error('Error in getPurchasesBySupplier:', error);
      throw error;
    }
  }

  /**
   * Most purchased products.
   */
  async getPurchasesByProduct(
    branchId?: number,
    dateFrom?: string,
    dateTo?: string,
    limit = 50,
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const products = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          SUM(poli.quantity)::decimal(18,2) AS "totalQtyPurchased",
          COALESCE(AVG(poli."unitPrice"), 0)::decimal(18,2) AS "avgPurchasePrice",
          COALESCE(SUM(poli."lineTotal"), 0)::decimal(18,2) AS "totalPurchaseValue",
          COUNT(DISTINCT poli."purchaseOrderId")::int AS "orderCount"
        FROM "PurchaseOrderLineItem" poli
        JOIN "PurchaseOrder" po ON poli."purchaseOrderId" = po.id
        JOIN "Product" p ON poli."productId" = p.id
        WHERE po."orderDate" >= ${new Date(from)} AND po."orderDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY p.id, p.name, p.sku
        ORDER BY "totalPurchaseValue" DESC
        LIMIT ${limit}
      `;

      return { dateRange: { from, to }, products: products || [] };
    } catch (error) {
      this.logger.error('Error in getPurchasesByProduct:', error);
      throw error;
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  INVENTORY REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Current inventory valuation by product.
   */
  async getInventoryValuation(branchId?: number, warehouseId?: number) {
    const branchCond = this.branchFilter(branchId);
    const warehouseCond = this.warehouseFilter(warehouseId);

    try {
      const products = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          p."unitPrice" AS "sellingPrice",
          COALESCE(p."averageCost", p."unitPrice", 0)::decimal(18,2) AS "avgCost",
          COALESCE(s."quantityOnHand", 0)::decimal(18,2) AS "quantityOnHand",
          COALESCE(s."quantityOnHand" * p."unitPrice", 0)::decimal(18,2) AS "sellingValue",
          COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0)::decimal(18,2) AS "costValue",
          p."reorderLevel" AS "reorderLevel",
          p."reorderQuantity" AS "reorderQuantity",
          CASE
            WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 'OUT_OF_STOCK'
            WHEN COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 'LOW_STOCK'
            ELSE 'NORMAL'
          END AS "stockStatus",
          w.name AS "warehouseName",
          b.name AS "branchName"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        LEFT JOIN "Warehouse" w ON s."warehouseId" = w.id
        LEFT JOIN "Branch" b ON p."branchId" = b.id
        WHERE 1=1
        ${branchCond}
        ${warehouseCond}
        AND (s."quantityOnHand" IS NULL OR s."quantityOnHand" > 0 OR p."trackInventory" = true)
        ORDER BY "costValue" DESC
      `;

      const totals = await this.prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT p.id)::int AS "totalSKUs",
          COALESCE(SUM(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0)), 0)::decimal(18,2) AS "totalCostValue",
          COALESCE(SUM(s."quantityOnHand" * p."unitPrice"), 0)::decimal(18,2) AS "totalSellingValue",
          COALESCE(SUM(s."quantityOnHand"), 0)::decimal(18,2) AS "totalUnits",
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 1 END)::int AS "outOfStockCount",
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) > 0 AND COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 1 END)::int AS "lowStockCount"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE 1=1
        ${branchCond}
        ${warehouseCond}
      `;

      return {
        products: products || [],
        totals: (totals as any[])[0] || {},
      };
    } catch (error) {
      this.logger.error('Error in getInventoryValuation:', error);
      throw error;
    }
  }

  /**
   * Stock aging - how long items have been in stock.
   */
  async getInventoryAging(branchId?: number) {
    const branchCond = this.branchFilter(branchId);

    try {
      const aging = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          COALESCE(s."quantityOnHand", 0)::decimal(18,2) AS "quantityOnHand",
          COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0)::decimal(18,2) AS "stockValue",
          MIN(sm."createdAt") AS "oldestMovementDate",
          COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0)::int AS "daysInStock",
          CASE
            WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) <= 30 THEN '0-30 days'
            WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) <= 60 THEN '31-60 days'
            WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) <= 90 THEN '61-90 days'
            WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) <= 180 THEN '91-180 days'
            ELSE '180+ days'
          END AS "agingBucket"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        LEFT JOIN "StockMovement" sm ON sm."productId" = p.id AND sm.type = 'IN'
        WHERE COALESCE(s."quantityOnHand", 0) > 0
        ${branchCond}
        GROUP BY p.id, p.name, p.sku, s."quantityOnHand", p."averageCost", p."unitPrice"
        ORDER BY "daysInStock" DESC
      `;

      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT p.id)::int AS "totalProducts",
          SUM(CASE WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) <= 30 THEN COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0) ELSE 0 END)::decimal(18,2) AS "value0to30",
          SUM(CASE WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) BETWEEN 31 AND 60 THEN COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0) ELSE 0 END)::decimal(18,2) AS "value31to60",
          SUM(CASE WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) BETWEEN 61 AND 90 THEN COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0) ELSE 0 END)::decimal(18,2) AS "value61to90",
          SUM(CASE WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) BETWEEN 91 AND 180 THEN COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0) ELSE 0 END)::decimal(18,2) AS "value91to180",
          SUM(CASE WHEN COALESCE(EXTRACT(DAY FROM NOW() - MIN(sm."createdAt")), 0) > 180 THEN COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", p."unitPrice", 0), 0) ELSE 0 END)::decimal(18,2) AS "value180plus"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        LEFT JOIN "StockMovement" sm ON sm."productId" = p.id AND sm.type = 'IN'
        WHERE COALESCE(s."quantityOnHand", 0) > 0
        ${branchCond}
        GROUP BY p.id
      `;

      return { aging: aging || [], summary: summary || [] };
    } catch (error) {
      this.logger.error('Error in getInventoryAging:', error);
      throw error;
    }
  }

  /**
   * Current stock levels with reorder alerts.
   */
  async getStockLevels(branchId?: number, warehouseId?: number, lowStockOnly = false) {
    const branchCond = this.branchFilter(branchId);
    const warehouseCond = this.warehouseFilter(warehouseId);

    try {
      const products = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          p."unitPrice" AS "sellingPrice",
          COALESCE(p."averageCost", 0)::decimal(18,2) AS "avgCost",
          p."reorderLevel" AS "reorderLevel",
          p."reorderQuantity" AS "reorderQuantity",
          p."trackInventory" AS "trackInventory",
          COALESCE(s."quantityOnHand", 0)::decimal(18,2) AS "quantityOnHand",
          COALESCE(s."quantityReserved", 0)::decimal(18,2) AS "quantityReserved",
          COALESCE(s."quantityOnHand" - s."quantityReserved", 0)::decimal(18,2) AS "availableQty",
          w.name AS "warehouseName",
          b.name AS "branchName",
          CASE
            WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 'OUT_OF_STOCK'
            WHEN COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 'LOW_STOCK'
            ELSE 'NORMAL'
          END AS "stockStatus",
          CASE
            WHEN p."reorderLevel" > 0 THEN GREATEST(0, p."reorderLevel" - COALESCE(s."quantityOnHand", 0))
            ELSE 0
          END::decimal(18,2) AS "shortfallQty",
          COALESCE(s."quantityOnHand" * COALESCE(p."averageCost", 0), 0)::decimal(18,2) AS "inventoryValue"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        LEFT JOIN "Warehouse" w ON s."warehouseId" = w.id
        LEFT JOIN "Branch" b ON p."branchId" = b.id
        WHERE 1=1
        ${branchCond}
        ${warehouseCond}
        ${lowStockOnly ? `AND (COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" OR COALESCE(s."quantityOnHand", 0) <= 0)` : ''}
        ORDER BY
          CASE
            WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 1
            WHEN COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 2
            ELSE 3
          END,
          p.name
      `;

      const alerts = await this.prisma.$queryRaw`
        SELECT
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) <= 0 THEN 1 END)::int AS "outOfStock",
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) > 0 AND COALESCE(s."quantityOnHand", 0) <= p."reorderLevel" THEN 1 END)::int AS "lowStock",
          COUNT(CASE WHEN COALESCE(s."quantityOnHand", 0) > p."reorderLevel" THEN 1 END)::int AS "normal"
        FROM "Product" p
        LEFT JOIN "StockLevel" s ON s."productId" = p.id
        WHERE 1=1
        ${branchCond}
        ${warehouseCond}
      `;

      return { products: products || [], alerts: (alerts as any[])[0] || {} };
    } catch (error) {
      this.logger.error('Error in getStockLevels:', error);
      throw error;
    }
  }

  /**
   * Stock movement summary by type (IN, OUT, ADJUSTMENT, TRANSFER).
   */
  async getStockMovementSummary(
    branchId?: number,
    dateFrom?: string,
    dateTo?: string,
    warehouseId?: number,
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);
    const warehouseCond = warehouseId ? `AND sm."warehouseId" = ${warehouseId}` : '';

    try {
      const byType = await this.prisma.$queryRaw`
        SELECT
          sm.type AS "movementType",
          sm."referenceType" AS "referenceType",
          COUNT(*)::int AS "movementCount",
          SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END)::decimal(18,2) AS "totalIn",
          SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END)::decimal(18,2) AS "totalOut",
          COALESCE(SUM(sm."unitCost" * sm.quantity), 0)::decimal(18,2) AS "totalValue"
        FROM "StockMovement" sm
        JOIN "Product" p ON sm."productId" = p.id
        WHERE sm."createdAt" >= ${new Date(from)} AND sm."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        ${warehouseCond}
        GROUP BY sm.type, sm."referenceType"
        ORDER BY sm.type, "movementCount" DESC
      `;

      const byProduct = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          p.sku AS "sku",
          SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END)::decimal(18,2) AS "totalIn",
          SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END)::decimal(18,2) AS "totalOut",
          COALESCE(SUM(sm."unitCost" * sm.quantity), 0)::decimal(18,2) AS "totalValue"
        FROM "StockMovement" sm
        JOIN "Product" p ON sm."productId" = p.id
        WHERE sm."createdAt" >= ${new Date(from)} AND sm."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        ${warehouseCond}
        GROUP BY p.id, p.name, p.sku
        ORDER BY "totalValue" DESC
        LIMIT 50
      `;

      const byDay = await this.prisma.$queryRaw`
        SELECT
          DATE(sm."createdAt") AS "date",
          COUNT(*)::int AS "movementCount",
          SUM(CASE WHEN sm.type = 'IN' THEN sm.quantity ELSE 0 END)::decimal(18,2) AS "totalIn",
          SUM(CASE WHEN sm.type = 'OUT' THEN sm.quantity ELSE 0 END)::decimal(18,2) AS "totalOut"
        FROM "StockMovement" sm
        JOIN "Product" p ON sm."productId" = p.id
        WHERE sm."createdAt" >= ${new Date(from)} AND sm."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        ${warehouseCond}
        GROUP BY DATE(sm."createdAt")
        ORDER BY "date"
      `;

      return {
        dateRange: { from, to },
        byType: byType || [],
        byProduct: byProduct || [],
        byDay: byDay || [],
      };
    } catch (error) {
      this.logger.error('Error in getStockMovementSummary:', error);
      throw error;
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  FINANCIAL REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * General Ledger: all journal lines for an account in date range.
   */
  async getGeneralLedger(
    branchId?: number,
    dateFrom?: string,
    dateTo?: string,
    accountId?: number,
  ) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);
    const accountCond = accountId ? `AND jl."accountId" = ${accountId}` : '';

    try {
      const entries = await this.prisma.$queryRaw`
        SELECT
          jl.id AS "journalLineId",
          j.id AS "journalId",
          j."journalNumber" AS "journalNumber",
          j."entryDate" AS "entryDate",
          j.reference AS "reference",
          j.description AS "journalDescription",
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          at.name AS "accountType",
          jl.description AS "lineDescription",
          jl.debit::decimal(18,2) AS "debit",
          jl.credit::decimal(18,2) AS "credit",
          COALESCE(SUM(jl2.debit - jl2.credit) OVER (
            PARTITION BY jl."accountId"
            ORDER BY j."entryDate", jl.id
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ), 0)::decimal(18,2) AS "runningBalance"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl2 ON jl2."accountId" = a.id AND jl2.id <= jl.id
        WHERE j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        ${branchCond}
        ${accountCond}
        ORDER BY j."entryDate", jl.id
      `;

      const accountTotals = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.debit), 0)::decimal(18,2) AS "totalDebit",
          COALESCE(SUM(jl.credit), 0)::decimal(18,2) AS "totalCredit",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "netBalance"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        WHERE j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        ${branchCond}
        ${accountCond}
        GROUP BY a.id, a."accountCode", a.name
        ORDER BY a."accountCode"
      `;

      return {
        dateRange: { from, to },
        entries: entries || [],
        accountTotals: accountTotals || [],
      };
    } catch (error) {
      this.logger.error('Error in getGeneralLedger:', error);
      throw error;
    }
  }

  /**
   * Trial Balance: all accounts with debit/credit totals.
   */
  async getTrialBalance(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const accounts = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          at.name AS "accountType",
          at."normalBalance" AS "normalBalance",
          COALESCE(SUM(jl.debit), 0)::decimal(18,2) AS "totalDebit",
          COALESCE(SUM(jl.credit), 0)::decimal(18,2) AS "totalCredit",
          CASE
            WHEN at."normalBalance" = 'DEBIT' THEN COALESCE(SUM(jl.debit - jl.credit), 0)
            ELSE COALESCE(SUM(jl.credit - jl.debit), 0)
          END::decimal(18,2) AS "balance"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
          ${branchCond}
        GROUP BY a.id, a."accountCode", a.name, at.name, at."normalBalance"
        ORDER BY a."accountCode"
      `;

      const totals = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM(jl.debit), 0)::decimal(18,2) AS "grandTotalDebit",
          COALESCE(SUM(jl.credit), 0)::decimal(18,2) AS "grandTotalCredit"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        WHERE j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        ${branchCond}
      `;

      return {
        dateRange: { from, to },
        accounts: accounts || [],
        totals: (totals as any[])[0] || {},
      };
    } catch (error) {
      this.logger.error('Error in getTrialBalance:', error);
      throw error;
    }
  }

  /**
   * Balance Sheet: Assets, Liabilities, Equity as of a date.
   */
  async getBalanceSheet(branchId?: number, asOfDate?: string) {
    const reportDate = asOfDate || new Date().toISOString().split('T')[0];
    const branchCond = this.branchFilter(branchId);

    try {
      const assets = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          at.name AS "accountType",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "balance"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id AND j."entryDate" <= ${new Date(reportDate + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('ASSET', 'CURRENT_ASSET', 'FIXED_ASSET', 'NON_CURRENT_ASSET')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name, at.name
        HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
        ORDER BY a."accountCode"
      `;

      const liabilities = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          at.name AS "accountType",
          COALESCE(SUM(jl.credit - jl.debit), 0)::decimal(18,2) AS "balance"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id AND j."entryDate" <= ${new Date(reportDate + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('LIABILITY', 'CURRENT_LIABILITY', 'LONG_TERM_LIABILITY')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name, at.name
        HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
        ORDER BY a."accountCode"
      `;

      const equity = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          at.name AS "accountType",
          COALESCE(SUM(jl.credit - jl.debit), 0)::decimal(18,2) AS "balance"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id AND j."entryDate" <= ${new Date(reportDate + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('EQUITY', 'RETAINED_EARNINGS', 'OWNER_EQUITY')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name, at.name
        HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
        ORDER BY a."accountCode"
      `;

      const totalAssets = (assets as any[]).reduce((sum, a) => sum + Number(a.balance), 0);
      const totalLiabilities = (liabilities as any[]).reduce((sum, l) => sum + Number(l.balance), 0);
      const totalEquity = (equity as any[]).reduce((sum, e) => sum + Number(e.balance), 0);

      return {
        asOfDate: reportDate,
        assets: assets || [],
        liabilities: liabilities || [],
        equity: equity || [],
        summary: {
          totalAssets: Number(totalAssets.toFixed(2)),
          totalLiabilities: Number(totalLiabilities.toFixed(2)),
          totalEquity: Number(totalEquity.toFixed(2)),
          totalLiabilitiesAndEquity: Number((totalLiabilities + totalEquity).toFixed(2)),
          balanced: Number(totalAssets.toFixed(2)) === Number((totalLiabilities + totalEquity).toFixed(2)),
        },
      };
    } catch (error) {
      this.logger.error('Error in getBalanceSheet:', error);
      throw error;
    }
  }

  /**
   * Income Statement: Revenue - Expenses = Net Income.
   */
  async getIncomeStatement(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const revenue = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.credit - jl.debit), 0)::decimal(18,2) AS "amount"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('REVENUE', 'SALES_REVENUE', 'OTHER_REVENUE')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name
        HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
        ORDER BY a."accountCode"
      `;

      const costOfGoodsSold = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "amount"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('COST_OF_GOODS_SOLD', 'COGS')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name
        HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
        ORDER BY a."accountCode"
      `;

      const expenses = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "amount"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('EXPENSE', 'OPERATING_EXPENSE', 'ADMIN_EXPENSE', 'SELLING_EXPENSE')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name
        HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
        ORDER BY a."accountCode"
      `;

      const totalRevenue = (revenue as any[]).reduce((sum, r) => sum + Number(r.amount), 0);
      const totalCOGS = (costOfGoodsSold as any[]).reduce((sum, c) => sum + Number(c.amount), 0);
      const totalExpenses = (expenses as any[]).reduce((sum, e) => sum + Number(e.amount), 0);
      const grossProfit = totalRevenue - totalCOGS;
      const netIncome = grossProfit - totalExpenses;

      return {
        dateRange: { from, to },
        revenue: revenue || [],
        costOfGoodsSold: costOfGoodsSold || [],
        expenses: expenses || [],
        summary: {
          totalRevenue: Number(totalRevenue.toFixed(2)),
          totalCOGS: Number(totalCOGS.toFixed(2)),
          grossProfit: Number(grossProfit.toFixed(2)),
          grossProfitMargin: totalRevenue > 0 ? Number(((grossProfit / totalRevenue) * 100).toFixed(2)) : 0,
          totalExpenses: Number(totalExpenses.toFixed(2)),
          netIncome: Number(netIncome.toFixed(2)),
          netProfitMargin: totalRevenue > 0 ? Number(((netIncome / totalRevenue) * 100).toFixed(2)) : 0,
        },
      };
    } catch (error) {
      this.logger.error('Error in getIncomeStatement:', error);
      throw error;
    }
  }

  /**
   * Cash Flow: Operating, Investing, Financing activities.
   */
  async getCashFlow(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const operating = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(CASE WHEN jl.debit > 0 THEN jl.debit ELSE -jl.credit END), 0)::decimal(18,2) AS "cashIn",
          COALESCE(SUM(CASE WHEN jl.credit > 0 THEN jl.credit ELSE -jl.debit END), 0)::decimal(18,2) AS "cashOut",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "netFlow"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE (at.name IN ('REVENUE', 'SALES_REVENUE', 'EXPENSE', 'OPERATING_EXPENSE',
              'COST_OF_GOODS_SOLD', 'ADMIN_EXPENSE', 'SELLING_EXPENSE',
              'ACCOUNTS_RECEIVABLE', 'ACCOUNTS_PAYABLE', 'INVENTORY')
          OR a."accountCode" LIKE '1%' OR a."accountCode" LIKE '2%' OR a."accountCode" LIKE '4%' OR a."accountCode" LIKE '5%')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name
        HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
        ORDER BY ABS(COALESCE(SUM(jl.debit - jl.credit), 0)) DESC
      `;

      const investing = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "netFlow"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('FIXED_ASSET', 'NON_CURRENT_ASSET', 'INVESTMENT')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name
        HAVING COALESCE(SUM(jl.debit - jl.credit), 0) != 0
        ORDER BY ABS(COALESCE(SUM(jl.debit - jl.credit), 0)) DESC
      `;

      const financing = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.credit - jl.debit), 0)::decimal(18,2) AS "netFlow"
        FROM "Account" a
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        LEFT JOIN "JournalLine" jl ON jl."accountId" = a.id
        LEFT JOIN "Journal" j ON jl."journalId" = j.id
          AND j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
          AND j."status" = 'POSTED'
        WHERE at.name IN ('LONG_TERM_LIABILITY', 'LOAN', 'EQUITY', 'OWNER_EQUITY')
        ${branchCond}
        GROUP BY a.id, a."accountCode", a.name
        HAVING COALESCE(SUM(jl.credit - jl.debit), 0) != 0
        ORDER BY ABS(COALESCE(SUM(jl.credit - jl.debit), 0)) DESC
      `;

      const operatingNet = (operating as any[]).reduce((s, o) => s + Number(o.netFlow), 0);
      const investingNet = (investing as any[]).reduce((s, i) => s + Number(i.netFlow), 0);
      const financingNet = (financing as any[]).reduce((s, f) => s + Number(f.netFlow), 0);

      return {
        dateRange: { from, to },
        operatingActivities: operating || [],
        investingActivities: investing || [],
        financingActivities: financing || [],
        summary: {
          netOperatingCashFlow: Number(operatingNet.toFixed(2)),
          netInvestingCashFlow: Number(investingNet.toFixed(2)),
          netFinancingCashFlow: Number(financingNet.toFixed(2)),
          netChangeInCash: Number((operatingNet + investingNet + financingNet).toFixed(2)),
        },
      };
    } catch (error) {
      this.logger.error('Error in getCashFlow:', error);
      throw error;
    }
  }

  /**
   * Customer Statement: all transactions for a customer.
   */
  async getCustomerStatement(customerId?: number, dateFrom?: string, dateTo?: string, branchId?: number) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const customer = await this.prisma.$queryRaw`
        SELECT
          c.id AS "customerId",
          c.name AS "customerName",
          c.phone AS "phone",
          c.email AS "email",
          c."creditLimit" AS "creditLimit",
          c.balance::decimal(18,2) AS "currentBalance"
        FROM "Customer" c
        WHERE c.id = ${customerId || 0}
      `;

      const invoices = await this.prisma.$queryRaw`
        SELECT
          'INVOICE' AS "transactionType",
          i.id AS "transactionId",
          i."invoiceNumber" AS "reference",
          i."createdAt" AS "transactionDate",
          i."dueDate" AS "dueDate",
          i."totalAmount"::decimal(18,2) AS "amount",
          i."paidAmount"::decimal(18,2) AS "paidAmount",
          (i."totalAmount" - i."paidAmount")::decimal(18,2) AS "balance",
          i."paymentType" AS "paymentType",
          i."status" AS "status"
        FROM "Invoice" i
        WHERE i."customerId" = ${customerId || 0}
        AND i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        ORDER BY i."createdAt"
      `;

      const receipts = await this.prisma.$queryRaw`
        SELECT
          'RECEIPT' AS "transactionType",
          r.id AS "transactionId",
          r."receiptNumber" AS "reference",
          r."receiptDate" AS "transactionDate",
          NULL AS "dueDate",
          -r.amount::decimal(18,2) AS "amount",
          r.amount::decimal(18,2) AS "paidAmount",
          0::decimal(18,2) AS "balance",
          r."paymentMethod" AS "paymentType",
          'POSTED' AS "status"
        FROM "Receipt" r
        WHERE r."customerId" = ${customerId || 0}
        AND r."receiptDate" >= ${new Date(from)} AND r."receiptDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        ORDER BY r."receiptDate"
      `;

      const salesReturns = await this.prisma.$queryRaw`
        SELECT
          'RETURN' AS "transactionType",
          sr.id AS "transactionId",
          sr."returnNumber" AS "reference",
          sr."createdAt" AS "transactionDate",
          NULL AS "dueDate",
          -sr."totalAmount"::decimal(18,2) AS "amount",
          0::decimal(18,2) AS "paidAmount",
          -sr."totalAmount"::decimal(18,2) AS "balance",
          sr."refundMethod" AS "paymentType",
          sr."status"
        FROM "SalesReturn" sr
        WHERE sr."customerId" = ${customerId || 0}
        AND sr."createdAt" >= ${new Date(from)} AND sr."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND sr."status" = 'COMPLETED'
        ${branchCond}
        ORDER BY sr."createdAt"
      `;

      const allTransactions = [
        ...(invoices as any[]),
        ...(receipts as any[]),
        ...(salesReturns as any[]),
      ].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

      let runningBalance = 0;
      const transactionsWithBalance = allTransactions.map((t) => {
        runningBalance += Number(t.amount);
        return { ...t, runningBalance: Number(runningBalance.toFixed(2)) };
      });

      return {
        dateRange: { from, to },
        customer: (customer as any[])[0] || null,
        transactions: transactionsWithBalance,
        summary: {
          totalInvoiced: (invoices as any[]).reduce((s, i) => s + Number(i.amount), 0),
          totalPaid: (receipts as any[]).reduce((s, r) => s + Number(r.paidAmount), 0),
          totalReturns: (salesReturns as any[]).reduce((s, sr) => s + Number(Math.abs(sr.amount)), 0),
          endingBalance: Number(runningBalance.toFixed(2)),
          transactionCount: allTransactions.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in getCustomerStatement:', error);
      throw error;
    }
  }

  /**
   * Supplier Statement: all transactions for a supplier.
   */
  async getSupplierStatement(supplierId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);

    try {
      const supplier = await this.prisma.$queryRaw`
        SELECT
          s.id AS "supplierId",
          s.name AS "supplierName",
          s.phone AS "phone",
          s.email AS "email",
          s.balance::decimal(18,2) AS "currentBalance"
        FROM "Supplier" s
        WHERE s.id = ${supplierId || 0}
      `;

      const purchaseOrders = await this.prisma.$queryRaw`
        SELECT
          'PURCHASE' AS "transactionType",
          po.id AS "transactionId",
          po."orderNumber" AS "reference",
          po."orderDate" AS "transactionDate",
          po."netAmount"::decimal(18,2) AS "amount",
          COALESCE(SUM(p.amount), 0)::decimal(18,2) AS "paidAmount",
          (po."netAmount" - COALESCE(SUM(p.amount), 0))::decimal(18,2) AS "balance",
          po."status"
        FROM "PurchaseOrder" po
        LEFT JOIN "Payment" p ON p."purchaseOrderId" = po.id AND p."status" = 'COMPLETED'
        WHERE po."supplierId" = ${supplierId || 0}
        AND po."orderDate" >= ${new Date(from)} AND po."orderDate" <= ${new Date(to + 'T23:59:59.999Z')}
        GROUP BY po.id, po."orderNumber", po."orderDate", po."netAmount", po."status"
        ORDER BY po."orderDate"
      `;

      const payments = await this.prisma.$queryRaw`
        SELECT
          'PAYMENT' AS "transactionType",
          p.id AS "transactionId",
          p."paymentNumber" AS "reference",
          p."paymentDate" AS "transactionDate",
          -p.amount::decimal(18,2) AS "amount",
          p.amount::decimal(18,2) AS "paidAmount",
          0::decimal(18,2) AS "balance",
          p."paymentMethod" AS "paymentMethod",
          p."status"
        FROM "Payment" p
        WHERE p."supplierId" = ${supplierId || 0}
        AND p."paymentDate" >= ${new Date(from)} AND p."paymentDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND p."status" = 'COMPLETED'
        ORDER BY p."paymentDate"
      `;

      const purchaseReturns = await this.prisma.$queryRaw`
        SELECT
          'RETURN' AS "transactionType",
          pr.id AS "transactionId",
          pr."returnNumber" AS "reference",
          pr."createdAt" AS "transactionDate",
          -pr."totalAmount"::decimal(18,2) AS "amount",
          0::decimal(18,2) AS "paidAmount",
          -pr."totalAmount"::decimal(18,2) AS "balance",
          pr."status"
        FROM "PurchaseReturn" pr
        WHERE pr."supplierId" = ${supplierId || 0}
        AND pr."createdAt" >= ${new Date(from)} AND pr."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        ORDER BY pr."createdAt"
      `;

      const allTransactions = [
        ...(purchaseOrders as any[]),
        ...(payments as any[]),
        ...(purchaseReturns as any[]),
      ].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());

      let runningBalance = 0;
      const transactionsWithBalance = allTransactions.map((t) => {
        runningBalance += Number(t.amount);
        return { ...t, runningBalance: Number(runningBalance.toFixed(2)) };
      });

      return {
        dateRange: { from, to },
        supplier: (supplier as any[])[0] || null,
        transactions: transactionsWithBalance,
        summary: {
          totalPurchases: (purchaseOrders as any[]).reduce((s, p) => s + Number(p.amount), 0),
          totalPaid: (payments as any[]).reduce((s, p) => s + Number(p.paidAmount), 0),
          totalReturns: (purchaseReturns as any[]).reduce((s, pr) => s + Number(Math.abs(pr.amount)), 0),
          endingBalance: Number(runningBalance.toFixed(2)),
          transactionCount: allTransactions.length,
        },
      };
    } catch (error) {
      this.logger.error('Error in getSupplierStatement:', error);
      throw error;
    }
  }

  /**
   * Profitability Analysis: Revenue vs costs breakdown.
   */
  async getProfitabilityAnalysis(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const revenue = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM("totalAmount"), 0)::decimal(18,2) AS "totalRevenue",
          COALESCE(SUM("discountTotal"), 0)::decimal(18,2) AS "totalDiscounts",
          COALESCE(SUM("taxTotal"), 0)::decimal(18,2) AS "totalTax",
          COALESCE(SUM("netAmount"), 0)::decimal(18,2) AS "netRevenue"
        FROM "Invoice"
        WHERE "createdAt" >= ${new Date(from)} AND "createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND "status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
      `;

      const costs = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM(CASE WHEN at.name IN ('COST_OF_GOODS_SOLD', 'COGS') THEN jl.debit ELSE 0 END), 0)::decimal(18,2) AS "totalCOGS",
          COALESCE(SUM(CASE WHEN at.name IN ('EXPENSE', 'OPERATING_EXPENSE') THEN jl.debit ELSE 0 END), 0)::decimal(18,2) AS "totalOperatingExpenses",
          COALESCE(SUM(CASE WHEN at.name = 'ADMIN_EXPENSE' THEN jl.debit ELSE 0 END), 0)::decimal(18,2) AS "totalAdminExpenses",
          COALESCE(SUM(CASE WHEN at.name = 'SELLING_EXPENSE' THEN jl.debit ELSE 0 END), 0)::decimal(18,2) AS "totalSellingExpenses"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        WHERE j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        ${branchCond}
      `;

      const byProduct = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          SUM(li.quantity)::decimal(18,2) AS "unitsSold",
          COALESCE(SUM(li."lineTotal"), 0)::decimal(18,2) AS "revenue",
          COALESCE(SUM(li.quantity * COALESCE(p."averageCost", p."unitPrice", 0)), 0)::decimal(18,2) AS "cost",
          COALESCE(SUM(li."lineTotal") - SUM(li.quantity * COALESCE(p."averageCost", p."unitPrice", 0)), 0)::decimal(18,2) AS "profit",
          CASE WHEN COALESCE(SUM(li."lineTotal"), 0) > 0
            THEN ROUND(((SUM(li."lineTotal") - SUM(li.quantity * COALESCE(p."averageCost", p."unitPrice", 0))) / SUM(li."lineTotal") * 100), 2)
            ELSE 0
          END::decimal(18,2) AS "profitMargin"
        FROM "InvoiceLineItem" li
        JOIN "Invoice" i ON li."invoiceId" = i.id
        JOIN "Product" p ON li."productId" = p.id
        WHERE i."createdAt" >= ${new Date(from)} AND i."createdAt" <= ${new Date(to + 'T23:59:59.999Z')}
        AND i."status" NOT IN ('DRAFT', 'CANCELLED')
        ${branchCond}
        GROUP BY p.id, p.name
        ORDER BY "profit" DESC
        LIMIT 50
      `;

      const rev = (revenue as any[])[0] || {};
      const cost = (costs as any[])[0] || {};
      const totalCosts = Number(cost.totalCOGS || 0) + Number(cost.totalOperatingExpenses || 0) + Number(cost.totalAdminExpenses || 0) + Number(cost.totalSellingExpenses || 0);
      const grossProfit = Number(rev.netRevenue || 0) - Number(cost.totalCOGS || 0);
      const netProfit = grossProfit - Number(cost.totalOperatingExpenses || 0) - Number(cost.totalAdminExpenses || 0) - Number(cost.totalSellingExpenses || 0);

      return {
        dateRange: { from, to },
        revenue: rev,
        costs: cost,
        byProduct: byProduct || [],
        summary: {
          totalRevenue: Number(rev.netRevenue || 0),
          totalCosts: Number(totalCosts.toFixed(2)),
          grossProfit: Number(grossProfit.toFixed(2)),
          grossMargin: Number(rev.netRevenue || 0) > 0 ? Number(((grossProfit / Number(rev.netRevenue || 1)) * 100).toFixed(2)) : 0,
          netProfit: Number(netProfit.toFixed(2)),
          netMargin: Number(rev.netRevenue || 0) > 0 ? Number(((netProfit / Number(rev.netRevenue || 1)) * 100).toFixed(2)) : 0,
          breakEvenRevenue: Number(netProfit >= 0 ? 0 : ((totalCosts / Number(rev.netRevenue || 1)) * Number(rev.netRevenue || 0)).toFixed(2)),
        },
      };
    } catch (error) {
      this.logger.error('Error in getProfitabilityAnalysis:', error);
      throw error;
    }
  }

  /**
   * Cost Center Report: expenses allocated to a cost center.
   */
  async getCostCenterReport(costCenterId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);

    try {
      const costCenter = await this.prisma.$queryRaw`
        SELECT
          cc.id AS "costCenterId",
          cc.name AS "costCenterName",
          cc.code AS "costCenterCode",
          cc.description AS "description"
        FROM "CostCenter" cc
        WHERE cc.id = ${costCenterId || 0}
      `;

      const expenses = await this.prisma.$queryRaw`
        SELECT
          a.id AS "accountId",
          a."accountCode" AS "accountCode",
          a.name AS "accountName",
          COALESCE(SUM(jl.debit), 0)::decimal(18,2) AS "totalDebit",
          COALESCE(SUM(jl.credit), 0)::decimal(18,2) AS "totalCredit",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "netExpense"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        WHERE j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        AND at.name IN ('EXPENSE', 'OPERATING_EXPENSE', 'ADMIN_EXPENSE', 'SELLING_EXPENSE')
        AND jl."costCenterId" = ${costCenterId || 0}
        GROUP BY a.id, a."accountCode", a.name
        ORDER BY "netExpense" DESC
      `;

      const totalExpense = (expenses as any[]).reduce((s, e) => s + Number(e.netExpense), 0);

      const byMonth = await this.prisma.$queryRaw`
        SELECT
          EXTRACT(MONTH FROM j."entryDate")::int AS "month",
          COALESCE(SUM(jl.debit - jl.credit), 0)::decimal(18,2) AS "monthlyExpense"
        FROM "JournalLine" jl
        JOIN "Journal" j ON jl."journalId" = j.id
        JOIN "Account" a ON jl."accountId" = a.id
        JOIN "AccountType" at ON a."accountTypeId" = at.id
        WHERE j."entryDate" >= ${new Date(from)} AND j."entryDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND j."status" = 'POSTED'
        AND at.name IN ('EXPENSE', 'OPERATING_EXPENSE', 'ADMIN_EXPENSE', 'SELLING_EXPENSE')
        AND jl."costCenterId" = ${costCenterId || 0}
        GROUP BY EXTRACT(MONTH FROM j."entryDate")
        ORDER BY "month"
      `;

      return {
        dateRange: { from, to },
        costCenter: (costCenter as any[])[0] || null,
        expenses: expenses || [],
        byMonth: byMonth || [],
        summary: {
          totalExpense: Number(totalExpense.toFixed(2)),
          accountCount: (expenses as any[]).length,
        },
      };
    } catch (error) {
      this.logger.error('Error in getCostCenterReport:', error);
      throw error;
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  PRODUCTION REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Manufacturing orders summary: count by status, total output, total cost.
   */
  async getProductionReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalOrders",
          COUNT(CASE WHEN "status" = 'COMPLETED' THEN 1 END)::int AS "completedOrders",
          COUNT(CASE WHEN "status" = 'IN_PROGRESS' THEN 1 END)::int AS "inProgressOrders",
          COUNT(CASE WHEN "status" = 'PLANNED' THEN 1 END)::int AS "plannedOrders",
          COUNT(CASE WHEN "status" = 'CANCELLED' THEN 1 END)::int AS "cancelledOrders",
          COALESCE(SUM("plannedQuantity"), 0)::decimal(18,2) AS "totalPlannedQty",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "totalActualQty",
          COALESCE(SUM("totalCost"), 0)::decimal(18,2) AS "totalProductionCost",
          CASE WHEN COALESCE(SUM("plannedQuantity"), 0) > 0
            THEN ROUND((SUM("actualQuantity") / SUM("plannedQuantity")) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "overallYieldPercent"
        FROM "ManufacturingOrder"
        WHERE "scheduledDate" >= ${new Date(from)} AND "scheduledDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const byProduct = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          COUNT(mo.id)::int AS "orderCount",
          COALESCE(SUM(mo."plannedQuantity"), 0)::decimal(18,2) AS "plannedQty",
          COALESCE(SUM(mo."actualQuantity"), 0)::decimal(18,2) AS "actualQty",
          COALESCE(SUM(mo."totalCost"), 0)::decimal(18,2) AS "totalCost",
          CASE WHEN COALESCE(SUM(mo."plannedQuantity"), 0) > 0
            THEN ROUND((SUM(mo."actualQuantity") / SUM(mo."plannedQuantity")) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "yieldPercent",
          COALESCE(AVG(mo."totalCost" / NULLIF(mo."actualQuantity", 0)), 0)::decimal(18,2) AS "avgUnitCost"
        FROM "ManufacturingOrder" mo
        JOIN "Product" p ON mo."productId" = p.id
        WHERE mo."scheduledDate" >= ${new Date(from)} AND mo."scheduledDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY p.id, p.name
        ORDER BY "totalCost" DESC
      `;

      const daily = await this.prisma.$queryRaw`
        SELECT
          DATE("scheduledDate") AS "date",
          COUNT(*)::int AS "orderCount",
          COALESCE(SUM("plannedQuantity"), 0)::decimal(18,2) AS "plannedQty",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "actualQty",
          COALESCE(SUM("totalCost"), 0)::decimal(18,2) AS "totalCost"
        FROM "ManufacturingOrder"
        WHERE "scheduledDate" >= ${new Date(from)} AND "scheduledDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY DATE("scheduledDate")
        ORDER BY "date"
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        byProduct: byProduct || [],
        daily: daily || [],
      };
    } catch (error) {
      this.logger.error('Error in getProductionReport:', error);
      throw error;
    }
  }

  /**
   * Feed cost report: breakdown of feed production costs.
   */
  async getFeedCostReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const feedProductions = await this.prisma.$queryRaw`
        SELECT
          fp.id AS "productionId",
          fp."batchNumber" AS "batchNumber",
          fp."productionDate" AS "productionDate",
          fp."totalQuantity"::decimal(18,2) AS "totalQuantity",
          fp."costPerKg"::decimal(18,2) AS "costPerKg",
          fp."totalCost"::decimal(18,2) AS "totalCost",
          fp."feedType" AS "feedType",
          fp."status" AS "status",
          b.name AS "branchName"
        FROM "FeedProduction" fp
        LEFT JOIN "Branch" b ON fp."branchId" = b.id
        WHERE fp."productionDate" >= ${new Date(from)} AND fp."productionDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        ORDER BY fp."productionDate" DESC
      `;

      const ingredientCosts = await this.prisma.$queryRaw`
        SELECT
          p.id AS "ingredientId",
          p.name AS "ingredientName",
          COALESCE(SUM(fpi.quantity), 0)::decimal(18,2) AS "totalQtyUsed",
          COALESCE(AVG(fpi."unitCost"), 0)::decimal(18,2) AS "avgUnitCost",
          COALESCE(SUM(fpi."totalCost"), 0)::decimal(18,2) AS "totalCost",
          CASE WHEN COALESCE(SUM(fpi.quantity), 0) > 0
            THEN ROUND((SUM(fpi."totalCost") / SUM(fpi.quantity)), 4)
            ELSE 0
          END::decimal(18,4) AS "effectiveCostPerUnit"
        FROM "FeedProductionIngredient" fpi
        JOIN "FeedProduction" fp ON fpi."feedProductionId" = fp.id
        JOIN "Product" p ON fpi."ingredientId" = p.id
        WHERE fp."productionDate" >= ${new Date(from)} AND fp."productionDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY p.id, p.name
        ORDER BY "totalCost" DESC
      `;

      const byFeedType = await this.prisma.$queryRaw`
        SELECT
          fp."feedType" AS "feedType",
          COUNT(*)::int AS "batchCount",
          COALESCE(SUM(fp."totalQuantity"), 0)::decimal(18,2) AS "totalQuantity",
          COALESCE(AVG(fp."costPerKg"), 0)::decimal(18,2) AS "avgCostPerKg",
          COALESCE(SUM(fp."totalCost"), 0)::decimal(18,2) AS "totalCost"
        FROM "FeedProduction" fp
        WHERE fp."productionDate" >= ${new Date(from)} AND fp."productionDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY fp."feedType"
        ORDER BY "totalCost" DESC
      `;

      return {
        dateRange: { from, to },
        feedProductions: feedProductions || [],
        ingredientCosts: ingredientCosts || [],
        byFeedType: byFeedType || [],
      };
    } catch (error) {
      this.logger.error('Error in getFeedCostReport:', error);
      throw error;
    }
  }

  /**
   * Manufacturing yield analysis: trends and efficiency.
   */
  async getYieldAnalysis(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const overall = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalBatches",
          COALESCE(SUM("plannedQuantity"), 0)::decimal(18,2) AS "totalPlanned",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "totalActual",
          COALESCE(AVG(
            CASE WHEN "plannedQuantity" > 0
              THEN ("actualQuantity" / "plannedQuantity") * 100
              ELSE 0
            END
          ), 0)::decimal(18,2) AS "avgYieldPercent",
          COALESCE(MIN(
            CASE WHEN "plannedQuantity" > 0
              THEN ("actualQuantity" / "plannedQuantity") * 100
              ELSE 0
            END
          ), 0)::decimal(18,2) AS "minYieldPercent",
          COALESCE(MAX(
            CASE WHEN "plannedQuantity" > 0
              THEN ("actualQuantity" / "plannedQuantity") * 100
              ELSE 0
            END
          ), 0)::decimal(18,2) AS "maxYieldPercent"
        FROM "ManufacturingOrder"
        WHERE "scheduledDate" >= ${new Date(from)} AND "scheduledDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND "status" = 'COMPLETED'
        ${branchCond}
      `;

      const byProduct = await this.prisma.$queryRaw`
        SELECT
          p.id AS "productId",
          p.name AS "productName",
          COUNT(mo.id)::int AS "batchCount",
          COALESCE(SUM(mo."plannedQuantity"), 0)::decimal(18,2) AS "plannedQty",
          COALESCE(SUM(mo."actualQuantity"), 0)::decimal(18,2) AS "actualQty",
          COALESCE(AVG(
            CASE WHEN mo."plannedQuantity" > 0
              THEN (mo."actualQuantity" / mo."plannedQuantity") * 100
              ELSE 0
            END
          ), 0)::decimal(18,2) AS "avgYieldPercent",
          COALESCE(SUM(mo."totalCost"), 0)::decimal(18,2) AS "totalCost",
          COALESCE(AVG(mo."totalCost" / NULLIF(mo."actualQuantity", 0)), 0)::decimal(18,2) AS "avgCostPerUnit"
        FROM "ManufacturingOrder" mo
        JOIN "Product" p ON mo."productId" = p.id
        WHERE mo."scheduledDate" >= ${new Date(from)} AND mo."scheduledDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND mo."status" = 'COMPLETED'
        ${branchCond}
        GROUP BY p.id, p.name
        ORDER BY "avgYieldPercent" DESC
      `;

      const byWeek = await this.prisma.$queryRaw`
        SELECT
          DATE_TRUNC('week', "scheduledDate") AS "week",
          COUNT(*)::int AS "batchCount",
          COALESCE(SUM("actualQuantity"), 0)::decimal(18,2) AS "actualQty",
          COALESCE(AVG(
            CASE WHEN "plannedQuantity" > 0
              THEN ("actualQuantity" / "plannedQuantity") * 100
              ELSE 0
            END
          ), 0)::decimal(18,2) AS "avgYieldPercent"
        FROM "ManufacturingOrder"
        WHERE "scheduledDate" >= ${new Date(from)} AND "scheduledDate" <= ${new Date(to + 'T23:59:59.999Z')}
        AND "status" = 'COMPLETED'
        ${branchCond}
        GROUP BY DATE_TRUNC('week', "scheduledDate")
        ORDER BY "week"
      `;

      return {
        dateRange: { from, to },
        overall: (overall as any[])[0] || {},
        byProduct: byProduct || [],
        byWeek: byWeek || [],
      };
    } catch (error) {
      this.logger.error('Error in getYieldAnalysis:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  POULTRY REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Active chicks batches with mortality rates.
   */
  async getChicksReport(branchId?: number) {
    const branchCond = this.branchFilter(branchId);

    try {
      const batches = await this.prisma.$queryRaw`
        SELECT
          cb.id AS "batchId",
          cb."batchNumber" AS "batchNumber",
          cb."breed" AS "breed",
          cb."supplier" AS "supplier",
          cb."receivedDate" AS "receivedDate",
          cb."initialQuantity"::int AS "initialQuantity",
          cb."currentQuantity"::int AS "currentQuantity",
          (cb."initialQuantity" - cb."currentQuantity")::int AS "mortalityCount",
          CASE WHEN cb."initialQuantity" > 0
            THEN ROUND(((cb."initialQuantity" - cb."currentQuantity")::decimal / cb."initialQuantity") * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "mortalityRate",
          cb."ageInDays"::int AS "ageInDays",
          cb."currentWeight"::decimal(18,2) AS "currentWeight",
          cb."status" AS "status",
          cb."houseNumber" AS "houseNumber",
          cb."vaccinationStatus" AS "vaccinationStatus",
          b.name AS "branchName"
        FROM "ChicksBatch" cb
        LEFT JOIN "Branch" b ON cb."branchId" = b.id
        WHERE cb."status" IN ('ACTIVE', 'GROWING')
        ${branchCond}
        ORDER BY cb."receivedDate" DESC
      `;

      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "activeBatches",
          COALESCE(SUM("initialQuantity"), 0)::int AS "totalInitialChicks",
          COALESCE(SUM("currentQuantity"), 0)::int AS "totalCurrentChicks",
          COALESCE(SUM("initialQuantity" - "currentQuantity"), 0)::int AS "totalMortality",
          CASE WHEN COALESCE(SUM("initialQuantity"), 0) > 0
            THEN ROUND((SUM("initialQuantity" - "currentQuantity")::decimal / SUM("initialQuantity")) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "overallMortalityRate",
          COALESCE(AVG("ageInDays"), 0)::decimal(18,2) AS "avgAgeDays"
        FROM "ChicksBatch"
        WHERE "status" IN ('ACTIVE', 'GROWING')
        ${branchCond}
      `;

      return {
        batches: batches || [],
        summary: (summary as any[])[0] || {},
      };
    } catch (error) {
      this.logger.error('Error in getChicksReport:', error);
      throw error;
    }
  }

  /**
   * Mortality trends by batch and over time.
   */
  async getMortalityReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const byBatch = await this.prisma.$queryRaw`
        SELECT
          cb.id AS "batchId",
          cb."batchNumber" AS "batchNumber",
          cb."breed" AS "breed",
          cb."initialQuantity"::int AS "initialQuantity",
          cb."currentQuantity"::int AS "currentQuantity",
          (cb."initialQuantity" - cb."currentQuantity")::int AS "totalMortality",
          CASE WHEN cb."initialQuantity" > 0
            THEN ROUND(((cb."initialQuantity" - cb."currentQuantity")::decimal / cb."initialQuantity") * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "mortalityRate",
          COALESCE(SUM(cm.count), 0)::int AS "recordedDeaths",
          cb."houseNumber" AS "houseNumber",
          cb."receivedDate" AS "receivedDate"
        FROM "ChicksBatch" cb
        LEFT JOIN "ChicksMortality" cm ON cm."batchId" = cb.id
          AND cm."date" >= ${new Date(from)} AND cm."date" <= ${new Date(to + 'T23:59:59.999Z')}
        WHERE cb."receivedDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY cb.id, cb."batchNumber", cb."breed", cb."initialQuantity", cb."currentQuantity", cb."houseNumber", cb."receivedDate"
        ORDER BY "totalMortality" DESC
      `;

      const dailyTrend = await this.prisma.$queryRaw`
        SELECT
          cm."date" AS "date",
          COUNT(DISTINCT cm."batchId")::int AS "affectedBatches",
          COALESCE(SUM(cm.count), 0)::int AS "totalDeaths",
          cb2."breed" AS "mostAffectedBreed"
        FROM "ChicksMortality" cm
        JOIN "ChicksBatch" cb ON cm."batchId" = cb.id
        LEFT JOIN LATERAL (
          SELECT cb2."breed"
          FROM "ChicksMortality" cm2
          JOIN "ChicksBatch" cb2 ON cm2."batchId" = cb2.id
          WHERE cm2."date" = cm."date"
          GROUP BY cb2."breed"
          ORDER BY SUM(cm2.count) DESC
          LIMIT 1
        ) cb2 ON true
        WHERE cm."date" >= ${new Date(from)} AND cm."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY cm."date", cb2."breed"
        ORDER BY cm."date"
      `;

      const byCause = await this.prisma.$queryRaw`
        SELECT
          COALESCE(cm.cause, 'UNKNOWN') AS "cause",
          COALESCE(SUM(cm.count), 0)::int AS "totalDeaths",
          COUNT(*)::int AS "incidentCount"
        FROM "ChicksMortality" cm
        JOIN "ChicksBatch" cb ON cm."batchId" = cb.id
        WHERE cm."date" >= ${new Date(from)} AND cm."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY cm.cause
        ORDER BY "totalDeaths" DESC
      `;

      return {
        dateRange: { from, to },
        byBatch: byBatch || [],
        dailyTrend: dailyTrend || [],
        byCause: byCause || [],
      };
    } catch (error) {
      this.logger.error('Error in getMortalityReport:', error);
      throw error;
    }
  }

  /**
   * Daily egg production report.
   */
  async getEggProductionReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM(ep."goodEggs"), 0)::int AS "totalGoodEggs",
          COALESCE(SUM(ep."crackedEggs"), 0)::int AS "totalCrackedEggs",
          COALESCE(SUM(ep."dirtyEggs"), 0)::int AS "totalDirtyEggs",
          COALESCE(SUM(ep."smallEggs"), 0)::int AS "totalSmallEggs",
          COALESCE(SUM(ep."totalEggs"), 0)::int AS "grandTotalEggs",
          COALESCE(AVG(ep."productionRate"), 0)::decimal(18,2) AS "avgProductionRate",
          COUNT(DISTINCT ep."houseId")::int AS "activeHouses",
          COUNT(DISTINCT ep."date")::int AS "productionDays"
        FROM "EggProduction" ep
        JOIN "Branch" b ON ep."branchId" = b.id
        WHERE ep."date" >= ${new Date(from)} AND ep."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const daily = await this.prisma.$queryRaw`
        SELECT
          ep."date" AS "date",
          COALESCE(SUM(ep."goodEggs"), 0)::int AS "goodEggs",
          COALESCE(SUM(ep."crackedEggs"), 0)::int AS "crackedEggs",
          COALESCE(SUM(ep."dirtyEggs"), 0)::int AS "dirtyEggs",
          COALESCE(SUM(ep."smallEggs"), 0)::int AS "smallEggs",
          COALESCE(SUM(ep."totalEggs"), 0)::int AS "totalEggs",
          COALESCE(AVG(ep."productionRate"), 0)::decimal(18,2) AS "productionRate",
          COUNT(DISTINCT ep."houseId")::int AS "housesActive"
        FROM "EggProduction" ep
        JOIN "Branch" b ON ep."branchId" = b.id
        WHERE ep."date" >= ${new Date(from)} AND ep."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY ep."date"
        ORDER BY ep."date"
      `;

      const byHouse = await this.prisma.$queryRaw`
        SELECT
          h.id AS "houseId",
          h.name AS "houseName",
          h."houseNumber" AS "houseNumber",
          COALESCE(SUM(ep."totalEggs"), 0)::int AS "totalEggs",
          COALESCE(AVG(ep."productionRate"), 0)::decimal(18,2) AS "avgProductionRate",
          COALESCE(SUM(ep."goodEggs"), 0)::int AS "goodEggs",
          CASE WHEN COALESCE(SUM(ep."totalEggs"), 0) > 0
            THEN ROUND((SUM(ep."goodEggs")::decimal / SUM(ep."totalEggs")) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "qualityRate"
        FROM "EggProduction" ep
        JOIN "PoultryHouse" h ON ep."houseId" = h.id
        JOIN "Branch" b ON ep."branchId" = b.id
        WHERE ep."date" >= ${new Date(from)} AND ep."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY h.id, h.name, h."houseNumber"
        ORDER BY "totalEggs" DESC
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        daily: daily || [],
        byHouse: byHouse || [],
      };
    } catch (error) {
      this.logger.error('Error in getEggProductionReport:', error);
      throw error;
    }
  }

  /**
   * Egg sales report: revenue and quantity sold.
   */
  async getEggSalesReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM(es.quantity), 0)::decimal(18,2) AS "totalQuantitySold",
          COALESCE(SUM(es."unitPrice" * es.quantity), 0)::decimal(18,2) AS "totalRevenue",
          COALESCE(AVG(es."unitPrice"), 0)::decimal(18,2) AS "avgUnitPrice",
          COALESCE(SUM(es.discount), 0)::decimal(18,2) AS "totalDiscounts",
          COALESCE(SUM(es."totalAmount"), 0)::decimal(18,2) AS "netRevenue",
          COUNT(*)::int AS "transactionCount"
        FROM "EggSale" es
        JOIN "Branch" b ON es."branchId" = b.id
        WHERE es."saleDate" >= ${new Date(from)} AND es."saleDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const daily = await this.prisma.$queryRaw`
        SELECT
          es."saleDate" AS "date",
          COALESCE(SUM(es.quantity), 0)::decimal(18,2) AS "quantitySold",
          COALESCE(AVG(es."unitPrice"), 0)::decimal(18,2) AS "avgUnitPrice",
          COALESCE(SUM(es."totalAmount"), 0)::decimal(18,2) AS "revenue",
          COUNT(*)::int AS "transactionCount"
        FROM "EggSale" es
        JOIN "Branch" b ON es."branchId" = b.id
        WHERE es."saleDate" >= ${new Date(from)} AND es."saleDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY es."saleDate"
        ORDER BY es."saleDate"
      `;

      const byCustomer = await this.prisma.$queryRaw`
        SELECT
          c.id AS "customerId",
          c.name AS "customerName",
          COALESCE(SUM(es.quantity), 0)::decimal(18,2) AS "quantitySold",
          COALESCE(SUM(es."totalAmount"), 0)::decimal(18,2) AS "totalRevenue",
          COALESCE(AVG(es."unitPrice"), 0)::decimal(18,2) AS "avgPrice",
          COUNT(*)::int AS "purchaseCount"
        FROM "EggSale" es
        JOIN "Customer" c ON es."customerId" = c.id
        JOIN "Branch" b ON es."branchId" = b.id
        WHERE es."saleDate" >= ${new Date(from)} AND es."saleDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY c.id, c.name
        ORDER BY "totalRevenue" DESC
        LIMIT 20
      `;

      const byGrade = await this.prisma.$queryRaw`
        SELECT
          COALESCE(es."eggGrade", 'UNGRADED') AS "eggGrade",
          COALESCE(SUM(es.quantity), 0)::decimal(18,2) AS "quantitySold",
          COALESCE(AVG(es."unitPrice"), 0)::decimal(18,2) AS "avgPrice",
          COALESCE(SUM(es."totalAmount"), 0)::decimal(18,2) AS "totalRevenue"
        FROM "EggSale" es
        JOIN "Branch" b ON es."branchId" = b.id
        WHERE es."saleDate" >= ${new Date(from)} AND es."saleDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY es."eggGrade"
        ORDER BY "quantitySold" DESC
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        daily: daily || [],
        byCustomer: byCustomer || [],
        byGrade: byGrade || [],
      };
    } catch (error) {
      this.logger.error('Error in getEggSalesReport:', error);
      throw error;
    }
  }


  // ═══════════════════════════════════════════════════════════════
  //  LOGISTICS REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Driver performance metrics.
   */
  async getDriverReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const drivers = await this.prisma.$queryRaw`
        SELECT
          d.id AS "driverId",
          d.name AS "driverName",
          d.phone AS "phone",
          d.licenseNumber AS "licenseNumber",
          d.status AS "status",
          COUNT(t.id)::int AS "tripCount",
          COALESCE(SUM(t.distance), 0)::decimal(18,2) AS "totalDistance",
          COALESCE(SUM(t."fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(SUM(t."deliveryCost"), 0)::decimal(18,2) AS "totalDeliveryCost",
          COALESCE(AVG(t.distance / NULLIF(t.duration, 0)), 0)::decimal(18,2) AS "avgSpeed",
          COALESCE(SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END), 0)::int AS "completedTrips",
          COALESCE(SUM(CASE WHEN t.status = 'DELAYED' THEN 1 ELSE 0 END), 0)::int AS "delayedTrips",
          CASE WHEN COUNT(t.id) > 0
            THEN ROUND((SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END)::decimal / COUNT(t.id)) * 100, 2)
            ELSE 0
          END::decimal(18,2) AS "completionRate"
        FROM "Driver" d
        LEFT JOIN "Trip" t ON t."driverId" = d.id
          AND t."startDate" >= ${new Date(from)} AND t."startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        WHERE 1=1
        ${branchCond}
        GROUP BY d.id, d.name, d.phone, d.licenseNumber, d.status
        ORDER BY "tripCount" DESC
      `;

      return {
        dateRange: { from, to },
        drivers: drivers || [],
      };
    } catch (error) {
      this.logger.error('Error in getDriverReport:', error);
      throw error;
    }
  }

  /**
   * Vehicle utilization and costs report.
   */
  async getVehicleReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const vehicles = await this.prisma.$queryRaw`
        SELECT
          v.id AS "vehicleId",
          v."plateNumber" AS "plateNumber",
          v.make AS "make",
          v.model AS "model",
          v."year" AS "year",
          v.type AS "type",
          v.status AS "status",
          COUNT(t.id)::int AS "tripCount",
          COALESCE(SUM(t.distance), 0)::decimal(18,2) AS "totalDistance",
          COALESCE(SUM(t."fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(AVG(t."fuelConsumption"), 0)::decimal(18,2) AS "avgFuelConsumption",
          COALESCE(SUM(t."deliveryCost"), 0)::decimal(18,2) AS "totalDeliveryCost",
          COALESCE(AVG(t.distance / NULLIF(t.duration, 0)), 0)::decimal(18,2) AS "avgSpeed"
        FROM "Vehicle" v
        LEFT JOIN "Trip" t ON t."vehicleId" = v.id
          AND t."startDate" >= ${new Date(from)} AND t."startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        WHERE 1=1
        ${branchCond}
        GROUP BY v.id, v."plateNumber", v.make, v.model, v."year", v.type, v.status
        ORDER BY "tripCount" DESC
      `;

      const maintenanceCosts = await this.prisma.$queryRaw`
        SELECT
          v.id AS "vehicleId",
          v."plateNumber" AS "plateNumber",
          COALESCE(SUM(vm.cost), 0)::decimal(18,2) AS "maintenanceCost",
          COUNT(vm.id)::int AS "serviceCount",
          MAX(vm."serviceDate") AS "lastServiceDate"
        FROM "Vehicle" v
        LEFT JOIN "VehicleMaintenance" vm ON vm."vehicleId" = v.id
          AND vm."serviceDate" >= ${new Date(from)} AND vm."serviceDate" <= ${new Date(to + 'T23:59:59.999Z')}
        WHERE 1=1
        ${branchCond}
        GROUP BY v.id, v."plateNumber"
      `;

      return {
        dateRange: { from, to },
        vehicles: vehicles || [],
        maintenanceCosts: maintenanceCosts || [],
      };
    } catch (error) {
      this.logger.error('Error in getVehicleReport:', error);
      throw error;
    }
  }

  /**
   * Trip costs and profitability.
   */
  async getTripCostReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalTrips",
          COALESCE(SUM(distance), 0)::decimal(18,2) AS "totalDistance",
          COALESCE(SUM("fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(SUM("deliveryCost"), 0)::decimal(18,2) AS "totalDeliveryCost",
          COALESCE(SUM("otherCosts"), 0)::decimal(18,2) AS "totalOtherCosts",
          COALESCE(SUM("fuelCost" + "deliveryCost" + "otherCosts"), 0)::decimal(18,2) AS "totalCost",
          COALESCE(AVG(distance), 0)::decimal(18,2) AS "avgDistance",
          COALESCE(AVG("fuelCost"), 0)::decimal(18,2) AS "avgFuelCost",
          COALESCE(AVG(duration), 0)::decimal(18,2) AS "avgDuration"
        FROM "Trip"
        WHERE "startDate" >= ${new Date(from)} AND "startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const byRoute = await this.prisma.$queryRaw`
        SELECT
          t."origin" AS "origin",
          t."destination" AS "destination",
          COUNT(*)::int AS "tripCount",
          COALESCE(SUM(t.distance), 0)::decimal(18,2) AS "totalDistance",
          COALESCE(AVG(t.distance), 0)::decimal(18,2) AS "avgDistance",
          COALESCE(SUM(t."fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(SUM(t."deliveryCost"), 0)::decimal(18,2) AS "totalDeliveryCost",
          COALESCE(SUM(t."fuelCost" + t."deliveryCost"), 0)::decimal(18,2) AS "totalCost",
          COALESCE(AVG(t.duration), 0)::decimal(18,2) AS "avgDuration"
        FROM "Trip" t
        WHERE t."startDate" >= ${new Date(from)} AND t."startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY t."origin", t."destination"
        ORDER BY "tripCount" DESC
        LIMIT 50
      `;

      const byVehicle = await this.prisma.$queryRaw`
        SELECT
          v.id AS "vehicleId",
          v."plateNumber" AS "plateNumber",
          v.make AS "make",
          v.model AS "model",
          COUNT(t.id)::int AS "tripCount",
          COALESCE(SUM(t.distance), 0)::decimal(18,2) AS "totalDistance",
          COALESCE(SUM(t."fuelCost"), 0)::decimal(18,2) AS "fuelCost",
          COALESCE(AVG(t."fuelConsumption"), 0)::decimal(18,2) AS "avgFuelConsumption",
          COALESCE(AVG(t.distance / NULLIF(t.duration, 0)), 0)::decimal(18,2) AS "avgSpeed"
        FROM "Vehicle" v
        JOIN "Trip" t ON t."vehicleId" = v.id
        WHERE t."startDate" >= ${new Date(from)} AND t."startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY v.id, v."plateNumber", v.make, v.model
        ORDER BY "tripCount" DESC
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        byRoute: byRoute || [],
        byVehicle: byVehicle || [],
      };
    } catch (error) {
      this.logger.error('Error in getTripCostReport:', error);
      throw error;
    }
  }

  /**
   * Fuel consumption trends.
   */
  async getFuelConsumptionReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COALESCE(SUM("fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(SUM("fuelLiters"), 0)::decimal(18,2) AS "totalFuelLiters",
          COALESCE(SUM(distance), 0)::decimal(18,2) AS "totalDistance",
          CASE WHEN COALESCE(SUM("fuelLiters"), 0) > 0
            THEN ROUND(SUM(distance) / SUM("fuelLiters"), 2)
            ELSE 0
          END::decimal(18,2) AS "avgKmPerLiter",
          COALESCE(AVG("fuelConsumption"), 0)::decimal(18,2) AS "avgConsumptionRate",
          COALESCE(AVG("fuelCost"), 0)::decimal(18,2) AS "avgCostPerTrip"
        FROM "Trip"
        WHERE "startDate" >= ${new Date(from)} AND "startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const byVehicle = await this.prisma.$queryRaw`
        SELECT
          v.id AS "vehicleId",
          v."plateNumber" AS "plateNumber",
          v.make AS "make",
          v.model AS "model",
          COALESCE(SUM(t."fuelLiters"), 0)::decimal(18,2) AS "totalLiters",
          COALESCE(SUM(t."fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(SUM(t.distance), 0)::decimal(18,2) AS "totalDistance",
          CASE WHEN COALESCE(SUM(t."fuelLiters"), 0) > 0
            THEN ROUND(SUM(t.distance) / SUM(t."fuelLiters"), 2)
            ELSE 0
          END::decimal(18,2) AS "kmPerLiter",
          COALESCE(AVG(t."fuelConsumption"), 0)::decimal(18,2) AS "consumptionRate",
          CASE WHEN COALESCE(SUM(t."fuelLiters"), 0) > 0
            THEN ROUND(SUM(t."fuelCost") / SUM(t."fuelLiters"), 2)
            ELSE 0
          END::decimal(18,2) AS "costPerLiter"
        FROM "Vehicle" v
        JOIN "Trip" t ON t."vehicleId" = v.id
        WHERE t."startDate" >= ${new Date(from)} AND t."startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY v.id, v."plateNumber", v.make, v.model
        ORDER BY "kmPerLiter" DESC
      `;

      const daily = await this.prisma.$queryRaw`
        SELECT
          DATE("startDate") AS "date",
          COALESCE(SUM("fuelLiters"), 0)::decimal(18,2) AS "totalLiters",
          COALESCE(SUM("fuelCost"), 0)::decimal(18,2) AS "totalFuelCost",
          COALESCE(SUM(distance), 0)::decimal(18,2) AS "totalDistance",
          COUNT(*)::int AS "tripCount"
        FROM "Trip"
        WHERE "startDate" >= ${new Date(from)} AND "startDate" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY DATE("startDate")
        ORDER BY "date"
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        byVehicle: byVehicle || [],
        daily: daily || [],
      };
    } catch (error) {
      this.logger.error('Error in getFuelConsumptionReport:', error);
      throw error;
    }
  }

  // ═══════════════════════════════════════════════════════════════
  //  HR REPORTS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Attendance summary report.
   */
  async getAttendanceReport(branchId?: number, dateFrom?: string, dateTo?: string) {
    const { dateFrom: from, dateTo: to } = this.getDateRangeDefaults(dateFrom, dateTo);
    const branchCond = this.branchFilter(branchId);

    try {
      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalRecords",
          COUNT(CASE WHEN "status" = 'PRESENT' THEN 1 END)::int AS "presentCount",
          COUNT(CASE WHEN "status" = 'ABSENT' THEN 1 END)::int AS "absentCount",
          COUNT(CASE WHEN "status" = 'LATE' THEN 1 END)::int AS "lateCount",
          COUNT(CASE WHEN "status" = 'HALF_DAY' THEN 1 END)::int AS "halfDayCount",
          COUNT(CASE WHEN "status" = 'ON_LEAVE' THEN 1 END)::int AS "onLeaveCount",
          COUNT(CASE WHEN "isOvertime" = true THEN 1 END)::int AS "overtimeCount",
          COALESCE(AVG("workingHours"), 0)::decimal(18,2) AS "avgWorkingHours",
          COALESCE(SUM("overtimeHours"), 0)::decimal(18,2) AS "totalOvertimeHours"
        FROM "Attendance"
        WHERE "date" >= ${new Date(from)} AND "date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
      `;

      const byEmployee = await this.prisma.$queryRaw`
        SELECT
          e.id AS "employeeId",
          e.name AS "employeeName",
          e."employeeCode" AS "employeeCode",
          d.name AS "departmentName",
          COUNT(*)::int AS "totalDays",
          COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END)::int AS "presentDays",
          COUNT(CASE WHEN a."status" = 'ABSENT' THEN 1 END)::int AS "absentDays",
          COUNT(CASE WHEN a."status" = 'LATE' THEN 1 END)::int AS "lateDays",
          COUNT(CASE WHEN a."status" = 'HALF_DAY' THEN 1 END)::int AS "halfDays",
          COALESCE(AVG(a."workingHours"), 0)::decimal(18,2) AS "avgWorkingHours",
          COALESCE(SUM(a."overtimeHours"), 0)::decimal(18,2) AS "totalOvertimeHours"
        FROM "Employee" e
        JOIN "Attendance" a ON a."employeeId" = e.id
        LEFT JOIN "Department" d ON e."departmentId" = d.id
        WHERE a."date" >= ${new Date(from)} AND a."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY e.id, e.name, e."employeeCode", d.name
        ORDER BY e.name
      `;

      const byDepartment = await this.prisma.$queryRaw`
        SELECT
          d.id AS "departmentId",
          d.name AS "departmentName",
          COUNT(*)::int AS "totalRecords",
          COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END)::int AS "presentCount",
          COUNT(CASE WHEN a."status" = 'ABSENT' THEN 1 END)::int AS "absentCount",
          COUNT(CASE WHEN a."status" = 'LATE' THEN 1 END)::int AS "lateCount",
          COALESCE(AVG(a."workingHours"), 0)::decimal(18,2) AS "avgWorkingHours",
          ROUND(
            (COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100,
            2
          )::decimal(18,2) AS "attendanceRate"
        FROM "Department" d
        JOIN "Employee" e ON e."departmentId" = d.id
        JOIN "Attendance" a ON a."employeeId" = e.id
        WHERE a."date" >= ${new Date(from)} AND a."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY d.id, d.name
        ORDER BY "attendanceRate" DESC
      `;

      const daily = await this.prisma.$queryRaw`
        SELECT
          a."date" AS "date",
          COUNT(*)::int AS "totalEmployees",
          COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END)::int AS "present",
          COUNT(CASE WHEN a."status" = 'ABSENT' THEN 1 END)::int AS "absent",
          COUNT(CASE WHEN a."status" = 'LATE' THEN 1 END)::int AS "late",
          COUNT(CASE WHEN a."status" = 'HALF_DAY' THEN 1 END)::int AS "halfDay",
          COALESCE(AVG(a."workingHours"), 0)::decimal(18,2) AS "avgWorkingHours",
          ROUND(
            (COUNT(CASE WHEN a."status" = 'PRESENT' THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100,
            2
          )::decimal(18,2) AS "attendanceRate"
        FROM "Attendance" a
        WHERE a."date" >= ${new Date(from)} AND a."date" <= ${new Date(to + 'T23:59:59.999Z')}
        ${branchCond}
        GROUP BY a."date"
        ORDER BY a."date"
      `;

      return {
        dateRange: { from, to },
        summary: (summary as any[])[0] || {},
        byEmployee: byEmployee || [],
        byDepartment: byDepartment || [],
        daily: daily || [],
      };
    } catch (error) {
      this.logger.error('Error in getAttendanceReport:', error);
      throw error;
    }
  }

  /**
   * Payroll summary by department.
   */
  async getPayrollSummary(branchId?: number, payrollPeriodId?: number) {
    const branchCond = this.branchFilter(branchId);

    try {
      const periodFilter = payrollPeriodId
        ? `AND p."payrollPeriodId" = ${payrollPeriodId}`
        : `AND p."payrollPeriodId" = (SELECT MAX(id) FROM "PayrollPeriod")`;

      const summary = await this.prisma.$queryRaw`
        SELECT
          COUNT(DISTINCT p."employeeId")::int AS "totalEmployees",
          COALESCE(SUM(p."basicSalary"), 0)::decimal(18,2) AS "totalBasicSalary",
          COALESCE(SUM(p."overtimePay"), 0)::decimal(18,2) AS "totalOvertimePay",
          COALESCE(SUM(p."allowances"), 0)::decimal(18,2) AS "totalAllowances",
          COALESCE(SUM(p."bonuses"), 0)::decimal(18,2) AS "totalBonuses",
          COALESCE(SUM(p."deductions"), 0)::decimal(18,2) AS "totalDeductions",
          COALESCE(SUM(p."tax"), 0)::decimal(18,2) AS "totalTax",
          COALESCE(SUM(p."socialSecurity"), 0)::decimal(18,2) AS "totalSocialSecurity",
          COALESCE(SUM(p."netSalary"), 0)::decimal(18,2) AS "totalNetSalary",
          COALESCE(SUM(p."grossSalary"), 0)::decimal(18,2) AS "totalGrossSalary"
        FROM "Payroll" p
        JOIN "Employee" e ON p."employeeId" = e.id
        WHERE 1=1
        ${branchCond}
        ${periodFilter}
      `;

      const byDepartment = await this.prisma.$queryRaw`
        SELECT
          d.id AS "departmentId",
          d.name AS "departmentName",
          COUNT(DISTINCT p."employeeId")::int AS "employeeCount",
          COALESCE(SUM(p."basicSalary"), 0)::decimal(18,2) AS "basicSalary",
          COALESCE(SUM(p."overtimePay"), 0)::decimal(18,2) AS "overtimePay",
          COALESCE(SUM(p."allowances"), 0)::decimal(18,2) AS "allowances",
          COALESCE(SUM(p."bonuses"), 0)::decimal(18,2) AS "bonuses",
          COALESCE(SUM(p."deductions"), 0)::decimal(18,2) AS "deductions",
          COALESCE(SUM(p."tax"), 0)::decimal(18,2) AS "tax",
          COALESCE(SUM(p."grossSalary"), 0)::decimal(18,2) AS "grossSalary",
          COALESCE(SUM(p."netSalary"), 0)::decimal(18,2) AS "netSalary"
        FROM "Payroll" p
        JOIN "Employee" e ON p."employeeId" = e.id
        JOIN "Department" d ON e."departmentId" = d.id
        WHERE 1=1
        ${branchCond}
        ${periodFilter}
        GROUP BY d.id, d.name
        ORDER BY "netSalary" DESC
      `;

      const byEmployee = await this.prisma.$queryRaw`
        SELECT
          e.id AS "employeeId",
          e.name AS "employeeName",
          e."employeeCode" AS "employeeCode",
          d.name AS "departmentName",
          p."basicSalary"::decimal(18,2) AS "basicSalary",
          p."overtimePay"::decimal(18,2) AS "overtimePay",
          p."allowances"::decimal(18,2) AS "allowances",
          p."bonuses"::decimal(18,2) AS "bonuses",
          p."deductions"::decimal(18,2) AS "deductions",
          p."tax"::decimal(18,2) AS "tax",
          p."grossSalary"::decimal(18,2) AS "grossSalary",
          p."netSalary"::decimal(18,2) AS "netSalary",
          p."paymentStatus" AS "paymentStatus"
        FROM "Payroll" p
        JOIN "Employee" e ON p."employeeId" = e.id
        JOIN "Department" d ON e."departmentId" = d.id
        WHERE 1=1
        ${branchCond}
        ${periodFilter}
        ORDER BY p."netSalary" DESC
      `;

      return {
        summary: (summary as any[])[0] || {},
        byDepartment: byDepartment || [],
        byEmployee: byEmployee || [],
      };
    } catch (error) {
      this.logger.error('Error in getPayrollSummary:', error);
      throw error;
    }
  }
}
