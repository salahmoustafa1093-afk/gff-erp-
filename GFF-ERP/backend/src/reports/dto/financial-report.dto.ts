import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GeneralLedgerFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Account ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  accountId?: number;
}

export class TrialBalanceFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class BalanceSheetFilterDto {
  @ApiPropertyOptional({ description: 'As of date' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class IncomeStatementFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class CashFlowFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class CustomerStatementFilterDto {
  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  customerId?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class SupplierStatementFilterDto {
  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  supplierId?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class ProfitabilityAnalysisFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class CostCenterReportFilterDto {
  @ApiPropertyOptional({ description: 'Cost Center ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  costCenterId?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
