import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString } from 'class-validator';
import { AccountType, AccountStatus } from '../interfaces/account.interface';

export class AccountTreeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by account type',
    enum: AccountType,
  })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @ApiPropertyOptional({
    description: 'Filter by account status',
    enum: AccountStatus,
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;

  @ApiPropertyOptional({
    description: 'Branch ID to filter accounts',
    example: 'branch-001',
  })
  @IsString()
  @IsOptional()
  branchId?: string;
}

export class AccountTreeResponseDto {
  @ApiProperty({ description: 'Account ID' })
  id: string;

  @ApiProperty({ description: 'Account code' })
  code: string;

  @ApiProperty({ description: 'Account name' })
  name: string;

  @ApiProperty({ description: 'Account type' })
  accountType: AccountType;

  @ApiProperty({ description: 'Normal balance' })
  normalBalance: string;

  @ApiProperty({ description: 'Hierarchy level' })
  level: number;

  @ApiProperty({ description: 'Current balance' })
  currentBalance: number;

  @ApiProperty({ description: 'Child accounts', type: [AccountTreeResponseDto] })
  children: AccountTreeResponseDto[];
}
