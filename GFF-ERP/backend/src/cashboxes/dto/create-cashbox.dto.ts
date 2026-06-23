import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateCashboxDto {
  @ApiProperty({
    description: 'Cash box code',
    example: 'CB-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Cash box name',
    example: 'Main Cashier',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Cash box name in Arabic',
    example: 'الصندوق الرئيسي',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    description: 'Linked GL account ID (cash account)',
    example: 'account-1100',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiPropertyOptional({
    description: 'Maximum cash limit',
    example: 10000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value !== undefined ? new Decimal(value) : undefined)
  maxLimit?: Decimal;

  @ApiPropertyOptional({
    description: 'Physical location',
    example: 'Front Office',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({
    description: 'Assigned cashier name',
    example: 'John Smith',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  cashierName?: string;
}
