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

export enum TransferSourceType {
  CASH = 'CASH',
  BANK = 'BANK',
}

export class TreasuryTransferDto {
  @ApiProperty({
    description: 'Source type (CASH or BANK)',
    enum: TransferSourceType,
    example: TransferSourceType.CASH,
  })
  @IsEnum(TransferSourceType)
  fromType: TransferSourceType;

  @ApiProperty({
    description: 'Source ID (cashbox ID or bank account ID)',
    example: 'cashbox-001',
  })
  @IsString()
  @IsNotEmpty()
  fromId: string;

  @ApiProperty({
    description: 'Destination type (CASH or BANK)',
    enum: TransferSourceType,
    example: TransferSourceType.BANK,
  })
  @IsEnum(TransferSourceType)
  toType: TransferSourceType;

  @ApiProperty({
    description: 'Destination ID (cashbox ID or bank account ID)',
    example: 'bank-001',
  })
  @IsString()
  @IsNotEmpty()
  toId: string;

  @ApiProperty({
    description: 'Transfer amount',
    example: 5000,
    minimum: 0.01,
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
    example: 'TRF-001',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  reference?: string;
}
