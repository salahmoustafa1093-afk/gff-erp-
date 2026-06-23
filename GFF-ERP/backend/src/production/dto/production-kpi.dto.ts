import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PlanningPeriod } from '../interfaces/production.interface';

export class ProductionKpiFilterDto {
  @ApiPropertyOptional({ description: 'Period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ enum: PlanningPeriod, description: 'Period grouping' })
  @IsEnum(PlanningPeriod)
  @IsOptional()
  period?: PlanningPeriod;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class TargetAnalysisFilterDto {
  @ApiPropertyOptional({ description: 'Analysis period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Analysis period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class CapacityPlanningFilterDto {
  @ApiPropertyOptional({ description: 'Period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Production capacity per period (KG)', minimum: 0 })
  @IsOptional()
  productionCapacity?: number;
}
