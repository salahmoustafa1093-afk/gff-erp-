import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  IsDateString,
} from 'class-validator';
import { VehicleType, VehicleStatus, FuelType } from '@prisma/client';

export class CreateVehicleDto {
  @ApiProperty({ description: 'Vehicle code', example: 'VH-001' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Vehicle make', example: 'Toyota' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  make: string;

  @ApiProperty({ description: 'Vehicle model', example: 'Hilux' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  model: string;

  @ApiProperty({ description: 'Manufacturing year', example: 2022, minimum: 1980, maximum: 2100 })
  @IsInt()
  @Min(1980)
  @Max(2100)
  year: number;

  @ApiProperty({ description: 'License plate number', example: 'ABC-123-GH' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licensePlate: string;

  @ApiPropertyOptional({ description: 'Chassis number', example: 'JT3HP10VXW7098765' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  chassisNumber?: string;

  @ApiPropertyOptional({ description: 'Engine number', example: '2KD-1234567' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  engineNumber?: string;

  @ApiProperty({ enum: VehicleType, description: 'Vehicle type' })
  @IsEnum(VehicleType)
  @IsNotEmpty()
  type: VehicleType;

  @ApiProperty({ enum: FuelType, description: 'Fuel type' })
  @IsEnum(FuelType)
  @IsNotEmpty()
  fuelType: FuelType;

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

  @ApiProperty({ description: 'Current mileage/odometer reading', example: 15420.5 })
  @IsNumber()
  @Min(0)
  currentMileage: number;

  @ApiPropertyOptional({ description: 'Branch ID this vehicle belongs to' })
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
