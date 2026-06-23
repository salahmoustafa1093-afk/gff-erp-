import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  Length,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  TERMINATED = 'TERMINATED',
  SUSPENDED = 'SUSPENDED',
  PROBATION = 'PROBATION',
  RESIGNED = 'RESIGNED',
}

export enum EmploymentType {
  FULL_TIME = 'FULL_TIME',
  PART_TIME = 'PART_TIME',
  CONTRACT = 'CONTRACT',
  INTERN = 'INTERN',
  TEMPORARY = 'TEMPORARY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
}

export class EmergencyContactDto {
  @ApiProperty({ description: 'Contact person full name' })
  @IsString()
  @Length(2, 100)
  name: string;

  @ApiProperty({ description: 'Relationship to employee' })
  @IsString()
  @Length(2, 50)
  relationship: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @Length(5, 20)
  phone: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  email?: string;
}

export class BankDetailsDto {
  @ApiProperty({ description: 'Bank name' })
  @IsString()
  @Length(2, 100)
  bankName: string;

  @ApiProperty({ description: 'Account holder name' })
  @IsString()
  @Length(2, 100)
  accountName: string;

  @ApiProperty({ description: 'Account number' })
  @IsString()
  @Length(5, 50)
  accountNumber: string;

  @ApiPropertyOptional({ description: 'IBAN / Swift code' })
  @IsOptional()
  @IsString()
  iban?: string;

  @ApiPropertyOptional({ description: 'Branch code' })
  @IsOptional()
  @IsString()
  branchCode?: string;
}

export class CreateEmployeeDto {
  @ApiProperty({ description: 'Employee number / code', example: 'EMP-2024-001' })
  @IsString()
  @Length(1, 50)
  employeeNumber: string;

  @ApiProperty({ description: 'First name' })
  @IsString()
  @Length(1, 100)
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  @IsString()
  @Length(1, 100)
  lastName: string;

  @ApiPropertyOptional({ description: 'Middle name' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  middleName?: string;

  @ApiPropertyOptional({ description: 'Display name / preferred name' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  displayName?: string;

  @ApiProperty({ description: 'Email address' })
  @IsEmail()
  @Length(1, 255)
  email: string;

  @ApiPropertyOptional({ description: 'Personal email' })
  @IsOptional()
  @IsEmail()
  personalEmail?: string;

  @ApiProperty({ description: 'Phone number' })
  @IsString()
  @Length(5, 20)
  phone: string;

  @ApiPropertyOptional({ description: 'Secondary phone' })
  @IsOptional()
  @IsString()
  @Length(5, 20)
  secondaryPhone?: string;

  @ApiProperty({ enum: Gender, description: 'Gender' })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ description: 'Date of birth', example: '1990-01-15' })
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({ description: 'National ID / passport number' })
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

  // Job Details
  @ApiProperty({ description: 'Department ID' })
  @IsUUID()
  departmentId: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ description: 'Job title ID' })
  @IsUUID()
  jobTitleId: string;

  @ApiProperty({ enum: EmploymentType, description: 'Employment type' })
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;

  @ApiPropertyOptional({ description: 'Supervisor / manager ID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiProperty({ description: 'Hire date', example: '2024-01-01' })
  @IsDateString()
  hireDate: string;

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

  // Salary Details
  @ApiProperty({ description: 'Basic salary', example: 5000.0 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  basicSalary: number;

  @ApiPropertyOptional({ description: 'Housing allowance', example: 1000.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  housingAllowance?: number;

  @ApiPropertyOptional({ description: 'Transport allowance', example: 500.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  transportAllowance?: number;

  @ApiPropertyOptional({ description: 'Food allowance', example: 300.0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  foodAllowance?: number;

  @ApiPropertyOptional({ description: 'Other allowance', example: 200.0 })
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

  @ApiPropertyOptional({ description: 'Tax identification number' })
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

  @ApiPropertyOptional({ description: 'Work location / office' })
  @IsOptional()
  @IsString()
  workLocation?: string;

  @ApiPropertyOptional({ description: 'Education background' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: 'Skills and qualifications' })
  @IsOptional()
  @IsString()
  skills?: string;

  @ApiPropertyOptional({ description: 'Notes / remarks' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Employee photo URL' })
  @IsOptional()
  @IsString()
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Whether employee is eligible for overtime', default: true })
  @IsOptional()
  @IsBoolean()
  isOvertimeEligible?: boolean;

  @ApiPropertyOptional({ description: 'Shift ID if applicable' })
  @IsOptional()
  @IsUUID()
  shiftId?: string;

  @ApiPropertyOptional({ description: 'Annual leave balance (days)', default: 21 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  annualLeaveBalance?: number;

  @ApiPropertyOptional({ description: 'Sick leave balance (days)', default: 14 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  sickLeaveBalance?: number;
}
