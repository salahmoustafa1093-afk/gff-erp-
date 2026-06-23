import { IsString, IsOptional, IsEnum, IsUUID, IsNumber, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  RESERVE = 'RESERVE',
  RELEASE = 'RELEASE',
  MANUFACTURING_CONSUMPTION = 'MANUFACTURING_CONSUMPTION',
  MANUFACTURING_OUTPUT = 'MANUFACTURING_OUTPUT',
}

export class CreateStockMovementDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Movement type', enum: MovementType, example: 'IN' })
  @IsEnum(MovementType)
  type: MovementType;

  @ApiProperty({ description: 'Quantity', example: 100 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Unit cost per item', example: 125.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Total cost (quantity * unitCost if not provided)', example: 12550 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalCost?: number;

  @ApiPropertyOptional({ description: 'Source warehouse ID (for OUT, TRANSFER)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  sourceWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Destination warehouse ID (for IN, TRANSFER)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  destinationWarehouseId?: string;

  @ApiPropertyOptional({ description: 'Batch/Lot ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Reference document number', example: 'PO-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Reference document type', example: 'PURCHASE_ORDER' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Reason for movement', example: 'Goods receipt from supplier' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Movement notes', example: 'Delivered by truck #5' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Expiry date for batch', example: '2024-12-31' })
  @IsOptional()
  expiryDate?: Date;
}
