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
import { CashTransactionType } from '../interfaces/cashbox.interface';

export class CashTransactionDto {
  @ApiProperty({
    description: 'Cash box ID',
    example: 'cashbox-001',
  })
  @IsString()
  @IsNotEmpty()
  cashboxId: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: CashTransactionType,
    example: CashTransactionType.RECEIPT,
  })
  @IsEnum(CashTransactionType)
  transactionType: CashTransactionType;

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
    description: 'Transaction date (defaults to today)',
    example: '2024-01-15',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({
    description: 'Description/Purpose',
    example: 'Cash received from customer ABC',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @ApiPropertyOptional({
    description: 'Reference number',
    example: 'RCPT-001',
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
    description: 'Related bank account ID (for transfers)',
    example: 'bank-001',
  })
  @IsString()
  @IsOptional()
  relatedBankAccountId?: string;

  @ApiProperty({
    description: 'Debit account ID (for auto journal)',
    example: 'account-1100',
  })
  @IsString()
  @IsNotEmpty()
  debitAccountId: string;

  @ApiProperty({
    description: 'Credit account ID (for auto journal)',
    example: 'account-4100',
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

export class TransferToBankDto {
  @ApiProperty({
    description: 'Cash box ID',
    example: 'cashbox-001',
  })
  @IsString()
  @IsNotEmpty()
  cashboxId: string;

  @ApiProperty({
    description: 'Bank account ID',
    example: 'bank-001',
  })
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @ApiProperty({
    description: 'Transfer amount',
    example: 5000,
  })
  @IsNumber()
  @Min(0.01)
  @Transform(({ value }) => new Decimal(value))
  amount: Decimal;

  @ApiPropertyOptional({
    description: 'Transfer date',
    example: '2024-01-15',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  date?: Date;

  @ApiProperty({
    description: 'Description',
    example: 'Daily cash deposit to bank',
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
  reference?: string;
}
