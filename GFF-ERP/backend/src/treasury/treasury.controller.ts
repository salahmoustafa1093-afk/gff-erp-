import {
  Controller,
  Get,
  Post,
  Body,
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
} from '@nestjs/swagger';
import { TreasuryService } from './treasury.service';
import { CashPositionQueryDto } from './dto/cash-position.dto';
import { TreasuryReportQueryDto } from './dto/treasury-report.dto';
import { TreasuryTransferDto } from './dto/treasury-transfer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Treasury Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}

  @Get('cash-position')
  @RequirePermission('treasury.read')
  @ApiOperation({ summary: 'Get cash position for branch' })
  @ApiQuery({ name: 'branchId', required: true })
  async getCashPosition(
    @Query() query: CashPositionQueryDto,
  ) {
    return this.treasuryService.getCashPosition(query.branchId);
  }

  @Get('bank-position')
  @RequirePermission('treasury.read')
  @ApiOperation({ summary: 'Get bank position for branch' })
  @ApiQuery({ name: 'branchId', required: true })
  async getBankPosition(
    @Query('branchId') branchId: string,
  ) {
    return this.treasuryService.getBankPosition(branchId);
  }

  @Get('position')
  @RequirePermission('treasury.read')
  @ApiOperation({ summary: 'Get consolidated treasury position' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiResponse({ status: 200, description: 'Complete treasury position' })
  async getTreasuryPosition(
    @Query('branchId') branchId: string,
  ) {
    return this.treasuryService.getTreasuryPosition(branchId);
  }

  @Post('transfer')
  @RequirePermission('treasury.transfer')
  @ApiOperation({ summary: 'Transfer between cash/bank accounts' })
  @ApiResponse({ status: 201, description: 'Transfer completed with journal entry' })
  async transfer(
    @Body() dto: TreasuryTransferDto,
    @Request() req,
  ) {
    return this.treasuryService.transfer(dto, req.user.userId);
  }

  @Get('cash-flow')
  @RequirePermission('treasury.read')
  @ApiOperation({ summary: 'Get cash flow summary' })
  @ApiQuery({ name: 'branchId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getCashFlowSummary(
    @Query('branchId') branchId: string,
    @Query('startDate', new ParseDatePipe()) startDate: Date,
    @Query('endDate', new ParseDatePipe()) endDate: Date,
  ) {
    return this.treasuryService.getCashFlowSummary(branchId, startDate, endDate);
  }

  @Get('transfers')
  @RequirePermission('treasury.read')
  @ApiOperation({ summary: 'Get transfer history' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getTransferHistory(
    @Query('branchId') branchId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.treasuryService.getTransferHistory(
      branchId,
      limit ? parseInt(limit, 10) : 50,
    );
  }
}
