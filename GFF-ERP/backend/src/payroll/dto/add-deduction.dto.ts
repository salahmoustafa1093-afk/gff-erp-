import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum DeductionType {
  LATE_ARRIVAL = 'LATE_ARRIVAL',
  ABSENCE = 'ABSENCE',
  DISCIPLINARY = 'DISCIPLINARY',
  ADVANCE = 'ADVANCE',
  OTHER = 'OTHER',
  DAMAGE = 'DAMAGE',
}

export class AddDeductionDto {
  @ApiProperty({ description: 'Payroll entry ID' })
  @IsUUID()
  payrollEntryId: string;

  @ApiProperty({ enum: DeductionType, description: 'Type of deduction' })
  @IsEnum(DeductionType)
  deductionType: DeductionType;

  @ApiProperty({ description: 'Deduction amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Description / reason' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}

export class AddBulkDeductionDto {
  @ApiProperty({ description: 'Payroll period ID' })
  @IsUUID()
  periodId: string;

  @ApiProperty({ description: 'Employee IDs to deduct from' })
  @IsUUID('4', { each: true })
  employeeIds: string[];

  @ApiProperty({ enum: DeductionType, description: 'Type of deduction' })
  @IsEnum(DeductionType)
  deductionType: DeductionType;

  @ApiProperty({ description: 'Deduction amount per employee' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Description / reason' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}

export class UpdateDeductionDto {
  @ApiPropertyOptional({ enum: DeductionType, description: 'Type of deduction' })
  @IsOptional()
  @IsEnum(DeductionType)
  deductionType?: DeductionType;

  @ApiPropertyOptional({ description: 'Deduction amount' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Type(() => Number)
  amount?: number;

  @ApiPropertyOptional({ description: 'Description / reason' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;
}
