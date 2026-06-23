import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsDateString,
  IsEnum,
  IsString,
  IsOptional,
  IsNumber,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttendanceStatus } from './create-attendance.dto';

export class DailyAttendanceSummaryDto {
  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Total employees' })
  totalEmployees: number;

  @ApiProperty({ description: 'Present count' })
  present: number;

  @ApiProperty({ description: 'Absent count' })
  absent: number;

  @ApiProperty({ description: 'Late count' })
  late: number;

  @ApiProperty({ description: 'Half day count' })
  halfDay: number;

  @ApiProperty({ description: 'On leave count' })
  onLeave: number;

  @ApiProperty({ description: 'Holiday count' })
  holiday: number;

  @ApiProperty({ description: 'Total overtime hours' })
  totalOvertimeHours: number;

  @ApiProperty({ description: 'Average working hours' })
  averageWorkingHours: number;
}

export class EmployeeAttendanceSummaryDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Department' })
  department: string;

  @ApiProperty({ description: 'Total days' })
  totalDays: number;

  @ApiProperty({ description: 'Present days' })
  presentDays: number;

  @ApiProperty({ description: 'Absent days' })
  absentDays: number;

  @ApiProperty({ description: 'Late days' })
  lateDays: number;

  @ApiProperty({ description: 'Half days' })
  halfDays: number;

  @ApiProperty({ description: 'On leave days' })
  onLeaveDays: number;

  @ApiProperty({ description: 'Holiday days' })
  holidayDays: number;

  @ApiProperty({ description: 'Total working hours' })
  totalWorkingHours: number;

  @ApiProperty({ description: 'Total overtime hours' })
  totalOvertimeHours: number;

  @ApiProperty({ description: 'Late arrival count' })
  lateArrivalCount: number;

  @ApiProperty({ description: 'Total late minutes' })
  totalLateMinutes: number;

  @ApiProperty({ description: 'Attendance rate %' })
  attendanceRate: number;
}

export class LateArrivalReportDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Department' })
  department: string;

  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Check-in time' })
  checkIn: string;

  @ApiProperty({ description: 'Late minutes' })
  lateMinutes: number;

  @ApiProperty({ description: 'Shift start time' })
  shiftStartTime?: string;

  @ApiProperty({ description: 'Notes' })
  notes?: string;
}

export class OvertimeReportDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Department' })
  department: string;

  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Working hours' })
  workingHours: number;

  @ApiProperty({ description: 'Overtime hours' })
  overtimeHours: number;

  @ApiProperty({ description: 'Notes' })
  notes?: string;
}

export class AbsenceReportDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Department' })
  department: string;

  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Notes' })
  notes?: string;
}
