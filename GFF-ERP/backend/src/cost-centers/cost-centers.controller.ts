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
  UseGuards,
  ParseDatePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CostCentersService } from './cost-centers.service';
import { CreateCostCenterDto } from './dto/create-cost-center.dto';
import { UpdateCostCenterDto } from './dto/update-cost-center.dto';
import { CostCenter } from './interfaces/cost-center.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Cost Centers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}

  @Post()
  @RequirePermission('costCenters.create')
  @ApiOperation({ summary: 'Create cost center' })
  @ApiResponse({ status: 201, description: 'Cost center created' })
  async create(
    @Body() dto: CreateCostCenterDto,
    @Request() req,
  ): Promise<CostCenter> {
    return this.costCentersService.create(dto, req.user.userId);
  }

  @Get()
  @RequirePermission('costCenters.read')
  @ApiOperation({ summary: 'Get all cost centers' })
  @ApiQuery({ name: 'branchId', required: false })
  async findAll(
    @Query('branchId') branchId?: string,
  ): Promise<CostCenter[]> {
    return this.costCentersService.findAll(branchId);
  }

  @Get('tree')
  @RequirePermission('costCenters.read')
  @ApiOperation({ summary: 'Get cost center tree' })
  @ApiQuery({ name: 'branchId', required: false })
  async findTree(
    @Query('branchId') branchId?: string,
  ): Promise<CostCenter[]> {
    return this.costCentersService.findTree(branchId);
  }

  @Get('allocation-report')
  @RequirePermission('costCenters.read')
  @ApiOperation({ summary: 'Get cost allocation report' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'branchId', required: false })
  async getAllocationReport(
    @Query('startDate', new ParseDatePipe()) startDate: Date,
    @Query('endDate', new ParseDatePipe()) endDate: Date,
    @Query('branchId') branchId?: string,
  ) {
    return this.costCentersService.getAllocationReport(startDate, endDate, branchId);
  }

  @Get(':id')
  @RequirePermission('costCenters.read')
  @ApiOperation({ summary: 'Get cost center by ID' })
  @ApiParam({ name: 'id' })
  async findOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ): Promise<CostCenter> {
    return this.costCentersService.findOne(id, branchId);
  }

  @Patch(':id')
  @RequirePermission('costCenters.update')
  @ApiOperation({ summary: 'Update cost center' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCostCenterDto,
    @Request() req,
  ): Promise<CostCenter> {
    return this.costCentersService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermission('costCenters.delete')
  @ApiOperation({ summary: 'Delete cost center' })
  @ApiParam({ name: 'id' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.costCentersService.remove(id, req.user.userId);
  }
}
