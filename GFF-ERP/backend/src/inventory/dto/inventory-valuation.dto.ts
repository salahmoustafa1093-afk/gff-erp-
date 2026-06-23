import { IsOptional, IsUUID, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ValuationMethod } from './inventory-filter.dto';

export class InventoryValuationDto {
  @ApiPropertyOptional({ description: 'Valuation method', enum: ValuationMethod, example: 'FIFO' })
  @IsOptional()
  @IsEnum(ValuationMethod)
  method?: ValuationMethod;

  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'As of date (ISO)', example: '2024-01-31' })
  @IsOptional()
  @IsDateString()
  asOfDate?: string;
}
