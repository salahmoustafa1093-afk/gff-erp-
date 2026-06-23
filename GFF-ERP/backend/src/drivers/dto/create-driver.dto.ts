import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateDriverDto {
  @ApiPropertyOptional({ description: 'Employee ID to link driver to employee record' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ description: 'Driver license number', example: 'DL-123456789' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  licenseNumber: string;

  @ApiProperty({ description: 'License class/category', example: 'C,D' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  licenseClass: string;

  @ApiProperty({ description: 'License issue date' })
  @IsDateString()
  @IsNotEmpty()
  licenseIssueDate: string;

  @ApiProperty({ description: 'License expiry date' })
  @IsDateString()
  @IsNotEmpty()
  licenseExpiryDate: string;

  @ApiPropertyOptional({ description: 'License issuing authority' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  licenseIssuingAuthority?: string;

  @ApiPropertyOptional({ description: 'Years of driving experience', example: 5 })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(60)
  yearsOfExperience?: number;

  @ApiPropertyOptional({ description: 'Driver certifications as JSON array', example: '["Hazmat","First Aid"]' })
  @IsString()
  @IsOptional()
  certifications?: string;

  @ApiPropertyOptional({ description: 'Allowed vehicle types as JSON array', example: '["TRUCK","VAN"]' })
  @IsString()
  @IsOptional()
  allowedVehicleTypes?: string;

  @ApiPropertyOptional({ description: 'Medical certificate expiry date' })
  @IsDateString()
  @IsOptional()
  medicalCertificateExpiry?: string;

  @ApiPropertyOptional({ description: 'Driver rating (1-5)', example: 4.5 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(5)
  rating?: number;

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
