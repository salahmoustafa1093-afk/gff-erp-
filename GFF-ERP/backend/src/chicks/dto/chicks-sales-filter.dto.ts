import { IsDateString, IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ChicksTransferType, ChicksTransferStatus } from '../interfaces/chicks-distribution.interface';

export class ChicksDistributionFilterDto {
  @ApiPropertyOptional({ description: 'Search by transfer number or customer name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by batch ID' })
  @IsString()
  @IsOptional()
  chicksBatchId?: string;

  @ApiPropertyOptional({ enum: ChicksTransferType, description: 'Filter by transfer type' })
  @IsEnum(ChicksTransferType)
  @IsOptional()
  transferType?: ChicksTransferType;

  @ApiPropertyOptional({ enum: ChicksTransferStatus, description: 'Filter by status' })
  @IsEnum(ChicksTransferStatus)
  @IsOptional()
  status?: ChicksTransferStatus;

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

export class ChicksSalesReportFilterDto {
  @ApiPropertyOptional({ description: 'Report period from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Report period to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;
}
