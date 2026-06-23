import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsInt,
  Min,
  IsDateString,
} from 'class-validator';
import { VehicleType, VehicleStatus, FuelType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';

export class VehicleFilterDto {
  @ApiPropertyOptional({ description: 'Search by code, make, model, or license plate' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: VehicleType, description: 'Filter by vehicle type' })
  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @ApiPropertyOptional({ enum: VehicleStatus, description: 'Filter by vehicle status' })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional({ enum: FuelType, description: 'Filter by fuel type' })
  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

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

  @ApiPropertyOptional({ description: 'Filter vehicles needing maintenance soon' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  maintenanceDue?: boolean;

  @ApiPropertyOptional({ description: 'Filter vehicles with expired or expiring insurance' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  insuranceExpiring?: boolean;

  @ApiPropertyOptional({ description: 'Filter vehicles with expired or expiring registration' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  registrationExpiring?: boolean;

  @ApiPropertyOptional({ description: 'Insurance expiry before date (for expiry tracking)' })
  @IsDateString()
  @IsOptional()
  insuranceExpiryBefore?: string;

  @ApiPropertyOptional({ description: 'Registration expiry before date' })
  @IsDateString()
  @IsOptional()
  registrationExpiryBefore?: string;

  @ApiPropertyOptional({ description: 'Maintenance due before date' })
  @IsDateString()
  @IsOptional()
  maintenanceDueBefore?: string;

  @ApiPropertyOptional({ description: 'Sort field', enum: ['code', 'make', 'model', 'year', 'currentMileage', 'status', 'createdAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
