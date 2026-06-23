import { IsString, IsOptional, IsBoolean, IsEnum, IsInt, Min, MaxLength, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WarehouseType {
  MAIN = 'MAIN',
  SUB = 'SUB',
  STORAGE = 'STORAGE',
  TRANSIT = 'TRANSIT',
  DAMAGED = 'DAMAGED',
  QUARANTINE = 'QUARANTINE',
}

export class CreateWarehouseDto {
  @ApiProperty({ description: 'Warehouse name', example: 'Main Warehouse A' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Warehouse code', example: 'WH-A-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiProperty({ description: 'Warehouse type', enum: WarehouseType, example: 'MAIN' })
  @IsEnum(WarehouseType)
  type: WarehouseType;

  @ApiPropertyOptional({ description: 'Branch ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Address', example: '123 Industrial Zone' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Max capacity in KG', example: 100000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxCapacity?: number;

  @ApiPropertyOptional({ description: 'Current usage in KG', example: 45000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  currentUsage?: number;

  @ApiPropertyOptional({ description: 'Storage temperature control', example: 'AMBIENT' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  temperatureControl?: string;

  @ApiPropertyOptional({ description: 'Whether warehouse is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Warehouse description', example: 'Main storage for finished goods' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Manager name', example: 'Ahmed Benali' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  managerName?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+212-522-123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Allow negative inventory', example: false })
  @IsOptional()
  @IsBoolean()
  allowNegativeStock?: boolean;

  @ApiPropertyOptional({ description: 'Notes', example: 'Climate controlled zone' })
  @IsOptional()
  @IsString()
  notes?: string;
}
