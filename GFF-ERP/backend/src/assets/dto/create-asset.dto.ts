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
import { DepreciationMethod } from '../interfaces/asset.interface';

export class CreateAssetDto {
  @ApiProperty({ description: 'Asset code', example: 'AST-001' })
  @IsString() @IsNotEmpty() @MaxLength(50) assetCode: string;
  @ApiProperty({ description: 'Asset name', example: 'Server Rack' })
  @IsString() @IsNotEmpty() @MaxLength(200) name: string;
  @ApiPropertyOptional({ description: 'Description' }) @IsString() @IsOptional() description?: string;
  @ApiProperty({ description: 'Category/account ID' }) @IsString() @IsNotEmpty() categoryId: string;
  @ApiProperty({ description: 'Branch ID' }) @IsString() @IsNotEmpty() branchId: string;
  @ApiPropertyOptional({ description: 'Cost center ID' }) @IsString() @IsOptional() costCenterId?: string;
  @ApiProperty({ description: 'Acquisition date' }) @IsDate() @Type(() => Date) acquisitionDate: Date;
  @ApiProperty({ description: 'Acquisition cost', example: 50000 }) @IsNumber() @Min(0) @Transform(({ value }) => new Decimal(value)) acquisitionCost: Decimal;
  @ApiPropertyOptional({ description: 'Salvage value', default: 0 }) @IsNumber() @Min(0) @IsOptional() @Transform(({ value }) => value !== undefined ? new Decimal(value) : new Decimal(0)) salvageValue?: Decimal;
  @ApiProperty({ description: 'Useful life in months', example: 60 }) @IsNumber() @Min(1) usefulLifeMonths: number;
  @ApiProperty({ description: 'Depreciation method', enum: DepreciationMethod }) @IsEnum(DepreciationMethod) depreciationMethod: DepreciationMethod;
  @ApiProperty({ description: 'Asset GL account ID' }) @IsString() @IsNotEmpty() assetAccountId: string;
  @ApiProperty({ description: 'Accumulated depreciation account ID' }) @IsString() @IsNotEmpty() depreciationAccountId: string;
  @ApiProperty({ description: 'Depreciation expense account ID' }) @IsString() @IsNotEmpty() expenseAccountId: string;
  @ApiPropertyOptional({ description: 'Location' }) @IsString() @IsOptional() location?: string;
  @ApiPropertyOptional({ description: 'Serial number' }) @IsString() @IsOptional() serialNumber?: string;
  @ApiPropertyOptional({ description: 'Supplier name' }) @IsString() @IsOptional() supplierName?: string;
  @ApiPropertyOptional({ description: 'Warranty expiry' }) @IsDate() @IsOptional() @Type(() => Date) warrantyExpiry?: Date;
}
