import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class EggProductionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by batch ID' })
  @IsString()
  @IsOptional()
  chicksBatchId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Collection date from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Collection date to' })
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

export class EggReportFilterDto {
  @ApiPropertyOptional({ description: 'Report period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by batch ID' })
  @IsString()
  @IsOptional()
  chicksBatchId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Group by: day, week, month', default: 'day' })
  @IsString()
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month';
}
