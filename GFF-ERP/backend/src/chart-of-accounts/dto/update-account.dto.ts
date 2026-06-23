import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Decimal } from '@prisma/client/runtime/library';
import {
  AccountType,
  AccountSubType,
  NormalBalance,
  AccountStatus,
} from '../interfaces/account.interface';

export class UpdateAccountDto {
  @ApiPropertyOptional({
    description: 'Account name in English',
    example: 'Cash on Hand',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Account name in Arabic',
    example: 'النقدية في الصندوق',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Account type',
    enum: AccountType,
    example: AccountType.ASSET,
  })
  @IsEnum(AccountType)
  @IsOptional()
  accountType?: AccountType;

  @ApiPropertyOptional({
    description: 'Account sub-type',
    enum: AccountSubType,
    example: AccountSubType.CURRENT_ASSET,
  })
  @IsEnum(AccountSubType)
  @IsOptional()
  accountSubType?: AccountSubType;

  @ApiPropertyOptional({
    description: 'Normal balance side',
    enum: NormalBalance,
    example: NormalBalance.DEBIT,
  })
  @IsEnum(NormalBalance)
  @IsOptional()
  normalBalance?: NormalBalance;

  @ApiPropertyOptional({
    description: 'Parent account ID for hierarchical structure',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

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
    example: 'Updated description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Opening balance amount',
    example: 5000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Transform(({ value }) => (value !== undefined ? new Decimal(value) : undefined))
  openingBalance?: Decimal;

  @ApiPropertyOptional({
    description: 'Account status',
    enum: AccountStatus,
    example: AccountStatus.ACTIVE,
  })
  @IsEnum(AccountStatus)
  @IsOptional()
  status?: AccountStatus;
}
