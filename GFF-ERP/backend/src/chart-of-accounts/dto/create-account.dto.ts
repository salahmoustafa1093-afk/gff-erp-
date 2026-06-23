import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  Length,
  MaxLength,
  Min,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AccountType,
  AccountSubType,
  NormalBalance,
} from '../interfaces/account.interface';

export class CreateAccountDto {
  @ApiProperty({
    description: 'Account code (e.g., 1101, 2100)',
    example: '1101',
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Matches(/^[0-9]+$/, { message: 'Account code must contain only digits' })
  code: string;

  @ApiProperty({
    description: 'Account name in English',
    example: 'Cash on Hand',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Account name in Arabic',
    example: 'النقدية في الصندوق',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiProperty({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.ASSET,
  })
  @IsEnum(AccountType)
  accountType: AccountType;

  @ApiProperty({
    description: 'Account sub-type',
    enum: AccountSubType,
    example: AccountSubType.CURRENT_ASSET,
  })
  @IsEnum(AccountSubType)
  accountSubType: AccountSubType;

  @ApiProperty({
    description: 'Normal balance side',
    enum: NormalBalance,
    example: NormalBalance.DEBIT,
  })
  @IsEnum(NormalBalance)
  normalBalance: NormalBalance;

  @ApiPropertyOptional({
    description: 'Parent account ID for hierarchical structure',
    example: '1100',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a system account (protected)',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a bank account',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isBankAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Whether this is a cash account',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCashAccount?: boolean;

  @ApiPropertyOptional({
    description: 'Account description',
    example: 'Main cash account for branch operations',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Opening balance amount',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => new Decimal(value || 0))
  openingBalance?: Decimal;

  @ApiProperty({
    description: 'Branch ID this account belongs to',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;
}
