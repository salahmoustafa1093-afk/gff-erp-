import { IsNumber, Min, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class NutritionalTargetInputDto {
  @ApiPropertyOptional({ description: 'Target protein %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  proteinTarget?: number;

  @ApiPropertyOptional({ description: 'Target energy ME kcal/kg', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  energyTarget?: number;

  @ApiPropertyOptional({ description: 'Target fiber %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  fiberTarget?: number;

  @ApiPropertyOptional({ description: 'Target calcium %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  calciumTarget?: number;

  @ApiPropertyOptional({ description: 'Target phosphorus %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  phosphorusTarget?: number;

  @ApiPropertyOptional({ description: 'Target moisture %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  moistureTarget?: number;

  @ApiPropertyOptional({ description: 'Target fat %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  fatTarget?: number;

  @ApiPropertyOptional({ description: 'Target lysine %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  lysineTarget?: number;

  @ApiPropertyOptional({ description: 'Target methionine %', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  methionineTarget?: number;
}
