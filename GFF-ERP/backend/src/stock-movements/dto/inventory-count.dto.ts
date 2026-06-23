import { IsString, IsOptional, IsUUID, IsNumber, IsArray, ValidateNested, Min, MaxLength, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CountStatus {
  DRAFT = 'DRAFT',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  APPROVED = 'APPROVED',
  CANCELLED = 'CANCELLED',
}

export class CountItemDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-here' })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({ description: 'Expected quantity from system', example: 100 })
  @IsOptional()
  @IsNumber()
  expectedQuantity?: number;

  @ApiProperty({ description: 'Actual counted quantity', example: 98 })
  @IsNumber()
  @Min(0)
  countedQuantity: number;

  @ApiPropertyOptional({ description: 'Batch/Lot ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  batchId?: string;

  @ApiPropertyOptional({ description: 'Item notes', example: '2 bags damaged' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  notes?: string;
}

export class CreateInventoryCountDto {
  @ApiProperty({ description: 'Warehouse ID to count', example: 'uuid-here' })
  @IsUUID()
  warehouseId: string;

  @ApiPropertyOptional({ description: 'Count sheet title', example: 'Monthly Cycle Count - January' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ description: 'Category to count (omit for all)', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Specific products to count (omit for all)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  productIds?: string[];

  @ApiPropertyOptional({ description: 'Count scheduled date', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  scheduledDate?: Date;

  @ApiPropertyOptional({ description: 'Count notes', example: 'Full physical count' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class SubmitCountDto {
  @ApiProperty({ description: 'Count items with actual quantities', type: [CountItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CountItemDto)
  items: CountItemDto[];

  @ApiPropertyOptional({ description: 'Submission notes', example: 'Count completed by team A' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ApproveCountDto {
  @ApiPropertyOptional({ description: 'Approval decision', example: true })
  @IsOptional()
  approve?: boolean;

  @ApiPropertyOptional({ description: 'Override adjustments (skip auto-adjustment)', example: false })
  @IsOptional()
  skipAdjustments?: boolean;

  @ApiPropertyOptional({ description: 'Approval notes', example: 'Approved - variances within tolerance' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
