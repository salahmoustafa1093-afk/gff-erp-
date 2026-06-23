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
import { ChicksService } from './chicks.service';
import {
  CreateChicksDistributionDto,
  UpdateChicksDistributionDto,
} from './dto/create-chicks-distribution.dto';
import {
  ChicksDistributionFilterDto,
  ChicksSalesReportFilterDto,
} from './dto/chicks-sales-filter.dto';
import { ChicksTransferType, ChicksTransferStatus } from './interfaces/chicks-distribution.interface';

@ApiTags('Chicks Distribution')
@ApiBearerAuth()
@Controller('chicks')
export class ChicksController {
  constructor(private readonly service: ChicksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a chicks distribution/transfer record' })
  @ApiResponse({ status: 201, description: 'Distribution created' })
  async create(@Body() dto: CreateChicksDistributionDto, @Request() req) {
    const data = await this.service.create(dto, req.user.id);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List chicks distributions/transfers' })
  async findAll(@Query() filter: ChicksDistributionFilterDto) {
    const result = await this.service.findAll(filter);
    return { success: true, ...result };
  }

  @Get('availability')
  @ApiOperation({ summary: 'Get available chicks by batch' })
  async getAvailability(
    @Query('branchId') branchId?: string,
    @Query('breedType') breedType?: string,
  ) {
    const data = await this.service.getAvailability(branchId, breedType);
    return { success: true, data };
  }

  @Get('transfer-types')
  @ApiOperation({ summary: 'Get available transfer types' })
  getTransferTypes() {
    return { success: true, data: Object.values(ChicksTransferType) };
  }

  @Get('transfer-statuses')
  @ApiOperation({ summary: 'Get available transfer statuses' })
  getTransferStatuses() {
    return { success: true, data: Object.values(ChicksTransferStatus) };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get distribution by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update distribution' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateChicksDistributionDto,
    @Request() req,
  ) {
    const data = await this.service.update(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete distribution' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.service.remove(id, req.user.id);
  }

  @Get('reports/sales')
  @ApiOperation({ summary: 'Get chicks sales report' })
  async getSalesReport(@Query() filter: ChicksSalesReportFilterDto) {
    const data = await this.service.getSalesReport(filter);
    return { success: true, data };
  }
}
