import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class GlQueryDto {
  @ApiPropertyOptional({
    description: 'Account ID to filter ledger',
    example: 'account-1100',
  })
  @IsString()
  @IsOptional()
  accountId?: string;

  @ApiPropertyOptional({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({
    description: 'Cost center ID',
    example: 'cc-001',
  })
  @IsString()
  @IsOptional()
  costCenterId?: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Skip records',
    example: 0,
  })
  @IsOptional()
  skip?: number;

  @ApiPropertyOptional({
    description: 'Take records',
    example: 100,
  })
  @IsOptional()
  take?: number;
}

export class TrialBalanceQueryDto {
  @ApiProperty({
    description: 'As of date',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  asOfDate: Date;

  @ApiPropertyOptional({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class FinancialStatementQueryDto {
  @ApiProperty({
    description: 'Start date of period',
    example: '2024-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({
    description: 'End date of period',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class AccountLedgerQueryDto {
  @ApiProperty({
    description: 'Account ID',
    example: 'account-1100',
  })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({
    description: 'Start date',
    example: '2024-01-01',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2024-01-31',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  endDate: Date;

  @ApiPropertyOptional({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsOptional()
  branchId?: string;
}
