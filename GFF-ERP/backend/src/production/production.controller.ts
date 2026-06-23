import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ProductionService } from './production.service';
import {
  CreateProductionPlanDto,
  UpdateProductionPlanDto,
  ProductionPlanFilterDto,
} from './dto/production-plan.dto';
import {
  ProductionKpiFilterDto,
  TargetAnalysisFilterDto,
  CapacityPlanningFilterDto,
} from './dto/production-kpi.dto';
import { PlanningPeriod, ProductionPlanStatus } from './interfaces/production.interface';

@ApiTags('Production')
@ApiBearerAuth()
@Controller('production')
export class ProductionController {
  constructor(private readonly service: ProductionService) {}

  // ─── Production Plans ───

  @Post('plans')
  @ApiOperation({ summary: 'Create a production plan' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  async createPlan(@Body() dto: CreateProductionPlanDto, @Request() req) {
    const data = await this.service.createPlan(dto, req.user.id);
    return { success: true, data };
  }

  @Get('plans')
  @ApiOperation({ summary: 'List production plans' })
  async findAllPlans(@Query() filter: ProductionPlanFilterDto) {
    const result = await this.service.findAllPlans(filter);
    return { success: true, ...result };
  }

  @Get('plans/:id')
  @ApiOperation({ summary: 'Get production plan by ID' })
  @ApiParam({ name: 'id' })
  async findPlanById(@Param('id') id: string) {
    const data = await this.service.findPlanById(id);
    return { success: true, data };
  }

  @Patch('plans/:id')
  @ApiOperation({ summary: 'Update production plan' })
  @ApiParam({ name: 'id' })
  async updatePlan(
    @Param('id') id: string,
    @Body() dto: UpdateProductionPlanDto,
    @Request() req,
  ) {
    const data = await this.service.updatePlan(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete production plan' })
  @ApiParam({ name: 'id' })
  async deletePlan(@Param('id') id: string, @Request() req) {
    await this.service.deletePlan(id, req.user.id);
  }

  @Post('plans/:id/approve')
  @ApiOperation({ summary: 'Approve a production plan' })
  @ApiParam({ name: 'id' })
  async approvePlan(@Param('id') id: string, @Request() req) {
    const data = await this.service.approvePlan(id, req.user.id);
    return { success: true, data };
  }

  // ─── References ───

  @Get('periods')
  @ApiOperation({ summary: 'Get available planning periods' })
  getPeriods() {
    return { success: true, data: Object.values(PlanningPeriod) };
  }

  @Get('plan-statuses')
  @ApiOperation({ summary: 'Get available plan statuses' })
  getPlanStatuses() {
    return { success: true, data: Object.values(ProductionPlanStatus) };
  }

  // ─── KPIs & Reports ───

  @Get('dashboard/kpis')
  @ApiOperation({ summary: 'Get production KPIs dashboard' })
  async getKpis(@Query() filter: ProductionKpiFilterDto) {
    const data = await this.service.getKpis(filter);
    return { success: true, data };
  }

  @Get('reports/target-analysis')
  @ApiOperation({ summary: 'Get production vs target analysis' })
  async getTargetAnalysis(@Query() filter: TargetAnalysisFilterDto) {
    const data = await this.service.getTargetAnalysis(filter);
    return { success: true, data };
  }

  @Get('reports/capacity')
  @ApiOperation({ summary: 'Get capacity planning report' })
  async getCapacityPlanning(@Query() filter: CapacityPlanningFilterDto) {
    const data = await this.service.getCapacityPlanning(filter);
    return { success: true, data };
  }

  @Get('reports/efficiency')
  @ApiOperation({ summary: 'Get efficiency metrics' })
  async getEfficiencyMetrics(@Query('branchId') branchId?: string) {
    const data = await this.service.getEfficiencyMetrics(branchId);
    return { success: true, data };
  }
}
