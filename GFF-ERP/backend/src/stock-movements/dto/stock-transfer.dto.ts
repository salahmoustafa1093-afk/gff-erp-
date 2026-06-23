import { IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TransferItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Quantity to transfer', example: 50 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Batch/Lot ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Item notes', example: 'Handle with care' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockTransferDto {
  @ApiProperty({ description: 'Source warehouse ID', example: 'uuid-here' })
  @IsUUID()
  sourceWarehouseId: string;

  @ApiProperty({ description: 'Destination warehouse ID', example: 'uuid-here' })
  @IsUUID()
  destinationWarehouseId: string;

  @ApiProperty({ description: 'Transfer items', type: [TransferItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TransferItemDto)
  items: TransferItemDto[];

  @ApiPropertyOptional({ description: 'Transfer reference', example: 'TF-2024-001' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiPropertyOptional({ description: 'Transfer reason', example: 'Replenishment' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;

  @ApiPropertyOptional({ description: 'Transfer notes', example: 'Urgent transfer needed' })
  @IsOptional()
  @IsString()
  notes?: string;
}
