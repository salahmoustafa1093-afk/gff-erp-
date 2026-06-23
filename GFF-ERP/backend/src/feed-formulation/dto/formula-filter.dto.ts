import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FeedType, FormulaStatus } from '../interfaces/feed-formula.interface';

export class FormulaFilterDto {
  @ApiPropertyOptional({ description: 'Search by code or name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: FeedType, description: 'Filter by feed type' })
  @IsEnum(FeedType)
  @IsOptional()
  feedType?: FeedType;

  @ApiPropertyOptional({ enum: FormulaStatus, description: 'Filter by status' })
  @IsEnum(FormulaStatus)
  @IsOptional()
  status?: FormulaStatus;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter default formulas only' })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'Created from date' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Created to date' })
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
