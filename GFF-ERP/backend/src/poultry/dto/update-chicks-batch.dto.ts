import { IsString, IsOptional, IsEnum, IsNumber, IsInt, Min, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BreedType, ChicksBatchStatus } from '../interfaces/poultry.interface';

export class UpdateChicksBatchDto {
  @ApiPropertyOptional({ description: 'Batch name' })
  @IsString()
  @IsOptional()
  batchName?: string;

  @ApiPropertyOptional({ enum: BreedType, description: 'Breed type' })
  @IsEnum(BreedType)
  @IsOptional()
  breedType?: BreedType;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Arrival date' })
  @IsDateString()
  @IsOptional()
  arrivalDate?: string;

  @ApiPropertyOptional({ description: 'Arrival quantity', minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  arrivalQuantity?: number;

  @ApiPropertyOptional({ enum: ChicksBatchStatus, description: 'Batch status' })
  @IsEnum(ChicksBatchStatus)
  @IsOptional()
  status?: ChicksBatchStatus;

  @ApiPropertyOptional({ description: 'Unit cost per chick', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Total cost', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Batch notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
