import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export class AddStopDto {
  @ApiProperty({ description: 'Stop sequence number', example: 1 })
  @IsInt()
  @Min(1)
  sequenceNumber: number;

  @ApiProperty({ description: 'Stop type', enum: ['PICKUP', 'DELIVERY', 'TRANSFER', 'OTHER'] })
  @IsString()
  @IsNotEmpty()
  stopType: 'PICKUP' | 'DELIVERY' | 'TRANSFER' | 'OTHER';

  @ApiProperty({ description: 'Location/address for the stop', example: '123 Main St, Accra' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  location: string;

  @ApiPropertyOptional({ description: 'Customer or contact name at stop' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact phone at stop' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Sales order ID for delivery stops' })
  @IsUUID()
  @IsOptional()
  salesOrderId?: string;

  @ApiPropertyOptional({ description: 'Purchase order ID for pickup stops' })
  @IsUUID()
  @IsOptional()
  purchaseOrderId?: string;

  @ApiPropertyOptional({ description: 'Invoice ID for proof of delivery link' })
  @IsUUID()
  @IsOptional()
  invoiceId?: string;

  @ApiPropertyOptional({ description: 'Expected arrival time at stop' })
  @IsDateString()
  @IsOptional()
  expectedArrival?: string;

  @ApiPropertyOptional({ description: 'Special instructions for this stop' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  specialInstructions?: string;

  @ApiPropertyOptional({ description: 'Latitude coordinate' })
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude coordinate' })
  @IsNumber()
  @IsOptional()
  longitude?: number;
}

export class UpdateStopDto {
  @ApiPropertyOptional({ description: 'Stop sequence number' })
  @IsInt()
  @Min(1)
  @IsOptional()
  sequenceNumber?: number;

  @ApiPropertyOptional({ description: 'Stop type', enum: ['PICKUP', 'DELIVERY', 'TRANSFER', 'OTHER'] })
  @IsString()
  @IsOptional()
  stopType?: 'PICKUP' | 'DELIVERY' | 'TRANSFER' | 'OTHER';

  @ApiPropertyOptional({ description: 'Location/address for the stop' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  location?: string;

  @ApiPropertyOptional({ description: 'Customer or contact name at stop' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact phone at stop' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Expected arrival time at stop' })
  @IsDateString()
  @IsOptional()
  expectedArrival?: string;

  @ApiPropertyOptional({ description: 'Special instructions for this stop' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  specialInstructions?: string;
}

export class CompleteStopDto {
  @ApiProperty({ description: 'Actual arrival time' })
  @IsDateString()
  @IsNotEmpty()
  actualArrival: string;

  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  notes?: string;

  @ApiPropertyOptional({ description: 'Proof of delivery - signed by' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  podSignedBy?: string;

  @ApiPropertyOptional({ description: 'Proof of delivery - signature URL' })
  @IsString()
  @IsOptional()
  podSignatureUrl?: string;

  @ApiPropertyOptional({ description: 'Proof of delivery - photo URL' })
  @IsString()
  @IsOptional()
  podPhotoUrl?: string;

  @ApiPropertyOptional({ description: 'Proof of delivery - notes' })
  @IsString()
  @IsOptional()
  podNotes?: string;
}
