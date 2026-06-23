import { IsString, IsOptional, IsUUID, IsNumber, IsEnum, Min, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdjustmentReason {
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  LOSS = 'LOSS',
  FOUND = 'FOUND',
  COUNT = 'COUNT',
  THEFT = 'THEFT',
  QUALITY_ISSUE = 'QUALITY_ISSUE',
  SYSTEM_CORRECTION = 'SYSTEM_CORRECTION',
  OTHER = 'OTHER',
}

export enum AdjustmentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export class StockAdjustmentDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid-here' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ description: 'Adjustment quantity (positive to add, negative to remove)', example: -5 })
  @IsNumber()
  quantity: number;

  @ApiPropertyOptional({ description: 'New absolute quantity (alternative to quantity delta)', example: 95 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  newQuantity?: number;

  @ApiProperty({ description: 'Adjustment reason', enum: AdjustmentReason, example: 'DAMAGE' })
  @IsEnum(AdjustmentReason)
  reason: AdjustmentReason;

  @ApiPropertyOptional({ description: 'Unit cost for valuation adjustment', example: 125.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Batch/Lot ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Adjustment notes', example: 'Broken bags found during inspection' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Approval notes', example: 'Approved after verification' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  approvalNotes?: string;
}

export class ApproveAdjustmentDto {
  @ApiPropertyOptional({ description: 'Approval decision', example: true })
  @IsOptional()
  approve?: boolean;

  @ApiPropertyOptional({ description: 'Approval notes', example: 'Approved - verified physical count' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
