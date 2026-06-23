import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { CheckInDto, CheckOutDto } from './dto/check-in.dto';
import {
  AttendanceFilterDto,
  AttendanceReportFilterDto,
} from './dto/attendance-filter.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // Check-in endpoint
  @Post('check-in')
  @Roles('HR_ADMIN', 'ADMIN', 'HR_USER', 'MANAGER')
  @ApiOperation({ summary: 'Record employee check-in' })
  @ApiResponse({ status: 201, description: 'Check-in recorded successfully' })
  @ApiResponse({ status: 409, description: 'Already checked in' })
  async checkIn(
    @Body() dto: CheckInDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.attendanceService.checkIn(dto, req.user.userId);
  }

  // Check-out endpoint
  @Post('check-out')
  @Roles('HR_ADMIN', 'ADMIN', 'HR_USER', 'MANAGER')
  @ApiOperation({ summary: 'Record employee check-out' })
  @ApiResponse({ status: 200, description: 'Check-out recorded successfully' })
  @ApiResponse({ status: 404, description: 'No check-in record found' })
  async checkOut(
    @Body() dto: CheckOutDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.attendanceService.checkOut(dto, req.user.userId);
  }

  // Create attendance record
  @Post()
  @Roles('HR_ADMIN', 'ADMIN', 'HR_USER')
  @ApiOperation({ summary: 'Create attendance record' })
  @ApiResponse({ status: 201, description: 'Attendance record created' })
  @ApiResponse({ status: 409, description: 'Record already exists for this date' })
  async create(
    @Body() dto: CreateAttendanceDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.attendanceService.create(dto, req.user.userId);
  }

  // Bulk attendance entry
  @Post('bulk')
  @Roles('HR_ADMIN', 'ADMIN', 'HR_USER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk attendance entry for a date' })
  @ApiResponse({ status: 200, description: 'Bulk attendance processed' })
  async bulkCreate(
    @Body() dto: BulkAttendanceDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.attendanceService.bulkCreate(dto, req.user.userId);
  }

  // Get all attendance records
  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get attendance records with filtering' })
  async findAll(
    @Query() filter: AttendanceFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.attendanceService.findAll(filter);
  }

  // Get today's attendance
  @Get('today')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: "Get today's attendance overview" })
  async getToday(
    @Request() req: { user: { branchId?: string } },
    @Query('departmentId') departmentId?: string,
  ) {
    return this.attendanceService.getToday(req.user.branchId, departmentId);
  }

  // Get attendance by ID
  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get attendance record by ID' })
  @ApiParam({ name: 'id', description: 'Attendance record UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.attendanceService.findOne(id);
  }

  // Update attendance record
  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'HR_USER')
  @ApiOperation({ summary: 'Update attendance record' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAttendanceDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.attendanceService.update(id, dto, req.user.userId);
  }

  // Delete attendance record
  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete attendance record' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.attendanceService.remove(id, req.user.userId);
  }

  // Monthly summary for employee
  @Get('employee/:employeeId/monthly-summary')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get monthly attendance summary for employee' })
  async getMonthlySummary(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query('month', ParseIntPipe) month: number,
    @Query('year', ParseIntPipe) year: number,
  ) {
    return this.attendanceService.getMonthlySummary(employeeId, month, year);
  }

  // Department-wise summary
  @Get('summary/department')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get department-wise attendance summary' })
  async getDepartmentSummary(
    @Query('date') date?: string,
    @Request() req?: { user: { branchId?: string } },
  ) {
    return this.attendanceService.getDepartmentSummary(
      date,
      req?.user?.branchId,
    );
  }

  // Late arrivals report
  @Get('reports/late-arrivals')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get late arrivals report' })
  async getLateArrivalsReport(
    @Query() filter: AttendanceReportFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.attendanceService.getLateArrivalsReport(filter);
  }

  // Absence report
  @Get('reports/absences')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get absence report' })
  async getAbsenceReport(
    @Query() filter: AttendanceReportFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.attendanceService.getAbsenceReport(filter);
  }

  // Overtime report
  @Get('reports/overtime')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get overtime report' })
  async getOvertimeReport(
    @Query() filter: AttendanceReportFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.attendanceService.getOvertimeReport(filter);
  }

  // Working hours summary
  @Get('reports/working-hours')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get working hours summary' })
  async getWorkingHoursSummary(
    @Query() filter: AttendanceReportFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.attendanceService.getWorkingHoursSummary(filter);
  }

  // Mark holiday
  @Post('mark-holiday')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark date as holiday for all employees' })
  async markHoliday(
    @Body() dto: { date: string; branchId?: string },
    @Request() req: { user: { userId: string; branchId?: string } },
  ) {
    return this.attendanceService.markHoliday(
      dto.date,
      dto.branchId || req.user.branchId,
      req.user.userId,
    );
  }
}
