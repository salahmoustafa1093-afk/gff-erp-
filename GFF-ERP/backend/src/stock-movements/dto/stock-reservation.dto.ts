import { IsString, IsOptional, IsUUID, IsNumber, Min, MaxLength, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  FULFILLED = 'FULFILLED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export class CreateStockReservationDto {
  @ApiProperty({ description: 'Product ID', example: 'uuid-here' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: 'Warehouse ID', example: 'uuid-here' })
  @IsUUID()
  warehouseId: string;

  @ApiProperty({ description: 'Sales order ID', example: 'uuid-here' })
  @IsUUID()
  salesOrderId: string;

  @ApiProperty({ description: 'Quantity to reserve', example: 50 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ description: 'Reservation expiry date', example: '2024-02-28' })
  @IsOptional()
  expiryDate?: Date;

  @ApiPropertyOptional({ description: 'Reservation notes', example: 'Reserved for VIP customer' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

export class ReleaseReservationDto {
  @ApiPropertyOptional({ description: 'Quantity to release (default: all)', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Release reason', example: 'Order cancelled' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

export class FulfillReservationDto {
  @ApiPropertyOptional({ description: 'Quantity fulfilled', example: 50 })
  @IsOptional()
  @IsNumber()
  @Min(0.001)
  quantity?: number;
}
