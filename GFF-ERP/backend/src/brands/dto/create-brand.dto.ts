import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBrandDto {
  @ApiProperty({ description: 'Brand name', example: 'NutriFeed' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Brand code/sku prefix', example: 'NF' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  code?: string;

  @ApiPropertyOptional({ description: 'Brand description', example: 'Premium animal nutrition products' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Brand logo URL', example: 'https://cdn.example.com/logo.png' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Country of origin', example: 'Morocco' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  countryOfOrigin?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'contact@nutrifeed.ma' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+212-522-123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Website URL', example: 'https://nutrifeed.ma' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Whether brand is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Main supplier for poultry feed' })
  @IsOptional()
  @IsString()
  notes?: string;
}
