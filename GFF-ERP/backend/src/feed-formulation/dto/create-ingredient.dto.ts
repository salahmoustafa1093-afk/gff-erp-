import { IsString, IsNotEmpty, IsNumber, Min, Max, IsOptional, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateIngredientDto {
  @ApiProperty({ description: 'Product (raw material) ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Formula ID this ingredient belongs to' })
  @IsString()
  @IsNotEmpty()
  formulaId: string;

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

  @ApiPropertyOptional({ description: 'Protein content % of ingredient' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  proteinContent?: number;

  @ApiPropertyOptional({ description: 'Metabolizable energy (ME) kcal/kg' })
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

  @ApiPropertyOptional({ description: 'Display order' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
