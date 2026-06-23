import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { UpdateSalesOrderDto } from './dto/update-sales-order.dto';
import { SalesFilterDto } from './dto/sales-filter.dto';
import { SalesReportDto } from './dto/sales-report.dto';
import { ApproveSalesDto } from './dto/approve-sales.dto';
import { SalesOrderStatus } from '@prisma/client';

@ApiTags('Sales Orders')
@ApiBearerAuth()
@Controller('sales')
export class SalesController {
  constructor(private readonly service: SalesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new sales order' })
  @ApiResponse({ status: 201, description: 'Sales order created' })
  create(@Body() dto: CreateSalesOrderDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List sales orders with filters' })
  findAll(@Query() filter: SalesFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('reports/summary')
  @ApiOperation({ summary: 'Get sales summary report' })
  getSalesReport(@Query() filter: SalesReportDto) {
    return this.service.getSalesReport(filter);
  }

  @Get('reports/by-product')
  @ApiOperation({ summary: 'Get sales grouped by product' })
  getSalesByProduct(@Query() filter: SalesReportDto) {
    return this.service.getSalesByProduct(filter);
  }

  @Get('reports/by-customer')
  @ApiOperation({ summary: 'Get sales grouped by customer' })
  getSalesByCustomer(@Query() filter: SalesReportDto) {
    return this.service.getSalesByCustomer(filter);
  }

  @Get('reports/by-sales-rep')
  @ApiOperation({ summary: 'Get sales grouped by sales representative' })
  getSalesBySalesRep(@Query() filter: SalesReportDto) {
    return this.service.getSalesBySalesRep(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales order by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update sales order (DRAFT only)' })
  update(@Param('id') id: string, @Body() dto: UpdateSalesOrderDto, @Req() req) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Post(':id/status/:status')
  @ApiOperation({ summary: 'Transition order status' })
  @ApiParam({ name: 'id', description: 'Order ID' })
  @ApiParam({ name: 'status', enum: SalesOrderStatus })
  transitionStatus(
    @Param('id') id: string,
    @Param('status', new ParseEnumPipe(SalesOrderStatus)) status: SalesOrderStatus,
    @Req() req,
  ) {
    return this.service.transitionStatus(id, status, req.user?.id);
  }

  @Post(':id/submit-approval')
  @ApiOperation({ summary: 'Submit order for approval' })
  requestApproval(@Param('id') id: string, @Req() req) {
    return this.service.requestApproval(id, req.user?.id);
  }

  @Post(':id/process-approval')
  @ApiOperation({ summary: 'Approve or reject order' })
  processApproval(@Param('id') id: string, @Body() dto: ApproveSalesDto, @Req() req) {
    return this.service.processApproval(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete sales order' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user?.id);
  }
}
