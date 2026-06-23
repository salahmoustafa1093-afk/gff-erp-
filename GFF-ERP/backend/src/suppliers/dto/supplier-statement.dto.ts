import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SupplierStatementDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsString()
  supplierId: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class SupplierStatementItemDto {
  @ApiProperty({ description: 'Transaction date' })
  date: Date;

  @ApiProperty({ description: 'Transaction type', example: 'INVOICE' })
  transactionType: string;

  @ApiProperty({ description: 'Reference number' })
  reference: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Debit amount' })
  debit: number;

  @ApiProperty({ description: 'Credit amount' })
  credit: number;

  @ApiProperty({ description: 'Running balance' })
  balance: number;
}
