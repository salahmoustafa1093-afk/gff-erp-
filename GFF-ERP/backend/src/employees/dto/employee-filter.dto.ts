import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EmployeeStatus, EmploymentType } from './create-employee.dto';

export class EmployeeFilterDto {
  @ApiPropertyOptional({ description: 'Search by name, email, or employee number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: EmployeeStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(EmployeeStatus)
  status?: EmployeeStatus;

  @ApiPropertyOptional({ description: 'Filter by department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Filter by job title ID' })
  @IsOptional()
  @IsUUID()
  jobTitleId?: string;

  @ApiPropertyOptional({ enum: EmploymentType, description: 'Filter by employment type' })
  @IsOptional()
  @IsEnum(EmploymentType)
  employmentType?: EmploymentType;

  @ApiPropertyOptional({ description: 'Filter by supervisor ID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Hire date from' })
  @IsOptional()
  @IsDateString()
  hireDateFrom?: string;

  @ApiPropertyOptional({ description: 'Hire date to' })
  @IsOptional()
  @IsDateString()
  hireDateTo?: string;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  pageSize?: number = 20;

  @ApiPropertyOptional({ description: 'Sort field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';
}
