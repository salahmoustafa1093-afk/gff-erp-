import { IsUUID, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class WarehouseStockFilterDto {
  @ApiPropertyOptional({ description: 'Filter by product ID' })
  @IsOptional()
  @IsUUID()
  productId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Search by product name or SKU' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Only low stock items', example: false })
  @IsOptional()
  lowStock?: boolean;

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
