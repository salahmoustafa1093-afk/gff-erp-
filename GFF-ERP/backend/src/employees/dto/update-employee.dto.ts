import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsUUID,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  EmployeeStatus,
  EmploymentType,
  Gender,
  EmergencyContactDto,
  BankDetailsDto,
} from './create-employee.dto';

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ description: 'Employee number / code' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  employeeNumber?: string;

  @ApiPropertyOptional({ description: 'First name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @ApiPropertyOptional({ description: 'Last name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  middleName?: string;

  @ApiPropertyOptional({ description: 'Display name' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  displayName?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  @Length(1, 255)
  email?: string;

  @ApiPropertyOptional({ description: 'Personal email' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Secondary phone' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  secondaryPhone?: string;

  @ApiPropertyOptional({ enum: Gender, description: 'Gender' })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiPropertyOptional({ description: 'Date of birth' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'National ID' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  nationalId?: string;

  @ApiPropertyOptional({ description: 'Nationality' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  nationality?: string;

  @ApiPropertyOptional({ description: 'Marital status' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  maritalStatus?: string;

  @ApiPropertyOptional({ description: 'Residential address' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  city?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  country?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Job title ID' })
  @IsOptional()
  @IsUUID()
  jobTitleId?: string;

  @ApiPropertyOptional({ enum: EmploymentType, description: 'Employment type' })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: 'Supervisor ID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Hire date' })
  @IsOptional()
  @IsDateString()
  hireDate?: string;

  @ApiPropertyOptional({ description: 'Probation end date' })
  @IsOptional()
  @IsDateString()
  probationEndDate?: string;

  @ApiPropertyOptional({ description: 'Termination date' })
  @IsOptional()
  @IsDateString()
  terminationDate?: string;

  @ApiPropertyOptional({ description: 'Termination reason' })
  @IsOptional()
  @IsString()
  terminationReason?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, description: 'Employee status' })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ description: 'Basic salary' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  basicSalary?: number;

  @ApiPropertyOptional({ description: 'Housing allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  housingAllowance?: number;

  @ApiPropertyOptional({ description: 'Transport allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  transportAllowance?: number;

  @ApiPropertyOptional({ description: 'Food allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  foodAllowance?: number;

  @ApiPropertyOptional({ description: 'Other allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  otherAllowance?: number;

  @ApiPropertyOptional({ description: 'Social insurance number' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  socialInsuranceNumber?: string;

  @ApiPropertyOptional({ description: 'Tax ID' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  taxId?: string;

  @ApiPropertyOptional({ description: 'Emergency contact' })
  @IsOptional()
  @ValidateNested()
  @Type(() => EmergencyContactDto)
  emergencyContact?: EmergencyContactDto;

  @ApiPropertyOptional({ description: 'Bank details' })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiPropertyOptional({ description: 'Work location' })
  @IsOptional()
  @IsString()
  workLocation?: string;

  @ApiPropertyOptional({ description: 'Education' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Skills' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Overtime eligible' })
  @IsOptional()
  @IsBoolean()
  isOvertimeEligible?: boolean;

  @ApiPropertyOptional({ description: 'Shift ID' })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Annual leave balance' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  annualLeaveBalance?: number;

  @ApiPropertyOptional({ description: 'Sick leave balance' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sickLeaveBalance?: number;
}
