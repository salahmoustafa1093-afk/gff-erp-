import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum TreasuryPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export class TreasuryReportQueryDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    description: 'Report period start date',
    example: '2024-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({
    description: 'Report period end date',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Period aggregation',
    enum: TreasuryPeriod,
    default: TreasuryPeriod.DAILY,
  })
  @IsEnum(TreasuryPeriod)
  @IsOptional()
  period?: TreasuryPeriod;
}
