import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateAttendanceDto, AttendanceStatus } from './dto/create-attendance.dto';
import { CheckInDto, CheckOutDto } from './dto/check-in.dto';
import {
  AttendanceFilterDto,
  AttendanceReportFilterDto,
} from './dto/attendance-filter.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // Create attendance record
  async create(dto: CreateAttendanceDto, userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
    });
    if (!employee) {
      throw new NotFoundException(
        `Employee '${dto.employeeId}' not found`,
      );
    }

    // Check if record already exists for this date
    const existing = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
      },
    });
    if (existing) {
      throw new ConflictException(
        `Attendance record already exists for employee on ${dto.date}`,
      );
    }

    const record = await this.prisma.attendanceRecord.create({
      data: {
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        status: dto.status,
        checkIn: dto.checkIn || null,
        checkOut: dto.checkOut || null,
        workingHours: dto.workingHours ?? null,
        overtimeHours: dto.overtimeHours ?? null,
        lateMinutes: dto.lateMinutes ?? null,
        earlyDepartureMinutes: dto.earlyDepartureMinutes ?? null,
        notes: dto.notes || null,
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
          },
        },
      },
    });

    await this.audit.log({
      action: 'ATTENDANCE_CREATED',
      entity: 'AttendanceRecord',
      entityId: record.id,
      userId,
      details: {
        employeeId: dto.employeeId,
        date: dto.date,
        status: dto.status,
      },
    });

    return record;
  }

  // Process check-in
  async checkIn(dto: CheckInDto, userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { shift: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${dto.employeeId}' not found`);
    }

    if (employee.status === 'TERMINATED') {
      throw new BadRequestException('Cannot check in terminated employee');
    }

    const today = dto.date ? new Date(dto.date) : new Date();
    today.setHours(0, 0, 0, 0);

    // Check for existing record
    let record = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: today,
      },
    });

    const checkInTime = dto.checkInTime || this.getCurrentTimeString();
    const shiftStartTime = employee.shift?.startTime || '08:00';
    const lateMinutes = this.calculateLateMinutes(checkInTime, shiftStartTime);

    if (record) {
      // Update existing record with check-in
      if (record.checkIn) {
        throw new ConflictException('Employee already checked in today');
      }

      const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      record = await this.prisma.attendanceRecord.update({
        where: { id: record.id },
        data: {
          checkIn: checkInTime,
          status,
          lateMinutes: lateMinutes > 0 ? lateMinutes : null,
          location: dto.location || null,
          notes: dto.notes || null,
        },
        include: {
          employee: {
            select: {
              employeeNumber: true,
              displayName: true,
            },
          },
        },
      });
    } else {
      // Create new record with check-in
      const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

      record = await this.prisma.attendanceRecord.create({
        data: {
          employeeId: dto.employeeId,
          date: today,
          checkIn: checkInTime,
          status,
          lateMinutes: lateMinutes > 0 ? lateMinutes : null,
          location: dto.location || null,
          notes: dto.notes || null,
        },
        include: {
          employee: {
            select: {
              employeeNumber: true,
              displayName: true,
            },
          },
        },
      });
    }

    await this.audit.log({
      action: 'ATTENDANCE_CHECK_IN',
      entity: 'AttendanceRecord',
      entityId: record.id,
      userId,
      details: {
        employeeId: dto.employeeId,
        checkIn: checkInTime,
        lateMinutes: lateMinutes > 0 ? lateMinutes : 0,
        status: record.status,
      },
    });

    return {
      ...record,
      lateMinutes: lateMinutes > 0 ? lateMinutes : 0,
      message:
        lateMinutes > 0
          ? `Checked in at ${checkInTime} (${lateMinutes} minutes late)`
          : `Checked in at ${checkInTime}`,
    };
  }

  // Process check-out
  async checkOut(dto: CheckOutDto, userId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: { shift: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${dto.employeeId}' not found`);
    }

    const today = dto.date ? new Date(dto.date) : new Date();
    today.setHours(0, 0, 0, 0);

    const record = await this.prisma.attendanceRecord.findFirst({
      where: {
        employeeId: dto.employeeId,
        date: today,
      },
    });

    if (!record) {
      throw new NotFoundException(
        'No check-in record found for today. Please check in first.',
      );
    }

    if (record.checkOut) {
      throw new ConflictException('Employee already checked out today');
    }

    const checkOutTime = dto.checkOutTime || this.getCurrentTimeString();
    const shiftEndTime = employee.shift?.endTime || '17:00';
    const checkInMinutes = this.timeToMinutes(record.checkIn || '00:00');
    const checkOutMinutes = this.timeToMinutes(checkOutTime);
    const shiftEndMinutes = this.timeToMinutes(shiftEndTime);

    // Calculate working hours
    let workingMinutes = checkOutMinutes - checkInMinutes;
    if (workingMinutes < 0) workingMinutes += 24 * 60; // Crossed midnight
    const workingHours = Math.round((workingMinutes / 60) * 100) / 100;

    // Calculate overtime (after shift end)
    let overtimeMinutes = checkOutMinutes - shiftEndMinutes;
    if (overtimeMinutes < 0) overtimeMinutes = 0;
    const overtimeHours = Math.round((overtimeMinutes / 60) * 100) / 100;

    // Early departure
    let earlyDepartureMinutes = 0;
    if (checkOutMinutes < shiftEndMinutes) {
      earlyDepartureMinutes = shiftEndMinutes - checkOutMinutes;
    }

    // Determine status
    let status = record.status;
    if (earlyDepartureMinutes > 0) {
      status = AttendanceStatus.EARLY_DEPARTURE;
    }

    const updated = await this.prisma.attendanceRecord.update({
      where: { id: record.id },
      data: {
        checkOut: checkOutTime,
        workingHours,
        overtimeHours: overtimeHours > 0 ? overtimeHours : null,
        earlyDepartureMinutes: earlyDepartureMinutes > 0 ? earlyDepartureMinutes : null,
        status,
        location: dto.location || record.location,
        notes: dto.notes || record.notes,
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
          },
        },
      },
    });

    await this.audit.log({
      action: 'ATTENDANCE_CHECK_OUT',
      entity: 'AttendanceRecord',
      entityId: record.id,
      userId,
      details: {
        employeeId: dto.employeeId,
        checkOut: checkOutTime,
        workingHours,
        overtimeHours,
        earlyDepartureMinutes,
      },
    });

    return {
      ...updated,
      workingHours,
      overtimeHours,
      earlyDepartureMinutes: earlyDepartureMinutes > 0 ? earlyDepartureMinutes : 0,
      message:
        overtimeHours > 0
          ? `Checked out at ${checkOutTime} (${overtimeHours}h overtime)`
          : earlyDepartureMinutes > 0
            ? `Checked out at ${checkOutTime} (${Math.ceil(earlyDepartureMinutes)}m early)`
            : `Checked out at ${checkOutTime}`,
    };
  }

  // Find all with filtering
  async findAll(filter: AttendanceFilterDto) {
    const where: Prisma.AttendanceRecordWhereInput = {};

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.status) where.status = filter.status;

    if (filter.date) {
      const d = new Date(filter.date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    if (filter.dateFrom || filter.dateTo) {
      where.date = {};
      if (filter.dateFrom) where.date.gte = new Date(filter.dateFrom);
      if (filter.dateTo) {
        const d = new Date(filter.dateTo);
        d.setHours(23, 59, 59, 999);
        where.date.lte = d;
      }
    }

    // Filter by department through employee relation
    const includeEmployee = filter.departmentId || filter.branchId || filter.search;
    const employeeWhere: Prisma.EmployeeWhereInput = {};
    if (filter.departmentId) employeeWhere.departmentId = filter.departmentId;
    if (filter.branchId) employeeWhere.branchId = filter.branchId;
    if (filter.search) {
      employeeWhere.OR = [
        { displayName: { contains: filter.search, mode: 'insensitive' } },
        { employeeNumber: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (Object.keys(employeeWhere).length > 0) {
      where.employee = employeeWhere;
    }

    const skip = ((filter.page || 1) - 1) * (filter.pageSize || 20);
    const take = filter.pageSize || 20;

    const [data, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [filter.sortBy || 'date']: filter.sortOrder || 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              employeeNumber: true,
              displayName: true,
              department: { select: { name: true } },
              branch: { select: { name: true } },
              shift: { select: { name: true, startTime: true, endTime: true } },
            },
          },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return { data, total, page: filter.page || 1, pageSize: filter.pageSize || 20 };
  }

  // Get today's attendance
  async getToday(branchId?: string, departmentId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: Prisma.AttendanceRecordWhereInput = { date: today };
    const employeeWhere: Prisma.EmployeeWhereInput = {};
    if (branchId) employeeWhere.branchId = branchId;
    if (departmentId) employeeWhere.departmentId = departmentId;
    if (Object.keys(employeeWhere).length > 0) {
      where.employee = employeeWhere;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
            shift: { select: { startTime: true, endTime: true } },
          },
        },
      },
      orderBy: { checkIn: 'desc' },
    });

    // Also get employees without attendance records
    const employeesWithRecords = records.map((r) => r.employeeId);
    const missingWhere: Prisma.EmployeeWhereInput = {
      id: { notIn: employeesWithRecords },
      status: { not: 'TERMINATED' },
    };
    if (branchId) missingWhere.branchId = branchId;
    if (departmentId) missingWhere.departmentId = departmentId;

    const missingEmployees = await this.prisma.employee.findMany({
      where: missingWhere,
      select: {
        id: true,
        employeeNumber: true,
        displayName: true,
        department: { select: { name: true } },
        status: true,
      },
    });

    const summary = {
      totalPresent: records.filter((r) => r.status === 'PRESENT').length,
      totalLate: records.filter((r) => r.status === 'LATE').length,
      totalAbsent: records.filter((r) => r.status === 'ABSENT').length,
      totalHalfDay: records.filter((r) => r.status === 'HALF_DAY').length,
      totalOnLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
      totalHoliday: records.filter((r) => r.status === 'HOLIDAY').length,
      totalEarlyDeparture: records.filter(
        (r) => r.status === 'EARLY_DEPARTURE',
      ).length,
      totalOvertimeHours: records.reduce(
        (sum, r) => sum + (r.overtimeHours ? Number(r.overtimeHours) : 0),
        0,
      ),
      notCheckedIn: missingEmployees.length,
    };

    return { records, missingEmployees, summary };
  }

  // Find one by ID
  async findOne(id: string) {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
            shift: { select: { name: true, startTime: true, endTime: true } },
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Attendance record '${id}' not found`);
    }

    return record;
  }

  // Update attendance record
  async update(id: string, dto: CreateAttendanceDto, userId: string) {
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Attendance record '${id}' not found`);
    }

    const data: Prisma.AttendanceRecordUpdateInput = {};

    if (dto.status !== undefined) data.status = dto.status;
    if (dto.checkIn !== undefined) data.checkIn = dto.checkIn || null;
    if (dto.checkOut !== undefined) data.checkOut = dto.checkOut || null;
    if (dto.workingHours !== undefined)
      data.workingHours = dto.workingHours ?? null;
    if (dto.overtimeHours !== undefined)
      data.overtimeHours = dto.overtimeHours ?? null;
    if (dto.lateMinutes !== undefined)
      data.lateMinutes = dto.lateMinutes ?? null;
    if (dto.earlyDepartureMinutes !== undefined)
      data.earlyDepartureMinutes = dto.earlyDepartureMinutes ?? null;
    if (dto.notes !== undefined) data.notes = dto.notes;

    const updated = await this.prisma.attendanceRecord.update({
      where: { id },
      data,
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
          },
        },
      },
    });

    await this.audit.log({
      action: 'ATTENDANCE_UPDATED',
      entity: 'AttendanceRecord',
      entityId: id,
      userId,
      details: { changes: Object.keys(dto) },
    });

    return updated;
  }

  // Remove attendance record
  async remove(id: string, userId: string) {
    const existing = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Attendance record '${id}' not found`);
    }

    await this.prisma.attendanceRecord.delete({ where: { id } });

    await this.audit.log({
      action: 'ATTENDANCE_DELETED',
      entity: 'AttendanceRecord',
      entityId: id,
      userId,
      details: {
        employeeId: existing.employeeId,
        date: existing.date,
      },
    });

    return { message: 'Attendance record deleted successfully' };
  }

  // Bulk attendance entry
  async bulkCreate(dto: BulkAttendanceDto, userId: string) {
    const date = new Date(dto.date);
    const results = {
      created: 0,
      updated: 0,
      failed: 0,
      errors: [] as { employeeId: string; error: string }[],
    };

    for (const entry of dto.entries) {
      try {
        // Check employee exists
        const employee = await this.prisma.employee.findUnique({
          where: { id: entry.employeeId },
          select: { id: true },
        });
        if (!employee) {
          results.failed++;
          results.errors.push({
            employeeId: entry.employeeId,
            error: 'Employee not found',
          });
          continue;
        }

        // Check for existing record
        const existing = await this.prisma.attendanceRecord.findFirst({
          where: {
            employeeId: entry.employeeId,
            date,
          },
        });

        if (existing) {
          // Update existing
          await this.prisma.attendanceRecord.update({
            where: { id: existing.id },
            data: {
              status: entry.status,
              checkIn: entry.checkIn || existing.checkIn,
              checkOut: entry.checkOut || existing.checkOut,
              workingHours: entry.workingHours ?? existing.workingHours,
              overtimeHours: entry.overtimeHours ?? existing.overtimeHours,
              lateMinutes: entry.lateMinutes ?? existing.lateMinutes,
              notes: entry.notes || existing.notes,
            },
          });
          results.updated++;
        } else {
          // Create new
          await this.prisma.attendanceRecord.create({
            data: {
              employeeId: entry.employeeId,
              date,
              status: entry.status,
              checkIn: entry.checkIn || null,
              checkOut: entry.checkOut || null,
              workingHours: entry.workingHours ?? null,
              overtimeHours: entry.overtimeHours ?? null,
              lateMinutes: entry.lateMinutes ?? null,
              notes: entry.notes || null,
            },
          });
          results.created++;
        }
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({
          employeeId: entry.employeeId,
          error: errorMessage,
        });
      }
    }

    await this.audit.log({
      action: 'ATTENDANCE_BULK_CREATED',
      entity: 'AttendanceRecord',
      entityId: dto.date,
      userId,
      details: {
        date: dto.date,
        created: results.created,
        updated: results.updated,
        failed: results.failed,
      },
    });

    return results;
  }

  // Monthly attendance summary for employee
  async getMonthlySummary(employeeId: string, month: number, year: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const records = await this.prisma.attendanceRecord.findMany({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
      },
      orderBy: { date: 'asc' },
    });

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      select: {
        id: true,
        employeeNumber: true,
        displayName: true,
        department: { select: { name: true } },
        basicSalary: true,
      },
    });

    const summary = {
      totalDays: records.length,
      presentDays: records.filter((r) => r.status === 'PRESENT').length,
      absentDays: records.filter((r) => r.status === 'ABSENT').length,
      lateDays: records.filter((r) => r.status === 'LATE').length,
      halfDays: records.filter((r) => r.status === 'HALF_DAY').length,
      onLeaveDays: records.filter((r) => r.status === 'ON_LEAVE').length,
      holidayDays: records.filter((r) => r.status === 'HOLIDAY').length,
      earlyDepartureDays: records.filter(
        (r) => r.status === 'EARLY_DEPARTURE',
      ).length,
      totalWorkingHours: records.reduce(
        (sum, r) => sum + (r.workingHours ? Number(r.workingHours) : 0),
        0,
      ),
      totalOvertimeHours: records.reduce(
        (sum, r) => sum + (r.overtimeHours ? Number(r.overtimeHours) : 0),
        0,
      ),
      totalLateMinutes: records.reduce(
        (sum, r) => sum + (r.lateMinutes || 0),
        0,
      ),
      totalEarlyDepartureMinutes: records.reduce(
        (sum, r) => sum + (r.earlyDepartureMinutes || 0),
        0,
      ),
    };

    const attendanceRate =
      summary.totalDays > 0
        ? Math.round(
            ((summary.presentDays + summary.lateDays) / summary.totalDays) * 100,
          )
        : 0;

    return {
      employee,
      month,
      year,
      summary: { ...summary, attendanceRate },
      records,
    };
  }

  // Department-wise attendance summary
  async getDepartmentSummary(date?: string, branchId?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      select: { id: true, name: true, code: true },
    });

    const results = await Promise.all(
      departments.map(async (dept) => {
        const employeeWhere: Prisma.EmployeeWhereInput = {
          departmentId: dept.id,
          status: { not: 'TERMINATED' },
        };
        if (branchId) employeeWhere.branchId = branchId;

        const totalEmployees = await this.prisma.employee.count({
          where: employeeWhere,
        });

        const employeeIds = await this.prisma.employee.findMany({
          where: employeeWhere,
          select: { id: true },
        });

        const records = await this.prisma.attendanceRecord.findMany({
          where: {
            date: targetDate,
            employeeId: { in: employeeIds.map((e) => e.id) },
          },
        });

        return {
          departmentId: dept.id,
          departmentName: dept.name,
          totalEmployees,
          present: records.filter((r) => r.status === 'PRESENT').length,
          absent: records.filter((r) => r.status === 'ABSENT').length,
          late: records.filter((r) => r.status === 'LATE').length,
          halfDay: records.filter((r) => r.status === 'HALF_DAY').length,
          onLeave: records.filter((r) => r.status === 'ON_LEAVE').length,
          notMarked: totalEmployees - records.length,
          attendanceRate:
            totalEmployees > 0
              ? Math.round(
                  ((records.filter(
                    (r) => r.status === 'PRESENT' || r.status === 'LATE',
                  ).length +
                    records.filter((r) => r.status === 'HALF_DAY').length *
                      0.5) /
                    totalEmployees) *
                    100,
                )
              : 0,
        };
      }),
    );

    return results;
  }

  // Late arrivals report
  async getLateArrivalsReport(filter: AttendanceReportFilterDto) {
    const where: Prisma.AttendanceRecordWhereInput = {
      lateMinutes: { gt: 0 },
    };

    this.applyDateFilter(where, filter);

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.departmentId || filter.branchId) {
      where.employee = {};
      if (filter.departmentId) where.employee.departmentId = filter.departmentId;
      if (filter.branchId) where.employee.branchId = filter.branchId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
            shift: { select: { startTime: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Aggregate by employee
    const byEmployee: Record<
      string,
      { employee: any; totalLateMinutes: number; lateCount: number }
    > = {};

    for (const r of records) {
      const eid = r.employeeId;
      if (!byEmployee[eid]) {
        byEmployee[eid] = {
          employee: r.employee,
          totalLateMinutes: 0,
          lateCount: 0,
        };
      }
      byEmployee[eid].totalLateMinutes += r.lateMinutes || 0;
      byEmployee[eid].lateCount++;
    }

    return {
      totalLateRecords: records.length,
      uniqueEmployees: Object.keys(byEmployee).length,
      records,
      summary: Object.values(byEmployee).sort(
        (a, b) => b.totalLateMinutes - a.totalLateMinutes,
      ),
    };
  }

  // Absence report
  async getAbsenceReport(filter: AttendanceReportFilterDto) {
    const where: Prisma.AttendanceRecordWhereInput = {
      status: 'ABSENT',
    };

    this.applyDateFilter(where, filter);

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.departmentId || filter.branchId) {
      where.employee = {};
      if (filter.departmentId) where.employee.departmentId = filter.departmentId;
      if (filter.branchId) where.employee.branchId = filter.branchId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Aggregate by employee
    const byEmployee: Record<
      string,
      { employee: any; absenceCount: number }
    > = {};

    for (const r of records) {
      const eid = r.employeeId;
      if (!byEmployee[eid]) {
        byEmployee[eid] = {
          employee: r.employee,
          absenceCount: 0,
        };
      }
      byEmployee[eid].absenceCount++;
    }

    return {
      totalAbsences: records.length,
      uniqueEmployees: Object.keys(byEmployee).length,
      records,
      summary: Object.values(byEmployee).sort(
        (a, b) => b.absenceCount - a.absenceCount,
      ),
    };
  }

  // Overtime report
  async getOvertimeReport(filter: AttendanceReportFilterDto) {
    const where: Prisma.AttendanceRecordWhereInput = {
      overtimeHours: { gt: new Prisma.Decimal(0) },
    };

    this.applyDateFilter(where, filter);

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.departmentId || filter.branchId) {
      where.employee = {};
      if (filter.departmentId) where.employee.departmentId = filter.departmentId;
      if (filter.branchId) where.employee.branchId = filter.branchId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalOvertimeHours = records.reduce(
      (sum, r) => sum + Number(r.overtimeHours || 0),
      0,
    );

    // Aggregate by employee
    const byEmployee: Record<
      string,
      { employee: any; totalOvertimeHours: number; overtimeCount: number }
    > = {};

    for (const r of records) {
      const eid = r.employeeId;
      if (!byEmployee[eid]) {
        byEmployee[eid] = {
          employee: r.employee,
          totalOvertimeHours: 0,
          overtimeCount: 0,
        };
      }
      byEmployee[eid].totalOvertimeHours += Number(r.overtimeHours || 0);
      byEmployee[eid].overtimeCount++;
    }

    return {
      totalOvertimeRecords: records.length,
      totalOvertimeHours: Math.round(totalOvertimeHours * 100) / 100,
      uniqueEmployees: Object.keys(byEmployee).length,
      records,
      summary: Object.values(byEmployee).sort(
        (a, b) => b.totalOvertimeHours - a.totalOvertimeHours,
      ),
    };
  }

  // Get overtime for payroll processing
  async getOvertimeForPayroll(
    employeeId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.attendanceRecord.aggregate({
      where: {
        employeeId,
        date: { gte: startDate, lte: endDate },
        overtimeHours: { gt: new Prisma.Decimal(0) },
      },
      _sum: { overtimeHours: true },
    });

    return Number(result._sum.overtimeHours || 0);
  }

  // Auto-generate attendance for holidays
  async markHoliday(date: string, branchId?: string, userId?: string) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const employeeWhere: Prisma.EmployeeWhereInput = {
      status: { not: 'TERMINATED' },
    };
    if (branchId) employeeWhere.branchId = branchId;

    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      select: { id: true },
    });

    const results = { created: 0, skipped: 0 };

    for (const emp of employees) {
      const existing = await this.prisma.attendanceRecord.findFirst({
        where: {
          employeeId: emp.id,
          date: targetDate,
        },
      });

      if (!existing) {
        await this.prisma.attendanceRecord.create({
          data: {
            employeeId: emp.id,
            date: targetDate,
            status: AttendanceStatus.HOLIDAY,
          },
        });
        results.created++;
      } else {
        results.skipped++;
      }
    }

    if (userId) {
      await this.audit.log({
        action: 'ATTENDANCE_HOLIDAY_MARKED',
        entity: 'AttendanceRecord',
        entityId: date,
        userId,
        details: { date, branchId, ...results },
      });
    }

    return results;
  }

  // Get working hours summary
  async getWorkingHoursSummary(filter: AttendanceReportFilterDto) {
    const where: Prisma.AttendanceRecordWhereInput = {
      workingHours: { not: null },
    };

    this.applyDateFilter(where, filter);

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.departmentId || filter.branchId) {
      where.employee = {};
      if (filter.departmentId) where.employee.departmentId = filter.departmentId;
      if (filter.branchId) where.employee.branchId = filter.branchId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const avgWorkingHours =
      records.length > 0
        ? records.reduce((sum, r) => sum + Number(r.workingHours || 0), 0) /
          records.length
        : 0;

    // Aggregate by employee
    const byEmployee: Record<
      string,
      {
        employee: any;
        totalWorkingHours: number;
        daysWorked: number;
        avgHours: number;
      }
    > = {};

    for (const r of records) {
      const eid = r.employeeId;
      if (!byEmployee[eid]) {
        byEmployee[eid] = {
          employee: r.employee,
          totalWorkingHours: 0,
          daysWorked: 0,
          avgHours: 0,
        };
      }
      byEmployee[eid].totalWorkingHours += Number(r.workingHours || 0);
      byEmployee[eid].daysWorked++;
    }

    for (const eid of Object.keys(byEmployee)) {
      byEmployee[eid].avgHours =
        Math.round(
          (byEmployee[eid].totalWorkingHours / byEmployee[eid].daysWorked) *
            100,
        ) / 100;
    }

    return {
      totalRecords: records.length,
      averageWorkingHours: Math.round(avgWorkingHours * 100) / 100,
      records,
      summary: Object.values(byEmployee).sort(
        (a, b) => b.totalWorkingHours - a.totalWorkingHours,
      ),
    };
  }

  // Helper: Apply date filter
  private applyDateFilter(
    where: Prisma.AttendanceRecordWhereInput,
    filter: AttendanceReportFilterDto,
  ) {
    if (filter.month && filter.year) {
      const startDate = new Date(filter.year, filter.month - 1, 1);
      const endDate = new Date(filter.year, filter.month, 0, 23, 59, 59);
      where.date = { gte: startDate, lte: endDate };
    } else if (filter.dateFrom || filter.dateTo) {
      where.date = {};
      if (filter.dateFrom) where.date.gte = new Date(filter.dateFrom);
      if (filter.dateTo) {
        const d = new Date(filter.dateTo);
        d.setHours(23, 59, 59, 999);
        where.date.lte = d;
      }
    }
  }

  // Helper: Get current time as HH:MM
  private getCurrentTimeString(): string {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  // Helper: Convert time string to minutes
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper: Calculate late minutes
  private calculateLateMinutes(checkIn: string, shiftStart: string): number {
    const checkInMinutes = this.timeToMinutes(checkIn);
    const shiftStartMinutes = this.timeToMinutes(shiftStart);
    const diff = checkInMinutes - shiftStartMinutes;
    return diff > 0 ? diff : 0;
  }
}
