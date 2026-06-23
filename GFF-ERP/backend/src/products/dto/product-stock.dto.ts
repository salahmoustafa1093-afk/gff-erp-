import { IsUUID, IsOptional, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductStockDto {
  @ApiProperty({ description: 'Warehouse ID', example: 'uuid-here' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Initial quantity', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialQuantity?: number;

  @ApiPropertyOptional({ description: 'Initial cost per unit', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initialCost?: number;

  @ApiPropertyOptional({ description: 'Reorder point', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'Reorder quantity', example: 200 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;
}

export class UpdateStockSettingsDto {
  @ApiPropertyOptional({ description: 'New reorder point', example: 100 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderPoint?: number;

  @ApiPropertyOptional({ description: 'New reorder quantity', example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  reorderQuantity?: number;
}
