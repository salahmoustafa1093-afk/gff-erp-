import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsDate,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';

export class ReconcileDto {
  @ApiProperty({
    description: 'Bank account ID',
    example: 'bank-001',
  })
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @ApiProperty({
    description: 'Statement date',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  statementDate: Date;

  @ApiProperty({
    description: 'Statement ending balance',
    example: 125000.5,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => new Decimal(value))
  statementBalance: Decimal;

  @ApiProperty({
    description: 'Array of reconciled transaction IDs',
    example: ['tx-001', 'tx-002'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  reconciledTransactionIds: string[];

  @ApiPropertyOptional({
    description: 'Notes',
    example: 'Monthly reconciliation - all clear',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}

export class ReconcileStatusDto {
  @ApiProperty({
    description: 'Bank account ID',
    example: 'bank-001',
  })
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @ApiProperty({
    description: 'Statement date',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  statementDate: Date;
}
