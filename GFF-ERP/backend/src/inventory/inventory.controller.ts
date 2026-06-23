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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { InventoryFilterDto, StockStatus } from './dto/inventory-filter.dto';
import { InventoryValuationDto } from './dto/inventory-valuation.dto';
import { StockLevelDto } from './dto/stock-level.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string };
}

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @ApiOperation({ summary: 'Get inventory listing with product details' })
  @ApiResponse({ status: 200, description: 'Inventory list' })
  findAll(@Query() filter: InventoryFilterDto, @Req() req: RequestWithUser) {
    return this.inventoryService.findAll(filter, req.user.branchId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get items below reorder point' })
  @ApiResponse({ status: 200, description: 'Low stock items' })
  getLowStock(
    @Query('warehouseId') warehouseId?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.inventoryService.getLowStock(req.user.branchId, warehouseId);
  }

  @Get('out-of-stock')
  @ApiOperation({ summary: 'Get out of stock items' })
  @ApiResponse({ status: 200, description: 'Out of stock items' })
  getOutOfStock(
    @Query('warehouseId') warehouseId?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.inventoryService.getOutOfStock(req.user.branchId, warehouseId);
  }

  @Get('valuation')
  @ApiOperation({ summary: 'Get inventory valuation report' })
  @ApiResponse({ status: 200, description: 'Valuation report' })
  getValuation(@Query() dto: InventoryValuationDto, @Req() req: RequestWithUser) {
    return this.inventoryService.getValuation(dto, req.user.branchId);
  }

  @Get('aging')
  @ApiOperation({ summary: 'Get inventory aging report' })
  @ApiResponse({ status: 200, description: 'Aging report' })
  getAgingReport(
    @Query('warehouseId') warehouseId?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.inventoryService.getAgingReport(req.user.branchId, warehouseId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get inventory summary statistics' })
  @ApiResponse({ status: 200, description: 'Summary statistics' })
  getSummary(@Req() req: RequestWithUser) {
    return this.inventoryService.getSummary(req.user.branchId);
  }

  @Get('by-warehouse')
  @ApiOperation({ summary: 'Get inventory grouped by warehouse' })
  @ApiResponse({ status: 200, description: 'Inventory by warehouse' })
  getByWarehouse(@Req() req: RequestWithUser) {
    return this.inventoryService.getByWarehouse(req.user.branchId);
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Get inventory grouped by category' })
  @ApiResponse({ status: 200, description: 'Inventory by category' })
  getByCategory(@Req() req: RequestWithUser) {
    return this.inventoryService.getByCategory(req.user.branchId);
  }

  @Get('reserved')
  @ApiOperation({ summary: 'Get reserved stock overview' })
  @ApiResponse({ status: 200, description: 'Reserved stock' })
  getReservedStock(@Req() req: RequestWithUser) {
    return this.inventoryService.getReservedStock(req.user.branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get inventory item by ID' })
  @ApiResponse({ status: 200, description: 'Inventory item found' })
  @ApiResponse({ status: 404, description: 'Inventory item not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.inventoryService.findOne(id, req.user.branchId);
  }

  @Get('product/:productId')
  @ApiOperation({ summary: 'Get inventory for a product' })
  @ApiResponse({ status: 200, description: 'Product inventory' })
  getByProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.inventoryService.getByProduct(productId, req.user.branchId);
  }

  @Get(':id/fifo-layers')
  @ApiOperation({ summary: 'Get FIFO cost layers for inventory item' })
  @ApiResponse({ status: 200, description: 'FIFO layers' })
  getFIFOLayers(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.inventoryService.getFIFOLayers(id, req.user.branchId);
  }

  @Patch(':id/stock-levels')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update stock level settings' })
  @ApiResponse({ status: 200, description: 'Stock levels updated' })
  updateStockLevels(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: StockLevelDto,
    @Req() req: RequestWithUser,
  ) {
    return this.inventoryService.updateStockLevels(id, dto, req.user.branchId, req.user.id);
  }

  @Post('recalculate-average')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Recalculate weighted average costs' })
  @ApiResponse({ status: 200, description: 'Average costs recalculated' })
  recalculateAverages(@Req() req: RequestWithUser) {
    return this.inventoryService.recalculateAllWeightedAverages(req.user.branchId, req.user.id);
  }
}
