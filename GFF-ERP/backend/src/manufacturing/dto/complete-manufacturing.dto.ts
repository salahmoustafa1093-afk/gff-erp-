import { IsNumber, IsOptional, Min, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class QualityTestResultDto {
  @ApiProperty({ description: 'Quality test ID' })
  @IsString()
  testId: string;

  @ApiProperty({ description: 'Measured test value' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  testValue: number;

  @ApiPropertyOptional({ description: 'Test result: PASS, FAIL, PARTIAL' })
  @IsString()
  @IsOptional()
  result?: string;

  @ApiPropertyOptional({ description: 'Test notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CompleteManufacturingDto {
  @ApiProperty({ description: 'Actual quantity produced in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  actualQuantityKg: number;

  @ApiPropertyOptional({ description: 'Actual material cost' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  actualMaterialCost?: number;

  @ApiPropertyOptional({ description: 'Overhead cost' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  overheadCost?: number;

  @ApiPropertyOptional({ description: 'Batch number for finished goods' })
  @IsString()
  @IsOptional()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Quality test results' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityTestResultDto)
  @IsOptional()
  qualityTests?: QualityTestResultDto[];

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
