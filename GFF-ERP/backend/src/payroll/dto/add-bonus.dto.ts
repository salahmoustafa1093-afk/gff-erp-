import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum BonusType {
  PERFORMANCE = 'PERFORMANCE',
  HOLIDAY = 'HOLIDAY',
  REFERRAL = 'REFERRAL',
  SIGNING = 'SIGNING',
  ANNUAL = 'ANNUAL',
  PROJECT_COMPLETION = 'PROJECT_COMPLETION',
  OTHER = 'OTHER',
}

export class AddBonusDto {
  @ApiProperty({ description: 'Payroll entry ID (if adding to existing entry)' })
  @IsUUID()
  payrollEntryId: string;

  @ApiProperty({ enum: BonusType, description: 'Type of bonus' })
  @IsEnum(BonusType)
  bonusType: BonusType;

  @ApiProperty({ description: 'Bonus amount' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Description / reason' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Taxable (default true)' })
  @IsOptional()
  isTaxable?: boolean = true;
}

export class AddBulkBonusDto {
  @ApiProperty({ description: 'Payroll period ID' })
  @IsUUID()
  periodId: string;

  @ApiProperty({ description: 'Employee IDs to receive bonus' })
  @IsUUID('4', { each: true })
  employeeIds: string[];

  @ApiProperty({ enum: BonusType, description: 'Type of bonus' })
  @IsEnum(BonusType)
  bonusType: BonusType;

  @ApiProperty({ description: 'Bonus amount per employee' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Type(() => Number)
  amount: number;

  @ApiPropertyOptional({ description: 'Description / reason' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({ description: 'Taxable (default true)' })
  @IsOptional()
  isTaxable?: boolean = true;
}

export class UpdateBonusDto {
  @ApiPropertyOptional({ enum: BonusType, description: 'Type of bonus' })
  @IsOptional()
  @IsEnum(BonusType)
  bonusType?: BonusType;

  @ApiPropertyOptional({ description: 'Bonus amount' })
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

  @ApiPropertyOptional({ description: 'Taxable' })
  @IsOptional()
  isTaxable?: boolean;
}
