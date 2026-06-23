import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BranchScope } from '../common/decorators/branch-scope.decorator';

@ApiTags('Logistics Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Get('dashboard')
  @BranchScope()
  @ApiOperation({
    summary: 'Get complete logistics dashboard',
    description:
      'Returns KPIs, fleet summary, recent trips, critical alerts, driver status, weekly chart, and fuel trend',
  })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@CurrentUser('branchId') branchId?: string) {
    return this.logisticsService.getDashboard(branchId);
  }

  @Get('kpis')
  @BranchScope()
  @ApiOperation({ summary: 'Get logistics KPIs' })
  @ApiResponse({ status: 200, description: 'KPIs retrieved successfully' })
  async getKpis(@CurrentUser('branchId') branchId?: string) {
    return this.logisticsService.getKpis(branchId);
  }

  @Get('fleet-summary')
  @BranchScope()
  @ApiOperation({ summary: 'Get fleet summary statistics' })
  @ApiResponse({ status: 200, description: 'Fleet summary retrieved' })
  async getFleetSummary(@CurrentUser('branchId') branchId?: string) {
    return this.logisticsService.getFleetSummary(branchId);
  }

  @Get('reports/delivery-performance')
  @BranchScope()
  @ApiOperation({ summary: 'Get delivery performance report' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back (default: 30)' })
  @ApiResponse({ status: 200, description: 'Delivery performance report retrieved' })
  async getDeliveryPerformance(
    @Query('days') days?: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.logisticsService.getDeliveryPerformance(numDays, branchId);
  }

  @Get('reports/fuel-trend')
  @BranchScope()
  @ApiOperation({ summary: 'Get fuel consumption trend' })
  @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to look back (default: 7)' })
  @ApiResponse({ status: 200, description: 'Fuel trend retrieved' })
  async getFuelTrend(
    @Query('days') days?: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    const numDays = days ? parseInt(days, 10) : 7;
    return this.logisticsService.getFuelTrend(numDays, branchId);
  }

  @Get('reports/cost-breakdown')
  @BranchScope()
  @ApiOperation({ summary: 'Get cost breakdown analysis' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Cost breakdown retrieved' })
  async getCostBreakdown(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.logisticsService.getCostBreakdown(startDate, endDate, branchId);
  }
}
