import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min, IsDateString } from 'class-validator';
import { VehicleType, VehicleStatus, FuelType } from '@prisma/client';
import { Type, Transform } from 'class-transformer';

export class VehicleReportFilterDto {
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

  @ApiPropertyOptional({ description: 'Report start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Report end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, default: 50 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number = 50;
}

export class VehicleUtilizationDto {
  @ApiProperty({ description: 'Vehicle ID' })
  id: string;

  @ApiProperty({ description: 'Vehicle code' })
  code: string;

  @ApiProperty({ description: 'Vehicle make' })
  make: string;

  @ApiProperty({ description: 'Vehicle model' })
  model: string;

  @ApiProperty({ description: 'License plate' })
  licensePlate: string;

  @ApiProperty({ enum: VehicleType, description: 'Vehicle type' })
  type: VehicleType;

  @ApiProperty({ description: 'Total trips completed' })
  totalTrips: number;

  @ApiProperty({ description: 'Total distance driven in km' })
  totalDistanceKm: number;

  @ApiProperty({ description: 'Total fuel consumed in liters' })
  totalFuelConsumed: number;

  @ApiProperty({ description: 'Average fuel consumption L/100km' })
  avgFuelConsumption: number;

  @ApiProperty({ description: 'Total fuel cost' })
  totalFuelCost: number;

  @ApiProperty({ description: 'Total maintenance cost' })
  totalMaintenanceCost: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm: number;

  @ApiProperty({ description: 'Days since last used' })
  daysSinceLastUsed: number;

  @ApiProperty({ description: 'Utilization rate (%)' })
  utilizationRate: number;

  @ApiProperty({ description: 'Current mileage' })
  currentMileage: number;

  @ApiProperty({ enum: VehicleStatus, description: 'Vehicle status' })
  status: VehicleStatus;
}

export class FuelConsumptionDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Vehicle make and model' })
  vehicleName: string;

  @ApiProperty({ description: 'Period start date' })
  periodStart: Date;

  @ApiProperty({ description: 'Period end date' })
  periodEnd: Date;

  @ApiProperty({ description: 'Total fuel filled (liters)' })
  totalFuelLiters: number;

  @ApiProperty({ description: 'Total fuel cost' })
  totalFuelCost: number;

  @ApiProperty({ description: 'Distance driven in period (km)' })
  distanceDriven: number;

  @ApiProperty({ description: 'Average consumption L/100km' })
  avgConsumptionPer100Km: number;

  @ApiProperty({ description: 'Average cost per liter' })
  avgCostPerLiter: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm: number;

  @ApiProperty({ description: 'Number of fuel entries' })
  fuelEntriesCount: number;

  @ApiProperty({ description: 'Best consumption reading' })
  bestConsumption: number;

  @ApiProperty({ description: 'Worst consumption reading' })
  worstConsumption: number;
}

export class VehicleCostSummaryDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Vehicle name' })
  vehicleName: string;

  @ApiProperty({ description: 'Total fuel cost' })
  fuelCost: number;

  @ApiProperty({ description: 'Total maintenance cost' })
  maintenanceCost: number;

  @ApiProperty({ description: 'Total trip cost (tolls, parking, etc.)' })
  tripCost: number;

  @ApiProperty({ description: 'Insurance cost (amortized)' })
  insuranceCost: number;

  @ApiProperty({ description: 'Total operating cost' })
  totalCost: number;

  @ApiProperty({ description: 'Total distance driven' })
  totalDistanceKm: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm: number;

  @ApiProperty({ description: 'Cost per trip' })
  costPerTrip: number;
}
