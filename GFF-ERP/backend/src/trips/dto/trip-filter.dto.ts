import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  IsDateString,
} from 'class-validator';
import { TripType, TripStatus } from '@prisma/client';
import { Type, Transform } from 'class-transformer';

export class TripFilterDto {
  @ApiPropertyOptional({ description: 'Search by trip number or title' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: TripType, description: 'Filter by trip type' })
  @IsEnum(TripType)
  @IsOptional()
  tripType?: TripType;

  @ApiPropertyOptional({ enum: TripStatus, description: 'Filter by trip status' })
  @IsEnum(TripStatus)
  @IsOptional()
  status?: TripStatus;

  @ApiPropertyOptional({ description: 'Filter by vehicle ID' })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter trips starting on or after this date' })
  @IsDateString()
  @IsOptional()
  startDateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter trips starting on or before this date' })
  @IsDateString()
  @IsOptional()
  startDateTo?: string;

  @ApiPropertyOptional({ description: 'Filter by today only' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  today?: boolean;

  @ApiPropertyOptional({ description: 'Filter by this week' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  thisWeek?: boolean;

  @ApiPropertyOptional({ description: 'Filter trips with late deliveries' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  lateDeliveries?: boolean;

  @ApiPropertyOptional({ description: 'Filter trips linked to a sales order' })
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  hasSalesOrder?: boolean;

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

  @ApiPropertyOptional({ description: 'Sort field', enum: ['tripNumber', 'title', 'startTime', 'status', 'plannedStartTime', 'createdAt'] })
  @IsString()
  @IsOptional()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
