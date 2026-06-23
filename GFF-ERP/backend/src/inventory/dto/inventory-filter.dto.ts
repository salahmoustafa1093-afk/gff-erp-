import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum ValuationMethod {
  FIFO = 'FIFO',
  WEIGHTED_AVERAGE = 'WEIGHTED_AVERAGE',
}

export enum StockStatus {
  ALL = 'ALL',
  LOW = 'LOW',
  OUT = 'OUT',
  NORMAL = 'NORMAL',
  EXCESS = 'EXCESS',
}

export class InventoryFilterDto {
  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by product type' })
  @IsOptional()
  @IsString()
  productType?: string;

  @ApiPropertyOptional({ description: 'Search by product name, SKU, or barcode' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Stock status filter', enum: StockStatus })
  @IsOptional()
  @IsEnum(StockStatus)
  stockStatus?: StockStatus;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', example: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;
}
