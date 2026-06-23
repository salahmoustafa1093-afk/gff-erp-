import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConvertLeadDto {
  @ApiPropertyOptional({ description: 'Customer code for new customer' })
  @IsOptional()
  @IsString()
  customerCode?: string;

  @ApiPropertyOptional({ description: 'Override customer name' })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiPropertyOptional({ description: 'Create contact as well' })
  @IsOptional()
  @IsBoolean()
  createContact?: boolean;

  @ApiPropertyOptional({ description: 'Initial sales order' })
  @IsOptional()
  @IsBoolean()
  createOpportunity?: boolean;

  @ApiPropertyOptional({ description: 'Opportunity estimated value' })
  @IsOptional()
  @IsNumber()
  opportunityValue?: number;

  @ApiPropertyOptional({ description: 'Notes for the conversion' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Price list ID to assign' })
  @IsOptional()
  @IsUUID()
  priceListId?: string;

  @ApiPropertyOptional({ description: 'Sales rep ID override' })
  @IsOptional()
  @IsUUID()
  salesRepId?: string;

  @ApiPropertyOptional({ description: 'Payment terms in days' })
  @IsOptional()
  @IsNumber()
  paymentTerms?: number;

  @ApiPropertyOptional({ description: 'Credit limit' })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;
}
