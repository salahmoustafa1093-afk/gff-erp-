import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ManufacturingStatus, QualityStatus } from '../interfaces/manufacturing.interface';

export class ManufacturingFilterDto {
  @ApiPropertyOptional({ description: 'Search by order number or batch number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ManufacturingStatus, description: 'Filter by status' })
  @IsEnum(ManufacturingStatus)
  @IsOptional()
  status?: ManufacturingStatus;

  @ApiPropertyOptional({ enum: QualityStatus, description: 'Filter by quality status' })
  @IsEnum(QualityStatus)
  @IsOptional()
  qualityStatus?: QualityStatus;

  @ApiPropertyOptional({ description: 'Filter by feed formula ID' })
  @IsString()
  @IsOptional()
  feedFormulaId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsString()
  @IsOptional()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Production date from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Production date to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort field' })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
