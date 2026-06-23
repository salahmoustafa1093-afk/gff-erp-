import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType, ProductStatus } from './create-product.dto';

export class ProductFilterDto {
  @ApiPropertyOptional({ description: 'Search by name, SKU, or barcode' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by product type', enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Filter by brand ID' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiPropertyOptional({ description: 'Filter by status', enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Only low stock items', example: false })
  @IsOptional()
  lowStock?: boolean;

  @ApiPropertyOptional({ description: 'Only traceable products', example: false })
  @IsOptional()
  traceable?: boolean;

  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field', example: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort direction', example: 'asc' })
  @IsOptional()
  @IsString()
  sortDir?: 'asc' | 'desc';
}
