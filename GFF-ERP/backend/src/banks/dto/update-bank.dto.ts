import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';
import { BankAccountStatus } from '../interfaces/bank.interface';

export class UpdateBankDto {
  @ApiPropertyOptional({
    description: 'Bank name',
    example: 'National Bank - Updated',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankName?: string;

  @ApiPropertyOptional({
    description: 'Bank name in Arabic',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  bankNameAr?: string;

  @ApiPropertyOptional({
    description: 'Account holder name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  accountName?: string;

  @ApiPropertyOptional({
    description: 'Bank branch name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  branchName?: string;

  @ApiPropertyOptional({
    description: 'Linked GL account ID',
  })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Currency code',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Opening balance',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => value !== undefined ? new Decimal(value) : undefined)
  openingBalance?: Decimal;

  @ApiPropertyOptional({
    description: 'SWIFT code',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  swiftCode?: string;

  @ApiPropertyOptional({
    description: 'IBAN',
  })
  @IsString()
  @IsOptional()
  @MaxLength(40)
  iban?: string;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: BankAccountStatus,
  })
  @IsEnum(BankAccountStatus)
  @IsOptional()
  status?: BankAccountStatus;
}
