import { IsString, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SalesReportDto {
  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsString()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Customer ID' })
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Sales rep ID' })
  @IsOptional()
  @IsString()
  salesRepId?: string;

  @ApiPropertyOptional({ description: 'Product ID' })
  @IsOptional()
  @IsString()
  productId?: string;

  @ApiPropertyOptional({ description: 'Start date' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Group by: day, week, month, quarter, year', example: 'month' })
  @IsOptional()
  @IsString()
  groupBy?: 'day' | 'week' | 'month' | 'quarter' | 'year';

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', default: 50 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}

export class SalesReportItemDto {
  @ApiProperty({ description: 'Period label' })
  period: string;

  @ApiProperty({ description: 'Total orders' })
  totalOrders: number;

  @ApiProperty({ description: 'Total quantity sold' })
  totalQuantity: number;

  @ApiProperty({ description: 'Gross sales amount' })
  grossAmount: number;

  @ApiProperty({ description: 'Total discounts' })
  totalDiscounts: number;

  @ApiProperty({ description: 'Total tax' })
  totalTax: number;

  @ApiProperty({ description: 'Net sales amount' })
  netAmount: number;

  @ApiProperty({ description: 'Total cost of goods sold' })
  totalCogs: number;

  @ApiProperty({ description: 'Gross profit' })
  grossProfit: number;

  @ApiProperty({ description: 'Gross profit margin %' })
  grossProfitMargin: number;
}
