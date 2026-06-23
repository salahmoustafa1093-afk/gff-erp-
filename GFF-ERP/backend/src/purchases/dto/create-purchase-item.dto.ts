import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePurchaseItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ description: 'Quantity ordered', example: 100 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit of measure', example: 'PCS' })
  @IsString()
  uom: string;

  @ApiProperty({ description: 'Unit cost price', example: 50.00 })
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 4 })
  @Min(0)
  unitCost: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 5.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 50.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Tax percentage', example: 15.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  taxPercent?: number;

  @ApiPropertyOptional({ description: 'Expected delivery date' })
  @IsOptional()
  @IsString()
  expectedDeliveryDate?: string;

  @ApiPropertyOptional({ description: 'Notes for this line item' })
  @IsOptional()
  @IsString()
  notes?: string;
}
