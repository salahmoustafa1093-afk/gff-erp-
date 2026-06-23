import { IsUUID, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StockLevelDto {
  @ApiProperty({ description: 'Product ID' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'New reorder point', example: 100 })
  @IsNumber()
  @Min(0)
  reorderPoint: number;

  @ApiPropertyOptional({ description: 'New reorder quantity', example: 500 })
  @IsNumber()
  @Min(0)
  reorderQuantity: number;
}
