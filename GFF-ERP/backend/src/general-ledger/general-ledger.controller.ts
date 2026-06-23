import {
  Controller,
  Get,
  Query,
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
import { GeneralLedgerService } from './general-ledger.service';
import {
  GlQueryDto,
  TrialBalanceQueryDto,
  FinancialStatementQueryDto,
  AccountLedgerQueryDto,
} from './dto/gl-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('General Ledger')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('general-ledger')
export class GeneralLedgerController {
  constructor(private readonly glService: GeneralLedgerService) {}

  @Get('ledger')
  @RequirePermission('generalLedger.read')
  @ApiOperation({ summary: 'Get account ledger with running balance' })
  @ApiQuery({ name: 'accountId', required: false })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'costCenterId', required: false })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiQuery({ name: 'skip', required: false })
  @ApiQuery({ name: 'take', required: false })
  async getLedger(@Query() query: GlQueryDto) {
    return this.glService.getAccountLedger({
      accountId: query.accountId || '',
      startDate: query.startDate,
      endDate: query.endDate,
      branchId: query.branchId,
      skip: query.skip,
      take: query.take,
    });
  }

  @Get('account-ledger/:accountId')
  @RequirePermission('generalLedger.read')
  @ApiOperation({ summary: 'Get ledger for a specific account' })
  async getAccountLedger(
    @Query() query: AccountLedgerQueryDto,
  ) {
    return this.glService.getAccountLedger({
      accountId: query.accountId,
      startDate: query.startDate,
      endDate: query.endDate,
      branchId: query.branchId,
    });
  }

  @Get('trial-balance')
  @RequirePermission('generalLedger.read')
  @ApiOperation({ summary: 'Generate trial balance as of date' })
  @ApiResponse({ status: 200, description: 'Trial balance report' })
  async getTrialBalance(@Query() query: TrialBalanceQueryDto) {
    return this.glService.getTrialBalance({
      asOfDate: query.asOfDate,
      branchId: query.branchId,
    });
  }

  @Get('balance-sheet')
  @RequirePermission('generalLedger.read')
  @ApiOperation({ summary: 'Generate balance sheet' })
  @ApiResponse({ status: 200, description: 'Balance sheet report' })
  async getBalanceSheet(@Query() query: FinancialStatementQueryDto) {
    return this.glService.getBalanceSheet({
      asOfDate: query.endDate,
      branchId: query.branchId,
    });
  }

  @Get('income-statement')
  @RequirePermission('generalLedger.read')
  @ApiOperation({ summary: 'Generate income statement (P&L)' })
  @ApiResponse({ status: 200, description: 'Income statement report' })
  async getIncomeStatement(@Query() query: FinancialStatementQueryDto) {
    return this.glService.getIncomeStatement({
      startDate: query.startDate,
      endDate: query.endDate,
      branchId: query.branchId,
    });
  }

  @Get('cash-flow')
  @RequirePermission('generalLedger.read')
  @ApiOperation({ summary: 'Generate cash flow statement' })
  @ApiResponse({ status: 200, description: 'Cash flow statement report' })
  async getCashFlowStatement(@Query() query: FinancialStatementQueryDto) {
    return this.glService.getCashFlowStatement({
      startDate: query.startDate,
      endDate: query.endDate,
      branchId: query.branchId,
    });
  }
}
