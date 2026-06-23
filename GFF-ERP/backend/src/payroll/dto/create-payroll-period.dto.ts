import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
  IsNumber,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum PayrollPeriodStatus {
  DRAFT = 'DRAFT',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CLOSED = 'CLOSED',
}

export class CreatePayrollPeriodDto {
  @ApiProperty({ description: 'Period name', example: 'January 2024' })
  @IsString()
  @Length(1, 200)
  name: string;

  @ApiProperty({ description: 'Start date', example: '2024-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'End date', example: '2024-01-31' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Payment date', example: '2024-02-05' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Branch ID (if branch-specific payroll)' })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  branchId?: string;
}

export class UpdatePayrollPeriodDto {
  @ApiPropertyOptional({ description: 'Period name' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  name?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Payment date' })
  @IsOptional()
  @IsDateString()
  paymentDate?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: PayrollPeriodStatus, description: 'Status' })
  @IsOptional()
  @IsEnum(PayrollPeriodStatus)
  status?: PayrollPeriodStatus;
}
