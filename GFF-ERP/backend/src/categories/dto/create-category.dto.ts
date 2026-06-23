import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ description: 'Category name', example: 'Animal Feed' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Category code', example: 'FEED-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Description of the category', example: 'All types of animal feed products' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Parent category ID for hierarchical structure', example: null })
  @IsOptional()
  @IsString()
  parentId?: string | null;

  @ApiPropertyOptional({ description: 'Category level in hierarchy', example: 1 })
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({ description: 'Display order', example: 1 })
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: 'Category image/icon URL', example: 'https://cdn.example.com/icon.png' })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Color code for UI display', example: '#4CAF50' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  colorCode?: string;

  @ApiPropertyOptional({ description: 'Whether category is active', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Additional notes', example: 'Main category for feed products' })
  @IsOptional()
  @IsString()
  notes?: string;
}
