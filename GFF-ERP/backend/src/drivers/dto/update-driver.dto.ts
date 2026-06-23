import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { DriverStatus } from '@prisma/client';

export class UpdateDriverDto {
  @ApiPropertyOptional({ description: 'Employee ID to link driver to employee record' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Driver license number' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'License class/category' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  licenseClass?: string;

  @ApiPropertyOptional({ description: 'License issue date' })
  @IsDateString()
  @IsOptional()
  licenseIssueDate?: string;

  @ApiPropertyOptional({ description: 'License expiry date' })
  @IsDateString()
  @IsOptional()
  licenseExpiryDate?: string;

  @ApiPropertyOptional({ description: 'License issuing authority' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  licenseIssuingAuthority?: string;

  @ApiPropertyOptional({ description: 'Years of driving experience' })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Driver certifications as JSON array string' })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiPropertyOptional({ description: 'Allowed vehicle types as JSON array string' })
  @IsString()
  @IsOptional()
  allowedVehicleTypes?: string;

  @ApiPropertyOptional({ description: 'Driver status' })
  @IsEnum(DriverStatus)
  @IsOptional()
  status?: DriverStatus;

  @ApiPropertyOptional({ description: 'Medical certificate expiry date' })
  @IsDateString()
  @IsOptional()
  medicalCertificateExpiry?: string;

  @ApiPropertyOptional({ description: 'Driver rating (1-5)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Total trips completed (admin override)' })
  @IsInt()
  @IsOptional()
  @Min(0)
  totalTrips?: number;

  @ApiPropertyOptional({ description: 'Total distance driven (admin override)' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalDistanceDriven?: number;

  @ApiPropertyOptional({ description: 'Emergency contact name' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  emergencyContactName?: string;

  @ApiPropertyOptional({ description: 'Emergency contact phone' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  emergencyContactPhone?: string;

  @ApiPropertyOptional({ description: 'Emergency contact relationship' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  emergencyContactRelation?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Base salary for trip costing' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  baseSalary?: number;

  @ApiPropertyOptional({ description: 'Cost per trip for trip costing' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerTrip?: number;

  @ApiPropertyOptional({ description: 'Cost per km for trip costing' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  costPerKm?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
