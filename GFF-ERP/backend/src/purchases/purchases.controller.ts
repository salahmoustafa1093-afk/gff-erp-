import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { PurchaseFilterDto } from './dto/purchase-filter.dto';
import { CreateGrnDto } from './dto/grn.dto';
import { ApprovePurchaseDto } from './dto/approve-purchase.dto';
import { PurchaseOrderStatus } from '@prisma/client';

@ApiTags('Purchase Orders')
@ApiBearerAuth()
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly service: PurchasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new purchase order' })
  create(@Body() dto: CreatePurchaseDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List purchase orders' })
  findAll(@Query() filter: PurchaseFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('reports/by-supplier')
  @ApiOperation({ summary: 'Purchase report by supplier' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  reportBySupplier(
    @Query('branchId') branchId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getPurchaseReport(branchId, supplierId, startDate, endDate);
  }

  @Get('reports/by-product')
  @ApiOperation({ summary: 'Purchase report by product' })
  @ApiQuery({ name: 'branchId', required: false })
  reportByProduct(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getPurchaseByProduct(branchId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase order by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update purchase order' })
  update(@Param('id') id: string, @Body() dto: UpdatePurchaseDto, @Req() req) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Post(':id/status/:status')
  @ApiOperation({ summary: 'Transition order status' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'status', enum: PurchaseOrderStatus })
  transitionStatus(
    @Param('id') id: string,
    @Param('status', new ParseEnumPipe(PurchaseOrderStatus)) status: PurchaseOrderStatus,
    @Req() req,
  ) {
    return this.service.transitionStatus(id, status, req.user?.id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve or reject purchase order' })
  processApproval(@Param('id') id: string, @Body() dto: ApprovePurchaseDto, @Req() req) {
    return this.service.processApproval(id, dto, req.user?.id);
  }

  @Post('grn')
  @ApiOperation({ summary: 'Create Goods Receipt Note (GRN)' })
  createGrn(@Body() dto: CreateGrnDto, @Req() req) {
    return this.service.createGrn(dto, req.user?.id);
  }

  @Post(':id/invoice')
  @ApiOperation({ summary: 'Create invoice from purchase order (after GRN)' })
  createInvoice(@Param('id') id: string, @Req() req) {
    return this.service.createInvoiceFromGrn(id, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete purchase order' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user?.id);
  }
}
