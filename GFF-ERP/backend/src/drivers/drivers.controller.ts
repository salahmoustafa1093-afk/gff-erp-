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
import { DriversService } from './drivers.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import { DriverStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BranchScope } from '../common/decorators/branch-scope.decorator';

@ApiTags('Drivers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post()
  @BranchScope()
  @ApiOperation({ summary: 'Create a new driver' })
  @ApiResponse({ status: 201, description: 'Driver created successfully' })
  @ApiResponse({ status: 409, description: 'License number already exists' })
  async create(
    @Body() dto: CreateDriverDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.create(dto, userId, branchId);
  }

  @Get()
  @BranchScope()
  @ApiOperation({ summary: 'List all drivers with filtering' })
  @ApiResponse({ status: 200, description: 'Drivers retrieved successfully' })
  async findAll(
    @Query() filter: DriverFilterDto,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.findAll(filter, branchId);
  }

  @Get('available')
  @BranchScope()
  @ApiOperation({ summary: 'Get available drivers for trip assignment' })
  @ApiResponse({ status: 200, description: 'Available drivers retrieved' })
  async getAvailableDrivers(@CurrentUser('branchId') branchId?: string) {
    return this.driversService.getAvailableDrivers(branchId);
  }

  @Get('alerts/license-expiry')
  @BranchScope()
  @ApiOperation({ summary: 'Get driver license expiry alerts' })
  @ApiResponse({ status: 200, description: 'License expiry alerts retrieved' })
  async getLicenseExpiryAlerts(@CurrentUser('branchId') branchId?: string) {
    return this.driversService.getLicenseExpiryAlerts(branchId);
  }

  @Get('leaderboard')
  @BranchScope()
  @ApiOperation({ summary: 'Get driver performance leaderboard' })
  @ApiResponse({ status: 200, description: 'Leaderboard retrieved' })
  async getLeaderboard(@CurrentUser('branchId') branchId?: string) {
    return this.driversService.getLeaderboard(branchId);
  }

  @Get(':id')
  @BranchScope()
  @ApiOperation({ summary: 'Get driver by ID' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver found' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.findOne(id, branchId);
  }

  @Get(':id/performance')
  @BranchScope()
  @ApiOperation({ summary: 'Get driver performance metrics' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved' })
  async getPerformance(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.getPerformanceMetrics(id, branchId);
  }

  @Get(':id/schedule')
  @BranchScope()
  @ApiOperation({ summary: 'Get driver schedule and availability' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver schedule retrieved' })
  async getSchedule(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.getDriverSchedule(id, branchId);
  }

  @Patch(':id')
  @BranchScope()
  @ApiOperation({ summary: 'Update a driver' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver updated' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDriverDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.update(id, dto, userId, branchId);
  }

  @Delete(':id')
  @BranchScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate a driver' })
  @ApiParam({ name: 'id', description: 'Driver ID' })
  @ApiResponse({ status: 200, description: 'Driver deactivated' })
  @ApiResponse({ status: 400, description: 'Driver has active trips' })
  @ApiResponse({ status: 404, description: 'Driver not found' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.driversService.remove(id, userId, branchId);
  }

  @Post('bulk-update-status')
  @BranchScope()
  @ApiOperation({ summary: 'Bulk update driver statuses' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: { type: 'array', items: { type: 'string' } },
        status: { type: 'string', enum: Object.values(DriverStatus) },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Statuses updated' })
  async bulkUpdateStatus(
    @Body('ids') ids: string[],
    @Body('status') status: DriverStatus,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('ids must be a non-empty array');
    }
    if (!Object.values(DriverStatus).includes(status)) {
      throw new BadRequestException('Invalid driver status');
    }
    return this.driversService.bulkUpdateStatus(ids, status, userId, branchId);
  }
}
