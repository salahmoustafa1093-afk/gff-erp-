import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MortalityCause } from '../interfaces/poultry.interface';

export class RecordMortalityDto {
  @ApiProperty({ description: 'Chicks batch ID' })
  @IsString()
  @IsNotEmpty()
  chicksBatchId: string;

  @ApiProperty({ description: 'Date of mortality' })
  @IsDateString()
  recordDate: string;

  @ApiProperty({ description: 'Number of chicks lost', minimum: 1 })
  @IsInt()
  @Min(1)
  count: number;

  @ApiProperty({ enum: MortalityCause, description: 'Cause of mortality' })
  @IsEnum(MortalityCause)
  cause: MortalityCause;

  @ApiPropertyOptional({ description: 'Description/notes about the mortality incident' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class MortalityRecordFilterDto {
  @ApiPropertyOptional({ description: 'Filter by batch ID' })
  @IsString()
  @IsOptional()
  chicksBatchId?: string;

  @ApiPropertyOptional({ enum: MortalityCause, description: 'Filter by cause' })
  @IsEnum(MortalityCause)
  @IsOptional()
  cause?: MortalityCause;

  @ApiPropertyOptional({ description: 'Date from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  limit?: number;
}
