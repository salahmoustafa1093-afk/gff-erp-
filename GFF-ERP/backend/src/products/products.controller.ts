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
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductFilterDto } from './dto/product-filter.dto';
import { ProductStockDto, UpdateStockSettingsDto } from './dto/product-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Request } from 'express';

interface RequestWithUser extends Request {
  user: { branchId: string; id: string };
}

@ApiTags('Products')
@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  @ApiResponse({ status: 409, description: 'Product SKU or barcode already exists' })
  create(@Body() dto: CreateProductDto, @Req() req: RequestWithUser) {
    return this.productsService.create(dto, req.user.branchId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with filtering' })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll(@Query() filter: ProductFilterDto, @Req() req: RequestWithUser) {
    return this.productsService.findAll(filter, req.user.branchId);
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get low stock products' })
  @ApiResponse({ status: 200, description: 'Products below reorder point' })
  getLowStock(
    @Query('warehouseId') warehouseId?: string,
    @Req() req: RequestWithUser,
  ) {
    return this.productsService.getLowStock(req.user.branchId, warehouseId);
  }

  @Get('stats/summary')
  @ApiOperation({ summary: 'Get product statistics summary' })
  @ApiResponse({ status: 200, description: 'Product statistics' })
  getStats(@Req() req: RequestWithUser) {
    return this.productsService.getStatistics(req.user.branchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.productsService.findOne(id, req.user.branchId);
  }

  @Get(':id/stock')
  @ApiOperation({ summary: 'Get product stock across warehouses' })
  @ApiResponse({ status: 200, description: 'Product stock levels' })
  getProductStock(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.productsService.getProductStock(id, req.user.branchId);
  }

  @Get(':id/cost-history')
  @ApiOperation({ summary: 'Get product cost history' })
  @ApiResponse({ status: 200, description: 'Cost history entries' })
  getCostHistory(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.productsService.getCostHistory(id, req.user.branchId);
  }

  @Get(':id/movements')
  @ApiOperation({ summary: 'Get product stock movements' })
  @ApiResponse({ status: 200, description: 'Stock movements' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getMovements(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: string,
    @Req() req?: RequestWithUser,
  ) {
    return this.productsService.getStockMovements(
      id,
      req!.user.branchId,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('barcode/:barcode')
  @ApiOperation({ summary: 'Find product by barcode' })
  @ApiResponse({ status: 200, description: 'Product found' })
  findByBarcode(@Param('barcode') barcode: string, @Req() req: RequestWithUser) {
    return this.productsService.findByBarcode(barcode, req.user.branchId);
  }

  @Post(':id/stock')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Initialize product stock in warehouse' })
  @ApiResponse({ status: 201, description: 'Stock initialized' })
  initializeStock(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ProductStockDto,
    @Req() req: RequestWithUser,
  ) {
    return this.productsService.initializeStock(id, dto, req.user.branchId, req.user.id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
    @Req() req: RequestWithUser,
  ) {
    return this.productsService.update(id, dto, req.user.branchId, req.user.id);
  }

  @Patch(':id/stock-settings/:warehouseId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update stock settings for product in warehouse' })
  updateStockSettings(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Body() dto: UpdateStockSettingsDto,
    @Req() req: RequestWithUser,
  ) {
    return this.productsService.updateStockSettings(
      id,
      warehouseId,
      dto,
      req.user.branchId,
      req.user.id,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete product' })
  @ApiResponse({ status: 204, description: 'Product deleted' })
  remove(@Param('id', ParseUUIDPipe) id: string, @Req() req: RequestWithUser) {
    return this.productsService.remove(id, req.user.branchId, req.user.id);
  }
}
