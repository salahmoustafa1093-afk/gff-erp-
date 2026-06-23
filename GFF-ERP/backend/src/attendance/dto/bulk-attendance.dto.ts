import { ApiProperty } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  ValidateNested,
  ArrayMinSize,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from './create-attendance.dto';

export class BulkAttendanceEntryDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ enum: AttendanceStatus, description: 'Attendance status' })
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({ description: 'Check-in time', example: '08:30' })
  @IsOptional()
  @IsString()
  @Length(5, 8)
  checkIn?: string;

  @ApiPropertyOptional({ description: 'Check-out time', example: '17:30' })
  @IsOptional()
  @IsString()
  @Length(5, 8)
  checkOut?: string;

  @ApiPropertyOptional({ description: 'Working hours' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @Type(() => Number)
  workingHours?: number;

  @ApiPropertyOptional({ description: 'Overtime hours' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(24)
  @Type(() => Number)
  overtimeHours?: number;

  @ApiPropertyOptional({ description: 'Late minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lateMinutes?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class BulkAttendanceDto {
  @ApiProperty({ description: 'Date for attendance entries', example: '2024-01-15' })
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Attendance entries',
    type: [BulkAttendanceEntryDto],
  })
  @ValidateNested({ each: true })
  @Type(() => BulkAttendanceEntryDto)
  @ArrayMinSize(1)
  entries: BulkAttendanceEntryDto[];
}
