import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BreedType } from '../interfaces/poultry.interface';

export class ChicksReportFilterDto {
  @ApiPropertyOptional({ enum: BreedType, description: 'Filter by breed type' })
  @IsEnum(BreedType)
  @IsOptional()
  breedType?: BreedType;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Report period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}

export class SupplierPerformanceFilterDto {
  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Report period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
