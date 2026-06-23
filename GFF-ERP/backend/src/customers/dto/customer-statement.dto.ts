import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerStatementDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsString()
  customerId: string;

  @ApiPropertyOptional({ description: 'Start date (ISO format)' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO format)' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class CustomerStatementItemDto {
  @ApiProperty({ description: 'Transaction date' })
  date: Date;

  @ApiProperty({ description: 'Transaction type', example: 'INVOICE' })
  transactionType: string;

  @ApiProperty({ description: 'Reference number', example: 'INV-2024-001' })
  reference: string;

  @ApiPropertyOptional({ description: 'Description' })
  description?: string;

  @ApiProperty({ description: 'Debit amount', example: 1000.00 })
  debit: number;

  @ApiProperty({ description: 'Credit amount', example: 500.00 })
  credit: number;

  @ApiProperty({ description: 'Running balance', example: 500.00 })
  balance: number;
}

export class CustomerAgingItemDto {
  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Invoice number' })
  invoiceNumber: string;

  @ApiProperty({ description: 'Invoice date' })
  invoiceDate: Date;

  @ApiProperty({ description: 'Due date' })
  dueDate: Date;

  @ApiProperty({ description: 'Original amount' })
  originalAmount: number;

  @ApiProperty({ description: 'Outstanding amount' })
  outstandingAmount: number;

  @ApiProperty({ description: 'Days overdue' })
  daysOverdue: number;

  @ApiProperty({ description: 'Current (not overdue)' })
  current: number;

  @ApiProperty({ description: '1-30 days overdue' })
  days1to30: number;

  @ApiProperty({ description: '31-60 days overdue' })
  days31to60: number;

  @ApiProperty({ description: '61-90 days overdue' })
  days61to90: number;

  @ApiProperty({ description: 'Over 90 days overdue' })
  daysOver90: number;
}
