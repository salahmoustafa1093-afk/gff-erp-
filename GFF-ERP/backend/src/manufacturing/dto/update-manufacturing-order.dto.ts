import { IsString, IsNumber, IsOptional, Min, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ManufacturingStatus } from '../interfaces/manufacturing.interface';
import { ConsumptionLineInputDto, QualityTestInputDto } from './create-manufacturing-order.dto';

export class UpdateManufacturingOrderDto {
  @ApiPropertyOptional({ description: 'Feed formula ID' })
  @IsString()
  @IsOptional()
  feedFormulaId?: string;

  @ApiPropertyOptional({ description: 'Planned quantity in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0.01)
  plannedQuantityKg?: number;

  @ApiPropertyOptional({ enum: ManufacturingStatus, description: 'Order status' })
  @IsEnum(ManufacturingStatus)
  @IsOptional()
  status?: ManufacturingStatus;

  @ApiPropertyOptional({ description: 'Production date' })
  @IsDateString()
  @IsOptional()
  productionDate?: string;

  @ApiPropertyOptional({ description: 'Completion date' })
  @IsDateString()
  @IsOptional()
  completionDate?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Source warehouse ID' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Output warehouse ID' })
  @IsString()
  @IsOptional()
  outputWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Order notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ type: [ConsumptionLineInputDto], description: 'Consumption lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConsumptionLineInputDto)
  @IsOptional()
  consumptionLines?: ConsumptionLineInputDto[];

  @ApiPropertyOptional({ type: [QualityTestInputDto], description: 'Quality tests' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QualityTestInputDto)
  @IsOptional()
  qualityTests?: QualityTestInputDto[];
}
