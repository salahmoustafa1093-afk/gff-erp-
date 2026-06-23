import { IsString, IsOptional, IsArray, IsDateString, IsNumber, Min, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateSalesItemDto } from './create-sales-item.dto';

export class CreateSalesOrderDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  customerId: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Warehouse ID for fulfillment' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Reference number (e.g., customer PO)' })
  @IsOptional()
  @IsString()
  referenceNumber?: string;

  @ApiPropertyOptional({ description: 'Order date', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  orderDate?: string;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @IsDateString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ description: 'Currency code', example: 'USD' })
  @IsOptional()
  @IsString()
  currencyCode?: string;

  @ApiPropertyOptional({ description: 'Exchange rate', example: 1.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 6 })
  @Min(0)
  exchangeRate?: number;

  @ApiProperty({ type: [CreateSalesItemDto], description: 'Order line items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSalesItemDto)
  items: CreateSalesItemDto[];

  @ApiPropertyOptional({ description: 'Global discount percentage', example: 5.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  globalDiscountPercent?: number;

  @ApiPropertyOptional({ description: 'Global discount amount', example: 50.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  globalDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Shipping cost', example: 25.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  shippingCost?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Internal notes (not shown on documents)' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Price list ID' })
  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @ApiPropertyOptional({ description: 'Sales representative user ID' })
  @IsOptional()
  @IsUUID()
  salesRepId?: string;

  @ApiPropertyOptional({ description: 'Payment terms override (days)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  paymentTermsDays?: number;
}
