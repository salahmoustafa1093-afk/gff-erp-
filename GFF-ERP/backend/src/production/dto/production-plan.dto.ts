import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, IsEnum, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlanningPeriod, ProductionPlanStatus } from '../interfaces/production.interface';

export class ProductionPlanLineDto {
  @ApiPropertyOptional({ description: 'Product ID' })
  @IsString()
  @IsOptional()
  productId?: string;

  @ApiPropertyOptional({ description: 'Feed formula ID' })
  @IsString()
  @IsOptional()
  feedFormulaId?: string;

  @ApiProperty({ description: 'Target quantity', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  targetQuantity: number;

  @ApiPropertyOptional({ description: 'Unit cost per unit' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  unitCost?: number;

  @ApiPropertyOptional({ description: 'Line start date' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Line end date' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Line notes' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Display order' })
  @IsOptional()
  sortOrder?: number;
}

export class CreateProductionPlanDto {
  @ApiProperty({ description: 'Plan name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PlanningPeriod, description: 'Planning period' })
  @IsEnum(PlanningPeriod)
  period: PlanningPeriod;

  @ApiProperty({ description: 'Plan start date' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Plan end date' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ description: 'Target feed production in KG', minimum: 0 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  targetFeedProductionKg?: number;

  @ApiPropertyOptional({ description: 'Target egg production count', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  targetEggProductionCount?: number;

  @ApiPropertyOptional({ description: 'Target chicks count', minimum: 0 })
  @IsNumber()
  @IsOptional()
  @Min(0)
  targetChicksCount?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ type: [ProductionPlanLineDto], description: 'Plan lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionPlanLineDto)
  @IsOptional()
  lines?: ProductionPlanLineDto[];
}

export class UpdateProductionPlanDto {
  @ApiPropertyOptional({ description: 'Plan name' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Plan description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ProductionPlanStatus, description: 'Plan status' })
  @IsEnum(ProductionPlanStatus)
  @IsOptional()
  status?: ProductionPlanStatus;

  @ApiPropertyOptional({ description: 'Target feed production in KG' })
  @IsNumber({ maxDecimalPlaces: 4 })
  @IsOptional()
  @Min(0)
  targetFeedProductionKg?: number;

  @ApiPropertyOptional({ description: 'Target egg production count' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  targetEggProductionCount?: number;

  @ApiPropertyOptional({ description: 'Target chicks count' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  targetChicksCount?: number;

  @ApiPropertyOptional({ type: [ProductionPlanLineDto], description: 'Plan lines' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductionPlanLineDto)
  @IsOptional()
  lines?: ProductionPlanLineDto[];
}

export class ProductionPlanFilterDto {
  @ApiPropertyOptional({ description: 'Search by name or plan number' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ enum: PlanningPeriod, description: 'Filter by period' })
  @IsEnum(PlanningPeriod)
  @IsOptional()
  period?: PlanningPeriod;

  @ApiPropertyOptional({ enum: ProductionPlanStatus, description: 'Filter by status' })
  @IsEnum(ProductionPlanStatus)
  @IsOptional()
  status?: ProductionPlanStatus;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}
