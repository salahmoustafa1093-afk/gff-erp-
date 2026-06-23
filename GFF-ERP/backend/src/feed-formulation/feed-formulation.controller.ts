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
  ApiQuery,
} from '@nestjs/swagger';
import { FeedFormulationService } from './feed-formulation.service';
import { CreateFormulaDto } from './dto/create-formula.dto';
import { UpdateFormulaDto } from './dto/update-formula.dto';
import { FormulaFilterDto } from './dto/formula-filter.dto';
import { FormulaComparisonDto, CopyFormulaDto } from './dto/formula-cost.dto';
import { FeedType } from './interfaces/feed-formula.interface';

@ApiTags('Feed Formulation')
@ApiBearerAuth()
@Controller('feed-formulation')
export class FeedFormulationController {
  constructor(private readonly service: FeedFormulationService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new feed formula' })
  @ApiResponse({ status: 201, description: 'Formula created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or percentages do not sum to 100%' })
  @ApiResponse({ status: 409, description: 'Formula code already exists' })
  async create(@Body() dto: CreateFormulaDto, @Request() req) {
    const data = await this.service.create(dto, req.user.id);
    return { success: true, data };
  }

  @Get()
  @ApiOperation({ summary: 'List all feed formulas with filters' })
  @ApiResponse({ status: 200, description: 'List of formulas' })
  async findAll(@Query() filter: FormulaFilterDto) {
    const result = await this.service.findAll(filter);
    return { success: true, ...result };
  }

  @Get('by-feed-type/:feedType')
  @ApiOperation({ summary: 'Get formulas by feed type' })
  @ApiParam({ name: 'feedType', enum: FeedType })
  @ApiQuery({ name: 'branchId', required: false })
  async findByFeedType(
    @Param('feedType') feedType: FeedType,
    @Query('branchId') branchId?: string,
  ) {
    const data = await this.service.findByFeedType(feedType, branchId);
    return { success: true, data };
  }

  @Get('feed-types')
  @ApiOperation({ summary: 'Get all available feed types' })
  async getFeedTypes() {
    return {
      success: true,
      data: Object.values(FeedType),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a formula by ID' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  @ApiResponse({ status: 200, description: 'Formula found' })
  @ApiResponse({ status: 404, description: 'Formula not found' })
  async findOne(@Param('id') id: string) {
    const data = await this.service.findOne(id);
    return { success: true, data };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a formula' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  @ApiResponse({ status: 200, description: 'Formula updated' })
  @ApiResponse({ status: 404, description: 'Formula not found' })
  async update(@Param('id') id: string, @Body() dto: UpdateFormulaDto, @Request() req) {
    const data = await this.service.update(id, dto, req.user.id);
    return { success: true, data };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a formula' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  @ApiResponse({ status: 204, description: 'Formula deleted' })
  @ApiResponse({ status: 400, description: 'Formula is in use' })
  @ApiResponse({ status: 404, description: 'Formula not found' })
  async remove(@Param('id') id: string, @Request() req) {
    await this.service.remove(id, req.user.id);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a formula' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  async archive(@Param('id') id: string, @Request() req) {
    const data = await this.service.archive(id, req.user.id);
    return { success: true, data };
  }

  @Post('copy')
  @ApiOperation({ summary: 'Copy/clone a formula' })
  @ApiResponse({ status: 201, description: 'Formula copied successfully' })
  async copyFormula(@Body() dto: CopyFormulaDto, @Request() req) {
    const data = await this.service.copyFormula(dto, req.user.id);
    return { success: true, data };
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare multiple formulas' })
  @ApiResponse({ status: 200, description: 'Comparison results' })
  async compareFormulas(@Body() dto: FormulaComparisonDto) {
    const data = await this.service.compareFormulas(dto);
    return { success: true, data };
  }

  @Get(':id/cost-analysis')
  @ApiOperation({ summary: 'Get cost analysis for a formula' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  async getCostAnalysis(@Param('id') id: string) {
    const data = await this.service.getCostAnalysis(id);
    return { success: true, data };
  }

  @Get(':id/nutritional-comparison')
  @ApiOperation({ summary: 'Get nutritional target vs actual comparison' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  async getNutritionalComparison(@Param('id') id: string) {
    const data = await this.service.getNutritionalComparison(id);
    return { success: true, data };
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate a formula' })
  @ApiParam({ name: 'id', description: 'Formula ID' })
  async validateFormula(@Param('id') id: string) {
    const data = await this.service.validateFormula(id);
    return { success: true, data };
  }
}
