import { IsString, IsOptional, IsBoolean, IsInt, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUnitDto {
  @ApiProperty({ description: 'Unit name (e.g., Kilogram, Ton, Bag)', example: 'Kilogram' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Unit abbreviation/symbol', example: 'KG' })
  @IsString()
  @MaxLength(20)
  abbreviation: string;

  @ApiPropertyOptional({ description: 'Unit code for system reference', example: 'kg' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Conversion factor to base unit', example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  conversionFactor?: number;

  @ApiPropertyOptional({ description: 'Base unit ID for conversion', example: null })
  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @ApiPropertyOptional({ description: 'Whether this is the base unit', example: true })
  @IsOptional()
  @IsBoolean()
  isBaseUnit?: boolean;

  @ApiPropertyOptional({ description: 'Unit type/category', example: 'weight' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;

  @ApiPropertyOptional({ description: 'Decimal places for display', example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  decimalPlaces?: number;

  @ApiPropertyOptional({ description: 'Whether unit is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Standard weight unit' })
  @IsOptional()
  @IsString()
  notes?: string;
}
