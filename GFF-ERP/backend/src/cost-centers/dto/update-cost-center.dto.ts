import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  IsNumber,
  Min,
} from 'class-validator';
import { CostCenterType, CostCenterStatus } from '../interfaces/cost-center.interface';

export class UpdateCostCenterDto {
  @ApiPropertyOptional({
    description: 'Cost center name',
    example: 'Sales Department - Updated',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    description: 'Cost center name in Arabic',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  nameAr?: string;

  @ApiPropertyOptional({
    description: 'Cost center type',
    enum: CostCenterType,
  })
  @IsEnum(CostCenterType)
  @IsOptional()
  type?: CostCenterType;

  @ApiPropertyOptional({
    description: 'Parent cost center ID',
  })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Budget amount',
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  budgetAmount?: number;

  @ApiPropertyOptional({
    description: 'Status',
    enum: CostCenterStatus,
  })
  @IsEnum(CostCenterStatus)
  @IsOptional()
  status?: CostCenterStatus;
}
