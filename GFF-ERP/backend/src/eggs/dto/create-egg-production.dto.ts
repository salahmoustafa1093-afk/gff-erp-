import { IsString, IsNotEmpty, IsOptional, IsInt, Min, IsDateString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateEggProductionDto {
  @ApiProperty({ description: 'Chicks batch ID (layer batch)' })
  @IsString()
  @IsNotEmpty()
  chicksBatchId: string;

  @ApiProperty({ description: 'Collection date' })
  @IsDateString()
  collectionDate: string;

  @ApiPropertyOptional({ description: 'Collection time (HH:MM)' })
  @IsString()
  @IsOptional()
  collectionTime?: string;

  @ApiPropertyOptional({ description: 'Collector name' })
  @IsString()
  @IsOptional()
  collectorName?: string;

  @ApiProperty({ description: 'Good large eggs', minimum: 0 })
  @IsInt()
  @Min(0)
  goodLarge: number;

  @ApiProperty({ description: 'Good medium eggs', minimum: 0 })
  @IsInt()
  @Min(0)
  goodMedium: number;

  @ApiProperty({ description: 'Good small eggs', minimum: 0 })
  @IsInt()
  @Min(0)
  goodSmall: number;

  @ApiPropertyOptional({ description: 'Dirty large eggs', minimum: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  dirtyLarge?: number;

  @ApiPropertyOptional({ description: 'Dirty medium eggs', minimum: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  dirtyMedium?: number;

  @ApiPropertyOptional({ description: 'Dirty small eggs', minimum: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  dirtySmall?: number;

  @ApiPropertyOptional({ description: 'Broken large eggs', minimum: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  brokenLarge?: number;

  @ApiPropertyOptional({ description: 'Broken medium eggs', minimum: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  brokenMedium?: number;

  @ApiPropertyOptional({ description: 'Broken small eggs', minimum: 0, default: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  brokenSmall?: number;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Collection notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateEggProductionDto {
  @ApiPropertyOptional({ description: 'Collection date' })
  @IsDateString()
  @IsOptional()
  collectionDate?: string;

  @ApiPropertyOptional({ description: 'Collection time (HH:MM)' })
  @IsString()
  @IsOptional()
  collectionTime?: string;

  @ApiPropertyOptional({ description: 'Collector name' })
  @IsString()
  @IsOptional()
  collectorName?: string;

  @ApiPropertyOptional({ description: 'Good large eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  goodLarge?: number;

  @ApiPropertyOptional({ description: 'Good medium eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  goodMedium?: number;

  @ApiPropertyOptional({ description: 'Good small eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  goodSmall?: number;

  @ApiPropertyOptional({ description: 'Dirty large eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  dirtyLarge?: number;

  @ApiPropertyOptional({ description: 'Dirty medium eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  dirtyMedium?: number;

  @ApiPropertyOptional({ description: 'Dirty small eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  dirtySmall?: number;

  @ApiPropertyOptional({ description: 'Broken large eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  brokenLarge?: number;

  @ApiPropertyOptional({ description: 'Broken medium eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  brokenMedium?: number;

  @ApiPropertyOptional({ description: 'Broken small eggs', minimum: 0 })
  @IsInt()
  @IsOptional()
  @Min(0)
  brokenSmall?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
