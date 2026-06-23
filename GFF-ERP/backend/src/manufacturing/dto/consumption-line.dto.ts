import { IsString, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RecordConsumptionDto {
  @ApiProperty({ description: 'Consumption line ID' })
  @IsString()
  @IsNotEmpty()
  lineId: string;

  @ApiProperty({ description: 'Actual quantity consumed in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  actualQuantityKg: number;

  @ApiPropertyOptional({ description: 'Batch/lot number of material used' })
  @IsString()
  @IsOptional()
  batchNumber?: string;
}

export class AddConsumptionLineDto {
  @ApiProperty({ description: 'Manufacturing order ID' })
  @IsString()
  @IsNotEmpty()
  manufacturingOrderId: string;

  @ApiProperty({ description: 'Product (raw material) ID' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ description: 'Planned quantity in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  plannedQuantityKg: number;

  @ApiPropertyOptional({ description: 'Actual quantity consumed in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  actualQuantityKg?: number;

  @ApiPropertyOptional({ description: 'Unit cost per KG' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  sortOrder?: number;
}

export class UpdateConsumptionLineDto {
  @ApiPropertyOptional({ description: 'Planned quantity in KG' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  plannedQuantityKg?: number;

  @ApiPropertyOptional({ description: 'Actual quantity consumed in KG' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  actualQuantityKg?: number;

  @ApiPropertyOptional({ description: 'Unit cost per KG' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitCost?: number;
}
