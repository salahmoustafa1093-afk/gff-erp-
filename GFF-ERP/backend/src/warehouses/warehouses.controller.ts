import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WarehousesService } from './warehouses.service';
import { CreateWarehouseDto, WarehouseType } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';
import { WarehouseStockFilterDto } from './dto/warehouse-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string; role: string };
}

@ApiTags('Warehouses')
@Controller('warehouses')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new warehouse' })
  @ApiResponse({ status: 201, description: 'Warehouse created successfully' })
  @ApiResponse({ status: 409, description: 'Warehouse already exists' })
  create(@Body() dto: CreateWarehouseDto, @Req() req: RequestWithUser) {
    const branchId = dto.branchId ?? req.user.branchId;
    return this.warehousesService.create(dto, branchId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all warehouses' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiQuery({ name: 'type', required: false, enum: WarehouseType })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'List of warehouses' })
  findAll(
    @Query('includeInactive') includeInactive?: string,
    @Query('type') type?: WarehouseType,
    @Query('search') search?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.warehousesService.findAll(
      req.user.branchId,
      includeInactive === 'true',
      type,
      search,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get warehouse by ID' })
  @ApiResponse({ status: 200, description: 'Warehouse found' })
  @ApiResponse({ status: 404, description: 'Warehouse not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.warehousesService.findOne(id, req.user.branchId);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get warehouse inventory listing' })
  @ApiResponse({ status: 200, description: 'Warehouse stock listing' })
  getStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Query() filter: WarehouseStockFilterDto,
    @Req() req: RequestWithUser,
  ) {
    return this.warehousesService.getWarehouseStock(id, req.user.branchId, filter);
  }

  @Get(':id/capacity')
  @ApiOperation({ summary: 'Get warehouse capacity report' })
  @ApiResponse({ status: 200, description: 'Warehouse capacity information' })
  getCapacity(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.warehousesService.getCapacityReport(id, req.user.branchId);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get warehouse statistics' })
  @ApiResponse({ status: 200, description: 'Warehouse statistics' })
  getStats(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.warehousesService.getStatistics(id, req.user.branchId);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update warehouse' })
  @ApiResponse({ status: 200, description: 'Warehouse updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
    @Req() req: RequestWithUser,
  ) {
    return this.warehousesService.update(id, dto, req.user.branchId, req.user.id);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete warehouse' })
  @ApiResponse({ status: 204, description: 'Warehouse deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.warehousesService.remove(id, req.user.branchId, req.user.id);
  }
}
