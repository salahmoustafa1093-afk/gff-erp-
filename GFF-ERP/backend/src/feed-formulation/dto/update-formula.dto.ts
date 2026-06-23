import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedType } from '../interfaces/feed-formula.interface';
import { FormulaIngredientDto, NutritionalTargetDto } from './create-formula.dto';

export class UpdateFormulaDto {
  @ApiPropertyOptional({ description: 'Formula code' })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiPropertyOptional({ description: 'Formula name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: FeedType, description: 'Feed type' })
  @IsEnum(FeedType)
  @IsOptional()
  feedType?: FeedType;

  @ApiPropertyOptional({ description: 'Formula description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ type: [FormulaIngredientDto], description: 'Formula ingredients' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormulaIngredientDto)
  @IsOptional()
  ingredients?: FormulaIngredientDto[];

  @ApiPropertyOptional({ type: NutritionalTargetDto, description: 'Nutritional targets' })
  @ValidateNested()
  @Type(() => NutritionalTargetDto)
  @IsOptional()
  nutritionalTarget?: NutritionalTargetDto;

  @ApiPropertyOptional({ description: 'Version notes for this update' })
  @IsString()
  @IsOptional()
  versionNotes?: string;

  @ApiPropertyOptional({ description: 'Whether this is the default formula for this feed type' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
