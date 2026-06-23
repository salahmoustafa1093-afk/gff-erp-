import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleFilterDto } from './dto/vehicle-filter.dto';
import { VehicleReportFilterDto } from './dto/vehicle-report.dto';
import { VehicleStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BranchScope } from '../common/decorators/branch-scope.decorator';

@ApiTags('Vehicles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @BranchScope()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle created successfully' })
  @ApiResponse({ status: 409, description: 'Vehicle code or license plate already exists' })
  async create(
    @Body() dto: CreateVehicleDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.create(dto, userId, branchId);
  }

  @Get()
  @BranchScope()
  @ApiOperation({ summary: 'List all vehicles with filtering' })
  @ApiResponse({ status: 200, description: 'Vehicles retrieved successfully' })
  async findAll(
    @Query() filter: VehicleFilterDto,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.findAll(filter, branchId);
  }

  @Get('available')
  @BranchScope()
  @ApiOperation({ summary: 'Get available vehicles (ACTIVE, not on a trip)' })
  @ApiResponse({ status: 200, description: 'Available vehicles retrieved' })
  async getAvailableVehicles(@CurrentUser('branchId') branchId?: string) {
    return this.vehiclesService.getAvailableVehicles(branchId);
  }

  @Get('alerts/maintenance')
  @BranchScope()
  @ApiOperation({ summary: 'Get maintenance alerts for all vehicles' })
  @ApiResponse({ status: 200, description: 'Maintenance alerts retrieved' })
  async getMaintenanceAlerts(@CurrentUser('branchId') branchId?: string) {
    return this.vehiclesService.getMaintenanceAlerts(branchId);
  }

  @Get('schedule/maintenance')
  @BranchScope()
  @ApiOperation({ summary: 'Get maintenance schedule for all vehicles' })
  @ApiResponse({ status: 200, description: 'Maintenance schedule retrieved' })
  async getMaintenanceSchedule(@CurrentUser('branchId') branchId?: string) {
    return this.vehiclesService.getMaintenanceSchedule(branchId);
  }

  @Get('reports/utilization')
  @BranchScope()
  @ApiOperation({ summary: 'Get vehicle utilization report' })
  @ApiResponse({ status: 200, description: 'Utilization report retrieved' })
  async getUtilizationReport(
    @Query() filter: VehicleReportFilterDto,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.getVehicleUtilization(filter, branchId);
  }

  @Get('reports/fuel-consumption')
  @BranchScope()
  @ApiOperation({ summary: 'Get fuel consumption report' })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Fuel consumption report retrieved' })
  async getFuelConsumptionReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.getFuelConsumptionReport(startDate, endDate, branchId);
  }

  @Get('reports/cost-summary')
  @BranchScope()
  @ApiOperation({ summary: 'Get vehicle cost summary' })
  @ApiResponse({ status: 200, description: 'Cost summary retrieved' })
  async getCostSummary(@CurrentUser('branchId') branchId?: string) {
    return this.vehiclesService.getVehicleCostSummary(branchId);
  }

  @Get(':id')
  @BranchScope()
  @ApiOperation({ summary: 'Get vehicle by ID' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle found' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.findOne(id, branchId);
  }

  @Get(':id/performance')
  @BranchScope()
  @ApiOperation({ summary: 'Get vehicle performance metrics' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  async getPerformance(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.getVehiclePerformance(id, branchId);
  }

  @Patch(':id')
  @BranchScope()
  @ApiOperation({ summary: 'Update a vehicle' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.update(id, dto, userId, branchId);
  }

  @Delete(':id')
  @BranchScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retire a vehicle (soft delete)' })
  @ApiParam({ name: 'id', description: 'Vehicle ID' })
  @ApiResponse({ status: 200, description: 'Vehicle retired' })
  @ApiResponse({ status: 400, description: 'Vehicle has active trips' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.vehiclesService.remove(id, userId, branchId);
  }

  @Post('bulk-update-status')
  @BranchScope()
  @ApiOperation({ summary: 'Bulk update vehicle statuses' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: Object.values(VehicleStatus) },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Statuses updated' })
  async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: VehicleStatus,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids must be a non-empty array');
    }
    if (!Object.values(VehicleStatus).includes(status)) {
      throw new BadRequestException('Invalid vehicle status');
    }
    return this.vehiclesService.bulkUpdateStatus(ids, status, userId, branchId);
  }
}
