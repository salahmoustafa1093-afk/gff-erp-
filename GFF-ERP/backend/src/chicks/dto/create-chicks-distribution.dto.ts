import { IsString, IsNotEmpty, IsOptional, IsEnum, IsNumber, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChicksTransferType } from '../interfaces/chicks-distribution.interface';

export class CreateChicksDistributionDto {
  @ApiProperty({ description: 'Chicks batch ID' })
  @IsString()
  @IsNotEmpty()
  chicksBatchId: string;

  @ApiProperty({ enum: ChicksTransferType, description: 'Transfer type' })
  @IsEnum(ChicksTransferType)
  transferType: ChicksTransferType;

  @ApiProperty({ description: 'Quantity to transfer/sell', minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit price per chick', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Customer name (for sales)' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsString()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'From warehouse ID' })
  @IsString()
  @IsOptional()
  fromWarehouseId?: string;

  @ApiPropertyOptional({ description: 'To warehouse ID' })
  @IsString()
  @IsOptional()
  toWarehouseId?: string;

  @ApiProperty({ description: 'Transfer date' })
  @IsDateString()
  transferDate: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Transfer notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateChicksDistributionDto {
  @ApiPropertyOptional({ description: 'Quantity', minimum: 1 })
  @IsInt()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Unit price', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Total amount' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  totalAmount?: number;

  @ApiPropertyOptional({ description: 'Customer name' })
  @IsString()
  @IsOptional()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Transfer date' })
  @IsDateString()
  @IsOptional()
  transferDate?: string;

  @ApiPropertyOptional({ description: 'Transfer notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
