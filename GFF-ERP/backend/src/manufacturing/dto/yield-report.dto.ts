import { IsDateString, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class YieldReportFilterDto {
  @ApiPropertyOptional({ description: 'Report period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by feed formula ID' })
  @IsString()
  @IsOptional()
  feedFormulaId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Group by: day, week, month, formula', default: 'month' })
  @IsString()
  @IsOptional()
  groupBy?: 'day' | 'week' | 'month' | 'formula';
}

export class CostReportFilterDto {
  @ApiPropertyOptional({ description: 'Report period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by feed formula ID' })
  @IsString()
  @IsOptional()
  feedFormulaId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
