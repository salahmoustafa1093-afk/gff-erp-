import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { CostCenterType } from '../interfaces/cost-center.interface';

export class CreateCostCenterDto {
  @ApiProperty({
    description: 'Cost center code',
    example: 'CC-001',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({
    description: 'Cost center name',
    example: 'Sales Department',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    description: 'Cost center name in Arabic',
    example: 'قسم المبيعات',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiProperty({
    description: 'Cost center type',
    enum: CostCenterType,
    example: CostCenterType.DEPARTMENT,
  })
  @IsEnum(CostCenterType)
  type: CostCenterType;

  @ApiPropertyOptional({
    description: 'Parent cost center ID',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Description',
    example: 'Main sales operations department',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Budget amount',
    example: 50000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetAmount?: number;
}
