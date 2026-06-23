import { IsInt, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class InventoryValuationFilterDto {
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

export class InventoryAgingFilterDto {
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

export class StockLevelsFilterDto {
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

  @ApiPropertyOptional({ description: 'Only show low stock items', default: false })
  @IsOptional()
  @Type(() => Boolean)
  lowStockOnly?: boolean;
}

export class StockMovementFilterDto {
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

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  warehouseId?: number;
}
