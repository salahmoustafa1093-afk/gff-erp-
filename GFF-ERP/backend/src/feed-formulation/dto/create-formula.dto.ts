import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max, IsBoolean, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FeedType } from '../interfaces/feed-formula.interface';

export class FormulaIngredientDto {
  @ApiProperty({ description: 'Product (raw material) ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Product name (for display)', required: false })
  @IsString()
  @IsOptional()
  productName?: string;

  @ApiProperty({ description: 'Percentage of ingredient in formula', minimum: 0, maximum: 100 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({ description: 'Minimum allowed percentage' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  minPercentage?: number;

  @ApiPropertyOptional({ description: 'Maximum allowed percentage' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Max(100)
  maxPercentage?: number;

  @ApiPropertyOptional({ description: 'Cost per KG of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  costPerKg?: number;

  @ApiPropertyOptional({ description: 'Protein content % of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  proteinContent?: number;

  @ApiPropertyOptional({ description: 'Metabolizable energy (ME) kcal/kg of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  energyContent?: number;

  @ApiPropertyOptional({ description: 'Fiber content % of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  fiberContent?: number;

  @ApiPropertyOptional({ description: 'Calcium content % of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  calciumContent?: number;

  @ApiPropertyOptional({ description: 'Phosphorus content % of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  phosphorusContent?: number;

  @ApiPropertyOptional({ description: 'Order of ingredient in formula' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}

export class NutritionalTargetDto {
  @ApiPropertyOptional({ description: 'Target protein %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  proteinTarget?: number;

  @ApiPropertyOptional({ description: 'Target energy ME kcal/kg' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  energyTarget?: number;

  @ApiPropertyOptional({ description: 'Target fiber %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  fiberTarget?: number;

  @ApiPropertyOptional({ description: 'Target calcium %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  calciumTarget?: number;

  @ApiPropertyOptional({ description: 'Target phosphorus %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  phosphorusTarget?: number;

  @ApiPropertyOptional({ description: 'Target moisture %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  moistureTarget?: number;

  @ApiPropertyOptional({ description: 'Target fat %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  fatTarget?: number;

  @ApiPropertyOptional({ description: 'Target lysine %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  lysineTarget?: number;

  @ApiPropertyOptional({ description: 'Target methionine %' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  methionineTarget?: number;
}

export class CreateFormulaDto {
  @ApiProperty({ description: 'Formula code', example: 'BRO-STR-001' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Formula name', example: 'Broiler Starter Formula' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: FeedType, description: 'Feed type' })
  @IsEnum(FeedType)
  feedType: FeedType;

  @ApiPropertyOptional({ description: 'Formula description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: [FormulaIngredientDto], description: 'Formula ingredients' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormulaIngredientDto)
  ingredients: FormulaIngredientDto[];

  @ApiPropertyOptional({ type: NutritionalTargetDto, description: 'Nutritional targets' })
  @ValidateNested()
  @Type(() => NutritionalTargetDto)
  @IsOptional()
  nutritionalTarget?: NutritionalTargetDto;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Whether this is the default formula for this feed type' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
