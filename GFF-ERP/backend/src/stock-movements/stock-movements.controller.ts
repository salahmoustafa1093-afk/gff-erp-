import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';
import { CreateStockMovementDto, MovementType } from './dto/create-stock-movement.dto';
import {
  CreateStockReservationDto,
  ReleaseReservationDto,
  FulfillReservationDto,
} from './dto/stock-reservation.dto';
import { StockTransferDto } from './dto/stock-transfer.dto';
import { StockAdjustmentDto, ApproveAdjustmentDto } from './dto/stock-adjustment.dto';
import {
  CreateInventoryCountDto,
  SubmitCountDto,
  ApproveCountDto,
} from './dto/inventory-count.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string };
}

@ApiTags('Stock Movements')
@Controller('stock-movements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}

  // === STOCK MOVEMENTS ===

  @Post()
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER')
  @ApiOperation({ summary: 'Record a stock movement' })
  @ApiResponse({ status: 201, description: 'Movement recorded' })
  create(@Body() dto: CreateStockMovementDto, @Req() req: RequestWithUser) {
    return this.stockMovementsService.createMovement(dto, req.user.branchId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get stock movements' })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'warehouseId', required: false })
  @ApiQuery({ name: 'type', required: false, enum: MovementType })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Movements list' })
  findAll(
    @Query('productId') productId?: string,
    @Query('warehouseId') warehouseId?: string,
    @Query('type') type?: MovementType,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Req() req?: RequestWithUser,
  ) {
    return this.stockMovementsService.findAll(
      {
        productId,
        warehouseId,
        type,
        fromDate: fromDate ? new Date(fromDate) : undefined,
        toDate: toDate ? new Date(toDate) : undefined,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
      },
      req!.user.branchId,
    );
  }

  @Get('product/:productId/history')
  @ApiOperation({ summary: 'Get stock movement history for a product' })
  @ApiResponse({ status: 200, description: 'Movement history' })
  getProductHistory(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Query('limit') limit?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.getProductHistory(
      productId,
      req.user.branchId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  // === STOCK RESERVATIONS ===

  @Post('reservations')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @ApiOperation({ summary: 'Create stock reservation for sales order' })
  @ApiResponse({ status: 201, description: 'Reservation created' })
  createReservation(@Body() dto: CreateStockReservationDto, @Req() req: RequestWithUser) {
    return this.stockMovementsService.createReservation(dto, req.user.branchId, req.user.id);
  }

  @Get('reservations')
  @ApiOperation({ summary: 'Get all stock reservations' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'productId', required: false })
  @ApiQuery({ name: 'salesOrderId', required: false })
  getReservations(
    @Query('status') status?: string,
    @Query('productId') productId?: string,
    @Query('salesOrderId') salesOrderId?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.getReservations(
      req.user.branchId,
      status,
      productId,
      salesOrderId,
    );
  }

  @Get('reservations/:id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  getReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.getReservation(id, req.user.branchId);
  }

  @Post('reservations/:id/release')
  @Roles('ADMIN', 'MANAGER', 'SALES')
  @ApiOperation({ summary: 'Release/cancel reservation' })
  @ApiResponse({ status: 200, description: 'Reservation released' })
  releaseReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReleaseReservationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.releaseReservation(id, dto, req.user.branchId, req.user.id);
  }

  @Post('reservations/:id/fulfill')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER')
  @ApiOperation({ summary: 'Fulfill reservation (convert to OUT movement)' })
  @ApiResponse({ status: 200, description: 'Reservation fulfilled' })
  fulfillReservation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: FulfillReservationDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.fulfillReservation(id, dto, req.user.branchId, req.user.id);
  }

  // === STOCK TRANSFERS ===

  @Post('transfers')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER')
  @ApiOperation({ summary: 'Execute stock transfer between warehouses' })
  @ApiResponse({ status: 201, description: 'Transfer completed' })
  executeTransfer(@Body() dto: StockTransferDto, @Req() req: RequestWithUser) {
    return this.stockMovementsService.executeTransfer(dto, req.user.branchId, req.user.id);
  }

  @Get('transfers')
  @ApiOperation({ summary: 'Get transfer history' })
  @ApiQuery({ name: 'fromWarehouseId', required: false })
  @ApiQuery({ name: 'toWarehouseId', required: false })
  getTransfers(
    @Query('fromWarehouseId') fromWarehouseId?: string,
    @Query('toWarehouseId') toWarehouseId?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.getTransfers(
      req.user.branchId,
      fromWarehouseId,
      toWarehouseId,
    );
  }

  // === STOCK ADJUSTMENTS ===

  @Post('adjustments')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create stock adjustment' })
  @ApiResponse({ status: 201, description: 'Adjustment created (pending approval)' })
  createAdjustment(@Body() dto: StockAdjustmentDto, @Req() req: RequestWithUser) {
    return this.stockMovementsService.createAdjustment(dto, req.user.branchId, req.user.id);
  }

  @Get('adjustments')
  @ApiOperation({ summary: 'Get stock adjustments' })
  @ApiQuery({ name: 'status', required: false })
  getAdjustments(
    @Query('status') status?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.getAdjustments(req.user.branchId, status);
  }

  @Post('adjustments/:id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approve or reject adjustment' })
  approveAdjustment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveAdjustmentDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.approveAdjustment(id, dto, req.user.branchId, req.user.id);
  }

  // === PHYSICAL / CYCLE COUNTS ===

  @Post('counts')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create count sheet' })
  @ApiResponse({ status: 201, description: 'Count sheet created' })
  createCount(@Body() dto: CreateInventoryCountDto, @Req() req: RequestWithUser) {
    return this.stockMovementsService.createCount(dto, req.user.branchId, req.user.id);
  }

  @Get('counts')
  @ApiOperation({ summary: 'Get all count sheets' })
  @ApiQuery({ name: 'status', required: false })
  getCounts(
    @Query('status') status?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.getCounts(req.user.branchId, status);
  }

  @Get('counts/:id')
  @ApiOperation({ summary: 'Get count sheet with items' })
  getCount(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.stockMovementsService.getCount(id, req.user.branchId);
  }

  @Post('counts/:id/submit')
  @Roles('ADMIN', 'MANAGER', 'WAREHOUSE_KEEPER')
  @ApiOperation({ summary: 'Submit count results' })
  @ApiResponse({ status: 200, description: 'Count submitted' })
  submitCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitCountDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.submitCount(id, dto, req.user.branchId, req.user.id);
  }

  @Post('counts/:id/approve')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Approve count and generate adjustments' })
  @ApiResponse({ status: 200, description: 'Count approved, adjustments generated' })
  approveCount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveCountDto,
    @Req() req: RequestWithUser,
  ) {
    return this.stockMovementsService.approveCount(id, dto, req.user.branchId, req.user.id);
  }

  @Get('counts/:id/variance-report')
  @ApiOperation({ summary: 'Get variance report for a count' })
  getVarianceReport(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.stockMovementsService.getVarianceReport(id, req.user.branchId);
  }
}
