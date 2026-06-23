import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsOptional,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  Min,
  ValidateNested,
  ArrayMinSize,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  CASH = 'CASH',
  CHEQUE = 'CHEQUE',
}

export class ProcessPayrollDto {
  @ApiProperty({ description: 'Payroll period ID' })
  @IsUUID()
  periodId: string;

  @ApiPropertyOptional({ description: 'Employee IDs to process (all if empty)' })
  @IsOptional()
  @IsUUID('4', { each: true })
  employeeIds?: string[];

  @ApiPropertyOptional({ description: 'Override basic salary' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  overrideBasicSalary?: number;

  @ApiPropertyOptional({ description: 'Additional notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessEmployeePayrollDto {
  @ApiProperty({ description: 'Payroll period ID' })
  @IsUUID()
  periodId: string;

  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({ description: 'Override basic salary' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  overrideBasicSalary?: number;

  @ApiPropertyOptional({ description: 'Override housing allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  overrideHousingAllowance?: number;

  @ApiPropertyOptional({ description: 'Override transport allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  overrideTransportAllowance?: number;

  @ApiPropertyOptional({ description: 'Override food allowance' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  overrideFoodAllowance?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayslipFilterDto {
  @ApiPropertyOptional({ description: 'Employee ID' })
  @IsOptional()
  @IsUUID()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Payroll period ID' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ description: 'Month (1-12)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  month?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20;
}

export class PaymentRecordDto {
  @ApiProperty({ description: 'Payroll entry ID' })
  @IsUUID()
  payrollEntryId: string;

  @ApiProperty({ enum: PaymentMethod, description: 'Payment method' })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ description: 'Transaction reference / cheque number' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Payment date', example: '2024-02-05' })
  @IsOptional()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
