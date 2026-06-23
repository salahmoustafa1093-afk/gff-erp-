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
import { BanksService } from './banks.service';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { BankTransactionDto } from './dto/bank-transaction.dto';
import { ReconcileDto } from './dto/reconcile.dto';
import { BankAccount } from './interfaces/bank.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Bank Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}

  @Post()
  @RequirePermission('banks.create')
  @ApiOperation({ summary: 'Create bank account' })
  @ApiResponse({ status: 201, description: 'Bank account created' })
  async create(
    @Body() dto: CreateBankDto,
    @Request() req,
  ): Promise<BankAccount> {
    return this.banksService.create(dto, req.user.userId);
  }

  @Get()
  @RequirePermission('banks.read')
  @ApiOperation({ summary: 'Get all bank accounts' })
  @ApiQuery({ name: 'branchId', required: false })
  async findAll(
    @Query('branchId') branchId?: string,
  ): Promise<BankAccount[]> {
    return this.banksService.findAll(branchId);
  }

  @Get(':id')
  @RequirePermission('banks.read')
  @ApiOperation({ summary: 'Get bank account by ID' })
  @ApiParam({ name: 'id' })
  async findOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ): Promise<BankAccount> {
    return this.banksService.findOne(id, branchId);
  }

  @Patch(':id')
  @RequirePermission('banks.update')
  @ApiOperation({ summary: 'Update bank account' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateBankDto,
    @Request() req,
  ): Promise<BankAccount> {
    return this.banksService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermission('banks.delete')
  @ApiOperation({ summary: 'Delete bank account' })
  @ApiParam({ name: 'id' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.banksService.remove(id, req.user.userId);
  }

  @Post('transactions')
  @RequirePermission('banks.transact')
  @ApiOperation({ summary: 'Create bank transaction' })
  @ApiResponse({ status: 201, description: 'Bank transaction created with journal entry' })
  async createTransaction(
    @Body() dto: BankTransactionDto,
    @Request() req,
  ) {
    return this.banksService.createTransaction(dto, req.user.userId);
  }

  @Get(':id/transactions')
  @RequirePermission('banks.read')
  @ApiOperation({ summary: 'Get bank transactions' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getTransactions(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.banksService.getTransactions(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id/unreconciled')
  @RequirePermission('banks.read')
  @ApiOperation({ summary: 'Get unreconciled transactions' })
  @ApiParam({ name: 'id' })
  async getUnreconciled(@Param('id') id: string) {
    return this.banksService.getUnreconciledTransactions(id);
  }

  @Post('reconcile')
  @RequirePermission('banks.reconcile')
  @ApiOperation({ summary: 'Reconcile bank account' })
  @ApiResponse({ status: 201, description: 'Bank reconciliation completed' })
  async reconcile(
    @Body() dto: ReconcileDto,
    @Request() req,
  ) {
    return this.banksService.reconcile(dto, req.user.userId);
  }

  @Get(':id/statement')
  @RequirePermission('banks.read')
  @ApiOperation({ summary: 'Generate bank statement' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  async getStatement(
    @Param('id') id: string,
    @Query('startDate', new ParseDatePipe()) startDate: Date,
    @Query('endDate', new ParseDatePipe()) endDate: Date,
  ) {
    return this.banksService.getStatement(id, startDate, endDate);
  }

  @Get(':id/balance')
  @RequirePermission('banks.read')
  @ApiOperation({ summary: 'Get bank account balance' })
  @ApiParam({ name: 'id' })
  async getBalance(@Param('id') id: string) {
    const balance = await this.banksService.getBalance(id);
    return { bankAccountId: id, balance: balance.toNumber() };
  }
}
