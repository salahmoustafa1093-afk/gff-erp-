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
import { CashboxesService } from './cashboxes.service';
import { CreateCashboxDto } from './dto/create-cashbox.dto';
import { UpdateCashboxDto } from './dto/update-cashbox.dto';
import { CashTransactionDto, TransferToBankDto } from './dto/cash-transaction.dto';
import { Cashbox } from './interfaces/cashbox.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Cash Boxes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('cashboxes')
export class CashboxesController {
  constructor(private readonly cashboxService: CashboxesService) {}

  @Post()
  @RequirePermission('cashboxes.create')
  @ApiOperation({ summary: 'Create cash box' })
  @ApiResponse({ status: 201, description: 'Cash box created' })
  async create(
    @Body() dto: CreateCashboxDto,
    @Request() req,
  ): Promise<Cashbox> {
    return this.cashboxService.create(dto, req.user.userId);
  }

  @Get()
  @RequirePermission('cashboxes.read')
  @ApiOperation({ summary: 'Get all cash boxes' })
  @ApiQuery({ name: 'branchId', required: false })
  async findAll(
    @Query('branchId') branchId?: string,
  ): Promise<Cashbox[]> {
    return this.cashboxService.findAll(branchId);
  }

  @Get(':id')
  @RequirePermission('cashboxes.read')
  @ApiOperation({ summary: 'Get cash box by ID' })
  @ApiParam({ name: 'id' })
  async findOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ): Promise<Cashbox> {
    return this.cashboxService.findOne(id, branchId);
  }

  @Patch(':id')
  @RequirePermission('cashboxes.update')
  @ApiOperation({ summary: 'Update cash box' })
  @ApiParam({ name: 'id' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCashboxDto,
    @Request() req,
  ): Promise<Cashbox> {
    return this.cashboxService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermission('cashboxes.delete')
  @ApiOperation({ summary: 'Delete cash box' })
  @ApiParam({ name: 'id' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.cashboxService.remove(id, req.user.userId);
  }

  @Post('transactions')
  @RequirePermission('cashboxes.transact')
  @ApiOperation({ summary: 'Create cash transaction (receipt/payment)' })
  @ApiResponse({ status: 201, description: 'Transaction created with journal entry' })
  async createTransaction(
    @Body() dto: CashTransactionDto,
    @Request() req,
  ) {
    return this.cashboxService.createTransaction(dto, req.user.userId);
  }

  @Get(':id/transactions')
  @RequirePermission('cashboxes.read')
  @ApiOperation({ summary: 'Get cash box transactions' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getTransactions(
    @Param('id') id: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.cashboxService.getTransactions(
      id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get(':id/daily-report')
  @RequirePermission('cashboxes.read')
  @ApiOperation({ summary: 'Get daily cash report' })
  @ApiParam({ name: 'id' })
  @ApiQuery({ name: 'date', required: true })
  async getDailyReport(
    @Param('id') id: string,
    @Query('date', new ParseDatePipe()) date: Date,
  ) {
    return this.cashboxService.getDailyReport(id, date);
  }

  @Post('transfer-to-bank')
  @RequirePermission('cashboxes.transact')
  @ApiOperation({ summary: 'Transfer cash to bank account' })
  @ApiResponse({ status: 201, description: 'Transfer completed with journal entry' })
  async transferToBank(
    @Body() dto: TransferToBankDto,
    @Request() req,
  ) {
    return this.cashboxService.transferToBank(dto, req.user.userId);
  }
}
