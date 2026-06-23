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
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ChartOfAccountsService } from './chart-of-accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';
import { AccountTreeQueryDto } from './dto/account-tree.dto';
import { Account, AccountType } from './interfaces/account.interface';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { BranchGuard } from '../branch/branch.guard';
import { RequirePermission } from '../auth/decorators/permissions.decorator';

@ApiTags('Chart of Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, BranchGuard)
@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly coaService: ChartOfAccountsService) {}

  @Post()
  @RequirePermission('accounts.create')
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created successfully' })
  @ApiResponse({ status: 409, description: 'Account code already exists' })
  async create(
    @Body() dto: CreateAccountDto,
    @Request() req,
  ): Promise<Account> {
    const userId = req.user.userId;
    return this.coaService.create(dto, userId);
  }

  @Get()
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Get all accounts' })
  @ApiQuery({ name: 'branchId', required: false, description: 'Filter by branch' })
  @ApiResponse({ status: 200, description: 'List of accounts' })
  async findAll(
    @Query('branchId') branchId?: string,
  ): Promise<Account[]> {
    return this.coaService.findAll(branchId);
  }

  @Get('tree')
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Get account tree structure' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'accountType', enum: AccountType, required: false })
  @ApiResponse({ status: 200, description: 'Hierarchical account tree' })
  async getTree(
    @Query() query: AccountTreeQueryDto,
  ) {
    return this.coaService.getTree(query.branchId, query.accountType);
  }

  @Get('search')
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Search accounts by code or name' })
  @ApiQuery({ name: 'q', description: 'Search query' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async search(
    @Query('q') query: string,
    @Query('branchId') branchId?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ): Promise<Account[]> {
    return this.coaService.searchAccounts(query, branchId, limit);
  }

  @Get('export')
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Export chart of accounts' })
  @ApiQuery({ name: 'branchId', required: false })
  @ApiResponse({ status: 200, description: 'COA exported as JSON' })
  async export(@Query('branchId') branchId?: string): Promise<Record<string, unknown>[]> {
    return this.coaService.exportCoa(branchId);
  }

  @Get(':id')
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Get account by ID' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account found' })
  @ApiResponse({ status: 404, description: 'Account not found' })
  async findOne(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ): Promise<Account> {
    return this.coaService.findOne(id, branchId);
  }

  @Get('code/:code')
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Get account by code' })
  @ApiParam({ name: 'code', description: 'Account code' })
  async findByCode(
    @Param('code') code: string,
    @Query('branchId') branchId: string,
  ): Promise<Account> {
    return this.coaService.findByCode(code, branchId);
  }

  @Get(':id/balance')
  @RequirePermission('accounts.read')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  async getBalance(@Param('id') id: string) {
    return this.coaService.getAccountBalance(id);
  }

  @Patch(':id')
  @RequirePermission('accounts.update')
  @ApiOperation({ summary: 'Update account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @ApiResponse({ status: 403, description: 'Cannot modify system account' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
    @Request() req,
  ): Promise<Account> {
    return this.coaService.update(id, dto, req.user.userId);
  }

  @Delete(':id')
  @RequirePermission('accounts.delete')
  @ApiOperation({ summary: 'Delete account' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  @ApiResponse({ status: 204, description: 'Account deleted' })
  @ApiResponse({ status: 403, description: 'Cannot delete system account' })
  async remove(
    @Param('id') id: string,
    @Request() req,
  ): Promise<void> {
    return this.coaService.remove(id, req.user.userId);
  }
}
