import { IsString, IsNumber, IsOptional, Min, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSalesItemDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Product variant ID' })
  @IsOptional()
  @IsUUID()
  variantId?: string;

  @ApiProperty({ description: 'Quantity ordered', example: 10 })
  @IsNumber()
  @Min(0.01)
  quantity: number;

  @ApiProperty({ description: 'Unit of measure', example: 'PCS' })
  @IsString()
  uom: string;

  @ApiPropertyOptional({ description: 'Unit price', example: 99.99 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 4 })
  @Min(0)
  unitPrice?: number;

  @ApiPropertyOptional({ description: 'Discount percentage', example: 5.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  discountPercent?: number;

  @ApiPropertyOptional({ description: 'Discount amount', example: 10.00 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Tax percentage', example: 15.0 })
  @IsOptional()
  @IsNumber({ allowInfinity: false, allowNaN: false, maxDecimalPlaces: 2 })
  @Min(0)
  taxPercent?: number;

  @ApiPropertyOptional({ description: 'Line item description override' })
  @IsOptional()
  @IsString()
  description?: string;
}
