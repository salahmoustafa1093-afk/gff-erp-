import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  IsDateString,
} from 'class-validator';
import { VehicleType, VehicleStatus, FuelType } from '@prisma/client';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ description: 'Vehicle code', example: 'VH-001' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Vehicle make', example: 'Toyota' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  make?: string;

  @ApiPropertyOptional({ description: 'Vehicle model', example: 'Hilux' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  model?: string;

  @ApiPropertyOptional({ description: 'Manufacturing year', example: 2022, minimum: 1980, maximum: 2100 })
  @IsInt()
  @IsOptional()
  @Min(1980)
  @Max(2100)
  year?: number;

  @ApiPropertyOptional({ description: 'License plate number', example: 'ABC-123-GH' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  licensePlate?: string;

  @ApiPropertyOptional({ description: 'Chassis number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  chassisNumber?: string;

  @ApiPropertyOptional({ description: 'Engine number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  engineNumber?: string;

  @ApiPropertyOptional({ enum: VehicleType, description: 'Vehicle type' })
  @IsEnum(VehicleType)
  @IsOptional()
  type?: VehicleType;

  @ApiPropertyOptional({ enum: VehicleStatus, description: 'Vehicle status' })
  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @ApiPropertyOptional({ enum: FuelType, description: 'Fuel type' })
  @IsEnum(FuelType)
  @IsOptional()
  fuelType?: FuelType;

  @ApiPropertyOptional({ description: 'Fuel tank capacity in liters', example: 80 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  tankCapacity?: number;

  @ApiPropertyOptional({ description: 'Load capacity in kg', example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  loadCapacity?: number;

  @ApiPropertyOptional({ description: 'Seating capacity', example: 3 })
  @IsInt()
  @IsOptional()
  @Min(0)
  seatingCapacity?: number;

  @ApiPropertyOptional({ description: 'Current mileage/odometer reading', example: 15420.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  currentMileage?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'GPS tracking device ID' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  gpsDeviceId?: string;

  @ApiPropertyOptional({ description: 'Vehicle color', example: 'White' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  color?: string;

  @ApiPropertyOptional({ description: 'Insurance policy number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  insurancePolicyNumber?: string;

  @ApiPropertyOptional({ description: 'Insurance company name' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  insuranceCompany?: string;

  @ApiPropertyOptional({ description: 'Insurance expiry date' })
  @IsDateString()
  @IsOptional()
  insuranceExpiry?: string;

  @ApiPropertyOptional({ description: 'Vehicle registration expiry date' })
  @IsDateString()
  @IsOptional()
  registrationExpiry?: string;

  @ApiPropertyOptional({ description: 'Next maintenance date' })
  @IsDateString()
  @IsOptional()
  nextMaintenanceDate?: string;

  @ApiPropertyOptional({ description: 'Next maintenance mileage threshold', example: 20000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  nextMaintenanceMileage?: number;

  @ApiPropertyOptional({ description: 'Maintenance interval in km', example: 5000 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  maintenanceIntervalKm?: number;

  @ApiPropertyOptional({ description: 'Purchase date' })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiPropertyOptional({ description: 'Purchase price' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  purchasePrice?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
