import { IsInt, IsOptional, IsDateString, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class DashboardQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID to scope the dashboard' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  warehouseId?: number;

  @ApiPropertyOptional({ description: 'Start date for KPI range' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date for KPI range' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Date range preset: today, week, month, year', default: 'month' })
  @IsOptional()
  @IsString()
  range?: 'today' | 'week' | 'month' | 'year';
}

export class MainKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class SalesKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class FinancialKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class InventoryKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  warehouseId?: number;
}

export class ProductionKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class WarehouseKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  warehouseId?: number;
}

export class BranchKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class PoultryKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class LogisticsKPIsQueryDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}
