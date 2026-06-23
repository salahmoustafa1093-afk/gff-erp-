import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import {
  DailySalesFilterDto,
  MonthlySalesFilterDto,
  YearlySalesFilterDto,
  SalesByProductFilterDto,
  SalesByCustomerFilterDto,
  SalesBySalesRepFilterDto,
  BranchPerformanceFilterDto,
  SalesTrendsFilterDto,
} from './dto/sales-report.dto';
import {
  PurchaseSummaryFilterDto,
  PurchasesBySupplierFilterDto,
  PurchasesByProductFilterDto,
} from './dto/purchase-report.dto';
import {
  InventoryValuationFilterDto,
  InventoryAgingFilterDto,
  StockLevelsFilterDto,
  StockMovementFilterDto,
} from './dto/inventory-report.dto';
import {
  GeneralLedgerFilterDto,
  TrialBalanceFilterDto,
  BalanceSheetFilterDto,
  IncomeStatementFilterDto,
  CashFlowFilterDto,
  CustomerStatementFilterDto,
  SupplierStatementFilterDto,
  ProfitabilityAnalysisFilterDto,
  CostCenterReportFilterDto,
} from './dto/financial-report.dto';

@ApiTags('Reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // ═══════════════════════════════════════════════════════════════
  //  SALES REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('sales/daily')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiResponse({ status: 200, description: 'Daily sales data returned successfully' })
  async getDailySales(@Query() dto: DailySalesFilterDto) {
    return this.reportsService.getDailySales(dto.branchId, dto.date);
  }

  @Get('sales/monthly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get monthly sales report with daily breakdown' })
  @ApiResponse({ status: 200, description: 'Monthly sales data returned successfully' })
  async getMonthlySales(@Query() dto: MonthlySalesFilterDto) {
    return this.reportsService.getMonthlySales(dto.branchId, dto.year, dto.month);
  }

  @Get('sales/yearly')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get yearly sales report with monthly breakdown' })
  @ApiResponse({ status: 200, description: 'Yearly sales data returned successfully' })
  async getYearlySales(@Query() dto: YearlySalesFilterDto) {
    return this.reportsService.getYearlySales(dto.branchId, dto.year);
  }

  @Get('sales/by-product')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sales grouped by product' })
  @ApiResponse({ status: 200, description: 'Sales by product returned successfully' })
  async getSalesByProduct(@Query() dto: SalesByProductFilterDto) {
    return this.reportsService.getSalesByProduct(dto.branchId, dto.dateFrom, dto.dateTo, dto.limit);
  }

  @Get('sales/by-customer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sales grouped by customer' })
  @ApiResponse({ status: 200, description: 'Sales by customer returned successfully' })
  async getSalesByCustomer(@Query() dto: SalesByCustomerFilterDto) {
    return this.reportsService.getSalesByCustomer(dto.branchId, dto.dateFrom, dto.dateTo, dto.limit);
  }

  @Get('sales/by-sales-rep')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sales performance by sales representative' })
  @ApiResponse({ status: 200, description: 'Sales by sales rep returned successfully' })
  async getSalesBySalesRep(@Query() dto: SalesBySalesRepFilterDto) {
    return this.reportsService.getSalesBySalesRep(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('sales/branch-performance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compare branch sales performance' })
  @ApiResponse({ status: 200, description: 'Branch performance data returned successfully' })
  async getBranchPerformance(@Query() dto: BranchPerformanceFilterDto) {
    return this.reportsService.getBranchPerformance(dto.dateFrom, dto.dateTo);
  }

  @Get('sales/trends')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sales trends over time' })
  @ApiResponse({ status: 200, description: 'Sales trends returned successfully' })
  async getSalesTrends(@Query() dto: SalesTrendsFilterDto) {
    return this.reportsService.getSalesTrends(dto.dateFrom, dto.dateTo, dto.branchId, dto.groupBy);
  }

  // ═══════════════════════════════════════════════════════════════
  //  PURCHASE REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('purchases/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get purchase summary report' })
  @ApiResponse({ status: 200, description: 'Purchase summary returned successfully' })
  async getPurchaseSummary(@Query() dto: PurchaseSummaryFilterDto) {
    return this.reportsService.getPurchaseSummary(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('purchases/by-supplier')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get purchases grouped by supplier' })
  @ApiResponse({ status: 200, description: 'Purchases by supplier returned successfully' })
  async getPurchasesBySupplier(@Query() dto: PurchasesBySupplierFilterDto) {
    return this.reportsService.getPurchasesBySupplier(dto.branchId, dto.dateFrom, dto.dateTo, dto.limit);
  }

  @Get('purchases/by-product')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get purchases grouped by product' })
  @ApiResponse({ status: 200, description: 'Purchases by product returned successfully' })
  async getPurchasesByProduct(@Query() dto: PurchasesByProductFilterDto) {
    return this.reportsService.getPurchasesByProduct(dto.branchId, dto.dateFrom, dto.dateTo, dto.limit);
  }

  // ═══════════════════════════════════════════════════════════════
  //  INVENTORY REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('inventory/valuation')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current inventory valuation' })
  @ApiResponse({ status: 200, description: 'Inventory valuation returned successfully' })
  async getInventoryValuation(@Query() dto: InventoryValuationFilterDto) {
    return this.reportsService.getInventoryValuation(dto.branchId, dto.warehouseId);
  }

  @Get('inventory/aging')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get inventory aging report' })
  @ApiResponse({ status: 200, description: 'Inventory aging returned successfully' })
  async getInventoryAging(@Query() dto: InventoryAgingFilterDto) {
    return this.reportsService.getInventoryAging(dto.branchId);
  }

  @Get('inventory/stock-levels')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get current stock levels with reorder alerts' })
  @ApiResponse({ status: 200, description: 'Stock levels returned successfully' })
  async getStockLevels(@Query() dto: StockLevelsFilterDto) {
    return this.reportsService.getStockLevels(dto.branchId, dto.warehouseId, dto.lowStockOnly);
  }

  @Get('inventory/stock-movement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get stock movement summary' })
  @ApiResponse({ status: 200, description: 'Stock movement summary returned successfully' })
  async getStockMovementSummary(@Query() dto: StockMovementFilterDto) {
    return this.reportsService.getStockMovementSummary(dto.branchId, dto.dateFrom, dto.dateTo, dto.warehouseId);
  }

  // ═══════════════════════════════════════════════════════════════
  //  FINANCIAL REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('financial/general-ledger')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get general ledger report' })
  @ApiResponse({ status: 200, description: 'General ledger returned successfully' })
  async getGeneralLedger(@Query() dto: GeneralLedgerFilterDto) {
    return this.reportsService.getGeneralLedger(dto.branchId, dto.dateFrom, dto.dateTo, dto.accountId);
  }

  @Get('financial/trial-balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trial balance report' })
  @ApiResponse({ status: 200, description: 'Trial balance returned successfully' })
  async getTrialBalance(@Query() dto: TrialBalanceFilterDto) {
    return this.reportsService.getTrialBalance(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('financial/balance-sheet')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get balance sheet' })
  @ApiResponse({ status: 200, description: 'Balance sheet returned successfully' })
  async getBalanceSheet(@Query() dto: BalanceSheetFilterDto) {
    return this.reportsService.getBalanceSheet(dto.branchId, dto.asOfDate);
  }

  @Get('financial/income-statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get income statement' })
  @ApiResponse({ status: 200, description: 'Income statement returned successfully' })
  async getIncomeStatement(@Query() dto: IncomeStatementFilterDto) {
    return this.reportsService.getIncomeStatement(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('financial/cash-flow')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cash flow statement' })
  @ApiResponse({ status: 200, description: 'Cash flow returned successfully' })
  async getCashFlow(@Query() dto: CashFlowFilterDto) {
    return this.reportsService.getCashFlow(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('financial/customer-statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get customer statement' })
  @ApiResponse({ status: 200, description: 'Customer statement returned successfully' })
  async getCustomerStatement(@Query() dto: CustomerStatementFilterDto) {
    return this.reportsService.getCustomerStatement(dto.customerId, dto.dateFrom, dto.dateTo, dto.branchId);
  }

  @Get('financial/supplier-statement')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get supplier statement' })
  @ApiResponse({ status: 200, description: 'Supplier statement returned successfully' })
  async getSupplierStatement(@Query() dto: SupplierStatementFilterDto) {
    return this.reportsService.getSupplierStatement(dto.supplierId, dto.dateFrom, dto.dateTo);
  }

  @Get('financial/profitability-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get profitability analysis' })
  @ApiResponse({ status: 200, description: 'Profitability analysis returned successfully' })
  async getProfitabilityAnalysis(@Query() dto: ProfitabilityAnalysisFilterDto) {
    return this.reportsService.getProfitabilityAnalysis(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('financial/cost-center')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get cost center expense report' })
  @ApiResponse({ status: 200, description: 'Cost center report returned successfully' })
  async getCostCenterReport(@Query() dto: CostCenterReportFilterDto) {
    return this.reportsService.getCostCenterReport(dto.costCenterId, dto.dateFrom, dto.dateTo);
  }

  // ═══════════════════════════════════════════════════════════════
  //  PRODUCTION REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('production/summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get manufacturing production report' })
  @ApiResponse({ status: 200, description: 'Production report returned successfully' })
  async getProductionReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getProductionReport(branchId, dateFrom, dateTo);
  }

  @Get('production/feed-costs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get feed production cost report' })
  @ApiResponse({ status: 200, description: 'Feed cost report returned successfully' })
  async getFeedCostReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getFeedCostReport(branchId, dateFrom, dateTo);
  }

  @Get('production/yield-analysis')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get manufacturing yield analysis' })
  @ApiResponse({ status: 200, description: 'Yield analysis returned successfully' })
  async getYieldAnalysis(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getYieldAnalysis(branchId, dateFrom, dateTo);
  }

  // ═══════════════════════════════════════════════════════════════
  //  POULTRY REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('poultry/chicks')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active chicks batches report' })
  @ApiResponse({ status: 200, description: 'Chicks report returned successfully' })
  async getChicksReport(@Query('branchId') branchId?: number) {
    return this.reportsService.getChicksReport(branchId);
  }

  @Get('poultry/mortality')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get mortality trends report' })
  @ApiResponse({ status: 200, description: 'Mortality report returned successfully' })
  async getMortalityReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getMortalityReport(branchId, dateFrom, dateTo);
  }

  @Get('poultry/egg-production')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get egg production report' })
  @ApiResponse({ status: 200, description: 'Egg production report returned successfully' })
  async getEggProductionReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getEggProductionReport(branchId, dateFrom, dateTo);
  }

  @Get('poultry/egg-sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get egg sales and revenue report' })
  @ApiResponse({ status: 200, description: 'Egg sales report returned successfully' })
  async getEggSalesReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getEggSalesReport(branchId, dateFrom, dateTo);
  }

  // ═══════════════════════════════════════════════════════════════
  //  LOGISTICS REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('logistics/drivers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get driver performance report' })
  @ApiResponse({ status: 200, description: 'Driver report returned successfully' })
  async getDriverReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getDriverReport(branchId, dateFrom, dateTo);
  }

  @Get('logistics/vehicles')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get vehicle utilization report' })
  @ApiResponse({ status: 200, description: 'Vehicle report returned successfully' })
  async getVehicleReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getVehicleReport(branchId, dateFrom, dateTo);
  }

  @Get('logistics/trip-costs')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get trip costs and profitability' })
  @ApiResponse({ status: 200, description: 'Trip cost report returned successfully' })
  async getTripCostReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getTripCostReport(branchId, dateFrom, dateTo);
  }

  @Get('logistics/fuel-consumption')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get fuel consumption trends' })
  @ApiResponse({ status: 200, description: 'Fuel consumption report returned successfully' })
  async getFuelConsumptionReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getFuelConsumptionReport(branchId, dateFrom, dateTo);
  }

  // ═══════════════════════════════════════════════════════════════
  //  HR REPORTS
  // ═══════════════════════════════════════════════════════════════

  @Get('hr/attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get attendance summary report' })
  @ApiResponse({ status: 200, description: 'Attendance report returned successfully' })
  async getAttendanceReport(
    @Query('branchId') branchId?: number,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.getAttendanceReport(branchId, dateFrom, dateTo);
  }

  @Get('hr/payroll-summary')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get payroll summary by department' })
  @ApiResponse({ status: 200, description: 'Payroll summary returned successfully' })
  async getPayrollSummary(
    @Query('branchId') branchId?: number,
    @Query('payrollPeriodId') payrollPeriodId?: number,
  ) {
    return this.reportsService.getPayrollSummary(branchId, payrollPeriodId);
  }
}
