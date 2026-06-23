import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { TripType } from '@prisma/client';

export class UpdateTripDto {
  @ApiPropertyOptional({ enum: TripType, description: 'Trip type' })
  @IsEnum(TripType)
  @IsOptional()
  tripType?: TripType;

  @ApiPropertyOptional({ description: 'Trip title/description' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed trip description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Vehicle ID to reassign' })
  @IsUUID()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Driver ID to reassign' })
  @IsUUID()
  @IsOptional()
  driverId?: string;

  @ApiPropertyOptional({ description: 'Planned start time' })
  @IsDateString()
  @IsOptional()
  plannedStartTime?: string;

  @ApiPropertyOptional({ description: 'Planned end time' })
  @IsDateString()
  @IsOptional()
  plannedEndTime?: string;

  @ApiPropertyOptional({ description: 'Estimated distance in km' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedDistance?: number;

  @ApiPropertyOptional({ description: 'Estimated fuel consumption in liters' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedFuel?: number;

  @ApiPropertyOptional({ description: 'Estimated fuel cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedFuelCost?: number;

  @ApiPropertyOptional({ description: 'Estimated toll cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  estimatedTollCost?: number;

  @ApiPropertyOptional({ description: 'Route notes/waypoints as JSON' })
  @IsString()
  @IsOptional()
  routeNotes?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  cancellationReason?: string;
}
