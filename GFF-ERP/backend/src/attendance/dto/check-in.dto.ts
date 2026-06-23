import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CheckInDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({ description: 'Date (defaults to today)', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Check-in time (defaults to now)', example: '08:30' })
  @IsOptional()
  @IsString()
  @Length(5, 8)
  checkInTime?: string;

  @ApiPropertyOptional({ description: 'Location / GPS coordinates' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CheckOutDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiPropertyOptional({ description: 'Date (defaults to today)', example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ description: 'Check-out time (defaults to now)', example: '17:30' })
  @IsOptional()
  @IsString()
  @Length(5, 8)
  checkOutTime?: string;

  @ApiPropertyOptional({ description: 'Location / GPS coordinates' })
  @IsOptional()
  @IsString()
  @Length(1, 255)
  location?: string;

  @ApiPropertyOptional({ description: 'Work summary / notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
