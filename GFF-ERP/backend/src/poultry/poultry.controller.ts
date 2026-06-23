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
import { PoultryService } from './poultry.service';
import { CreateChicksBatchDto } from './dto/create-chicks-batch.dto';
import { UpdateChicksBatchDto } from './dto/update-chicks-batch.dto';
import { RecordMortalityDto, MortalityRecordFilterDto } from './dto/record-mortality.dto';
import { ChicksFilterDto } from './dto/chicks-filter.dto';
import { ChicksReportFilterDto, SupplierPerformanceFilterDto } from './dto/chicks-report.dto';
import { BreedType, ChicksBatchStatus, MortalityCause } from './interfaces/poultry.interface';

@ApiTags('Poultry - Chicks Batches')
@ApiBearerAuth()
@Controller('poultry')
export class PoultryController {
  constructor(private readonly service: PoultryService) {}

  // ─── Chicks Batches ───

  @Post('batches')
  @ApiOperation({ summary: 'Create a new chicks batch' })
  @ApiResponse({ status: 201, description: 'Batch created' })
  async createBatch(@Body() dto: CreateChicksBatchDto, @Request() req) {
    const data = await this.service.createBatch(dto, req.user.id);
    return { success: true, data };
  }

  @Get('batches')
  @ApiOperation({ summary: 'List chicks batches with filters' })
  async findAll(@Query() filter: ChicksFilterDto) {
    const result = await this.service.findAll(filter);
    return { success: true, ...result };
  }

  @Get('batches/:id')
  @ApiOperation({ summary: 'Get chicks batch by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Patch('batches/:id')
  @ApiOperation({ summary: 'Update chicks batch' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChicksBatchDto,
    @Request() req,
  ) {
    const data = await this.service.update(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete('batches/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete chicks batch' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.service.remove(id, req.user.id);
  }

  // ─── References ───

  @Get('breed-types')
  @ApiOperation({ summary: 'Get available breed types' })
  getBreedTypes() {
    return { success: true, data: Object.values(BreedType) };
  }

  @Get('batch-statuses')
  @ApiOperation({ summary: 'Get available batch statuses' })
  getBatchStatuses() {
    return { success: true, data: Object.values(ChicksBatchStatus) };
  }

  @Get('mortality-causes')
  @ApiOperation({ summary: 'Get available mortality causes' })
  getMortalityCauses() {
    return { success: true, data: Object.values(MortalityCause) };
  }

  // ─── Mortality ───

  @Post('mortality')
  @ApiOperation({ summary: 'Record mortality for a batch' })
  @ApiResponse({ status: 201, description: 'Mortality recorded' })
  async recordMortality(@Body() dto: RecordMortalityDto, @Request() req) {
    const data = await this.service.recordMortality(dto, req.user.id);
    return { success: true, data };
  }

  @Get('mortality')
  @ApiOperation({ summary: 'List mortality records' })
  async findMortalityRecords(@Query() filter: MortalityRecordFilterDto) {
    const result = await this.service.findMortalityRecords(filter);
    return { success: true, ...result };
  }

  @Delete('mortality/:recordId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a mortality record' })
  @ApiParam({ name: 'recordId' })
  async removeMortalityRecord(@Param('recordId') recordId: string, @Request() req) {
    await this.service.removeMortalityRecord(recordId, req.user.id);
  }

  // ─── Statistics ───

  @Get('batches/:id/statistics')
  @ApiOperation({ summary: 'Get batch statistics' })
  @ApiParam({ name: 'id' })
  async getBatchStatistics(@Param('id') id: string) {
    const data = await this.service.getBatchStatistics(id);
    return { success: true, data };
  }

  // ─── Reports ───

  @Get('reports/chicks')
  @ApiOperation({ summary: 'Get chicks report' })
  async getChicksReport(@Query() filter: ChicksReportFilterDto) {
    const data = await this.service.getChicksReport(filter);
    return { success: true, data };
  }

  @Get('reports/supplier-performance')
  @ApiOperation({ summary: 'Get supplier performance report' })
  async getSupplierPerformance(@Query() filter: SupplierPerformanceFilterDto) {
    const data = await this.service.getSupplierPerformance(filter);
    return { success: true, data };
  }
}
