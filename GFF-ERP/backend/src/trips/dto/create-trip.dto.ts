import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TripType } from '@prisma/client';

export class TripStopDto {
  @ApiProperty({ description: 'Stop sequence number', example: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  sequenceNumber: number;

  @ApiProperty({ description: 'Stop type', enum: ['PICKUP', 'DELIVERY', 'TRANSFER', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  stopType: 'PICKUP' | 'DELIVERY' | 'TRANSFER' | 'OTHER';

  @ApiProperty({ description: 'Location/address for the stop', example: '123 Main St, Accra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @ApiPropertyOptional({ description: 'Customer or contact name at stop' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact phone at stop' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Sales order ID for delivery stops' })
  @IsUUID()
  @IsOptional()
  salesOrderId?: string;

  @ApiPropertyOptional({ description: 'Purchase order ID for pickup stops' })
  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Invoice ID for proof of delivery link' })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Expected arrival time at stop' })
  @IsDateString()
  @IsOptional()
  expectedArrival?: string;

  @ApiPropertyOptional({ description: 'Special instructions for this stop' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  specialInstructions?: string;
}

export class CreateTripDto {
  @ApiProperty({ enum: TripType, description: 'Trip type' })
  @IsEnum(TripType)
  @IsNotEmpty()
  tripType: TripType;

  @ApiProperty({ description: 'Trip title/description', example: 'Delivery to Kumasi' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ description: 'Detailed trip description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Vehicle ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  vehicleId: string;

  @ApiProperty({ description: 'Driver ID to assign' })
  @IsUUID()
  @IsNotEmpty()
  driverId: string;

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

  @ApiProperty({ description: 'Trip stops', type: [TripStopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripStopDto)
  stops: TripStopDto[];
}
