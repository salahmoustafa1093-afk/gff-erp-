import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  MaxLength,
  IsEnum,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';
import { BankTransactionType } from '../interfaces/bank.interface';

export class BankTransactionDto {
  @ApiProperty({
    description: 'Bank account ID',
    example: 'bank-001',
  })
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: BankTransactionType,
    example: BankTransactionType.DEPOSIT,
  })
  @IsEnum(BankTransactionType)
  transactionType: BankTransactionType;

  @ApiProperty({
    description: 'Transaction amount',
    example: 5000,
    minimum: 0.01,
  })
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => new Decimal(value))
  amount: Decimal;

  @ApiPropertyOptional({
    description: 'Transaction date',
    example: '2024-01-15',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({
    description: 'Description',
    example: 'Customer payment deposit',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'DEP-001',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Counterparty name',
    example: 'ABC Company',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  counterpartyName?: string;

  @ApiPropertyOptional({
    description: 'Counterparty account',
    example: '1098765432',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  counterpartyAccount?: string;

  @ApiPropertyOptional({
    description: 'Check number (for check transactions)',
    example: 'CHK-12345',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  checkNumber?: string;

  @ApiProperty({
    description: 'Debit account ID (for auto journal)',
    example: 'account-1101',
  })
  @IsString()
  @IsNotEmpty()
  debitAccountId: string;

  @ApiProperty({
    description: 'Credit account ID (for auto journal)',
    example: 'account-1200',
  })
  @IsString()
  @IsNotEmpty()
  creditAccountId: string;

  @ApiPropertyOptional({
    description: 'Cost center ID',
    example: 'cc-001',
  })
  @IsString()
  @IsOptional()
  costCenterId?: string;
}
