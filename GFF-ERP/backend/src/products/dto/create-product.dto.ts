import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID, IsNumber, IsObject, Min, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ProductType {
  RAW_MATERIAL = 'RAW_MATERIAL',
  FINISHED_GOOD = 'FINISHED_GOOD',
  FEED = 'FEED',
  ADDITIVE = 'ADDITIVE',
  PREMIX = 'PREMIX',
  SUPPLY = 'SUPPLY',
}

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  DISCONTINUED = 'DISCONTINUED',
  DRAFT = 'DRAFT',
}

export class NutritionalInfoDto {
  @ApiPropertyOptional({ description: 'Protein percentage', example: 18.5 })
  @IsOptional()
  @IsNumber()
  protein?: number;

  @ApiPropertyOptional({ description: 'Fat percentage', example: 4.2 })
  @IsOptional()
  @IsNumber()
  fat?: number;

  @ApiPropertyOptional({ description: 'Fiber percentage', example: 7.0 })
  @IsOptional()
  @IsNumber()
  fiber?: number;

  @ApiPropertyOptional({ description: 'Moisture percentage', example: 12.0 })
  @IsOptional()
  @IsNumber()
  moisture?: number;

  @ApiPropertyOptional({ description: 'Ash percentage', example: 8.5 })
  @IsOptional()
  @IsNumber()
  ash?: number;

  @ApiPropertyOptional({ description: 'Calcium percentage', example: 1.2 })
  @IsOptional()
  @IsNumber()
  calcium?: number;

  @ApiPropertyOptional({ description: 'Phosphorus percentage', example: 0.8 })
  @IsOptional()
  @IsNumber()
  phosphorus?: number;

  @ApiPropertyOptional({ description: 'Lysine percentage', example: 0.95 })
  @IsOptional()
  @IsNumber()
  lysine?: number;

  @ApiPropertyOptional({ description: 'Methionine percentage', example: 0.42 })
  @IsOptional()
  @IsNumber()
  methionine?: number;

  @ApiPropertyOptional({ description: 'Energy kcal/kg', example: 2800 })
  @IsOptional()
  @IsNumber()
  energy?: number;

  @ApiPropertyOptional({ description: 'Additional nutritional data', example: {} })
  @IsOptional()
  @IsObject()
  additional?: Record<string, number>;
}

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Poultry Layer Feed 18%' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'SKU code', example: 'FEED-PLY-018-50' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @ApiPropertyOptional({ description: 'Barcode/EAN', example: '6112345678901' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  barcode?: string;

  @ApiProperty({ description: 'Product type', enum: ProductType, example: 'FEED' })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ description: 'Category ID', example: 'uuid-here' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ description: 'Brand ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  brandId?: string;

  @ApiProperty({ description: 'Unit of measurement ID', example: 'uuid-here' })
  @IsUUID()
  unitId: string;

  @ApiPropertyOptional({ description: 'Product description', example: 'Premium layer feed with 18% protein' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Product specifications', example: 'Bag 50KG, Protein min 18%' })
  @IsOptional()
  @IsString()
  specifications?: string;

  @ApiPropertyOptional({ description: 'Standard cost', example: 125.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  standardCost?: number;

  @ApiPropertyOptional({ description: 'Selling price', example: 155.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sellingPrice?: number;

  @ApiPropertyOptional({ description: 'Weight in KG per unit', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  weightKg?: number;

  @ApiPropertyOptional({ description: 'Reorder point', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;

  @ApiPropertyOptional({ description: 'Nutritional information (for feed products)', type: NutritionalInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => NutritionalInfoDto)
  nutritionalInfo?: NutritionalInfoDto;

  @ApiPropertyOptional({ description: 'Storage requirements', example: 'Cool dry place, max 25C' })
  @IsOptional()
  @IsString()
  storageRequirements?: string;

  @ApiPropertyOptional({ description: 'Shelf life in days', example: 180 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  shelfLifeDays?: number;

  @ApiPropertyOptional({ description: 'Product status', enum: ProductStatus, example: 'ACTIVE' })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ description: 'Is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is traceable (batch/lot tracking)', example: true })
  @IsOptional()
  @IsBoolean()
  isTraceable?: boolean;

  @ApiPropertyOptional({ description: 'Default warehouse ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  defaultWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Image URL', example: 'https://cdn.example.com/product.jpg' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Tax rate percentage', example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  taxRate?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Best seller product' })
  @IsOptional()
  @IsString()
  notes?: string;
}
