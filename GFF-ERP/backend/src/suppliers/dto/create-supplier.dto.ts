import { IsString, IsOptional, IsEmail, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSupplierDto {
  @ApiProperty({ description: 'Supplier code', example: 'SUP-001' })
  @IsString()
  @MaxLength(50)
  supplierCode: string;

  @ApiProperty({ description: 'Supplier name', example: 'Global Materials Ltd' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactPerson?: string;

  @ApiPropertyOptional({ description: 'Email address' })
  @IsOptional()
  @IsEmail()
  @MaxLength(100)
  email?: string;

  @ApiPropertyOptional({ description: 'Phone number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @ApiPropertyOptional({ description: 'Mobile number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  mobile?: string;

  @ApiPropertyOptional({ description: 'Fax number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  fax?: string;

  @ApiPropertyOptional({ description: 'Website' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  website?: string;

  @ApiPropertyOptional({ description: 'Tax registration number' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  taxNumber?: string;

  @ApiPropertyOptional({ description: 'Billing address' })
  @IsOptional()
  @IsString()
  billingAddress?: string;

  @ApiPropertyOptional({ description: 'Shipping address' })
  @IsOptional()
  @IsString()
  shippingAddress?: string;

  @ApiPropertyOptional({ description: 'City' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'State/Province' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Credit limit', example: 100000 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Payment terms in days', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Supplier rating 1-5', example: 4 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  rating?: number;

  @ApiPropertyOptional({ description: 'Lead time in days', example: 7 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  leadTimeDays?: number;

  @ApiPropertyOptional({ description: 'Minimum order amount' })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  minOrderAmount?: number;

  @ApiPropertyOptional({ description: 'Product categories supplied' })
  @IsOptional()
  @IsString()
  categories?: string;
}
