import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class StartTripDto {
  @ApiProperty({ description: 'Start time (defaults to now if not provided)' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ description: 'Starting odometer reading' })
  @IsNumber()
  @Min(0)
  startOdometer: number;

  @ApiPropertyOptional({ description: 'Initial fuel level in liters' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  initialFuelLevel?: number;

  @ApiPropertyOptional({ description: 'Starting notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class CompleteTripDto {
  @ApiProperty({ description: 'End time (defaults to now if not provided)' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ description: 'Ending odometer reading' })
  @IsNumber()
  @Min(0)
  endOdometer: number;

  @ApiProperty({ description: 'Total distance driven (km)' })
  @IsNumber()
  @Min(0)
  totalDistance: number;

  @ApiProperty({ description: 'Total fuel consumed (liters)' })
  @IsNumber()
  @Min(0)
  totalFuelConsumed: number;

  @ApiPropertyOptional({ description: 'Total fuel cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  fuelCost?: number;

  @ApiPropertyOptional({ description: 'Toll cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tollCost?: number;

  @ApiPropertyOptional({ description: 'Parking cost' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  parkingCost?: number;

  @ApiPropertyOptional({ description: 'Other costs' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  otherCost?: number;

  @ApiPropertyOptional({ description: 'Driver cost/overtime' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  driverCost?: number;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;
}

export class CancelTripDto {
  @ApiProperty({ description: 'Cancellation reason' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason: string;
}
