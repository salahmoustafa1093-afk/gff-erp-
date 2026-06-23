import { Controller, Get, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';
import {
  MainKPIsQueryDto,
  SalesKPIsQueryDto,
  FinancialKPIsQueryDto,
  InventoryKPIsQueryDto,
  ProductionKPIsQueryDto,
  WarehouseKPIsQueryDto,
  BranchKPIsQueryDto,
  PoultryKPIsQueryDto,
  LogisticsKPIsQueryDto,
} from './dto/dashboard-query.dto';

@ApiTags('Dashboards')
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all dashboard KPIs at once' })
  @ApiResponse({ status: 200, description: 'All KPIs returned successfully' })
  async getAllKPIs(@Query('branchId') branchId?: number) {
    return this.dashboardsService.getAllKPIs(branchId);
  }

  @Get('main')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get main overview KPIs (today sales, active orders, low stock)' })
  @ApiResponse({ status: 200, description: 'Main KPIs returned successfully' })
  async getMainKPIs(@Query() dto: MainKPIsQueryDto) {
    return this.dashboardsService.getMainKPIs(dto.branchId);
  }

  @Get('sales')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sales KPIs (total sales, AOV, growth, top products/customers)' })
  @ApiResponse({ status: 200, description: 'Sales KPIs returned successfully' })
  async getSalesKPIs(@Query() dto: SalesKPIsQueryDto) {
    return this.dashboardsService.getSalesKPIs(dto.branchId, dto.dateFrom, dto.dateTo);
  }

  @Get('financial')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get financial KPIs (cash, bank, AR, AP, net position)' })
  @ApiResponse({ status: 200, description: 'Financial KPIs returned successfully' })
  async getFinancialKPIs(@Query() dto: FinancialKPIsQueryDto) {
    return this.dashboardsService.getFinancialKPIs(dto.branchId);
  }

  @Get('inventory')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get inventory KPIs (total value, SKUs, low stock, out of stock)' })
  @ApiResponse({ status: 200, description: 'Inventory KPIs returned successfully' })
  async getInventoryKPIs(@Query() dto: InventoryKPIsQueryDto) {
    return this.dashboardsService.getInventoryKPIs(dto.branchId, dto.warehouseId);
  }

  @Get('production')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get production KPIs (active orders, yield, costs)' })
  @ApiResponse({ status: 200, description: 'Production KPIs returned successfully' })
  async getProductionKPIs(@Query() dto: ProductionKPIsQueryDto) {
    return this.dashboardsService.getProductionKPIs(dto.branchId);
  }

  @Get('warehouse')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get warehouse KPIs (items, transfers pending)' })
  @ApiResponse({ status: 200, description: 'Warehouse KPIs returned successfully' })
  async getWarehouseKPIs(@Query() dto: WarehouseKPIsQueryDto) {
    return this.dashboardsService.getWarehouseKPIs(dto.branchId, dto.warehouseId);
  }

  @Get('branch')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get branch KPIs (employees, customers, sales, expenses, profit)' })
  @ApiResponse({ status: 200, description: 'Branch KPIs returned successfully' })
  async getBranchKPIs(@Query() dto: BranchKPIsQueryDto) {
    return this.dashboardsService.getBranchKPIs(dto.branchId);
  }

  @Get('poultry')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get poultry KPIs (chicks, mortality, egg production)' })
  @ApiResponse({ status: 200, description: 'Poultry KPIs returned successfully' })
  async getPoultryKPIs(@Query() dto: PoultryKPIsQueryDto) {
    return this.dashboardsService.getPoultryKPIs(dto.branchId);
  }

  @Get('logistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get logistics KPIs (trips, fuel, maintenance alerts)' })
  @ApiResponse({ status: 200, description: 'Logistics KPIs returned successfully' })
  async getLogisticsKPIs(@Query() dto: LogisticsKPIsQueryDto) {
    return this.dashboardsService.getLogisticsKPIs(dto.branchId);
  }
}
