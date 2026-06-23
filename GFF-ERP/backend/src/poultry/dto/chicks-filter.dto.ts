import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BreedType, ChicksBatchStatus } from '../interfaces/poultry.interface';

export class ChicksFilterDto {
  @ApiPropertyOptional({ description: 'Search by batch number or name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: BreedType, description: 'Filter by breed type' })
  @IsEnum(BreedType)
  @IsOptional()
  breedType?: BreedType;

  @ApiPropertyOptional({ enum: ChicksBatchStatus, description: 'Filter by status' })
  @IsEnum(ChicksBatchStatus)
  @IsOptional()
  status?: ChicksBatchStatus;

  @ApiPropertyOptional({ description: 'Filter by supplier ID' })
  @IsString()
  @IsOptional()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Arrival date from' })
  @IsDateString()
  @IsOptional()
  arrivalDateFrom?: string;

  @ApiPropertyOptional({ description: 'Arrival date to' })
  @IsDateString()
  @IsOptional()
  arrivalDateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}
