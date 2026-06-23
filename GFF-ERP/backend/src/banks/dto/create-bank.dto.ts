import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateBankDto {
  @ApiProperty({
    description: 'Bank name',
    example: 'National Bank',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  bankName: string;

  @ApiPropertyOptional({
    description: 'Bank name in Arabic',
    example: 'البنك الوطني',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankNameAr?: string;

  @ApiProperty({
    description: 'Account number',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  accountNumber: string;

  @ApiProperty({
    description: 'Account holder name',
    example: 'GFF Enterprise LLC',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  accountName: string;

  @ApiPropertyOptional({
    description: 'Bank branch name',
    example: 'Main Branch',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  branchName?: string;

  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    description: 'Linked GL account ID (bank account)',
    example: 'account-1101',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiPropertyOptional({
    description: 'Currency code',
    example: 'USD',
    default: 'USD',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Opening balance',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => new Decimal(value || 0))
  openingBalance?: Decimal;

  @ApiPropertyOptional({
    description: 'SWIFT code',
    example: 'NBANKUS33',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  swiftCode?: string;

  @ApiPropertyOptional({
    description: 'IBAN',
    example: 'US12345678901234567890',
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  iban?: string;
}
