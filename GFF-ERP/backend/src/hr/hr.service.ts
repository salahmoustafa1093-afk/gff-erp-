import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { EmployeesService } from '../employees/employees.service';
import { AttendanceService } from '../attendance/attendance.service';
import { PayrollService } from '../payroll/payroll.service';

export interface HrDashboardStats {
  headcount: number;
  activeEmployees: number;
  onLeaveEmployees: number;
  probationEmployees: number;
  terminatedThisMonth: number;
  newHiresThisMonth: number;
  attendanceRate: number;
  averageWorkingHours: number;
  pendingPayrolls: number;
  totalOvertimeHoursThisMonth: number;
  upcomingBirthdays: number;
  upcomingAnniversaries: number;
  genderDistribution: { gender: string; count: number }[];
  employmentTypeDistribution: { type: string; count: number }[];
}

export interface HrKpis {
  headcount: number;
  turnoverRate: number;
  attendanceRate: number;
  averageTenure: number;
  totalMonthlyPayroll: number;
  costPerEmployee: number;
  overtimeRate: number;
  lateArrivalRate: number;
}

@Injectable()
export class HrService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly employeesService: EmployeesService,
    private readonly attendanceService: AttendanceService,
    private readonly payrollService: PayrollService,
  ) {}

  // Get HR Dashboard Statistics
  async getDashboardStats(branchId?: string): Promise<HrDashboardStats> {
    const employeeWhere = branchId
      ? { branchId, status: { not: 'TERMINATED' as const } }
      : { status: { not: 'TERMINATED' as const } };

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);

    const [
      headcount,
      activeEmployees,
      onLeaveEmployees,
      probationEmployees,
      terminatedThisMonth,
      newHiresThisMonth,
      attendanceRecords,
      pendingPayrolls,
      genderDistribution,
      employmentTypeDistribution,
      upcomingBirthdays,
      upcomingAnniversaries,
    ] = await Promise.all([
      // Total headcount (excluding terminated)
      this.prisma.employee.count({ where: employeeWhere }),

      // Active employees
      this.prisma.employee.count({
        where: { ...employeeWhere, status: 'ACTIVE' },
      }),

      // On leave
      this.prisma.employee.count({
        where: { ...employeeWhere, status: 'ON_LEAVE' },
      }),

      // Probation
      this.prisma.employee.count({
        where: { ...employeeWhere, status: 'PROBATION' },
      }),

      // Terminated this month
      this.prisma.employee.count({
        where: {
          ...(branchId && { branchId }),
          status: 'TERMINATED',
          terminationDate: { gte: monthStart, lte: monthEnd },
        },
      }),

      // New hires this month
      this.prisma.employee.count({
        where: {
          ...(branchId && { branchId }),
          hireDate: { gte: monthStart, lte: monthEnd },
        },
      }),

      // Attendance records this month
      this.prisma.attendanceRecord.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          ...(branchId && {
            employee: { branchId },
          }),
        },
        select: {
          status: true,
          workingHours: true,
          overtimeHours: true,
        },
      }),

      // Pending payroll periods
      this.prisma.payrollPeriod.count({
        where: {
          status: { in: ['DRAFT', 'PROCESSING'] },
          ...(branchId && { branchId }),
        },
      }),

      // Gender distribution
      this.prisma.employee.groupBy({
        by: ['gender'],
        where: employeeWhere,
        _count: { id: true },
      }),

      // Employment type distribution
      this.prisma.employee.groupBy({
        by: ['employmentType'],
        where: employeeWhere,
        _count: { id: true },
      }),

      // Upcoming birthdays count
      this.countUpcomingBirthdays(branchId),

      // Upcoming anniversaries count
      this.countUpcomingAnniversaries(branchId),
    ]);

    // Calculate attendance rate
    const totalAttendanceDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE',
    ).length;
    const attendanceRate =
      totalAttendanceDays > 0
        ? Math.round((presentDays / totalAttendanceDays) * 10000) / 100
        : 0;

    // Calculate average working hours
    const recordsWithHours = attendanceRecords.filter((r) => r.workingHours);
    const averageWorkingHours =
      recordsWithHours.length > 0
        ? Math.round(
            (recordsWithHours.reduce(
              (sum, r) => sum + Number(r.workingHours || 0),
              0,
            ) /
              recordsWithHours.length) *
              100,
          ) / 100
        : 0;

    // Total overtime hours
    const totalOvertimeHoursThisMonth = attendanceRecords.reduce(
      (sum, r) => sum + Number(r.overtimeHours || 0),
      0,
    );

    return {
      headcount,
      activeEmployees,
      onLeaveEmployees,
      probationEmployees,
      terminatedThisMonth,
      newHiresThisMonth,
      attendanceRate,
      averageWorkingHours,
      pendingPayrolls,
      totalOvertimeHoursThisMonth,
      upcomingBirthdays,
      upcomingAnniversaries,
      genderDistribution: genderDistribution.map((g) => ({
        gender: g.gender,
        count: g._count.id,
      })),
      employmentTypeDistribution: employmentTypeDistribution.map((e) => ({
        type: e.employmentType,
        count: e._count.id,
      })),
    };
  }

  // Get HR KPIs
  async getHrKpis(branchId?: string): Promise<HrKpis> {
    const employeeWhere = branchId
      ? { branchId }
      : {};

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const monthStart = new Date(currentYear, currentMonth, 1);
    const monthEnd = new Date(currentYear, currentMonth + 1, 0);
    const yearStart = new Date(currentYear, 0, 1);

    const [
      headcount,
      activeEmployees,
      terminatedThisYear,
      attendanceRecords,
      payrollEntries,
      employeesWithTenure,
    ] = await Promise.all([
      this.prisma.employee.count({
        where: { ...employeeWhere, status: { not: 'TERMINATED' as const } },
      }),

      this.prisma.employee.count({
        where: { ...employeeWhere, status: 'ACTIVE' },
      }),

      this.prisma.employee.count({
        where: {
          ...employeeWhere,
          status: 'TERMINATED',
          terminationDate: { gte: yearStart },
        },
      }),

      this.prisma.attendanceRecord.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          ...(branchId && { employee: { branchId } }),
        },
        select: {
          status: true,
          overtimeHours: true,
          lateMinutes: true,
        },
      }),

      this.prisma.payrollEntry.findMany({
        where: {
          createdAt: { gte: monthStart, lte: monthEnd },
          ...(branchId && {
            employee: { branchId },
          }),
        },
        select: {
          netSalary: true,
          grossSalary: true,
        },
      }),

      this.prisma.employee.findMany({
        where: {
          ...employeeWhere,
          status: 'ACTIVE',
          hireDate: { not: null },
        },
        select: {
          hireDate: true,
        },
      }),
    ]);

    // Turnover rate = terminations / average headcount
    const turnoverRate =
      headcount + terminatedThisYear > 0
        ? Math.round(
            (terminatedThisYear / (headcount + terminatedThisYear / 2)) * 10000,
          ) / 100
        : 0;

    // Attendance rate
    const totalDays = attendanceRecords.length;
    const presentDays = attendanceRecords.filter(
      (r) => r.status === 'PRESENT' || r.status === 'LATE',
    ).length;
    const attendanceRate =
      totalDays > 0
        ? Math.round((presentDays / totalDays) * 10000) / 100
        : 0;

    // Average tenure in years
    const totalTenureYears = employeesWithTenure.reduce((sum, emp) => {
      const hire = new Date(emp.hireDate);
      const diff = currentDate.getTime() - hire.getTime();
      return sum + diff / (1000 * 60 * 60 * 24 * 365);
    }, 0);
    const averageTenure =
      employeesWithTenure.length > 0
        ? Math.round((totalTenureYears / employeesWithTenure.length) * 100) / 100
        : 0;

    // Total monthly payroll
    const totalMonthlyPayroll = payrollEntries.reduce(
      (sum, e) => sum + Number(e.grossSalary || 0),
      0,
    );

    // Cost per employee
    const costPerEmployee =
      activeEmployees > 0
        ? Math.round((totalMonthlyPayroll / activeEmployees) * 100) / 100
        : 0;

    // Overtime rate
    const overtimeRecords = attendanceRecords.filter(
      (r) => Number(r.overtimeHours) > 0,
    );
    const overtimeRate =
      totalDays > 0
        ? Math.round((overtimeRecords.length / totalDays) * 10000) / 100
        : 0;

    // Late arrival rate
    const lateRecords = attendanceRecords.filter(
      (r) => r.status === 'LATE',
    );
    const lateArrivalRate =
      totalDays > 0
        ? Math.round((lateRecords.length / totalDays) * 10000) / 100
        : 0;

    return {
      headcount,
      turnoverRate,
      attendanceRate,
      averageTenure,
      totalMonthlyPayroll: Math.round(totalMonthlyPayroll * 100) / 100,
      costPerEmployee,
      overtimeRate,
      lateArrivalRate,
    };
  }

  // Get leave balance summary
  async getLeaveBalanceSummary(branchId?: string) {
    const where: { status: { not: 'TERMINATED' }; branchId?: string } = {
      status: { not: 'TERMINATED' as const },
    };
    if (branchId) where.branchId = branchId;

    const employees = await this.prisma.employee.findMany({
      where,
      select: {
        id: true,
        employeeNumber: true,
        displayName: true,
        department: { select: { name: true } },
        annualLeaveBalance: true,
        sickLeaveBalance: true,
        hireDate: true,
      },
      orderBy: { displayName: 'asc' },
    });

    // Calculate total leave taken this year
    const currentYear = new Date().getFullYear();
    const leaves = await this.prisma.leaveRequest.groupBy({
      by: ['employeeId', 'leaveType'],
      where: {
        status: 'APPROVED',
        startDate: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31),
        },
      },
      _sum: { days: true },
    });

    const leaveMap: Record<string, { annual: number; sick: number }> = {};
    for (const leave of leaves) {
      if (!leaveMap[leave.employeeId]) {
        leaveMap[leave.employeeId] = { annual: 0, sick: 0 };
      }
      if (leave.leaveType === 'ANNUAL') {
        leaveMap[leave.employeeId].annual = leave._sum.days || 0;
      } else if (leave.leaveType === 'SICK') {
        leaveMap[leave.employeeId].sick = leave._sum.days || 0;
      }
    }

    const summary = employees.map((emp) => ({
      employeeId: emp.id,
      employeeNumber: emp.employeeNumber,
      employeeName: emp.displayName,
      department: emp.department?.name || 'N/A',
      annualLeaveBalance: emp.annualLeaveBalance ?? 21,
      annualLeaveTaken: leaveMap[emp.id]?.annual || 0,
      annualLeaveRemaining:
        (emp.annualLeaveBalance ?? 21) - (leaveMap[emp.id]?.annual || 0),
      sickLeaveBalance: emp.sickLeaveBalance ?? 14,
      sickLeaveTaken: leaveMap[emp.id]?.sick || 0,
      sickLeaveRemaining:
        (emp.sickLeaveBalance ?? 14) - (leaveMap[emp.id]?.sick || 0),
    }));

    const totals = {
      totalAnnualBalance: summary.reduce((s, e) => s + e.annualLeaveBalance, 0),
      totalAnnualTaken: summary.reduce((s, e) => s + e.annualLeaveTaken, 0),
      totalSickBalance: summary.reduce((s, e) => s + e.sickLeaveBalance, 0),
      totalSickTaken: summary.reduce((s, e) => s + e.sickLeaveTaken, 0),
    };

    return { summary, totals, count: summary.length };
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays(branchId?: string) {
    return this.employeesService.getUpcomingBirthdays(branchId);
  }

  // Get upcoming anniversaries
  async getUpcomingAnniversaries(branchId?: string) {
    return this.employeesService.getUpcomingAnniversaries(branchId);
  }

  // Get employee overview
  async getEmployeeOverview(employeeId: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        jobTitle: true,
        branch: true,
        supervisor: {
          select: { displayName: true, email: true },
        },
      },
    });

    if (!employee) return null;

    const [
      attendanceThisMonth,
      payrollHistory,
      activeLoans,
      leaveRequests,
    ] = await Promise.all([
      this.prisma.attendanceRecord.count({
        where: {
          employeeId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
          status: { in: ['PRESENT', 'LATE'] },
        },
      }),

      this.prisma.payrollEntry.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: {
          id: true,
          grossSalary: true,
          netSalary: true,
          payrollPeriod: { select: { name: true } },
        },
      }),

      this.prisma.employeeLoan.findMany({
        where: {
          employeeId,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      }),

      this.prisma.leaveRequest.findMany({
        where: { employeeId },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    return {
      employee,
      attendanceThisMonth,
      payrollHistory,
      activeLoans: {
        count: activeLoans.length,
        totalRemaining: activeLoans.reduce(
          (sum, l) => sum + Number(l.remainingBalance || 0),
          0,
        ),
      },
      recentLeaveRequests: leaveRequests,
    };
  }

  // Private helpers
  private async countUpcomingBirthdays(branchId?: string): Promise<number> {
    const birthdays = await this.employeesService.getUpcomingBirthdays(branchId);
    return birthdays.length;
  }

  private async countUpcomingAnniversaries(branchId?: string): Promise<number> {
    const anniversaries = await this.employeesService.getUpcomingAnniversaries(branchId);
    return anniversaries.length;
  }
}
