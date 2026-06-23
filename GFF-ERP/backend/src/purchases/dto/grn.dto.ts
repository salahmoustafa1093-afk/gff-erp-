import { IsString, IsOptional, IsArray, IsDateString, IsNumber, Min, ValidateNested, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class GrnItemDto {
  @ApiProperty({ description: 'Purchase order item ID' })
  @IsUUID()
  purchaseOrderItemId: string;

  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity received', example: 100 })
  @IsNumber()
  @Min(0)
  quantityReceived: number;

  @ApiPropertyOptional({ description: 'Batch/lot number' })
  @IsOptional()
  @IsString()
  batchNumber?: string;

  @ApiPropertyOptional({ description: 'Expiry date' })
  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @ApiPropertyOptional({ description: 'Unit cost at receipt', example: 50.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 4 })
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateGrnDto {
  @ApiProperty({ description: 'Purchase order ID' })
  @IsUUID()
  purchaseOrderId: string;

  @ApiPropertyOptional({ description: 'GRN date' })
  @IsOptional()
  @IsDateString()
  grnDate?: string;

  @ApiPropertyOptional({ description: 'Supplier invoice reference' })
  @IsOptional()
  @IsString()
  supplierInvoiceRef?: string;

  @ApiPropertyOptional({ description: 'Received by user ID' })
  @IsOptional()
  @IsUUID()
  receivedById?: string;

  @ApiProperty({ type: [GrnItemDto], description: 'Received items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GrnItemDto)
  items: GrnItemDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
