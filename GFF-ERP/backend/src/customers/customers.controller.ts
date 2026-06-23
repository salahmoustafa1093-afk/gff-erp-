import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags,
} from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerFilterDto } from './dto/customer-filter.dto';
import { CustomerStatementDto } from './dto/customer-statement.dto';

@ApiTags('Customers')
@ApiBearerAuth()
@Controller('customers')
export class CustomersController {
  constructor(private readonly service: CustomersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created' })
  create(@Body() dto: CreateCustomerDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List customers with filters' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'customerType', required: false, enum: ['INDIVIDUAL', 'COMPANY', 'DEALER'] })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'country', required: false })
  @ApiQuery({ name: 'salesRepId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() filter: CustomerFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search customers by name, phone, or code' })
  @ApiQuery({ name: 'q', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  search(@Query('q') q: string, @Query('branchId') branchId?: string, @Query('limit') limit?: string) {
    return this.service.search(q, branchId, limit ? parseInt(limit) : 20);
  }

  @Get('aging-report')
  @ApiOperation({ summary: 'Get customer aging report' })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  agingReport(@Query('customerId') customerId?: string, @Query('branchId') branchId?: string) {
    return this.service.getAgingReport(customerId, branchId);
  }

  @Get('top-customers')
  @ApiOperation({ summary: 'Get top customers by balance' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  topCustomers(@Query('branchId') branchId?: string, @Query('limit') limit?: string) {
    return this.service.getTopCustomers(branchId, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update customer' })
  update(@Param('id') id: string, @Body() dto: UpdateCustomerDto, @Req() req) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete customer' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user?.id);
  }

  @Post('statement')
  @ApiOperation({ summary: 'Get customer statement with running balance' })
  getStatement(@Body() dto: CustomerStatementDto) {
    return this.service.getStatement(dto);
  }

  @Get(':id/credit-check')
  @ApiOperation({ summary: 'Check customer credit limit' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiQuery({ name: 'amount', required: true, type: Number })
  checkCredit(@Param('id') id: string, @Query('amount') amount: string) {
    return this.service.checkCreditLimit(id, parseFloat(amount));
  }
}
