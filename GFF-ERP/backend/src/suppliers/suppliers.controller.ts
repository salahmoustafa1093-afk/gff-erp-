import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { SupplierFilterDto } from './dto/supplier-filter.dto';
import { SupplierStatementDto } from './dto/supplier-statement.dto';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly service: SuppliersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new supplier' })
  create(@Body() dto: CreateSupplierDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List suppliers with filters' })
  findAll(@Query() filter: SupplierFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search suppliers' })
  @ApiQuery({ name: 'q', required: true })
  search(@Query('q') q: string, @Query('branchId') branchId?: string) {
    return this.service.search(q, branchId);
  }

  @Get('top-suppliers')
  @ApiOperation({ summary: 'Get top suppliers' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  topSuppliers(@Query('branchId') branchId?: string, @Query('limit') limit?: string) {
    return this.service.getTopSuppliers(branchId, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get supplier by ID' })
  @ApiParam({ name: 'id', description: 'Supplier ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update supplier' })
  update(@Param('id') id: string, @Body() dto: UpdateSupplierDto, @Req() req) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete supplier' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user?.id);
  }

  @Post('statement')
  @ApiOperation({ summary: 'Get supplier statement' })
  getStatement(@Body() dto: SupplierStatementDto) {
    return this.service.getStatement(dto);
  }

  @Patch(':id/rating')
  @ApiOperation({ summary: 'Update supplier rating' })
  @ApiParam({ name: 'id' })
  updateRating(@Param('id') id: string, @Body('rating') rating: number, @Req() req) {
    return this.service.updateRating(id, rating, req.user?.id);
  }
}
