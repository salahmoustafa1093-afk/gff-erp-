import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, Req, ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { LeadFilterDto } from './dto/lead-filter.dto';
import { LeadStatus } from '@prisma/client';

@ApiTags('Leads')
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly service: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  create(@Body() dto: CreateLeadDto, @Req() req) {
    return this.service.create(dto, req.user?.id);
  }

  @Get()
  @ApiOperation({ summary: 'List leads with filters' })
  findAll(@Query() filter: LeadFilterDto) {
    return this.service.findAll(filter);
  }

  @Get('pipeline')
  @ApiOperation({ summary: 'Get leads pipeline view' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'assignedToId', required: false })
  getPipeline(@Query('branchId') branchId?: string, @Query('assignedToId') assignedToId?: string) {
    return this.service.getPipeline(branchId, assignedToId);
  }

  @Get('reports/conversion')
  @ApiOperation({ summary: 'Get lead conversion report' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  conversionReport(
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.service.getConversionReport(branchId, startDate, endDate);
  }

  @Get('top-leads')
  @ApiOperation({ summary: 'Get top leads by estimated value' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  topLeads(@Query('branchId') branchId?: string, @Query('limit') limit?: string) {
    return this.service.getTopLeads(branchId, limit ? parseInt(limit) : 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID with activity history' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lead' })
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto, @Req() req) {
    return this.service.update(id, dto, req.user?.id);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Update lead status in pipeline' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'status', enum: LeadStatus })
  updateStatus(
    @Param('id') id: string,
    @Param('status', new ParseEnumPipe(LeadStatus)) status: LeadStatus,
    @Req() req,
  ) {
    return this.service.updateStatus(id, status, req.user?.id);
  }

  @Post(':id/move/:direction')
  @ApiOperation({ summary: 'Move lead forward/backward in pipeline' })
  @ApiParam({ name: 'id' })
  @ApiParam({ name: 'direction', enum: ['forward', 'backward'] })
  moveInPipeline(
    @Param('id') id: string,
    @Param('direction') direction: 'forward' | 'backward',
    @Req() req,
  ) {
    return this.service.moveInPipeline(id, direction, req.user?.id);
  }

  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to customer (WON)' })
  @ApiParam({ name: 'id' })
  convertLead(@Param('id') id: string, @Body() dto: ConvertLeadDto, @Req() req) {
    return this.service.convert(id, dto, req.user?.id);
  }

  @Post(':id/lost')
  @ApiOperation({ summary: 'Mark lead as lost' })
  @ApiParam({ name: 'id' })
  markLost(@Param('id') id: string, @Body('reason') reason: string, @Req() req) {
    return this.service.markLost(id, reason, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lead' })
  remove(@Param('id') id: string, @Req() req) {
    return this.service.remove(id, req.user?.id);
  }
}
