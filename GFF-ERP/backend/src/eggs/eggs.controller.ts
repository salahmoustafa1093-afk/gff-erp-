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
import { EggsService } from './eggs.service';
import { CreateEggProductionDto, UpdateEggProductionDto } from './dto/create-egg-production.dto';
import { EggProductionFilterDto, EggReportFilterDto } from './dto/egg-filter.dto';
import { CreateEggTransferDto, UpdateEggTransferDto, EggTransferFilterDto } from './dto/egg-transfer.dto';
import { EggTransferType, EggTransferStatus, EggSize } from './interfaces/egg.interface';

@ApiTags('Eggs Management')
@ApiBearerAuth()
@Controller('eggs')
export class EggsController {
  constructor(private readonly service: EggsService) {}

  // ─── Egg Production ───

  @Post('production')
  @ApiOperation({ summary: 'Record egg production collection' })
  @ApiResponse({ status: 201, description: 'Production recorded' })
  async recordProduction(@Body() dto: CreateEggProductionDto, @Request() req) {
    const data = await this.service.recordProduction(dto, req.user.id);
    return { success: true, data };
  }

  @Get('production')
  @ApiOperation({ summary: 'List egg production records' })
  async findAllProduction(@Query() filter: EggProductionFilterDto) {
    const result = await this.service.findAllProduction(filter);
    return { success: true, ...result };
  }

  @Get('production/:id')
  @ApiOperation({ summary: 'Get production record by ID' })
  @ApiParam({ name: 'id' })
  async findProductionById(@Param('id') id: string) {
    const data = await this.service.findProductionById(id);
    return { success: true, data };
  }

  @Patch('production/:id')
  @ApiOperation({ summary: 'Update production record' })
  @ApiParam({ name: 'id' })
  async updateProduction(
    @Param('id') id: string,
    @Body() dto: UpdateEggProductionDto,
    @Request() req,
  ) {
    const data = await this.service.updateProduction(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete('production/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete production record' })
  @ApiParam({ name: 'id' })
  async deleteProduction(@Param('id') id: string, @Request() req) {
    await this.service.deleteProduction(id, req.user.id);
  }

  // ─── Egg Transfers ───

  @Post('transfers')
  @ApiOperation({ summary: 'Create egg transfer/sale record' })
  @ApiResponse({ status: 201, description: 'Transfer created' })
  async createTransfer(@Body() dto: CreateEggTransferDto, @Request() req) {
    const data = await this.service.createTransfer(dto, req.user.id);
    return { success: true, data };
  }

  @Get('transfers')
  @ApiOperation({ summary: 'List egg transfers' })
  async findAllTransfers(@Query() filter: EggTransferFilterDto) {
    const result = await this.service.findAllTransfers(filter);
    return { success: true, ...result };
  }

  @Get('transfers/:id')
  @ApiOperation({ summary: 'Get transfer by ID' })
  @ApiParam({ name: 'id' })
  async findTransferById(@Param('id') id: string) {
    const data = await this.service.findTransferById(id);
    return { success: true, data };
  }

  @Patch('transfers/:id')
  @ApiOperation({ summary: 'Update transfer' })
  @ApiParam({ name: 'id' })
  async updateTransfer(
    @Param('id') id: string,
    @Body() dto: UpdateEggTransferDto,
    @Request() req,
  ) {
    const data = await this.service.updateTransfer(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete('transfers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete transfer' })
  @ApiParam({ name: 'id' })
  async deleteTransfer(@Param('id') id: string, @Request() req) {
    await this.service.deleteTransfer(id, req.user.id);
  }

  // ─── References ───

  @Get('sizes')
  @ApiOperation({ summary: 'Get available egg sizes' })
  getEggSizes() {
    return { success: true, data: Object.values(EggSize) };
  }

  @Get('transfer-types')
  @ApiOperation({ summary: 'Get available transfer types' })
  getTransferTypes() {
    return { success: true, data: Object.values(EggTransferType) };
  }

  @Get('transfer-statuses')
  @ApiOperation({ summary: 'Get available transfer statuses' })
  getTransferStatuses() {
    return { success: true, data: Object.values(EggTransferStatus) };
  }

  // ─── Reports ───

  @Get('reports/daily/:date')
  @ApiOperation({ summary: 'Get daily egg report' })
  @ApiParam({ name: 'date', description: 'Date in YYYY-MM-DD format' })
  async getDailyReport(
    @Param('date') date: string,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.getDailyReport(date, branchId);
    return { success: true, data };
  }

  @Get('reports/trend')
  @ApiOperation({ summary: 'Get egg production trend' })
  async getProductionTrend(@Query() filter: EggReportFilterDto) {
    const data = await this.service.getProductionTrend(filter);
    return { success: true, data };
  }

  @Get('reports/size-distribution')
  @ApiOperation({ summary: 'Get egg size distribution' })
  async getSizeDistribution(@Query() filter: EggReportFilterDto) {
    const data = await this.service.getSizeDistribution(filter);
    return { success: true, data };
  }

  @Get('reports/revenue')
  @ApiOperation({ summary: 'Get egg revenue report' })
  async getRevenueReport(@Query() filter: EggReportFilterDto) {
    const data = await this.service.getRevenueReport(filter);
    return { success: true, data };
  }

  @Get('reports/collection-schedule')
  @ApiOperation({ summary: 'Get egg collection schedule' })
  async getCollectionSchedule(@Query('branchId') branchId?: string) {
    const data = await this.service.getCollectionSchedule(branchId);
    return { success: true, data };
  }

  @Get('reports/fcr')
  @ApiOperation({ summary: 'Get feed conversion ratio estimation' })
  async getFeedConversionRatio(
    @Query('chicksBatchId') chicksBatchId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const data = await this.service.getFeedConversionRatio(chicksBatchId, dateFrom, dateTo);
    return { success: true, data };
  }
}
