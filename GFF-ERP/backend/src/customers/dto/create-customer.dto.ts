import { IsString, IsOptional, IsEnum, IsEmail, IsNumber, IsBoolean, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CustomerType } from '@prisma/client';

export class CreateCustomerDto {
  @ApiProperty({ description: 'Customer code', example: 'CUST-001' })
  @IsString()
  @MaxLength(50)
  customerCode: string;

  @ApiProperty({ description: 'Customer name', example: 'Acme Corporation' })
  @IsString()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ description: 'Contact person name' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  contactPerson?: string;

  @ApiProperty({ enum: CustomerType, description: 'Customer type', example: CustomerType.COMPANY })
  @IsEnum(CustomerType)
  customerType: CustomerType;

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

  @ApiPropertyOptional({ description: 'Credit limit amount', example: 50000.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  creditLimit?: number;

  @ApiPropertyOptional({ description: 'Payment terms in days', example: 30 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTerms?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 5.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Price list ID' })
  @IsOptional()
  @IsString()
  priceListId?: string;

  @ApiPropertyOptional({ description: 'Sales representative user ID' })
  @IsOptional()
  @IsString()
  salesRepId?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Is active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Latitude for GPS location' })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude for GPS location' })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Customer category' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;

  @ApiPropertyOptional({ description: 'Industry' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  industry?: string;
}
