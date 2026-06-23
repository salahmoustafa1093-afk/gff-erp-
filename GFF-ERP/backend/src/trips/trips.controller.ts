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
import { TripsService } from './trips.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import { TripReportFilterDto } from './dto/trip-report.dto';
import { AddStopDto, UpdateStopDto, CompleteStopDto } from './dto/add-stop.dto';
import { StartTripDto, CompleteTripDto, CancelTripDto } from './dto/complete-trip.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { BranchScope } from '../common/decorators/branch-scope.decorator';

@ApiTags('Trips')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  // ==================== CRUD ====================

  @Post()
  @BranchScope()
  @ApiOperation({ summary: 'Create a new trip with stops' })
  @ApiResponse({ status: 201, description: 'Trip created successfully' })
  @ApiResponse({ status: 400, description: 'Vehicle or driver not available' })
  async create(
    @Body() dto: CreateTripDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.create(dto, userId, branchId);
  }

  @Get()
  @BranchScope()
  @ApiOperation({ summary: 'List all trips with filtering' })
  @ApiResponse({ status: 200, description: 'Trips retrieved successfully' })
  async findAll(
    @Query() filter: TripFilterDto,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.findAll(filter, branchId);
  }

  @Get('schedule/upcoming')
  @BranchScope()
  @ApiOperation({ summary: 'Get upcoming trip schedule' })
  @ApiResponse({ status: 200, description: 'Upcoming trips retrieved' })
  async getUpcomingSchedule(@CurrentUser('branchId') branchId?: string) {
    return this.tripsService.getUpcomingSchedule(branchId);
  }

  @Get('dashboard/status-counts')
  @BranchScope()
  @ApiOperation({ summary: 'Get trip status counts for dashboard' })
  @ApiResponse({ status: 200, description: 'Status counts retrieved' })
  async getStatusCounts(@CurrentUser('branchId') branchId?: string) {
    return this.tripsService.getStatusCounts(branchId);
  }

  @Get('alerts/late-deliveries')
  @BranchScope()
  @ApiOperation({ summary: 'Get late delivery alerts' })
  @ApiResponse({ status: 200, description: 'Late delivery alerts retrieved' })
  async getLateDeliveryAlerts(@CurrentUser('branchId') branchId?: string) {
    return this.tripsService.getLateDeliveryAlerts(branchId);
  }

  @Get('reports/daily-summary')
  @BranchScope()
  @ApiOperation({ summary: 'Get daily trip summary' })
  @ApiQuery({ name: 'date', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Daily summary retrieved' })
  async getDailySummary(
    @Query('date') date?: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.getDailySummary(date, branchId);
  }

  @Get('reports/profitability')
  @BranchScope()
  @ApiOperation({ summary: 'Get trip profitability report' })
  @ApiResponse({ status: 200, description: 'Profitability report retrieved' })
  async getProfitabilityReport(
    @Query() filter: TripReportFilterDto,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.getProfitabilityReport(filter, branchId);
  }

  @Get(':id')
  @BranchScope()
  @ApiOperation({ summary: 'Get trip by ID' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip found' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.findOne(id, branchId);
  }

  @Get(':id/tracking')
  @BranchScope()
  @ApiOperation({ summary: 'Get delivery tracking for a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Tracking data retrieved' })
  async getDeliveryTracking(
    @Param('id') id: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.getDeliveryTracking(id, branchId);
  }

  @Patch(':id')
  @BranchScope()
  @ApiOperation({ summary: 'Update a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTripDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.update(id, dto, userId, branchId);
  }

  @Delete(':id')
  @BranchScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a scheduled trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip deleted' })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.remove(id, userId, branchId);
  }

  // ==================== LIFECYCLE ====================

  @Post(':id/start')
  @BranchScope()
  @ApiOperation({ summary: 'Start a trip (SCHEDULED → IN_PROGRESS)' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip started' })
  async startTrip(
    @Param('id') id: string,
    @Body() dto: StartTripDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.startTrip(id, dto, userId, branchId);
  }

  @Post(':id/complete')
  @BranchScope()
  @ApiOperation({ summary: 'Complete a trip (IN_PROGRESS → COMPLETED)' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip completed' })
  async completeTrip(
    @Param('id') id: string,
    @Body() dto: CompleteTripDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.completeTrip(id, dto, userId, branchId);
  }

  @Post(':id/cancel')
  @BranchScope()
  @ApiOperation({ summary: 'Cancel a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Trip cancelled' })
  async cancelTrip(
    @Param('id') id: string,
    @Body() dto: CancelTripDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.cancelTrip(id, dto, userId, branchId);
  }

  // ==================== STOP MANAGEMENT ====================

  @Post(':id/stops')
  @BranchScope()
  @ApiOperation({ summary: 'Add a stop to a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiResponse({ status: 201, description: 'Stop added' })
  async addStop(
    @Param('id') tripId: string,
    @Body() dto: AddStopDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.addStop(tripId, dto, userId, branchId);
  }

  @Patch(':id/stops/:stopId')
  @BranchScope()
  @ApiOperation({ summary: 'Update a stop' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiParam({ name: 'stopId', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop updated' })
  async updateStop(
    @Param('id') tripId: string,
    @Param('stopId') stopId: string,
    @Body() dto: UpdateStopDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.updateStop(tripId, stopId, dto, userId, branchId);
  }

  @Post(':id/stops/:stopId/complete')
  @BranchScope()
  @ApiOperation({ summary: 'Complete a stop with proof of delivery' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiParam({ name: 'stopId', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop completed' })
  async completeStop(
    @Param('id') tripId: string,
    @Param('stopId') stopId: string,
    @Body() dto: CompleteStopDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.completeStop(tripId, stopId, dto, userId, branchId);
  }

  @Delete(':id/stops/:stopId')
  @BranchScope()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a stop from a trip' })
  @ApiParam({ name: 'id', description: 'Trip ID' })
  @ApiParam({ name: 'stopId', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop removed' })
  async removeStop(
    @Param('id') tripId: string,
    @Param('stopId') stopId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('branchId') branchId?: string,
  ) {
    return this.tripsService.removeStop(tripId, stopId, userId, branchId);
  }
}
