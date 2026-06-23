import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  ON_LEAVE = 'ON_LEAVE',
  HOLIDAY = 'HOLIDAY',
  EARLY_DEPARTURE = 'EARLY_DEPARTURE',
}

export class CreateAttendanceDto {
  @ApiProperty({ description: 'Employee ID' })
  @IsUUID()
  employeeId: string;

  @ApiProperty({ description: 'Attendance date', example: '2024-01-15' })
  @IsDateString()
  date: string;

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

  @ApiPropertyOptional({ description: 'Late arrival minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lateMinutes?: number;

  @ApiPropertyOptional({ description: 'Early departure minutes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  earlyDepartureMinutes?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
