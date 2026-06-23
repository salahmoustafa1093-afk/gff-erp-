import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ManufacturingService } from './manufacturing.service';
import { CreateManufacturingOrderDto } from './dto/create-manufacturing-order.dto';
import { UpdateManufacturingOrderDto } from './dto/update-manufacturing-order.dto';
import { CompleteManufacturingDto } from './dto/complete-manufacturing.dto';
import { ManufacturingFilterDto } from './dto/manufacturing-filter.dto';
import { YieldReportFilterDto, CostReportFilterDto } from './dto/yield-report.dto';
import { RecordConsumptionDto, AddConsumptionLineDto } from './dto/consumption-line.dto';
import { ManufacturingStatus } from './interfaces/manufacturing.interface';

@ApiTags('Manufacturing')
@ApiBearerAuth()
@Controller('manufacturing')
export class ManufacturingController {
  constructor(private readonly service: ManufacturingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a manufacturing order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  async create(@Body() dto: CreateManufacturingOrderDto, @Request() req) {
    const data = await this.service.create(dto, req.user.id);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List manufacturing orders' })
  async findAll(@Query() filter: ManufacturingFilterDto) {
    const result = await this.service.findAll(filter);
    return { success: true, ...result };
  }

  @Get('statuses')
  @ApiOperation({ summary: 'Get available manufacturing statuses' })
  getStatuses() {
    return { success: true, data: Object.values(ManufacturingStatus) };
  }

  @Get('reports/yield')
  @ApiOperation({ summary: 'Get yield report' })
  async getYieldReport(@Query() filter: YieldReportFilterDto) {
    const data = await this.service.getYieldReport(filter);
    return { success: true, data };
  }

  @Get('reports/cost')
  @ApiOperation({ summary: 'Get cost report' })
  async getCostReport(@Query() filter: CostReportFilterDto) {
    const data = await this.service.getCostReport(filter);
    return { success: true, data };
  }

  @Get('reports/capacity')
  @ApiOperation({ summary: 'Get production capacity report' })
  async getCapacityReport(@Query('branchId') branchId?: string) {
    const data = await this.service.getCapacityReport(branchId);
    return { success: true, data };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get manufacturing order by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update manufacturing order' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateManufacturingOrderDto, @Request() req) {
    const data = await this.service.update(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete manufacturing order' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.service.remove(id, req.user.id);
  }

  // ─── Status Transitions ───

  @Post(':id/start')
  @ApiOperation({ summary: 'Start production (DRAFT/PLANNED -> IN_PROGRESS)' })
  @ApiParam({ name: 'id' })
  async startProduction(@Param('id') id: string, @Request() req) {
    const data = await this.service.startProduction(id, req.user.id);
    return { success: true, data };
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Complete production (IN_PROGRESS -> COMPLETED)' })
  @ApiParam({ name: 'id' })
  async completeProduction(
    @Param('id') id: string,
    @Body() dto: CompleteManufacturingDto,
    @Request() req,
  ) {
    const data = await this.service.completeProduction(id, dto, req.user.id);
    return { success: true, data };
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel order' })
  @ApiParam({ name: 'id' })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Request() req,
  ) {
    const data = await this.service.cancelOrder(id, req.user.id, reason);
    return { success: true, data };
  }

  // ─── Consumption Lines ───

  @Post(':id/consumption')
  @ApiOperation({ summary: 'Record actual consumption for a line' })
  @ApiParam({ name: 'id' })
  async recordConsumption(
    @Param('id') id: string,
    @Body() dto: RecordConsumptionDto,
    @Request() req,
  ) {
    const data = await this.service.recordConsumption(id, dto, req.user.id);
    return { success: true, data };
  }

  @Post('consumption-lines')
  @ApiOperation({ summary: 'Add a consumption line to an order' })
  async addConsumptionLine(@Body() dto: AddConsumptionLineDto, @Request() req) {
    const data = await this.service.addConsumptionLine(dto, req.user.id);
    return { success: true, data };
  }
}
