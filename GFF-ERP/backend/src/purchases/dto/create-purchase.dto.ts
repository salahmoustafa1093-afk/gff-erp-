import { IsString, IsOptional, IsArray, IsDateString, IsNumber, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class CreatePurchaseDto {
  @ApiProperty({ description: 'Supplier ID' })
  @IsUUID()
  supplierId: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Warehouse for delivery' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Reference number (e.g., RFQ number)' })
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
  exchangeRate?: number;

  @ApiProperty({ type: [CreatePurchaseItemDto], description: 'Purchase line items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseItemDto)
  items: CreatePurchaseItemDto[];

  @ApiPropertyOptional({ description: 'Global discount percentage' })
  @IsOptional()
  @IsNumber()
  globalDiscountPercent?: number;

  @ApiPropertyOptional({ description: 'Global discount amount' })
  @IsOptional()
  @IsNumber()
  globalDiscountAmount?: number;

  @ApiPropertyOptional({ description: 'Shipping cost' })
  @IsOptional()
  @IsNumber()
  shippingCost?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'Requested by user ID' })
  @IsOptional()
  @IsUUID()
  requestedById?: string;

  @ApiPropertyOptional({ description: 'Requisition ID if created from requisition' })
  @IsOptional()
  @IsUUID()
  requisitionId?: string;
}
