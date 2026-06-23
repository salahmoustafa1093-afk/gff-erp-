import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { DriverStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';

export class DriverFilterDto {
  @ApiPropertyOptional({ description: 'Search by license number or name' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: DriverStatus, description: 'Filter by driver status' })
  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by license class' })
  @IsString()
  @IsOptional()
  licenseClass?: string;

  @ApiPropertyOptional({ description: 'Filter available drivers only (not on active trip)' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  available?: boolean;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, default: 20 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['licenseNumber', 'rating', 'totalTrips', 'totalDistanceDriven', 'status', 'createdAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
