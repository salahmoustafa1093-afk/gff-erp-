import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsNumber, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EggTransferType } from '../interfaces/egg.interface';

export class CreateEggTransferDto {
  @ApiProperty({ enum: EggTransferType, description: 'Transfer type' })
  @IsEnum(EggTransferType)
  transferType: EggTransferType;

  @ApiPropertyOptional({ description: 'Chicks batch ID (for farm transfers)' })
  @IsString()
  @IsOptional()
  chicksBatchId?: string;

  @ApiPropertyOptional({ description: 'From warehouse ID' })
  @IsString()
  @IsOptional()
  fromWarehouseId?: string;

  @ApiProperty({ description: 'To warehouse ID (or destination)' })
  @IsString()
  @IsNotEmpty()
  toWarehouseId: string;

  @ApiProperty({ description: 'Large eggs quantity', minimum: 0 })
  @IsInt()
  @Min(0)
  largeQuantity: number;

  @ApiProperty({ description: 'Medium eggs quantity', minimum: 0 })
  @IsInt()
  @Min(0)
  mediumQuantity: number;

  @ApiProperty({ description: 'Small eggs quantity', minimum: 0 })
  @IsInt()
  @Min(0)
  smallQuantity: number;

  @ApiPropertyOptional({ description: 'Unit price per egg (for sales)', minimum: 0 })
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

export class UpdateEggTransferDto {
  @ApiPropertyOptional({ description: 'Large eggs quantity', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  largeQuantity?: number;

  @ApiPropertyOptional({ description: 'Medium eggs quantity', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  mediumQuantity?: number;

  @ApiPropertyOptional({ description: 'Small eggs quantity', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  smallQuantity?: number;

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

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class EggTransferFilterDto {
  @ApiPropertyOptional({ description: 'Search by transfer number or customer' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: EggTransferType, description: 'Filter by transfer type' })
  @IsEnum(EggTransferType)
  @IsOptional()
  transferType?: EggTransferType;

  @ApiPropertyOptional({ description: 'Filter by from warehouse' })
  @IsString()
  @IsOptional()
  fromWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by to warehouse' })
  @IsString()
  @IsOptional()
  toWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Transfer date from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Transfer date to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}
