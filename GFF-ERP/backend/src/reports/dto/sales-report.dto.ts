import { IsInt, IsOptional, IsString, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DailySalesFilterDto {
  @ApiPropertyOptional({ description: 'Date to report on (ISO 8601)' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class MonthlySalesFilterDto {
  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Month (1-12)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  month?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class YearlySalesFilterDto {
  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  year?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class SalesByProductFilterDto {
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

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

export class SalesByCustomerFilterDto {
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

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

export class SalesBySalesRepFilterDto {
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

export class BranchPerformanceFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class SalesTrendsFilterDto {
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

  @ApiPropertyOptional({ description: 'Group by: day, week, month', default: 'month' })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month';
}
