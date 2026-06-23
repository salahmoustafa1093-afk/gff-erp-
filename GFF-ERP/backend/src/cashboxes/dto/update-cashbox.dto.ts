import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';
import { CashboxStatus } from '../interfaces/cashbox.interface';

export class UpdateCashboxDto {
  @ApiPropertyOptional({
    description: 'Cash box name',
    example: 'Main Cashier - Updated',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Cash box name in Arabic',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Linked GL account ID',
  })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Maximum cash limit',
    example: 15000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value !== undefined ? new Decimal(value) : undefined)
  maxLimit?: Decimal;

  @ApiPropertyOptional({
    description: 'Physical location',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Assigned cashier name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  cashierName?: string;

  @ApiPropertyOptional({
    description: 'Status',
    enum: CashboxStatus,
  })
  @IsEnum(CashboxStatus)
  @IsOptional()
  status?: CashboxStatus;
}
