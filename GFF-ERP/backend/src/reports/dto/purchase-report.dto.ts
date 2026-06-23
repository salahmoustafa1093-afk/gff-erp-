import { IsInt, IsOptional, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PurchaseSummaryFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;
}

export class PurchasesBySupplierFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}

export class PurchasesByProductFilterDto {
  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  branchId?: number;

  @ApiPropertyOptional({ description: 'Limit results', default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number;
}
