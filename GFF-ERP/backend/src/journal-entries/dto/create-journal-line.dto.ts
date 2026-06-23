import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateJournalLineDto {
  @ApiProperty({
    description: 'Account ID',
    example: 'account-uuid-123',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({
    description: 'Debit amount (either debit or credit must be > 0)',
    example: 1000.00,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => new Decimal(value || 0))
  debit: Decimal;

  @ApiProperty({
    description: 'Credit amount (either debit or credit must be > 0)',
    example: 0,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => new Decimal(value || 0))
  credit: Decimal;

  @ApiPropertyOptional({
    description: 'Line description',
    example: 'Payment for office supplies',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Cost center ID for allocation',
    example: 'cc-001',
  })
  @IsString()
  @IsOptional()
  costCenterId?: string;

  @ApiPropertyOptional({
    description: 'Line reference number',
    example: 'INV-001-LINE1',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiProperty({
    description: 'Line order in the journal entry',
    example: 1,
  })
  @IsNumber()
  @Min(0)
  lineOrder: number;

  @ValidateIf((o) => o.debit === undefined || o.credit === undefined)
  @IsNotEmpty({ message: 'Either debit or credit must be provided' })
  _check?: void;
}
