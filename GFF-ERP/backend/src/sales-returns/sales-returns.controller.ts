import {
  Controller, Get, Post, Patch, Body, Param, Query, Req,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { SalesReturnsService } from './sales-returns.service';
import { CreateSalesReturnDto } from './dto/create-sales-return.dto';
import { ApproveReturnDto } from './dto/approve-return.dto';

@ApiTags('Sales Returns')
@ApiBearerAuth()
@Controller('sales-returns')
export class SalesReturnsController {
  constructor(private readonly service: SalesReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a sales return' })
  create(@Body() dto: CreateSalesReturnDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List sales returns' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'customerId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'salesOrderId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() filter: any) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sales return by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject a return' })
  approve(@Param('id') id: string, @Body() dto: ApproveReturnDto, @Req() req) {
    return this.service.approve(id, dto, req.user?.id);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: 'Receive returned goods into inventory' })
  receiveGoods(@Param('id') id: string, @Req() req) {
    return this.service.receiveGoods(id, req.user?.id);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Process refund/credit note' })
  processRefund(@Param('id') id: string, @Req() req) {
    return this.service.processRefund(id, req.user?.id);
  }
}
