import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BreedType } from '../interfaces/poultry.interface';

export class CreateChicksBatchDto {
  @ApiProperty({ description: 'Batch name' })
  @IsString()
  @IsNotEmpty()
  batchName: string;

  @ApiProperty({ enum: BreedType, description: 'Breed type' })
  @IsEnum(BreedType)
  breedType: BreedType;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiProperty({ description: 'Arrival date' })
  @IsDateString()
  arrivalDate: string;

  @ApiProperty({ description: 'Arrival quantity', minimum: 1 })
  @IsInt()
  @Min(1)
  arrivalQuantity: number;

  @ApiPropertyOptional({ description: 'Unit cost per chick', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Total cost of batch', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID for inventory tracking' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Batch notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
