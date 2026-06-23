import { IsString, IsOptional, IsArray, IsDateString, IsNumber, IsEnum, Min, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PurchaseReturnItemDto {
  @ApiProperty({ description: 'Purchase order item ID being returned' })
  @IsUUID()
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to return', example: 10 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for return' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Unit cost for credit', example: 50.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 4 })
  @Min(0)
  creditCost?: number;
}

export class CreatePurchaseReturnDto {
  @ApiProperty({ description: 'Original purchase order ID' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiPropertyOptional({ description: 'Original purchase invoice ID' })
  @IsOptional()
  @IsUUID()
  purchaseInvoiceId?: string;

  @ApiPropertyOptional({ description: 'Supplier ID' })
  @IsOptional()
  @IsUUID()
  supplierId?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Warehouse to deduct from' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({ type: [PurchaseReturnItemDto], description: 'Return line items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseReturnItemDto)
  items: PurchaseReturnItemDto[];

  @ApiPropertyOptional({ description: 'Return date' })
  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @ApiPropertyOptional({ description: 'Reason for return' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Refund method', enum: ['AP_CREDIT', 'CASH_REFUND'] })
  @IsOptional()
  @IsEnum(['AP_CREDIT', 'CASH_REFUND'])
  refundMethod?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
