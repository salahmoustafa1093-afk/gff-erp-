import {
  Controller, Get, Post, Body, Param, Query, Req,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { PurchaseReturnsService } from './purchase-returns.service';
import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';

@ApiTags('Purchase Returns')
@ApiBearerAuth()
@Controller('purchase-returns')
export class PurchaseReturnsController {
  constructor(private readonly service: PurchaseReturnsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a purchase return' })
  create(@Body() dto: CreatePurchaseReturnDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List purchase returns' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'supplierId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  findAll(@Query() filter: any) {
    return this.service.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get purchase return by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve purchase return' })
  approve(@Param('id') id: string, @Body('reason') reason: string, @Req() req) {
    return this.service.approve(id, req.user?.id, reason);
  }

  @Post(':id/credit')
  @ApiOperation({ summary: 'Process AP credit or cash refund' })
  processCredit(@Param('id') id: string, @Req() req) {
    return this.service.processCredit(id, req.user?.id);
  }
}
