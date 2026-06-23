import { IsString, IsNotEmpty, IsNumber, IsOptional, Min, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsumptionLineInputDto {
  @ApiProperty({ description: 'Product (raw material) ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Planned quantity in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  plannedQuantityKg: number;

  @ApiPropertyOptional({ description: 'Unit cost per KG' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  sortOrder?: number;
}

export class QualityTestInputDto {
  @ApiProperty({ description: 'Test type name (e.g., PROTEIN, MOISTURE)' })
  @IsString()
  @IsNotEmpty()
  testType: string;

  @ApiPropertyOptional({ description: 'Measured value' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  testValue?: number;

  @ApiPropertyOptional({ description: 'Target value' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Unit of measurement' })
  @IsString()
  @IsOptional()
  unit?: string;

  @ApiPropertyOptional({ description: 'Test notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateManufacturingOrderDto {
  @ApiProperty({ description: 'Feed formula ID to manufacture' })
  @IsString()
  @IsNotEmpty()
  feedFormulaId: string;

  @ApiProperty({ description: 'Planned production quantity in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.01)
  plannedQuantityKg: number;

  @ApiPropertyOptional({ description: 'Production date' })
  @IsDateString()
  @IsOptional()
  productionDate?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Source warehouse ID (for raw materials)' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Output warehouse ID (for finished goods)' })
  @IsString()
  @IsOptional()
  outputWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [ConsumptionLineInputDto], description: 'Manual consumption lines (optional - auto-generated from formula if not provided)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionLineInputDto)
  @IsOptional()
  consumptionLines?: ConsumptionLineInputDto[];

  @ApiPropertyOptional({ type: [QualityTestInputDto], description: 'Planned quality tests' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityTestInputDto)
  @IsOptional()
  qualityTests?: QualityTestInputDto[];
}
