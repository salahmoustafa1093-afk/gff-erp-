import { IsString, IsOptional, IsArray, IsDateString, IsNumber, IsEnum, Min, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class SalesReturnItemDto {
  @ApiProperty({ description: 'Sales order item ID being returned' })
  @IsUUID()
  salesOrderItemId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to return', example: 5 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiPropertyOptional({ description: 'Reason for return' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Condition of returned goods', enum: ['GOOD', 'DAMAGED', 'DEFECTIVE'] })
  @IsOptional()
  @IsEnum(['GOOD', 'DAMAGED', 'DEFECTIVE'])
  condition?: string;

  @ApiPropertyOptional({ description: 'Unit refund price', example: 99.99 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 4 })
  @Min(0)
  refundPrice?: number;
}

export class CreateSalesReturnDto {
  @ApiProperty({ description: 'Original sales order ID' })
  @IsUUID()
  salesOrderId: string;

  @ApiPropertyOptional({ description: 'Original sales invoice ID (if invoiced)' })
  @IsOptional()
  @IsUUID()
  salesInvoiceId?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Warehouse to receive goods into' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiProperty({ type: [SalesReturnItemDto], description: 'Return line items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SalesReturnItemDto)
  items: SalesReturnItemDto[];

  @ApiPropertyOptional({ description: 'Return date', example: '2024-01-20' })
  @IsOptional()
  @IsDateString()
  returnDate?: string;

  @ApiPropertyOptional({ description: 'Return reason' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Refund method', enum: ['CREDIT_NOTE', 'CASH_REFUND', 'REPLACE'] })
  @IsOptional()
  @IsEnum(['CREDIT_NOTE', 'CASH_REFUND', 'REPLACE'])
  refundMethod?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
