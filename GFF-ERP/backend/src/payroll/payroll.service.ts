import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AttendanceService } from '../attendance/attendance.service';
import {
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
  PayrollPeriodStatus,
} from './dto/create-payroll-period.dto';
import {
  ProcessPayrollDto,
  ProcessEmployeePayrollDto,
  PayslipFilterDto,
  PaymentRecordDto,
  PaymentMethod,
} from './dto/process-payroll.dto';
import {
  PayrollPeriodFilterDto,
  PayrollEntryFilterDto,
} from './dto/payroll-filter.dto';
import { AddBonusDto, AddBulkBonusDto, UpdateBonusDto } from './dto/add-bonus.dto';
import { AddDeductionDto, AddBulkDeductionDto, UpdateDeductionDto } from './dto/add-deduction.dto';
import {
  PayrollReportFilterDto,
  PayrollSummaryDto,
} from './dto/payroll-report.dto';
import { Prisma } from '@prisma/client';

// Tax bracket definition (progressive tax)
interface TaxBracket {
  min: number;
  max: number;
  rate: number;
  baseTax: number;
}

@Injectable()
export class PayrollService {
  // Default social insurance rates
  private readonly SOCIAL_INSURANCE_EMPLOYEE_RATE = 0.11; // 11% employee contribution
  private readonly SOCIAL_INSURANCE_EMPLOYER_RATE = 0.185; // 18.5% employer contribution

  // Progressive tax brackets (example - should be configurable)
  private readonly TAX_BRACKETS: TaxBracket[] = [
    { min: 0, max: 10000, rate: 0, baseTax: 0 },        // 0% on first 10,000
    { min: 10000, max: 20000, rate: 0.1, baseTax: 0 },   // 10% on 10,001-20,000
    { min: 20000, max: 35000, rate: 0.15, baseTax: 1000 }, // 15% on 20,001-35,000
    { min: 35000, max: 50000, rate: 0.2, baseTax: 3250 },  // 20% on 35,001-50,000
    { min: 50000, max: Infinity, rate: 0.25, baseTax: 6250 }, // 25% above 50,000
  ];

  // Tax personal exemption
  private readonly TAX_PERSONAL_EXEMPTION = 7000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly attendanceService: AttendanceService,
  ) {}

  // ==================== PAYROLL PERIOD ====================

  async createPeriod(dto: CreatePayrollPeriodDto, userId: string) {
    // Validate date range
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException('Start date must be before end date');
    }

    // Check for overlapping periods
    const overlapping = await this.prisma.payrollPeriod.findFirst({
      where: {
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
        ...(dto.branchId && { branchId: dto.branchId }),
      },
    });
    if (overlapping) {
      throw new ConflictException(
        `Overlapping payroll period exists: ${overlapping.name}`,
      );
    }

    const period = await this.prisma.payrollPeriod.create({
      data: {
        name: dto.name,
        startDate: start,
        endDate: end,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : null,
        status: PayrollPeriodStatus.DRAFT,
        notes: dto.notes || null,
        branchId: dto.branchId || null,
      },
    });

    await this.audit.log({
      action: 'PAYROLL_PERIOD_CREATED',
      entity: 'PayrollPeriod',
      entityId: period.id,
      userId,
      details: {
        name: period.name,
        startDate: dto.startDate,
        endDate: dto.endDate,
      },
    });

    return period;
  }

  async findAllPeriods(filter: PayrollPeriodFilterDto) {
    const where: Prisma.PayrollPeriodWhereInput = {};

    if (filter.search) {
      where.name = { contains: filter.search, mode: 'insensitive' };
    }
    if (filter.status) where.status = filter.status;
    if (filter.branchId) where.branchId = filter.branchId;
    if (filter.year) {
      where.startDate = {
        gte: new Date(filter.year, 0, 1),
        lte: new Date(filter.year, 11, 31),
      };
    }
    if (filter.month && filter.year) {
      const start = new Date(filter.year, filter.month - 1, 1);
      const end = new Date(filter.year, filter.month, 0);
      where.startDate = { gte: start, lte: end };
    }

    const skip = ((filter.page || 1) - 1) * (filter.pageSize || 20);
    const take = filter.pageSize || 20;

    const [data, total] = await Promise.all([
      this.prisma.payrollPeriod.findMany({
        where,
        skip,
        take,
        orderBy: {
          [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc',
        },
        include: {
          _count: {
            select: { payrollEntries: true },
          },
        },
      }),
      this.prisma.payrollPeriod.count({ where }),
    ]);

    return { data, total, page: filter.page || 1, pageSize: filter.pageSize || 20 };
  }

  async findPeriodById(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: {
        payrollEntries: {
          include: {
            employee: {
              select: {
                employeeNumber: true,
                displayName: true,
                department: { select: { name: true } },
              },
            },
            bonuses: true,
            deductions: true,
          },
        },
        _count: {
          select: {
            payrollEntries: true,
          },
        },
      },
    });

    if (!period) {
      throw new NotFoundException(`Payroll period '${id}' not found`);
    }

    return period;
  }

  async updatePeriod(id: string, dto: UpdatePayrollPeriodDto, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) {
      throw new NotFoundException(`Payroll period '${id}' not found`);
    }

    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot modify a closed payroll period');
    }

    const data: Prisma.PayrollPeriodUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.paymentDate !== undefined)
      data.paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : null;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status !== undefined) data.status = dto.status;

    const updated = await this.prisma.payrollPeriod.update({
      where: { id },
      data,
    });

    await this.audit.log({
      action: 'PAYROLL_PERIOD_UPDATED',
      entity: 'PayrollPeriod',
      entityId: id,
      userId,
      details: { changes: Object.keys(dto) },
    });

    return updated;
  }

  async deletePeriod(id: string, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id },
      include: { _count: { select: { payrollEntries: true } } },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${id}' not found`);
    }

    if (period._count.payrollEntries > 0) {
      throw new BadRequestException(
        'Cannot delete payroll period with existing entries. Reverse processing first.',
      );
    }

    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot delete a closed payroll period');
    }

    await this.prisma.payrollPeriod.delete({ where: { id } });

    await this.audit.log({
      action: 'PAYROLL_PERIOD_DELETED',
      entity: 'PayrollPeriod',
      entityId: id,
      userId,
      details: { name: period.name },
    });

    return { message: 'Payroll period deleted successfully' };
  }

  // ==================== PAYROLL PROCESSING ====================

  async processPayroll(dto: ProcessPayrollDto, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.periodId },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${dto.periodId}' not found`);
    }

    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot process a closed payroll period');
    }

    // Update period status to PROCESSING
    await this.prisma.payrollPeriod.update({
      where: { id: dto.periodId },
      data: { status: PayrollPeriodStatus.PROCESSING },
    });

    // Get employees to process
    const employeeWhere: Prisma.EmployeeWhereInput = {
      status: { in: ['ACTIVE', 'ON_LEAVE', 'SUSPENDED'] },
    };
    if (dto.employeeIds && dto.employeeIds.length > 0) {
      employeeWhere.id = { in: dto.employeeIds };
    }
    if (period.branchId) {
      employeeWhere.branchId = period.branchId;
    }

    const employees = await this.prisma.employee.findMany({
      where: employeeWhere,
      include: {
        department: { select: { id: true, name: true } },
        loans: {
          where: {
            status: 'ACTIVE',
            deductionStartDate: { lte: period.endDate },
          },
        },
      },
    });

    const results = {
      processed: 0,
      failed: 0,
      errors: [] as { employeeId: string; error: string }[],
    };

    for (const employee of employees) {
      try {
        await this.processEmployeePayroll(
          {
            periodId: dto.periodId,
            employeeId: employee.id,
            overrideBasicSalary: dto.overrideBasicSalary,
            notes: dto.notes,
          },
          userId,
        );
        results.processed++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push({ employeeId: employee.id, error: errorMessage });
      }
    }

    // Update period status to COMPLETED
    await this.prisma.payrollPeriod.update({
      where: { id: dto.periodId },
      data: { status: PayrollPeriodStatus.COMPLETED },
    });

    await this.audit.log({
      action: 'PAYROLL_PROCESSED',
      entity: 'PayrollPeriod',
      entityId: dto.periodId,
      userId,
      details: {
        processed: results.processed,
        failed: results.failed,
        employeeCount: employees.length,
      },
    });

    return results;
  }

  async processEmployeePayroll(
    dto: ProcessEmployeePayrollDto,
    userId: string,
  ) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.periodId },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${dto.periodId}' not found`);
    }

    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot modify a closed payroll period');
    }

    const employee = await this.prisma.employee.findUnique({
      where: { id: dto.employeeId },
      include: {
        department: { select: { id: true, name: true } },
        loans: {
          where: {
            status: 'ACTIVE',
            deductionStartDate: { lte: period.endDate },
          },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Employee '${dto.employeeId}' not found`);
    }

    // Check if entry already exists
    const existing = await this.prisma.payrollEntry.findFirst({
      where: {
        employeeId: dto.employeeId,
        payrollPeriodId: dto.periodId,
      },
    });
    if (existing) {
      // Delete existing entry and recalculate
      await this.prisma.payrollEntry.delete({ where: { id: existing.id } });
    }

    // Get overtime hours from attendance
    const overtimeHours = await this.attendanceService.getOvertimeForPayroll(
      dto.employeeId,
      period.startDate,
      period.endDate,
    );

    // Calculate salary components
    const basicSalary = new Prisma.Decimal(
      dto.overrideBasicSalary ?? employee.basicSalary,
    );
    const housingAllowance = new Prisma.Decimal(
      dto.overrideHousingAllowance ?? employee.housingAllowance ?? 0,
    );
    const transportAllowance = new Prisma.Decimal(
      dto.overrideTransportAllowance ?? employee.transportAllowance ?? 0,
    );
    const foodAllowance = new Prisma.Decimal(
      dto.overrideFoodAllowance ?? employee.foodAllowance ?? 0,
    );

    const totalAllowances = housingAllowance
      .add(transportAllowance)
      .add(foodAllowance);

    // Overtime pay (basic salary / 30 / 8 * 1.5 * overtime hours)
    const overtimeRate = basicSalary
      .div(30)
      .div(8)
      .mul(1.5);
    const overtimePay = overtimeRate.mul(overtimeHours);

    // Gross salary before bonuses
    const grossSalaryBeforeBonuses = basicSalary
      .add(totalAllowances)
      .add(overtimePay);

    // Calculate loan deductions
    let totalLoanDeduction = new Prisma.Decimal(0);
    const loanDeductions: {
      loanId: string;
      amount: number;
      remainingBalance: number;
    }[] = [];

    for (const loan of employee.loans) {
      if (
        loan.remainingBalance &&
        Number(loan.remainingBalance) > 0 &&
        loan.monthlyDeduction
      ) {
        const deduction = Prisma.Decimal.min(
          loan.monthlyDeduction,
          loan.remainingBalance,
        );
        totalLoanDeduction = totalLoanDeduction.add(deduction);
        loanDeductions.push({
          loanId: loan.id,
          amount: Number(deduction),
          remainingBalance: Number(
            new Prisma.Decimal(loan.remainingBalance).sub(deduction),
          ),
        });
      }
    }

    // Social insurance calculation
    const socialInsuranceBase = Prisma.Decimal.max(
      basicSalary,
      new Prisma.Decimal(0),
    );
    const employeeSocialInsurance = socialInsuranceBase.mul(
      this.SOCIAL_INSURANCE_EMPLOYEE_RATE,
    );

    // Taxable income (gross - allowances - social insurance - personal exemption)
    const taxableIncome = Prisma.Decimal.max(
      grossSalaryBeforeBonuses
        .sub(employeeSocialInsurance)
        .sub(new Prisma.Decimal(this.TAX_PERSONAL_EXEMPTION)),
      new Prisma.Decimal(0),
    );

    // Income tax (progressive brackets)
    const incomeTax = this.calculateProgressiveTax(Number(taxableIncome));

    // Total deductions before bonuses
    const totalDeductions = totalLoanDeduction
      .add(employeeSocialInsurance)
      .add(new Prisma.Decimal(incomeTax));

    // Net salary (will be adjusted after bonuses)
    const netSalary = Prisma.Decimal.max(
      grossSalaryBeforeBonuses.sub(totalDeductions),
      new Prisma.Decimal(0),
    );

    // Create payroll entry
    const entry = await this.prisma.payrollEntry.create({
      data: {
        payrollPeriodId: dto.periodId,
        employeeId: dto.employeeId,
        departmentId: employee.departmentId,
        basicSalary,
        housingAllowance,
        transportAllowance,
        foodAllowance,
        overtimeHours: new Prisma.Decimal(overtimeHours),
        overtimePay,
        bonusAmount: new Prisma.Decimal(0),
        totalAllowances,
        grossSalary: grossSalaryBeforeBonuses,
        loanDeductions: totalLoanDeduction,
        socialInsurance: employeeSocialInsurance,
        incomeTax: new Prisma.Decimal(incomeTax),
        otherDeductions: new Prisma.Decimal(0),
        totalDeductions,
        netSalary,
        paymentStatus: 'PENDING',
        paymentMethod: null,
        notes: dto.notes || null,
        loanDeductionDetails:
          loanDeductions.length > 0
            ? JSON.parse(JSON.stringify(loanDeductions))
            : Prisma.JsonNull,
      },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
          },
        },
        payrollPeriod: {
          select: { name: true, startDate: true, endDate: true },
        },
      },
    });

    // Update loan remaining balances
    for (const ld of loanDeductions) {
      await this.prisma.employeeLoan.update({
        where: { id: ld.loanId },
        data: {
          remainingBalance: new Prisma.Decimal(ld.remainingBalance),
          status:
            ld.remainingBalance <= 0
              ? 'COMPLETED'
              : ('ACTIVE' as 'COMPLETED' | 'ACTIVE'),
          ...(ld.remainingBalance <= 0 && {
            completedDate: new Date(),
          }),
        },
      });
    }

    await this.audit.log({
      action: 'PAYROLL_ENTRY_CREATED',
      entity: 'PayrollEntry',
      entityId: entry.id,
      userId,
      details: {
        employeeId: dto.employeeId,
        periodId: dto.periodId,
        grossSalary: Number(grossSalaryBeforeBonuses),
        netSalary: Number(netSalary),
      },
    });

    return entry;
  }

  // ==================== BONUSES ====================

  async addBonus(dto: AddBonusDto, userId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: dto.payrollEntryId },
      include: { payrollPeriod: true },
    });
    if (!entry) {
      throw new NotFoundException(
        `Payroll entry '${dto.payrollEntryId}' not found`,
      );
    }

    if (entry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot add bonus to closed payroll period');
    }

    // Create bonus record
    await this.prisma.payrollBonus.create({
      data: {
        payrollEntryId: dto.payrollEntryId,
        bonusType: dto.bonusType,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description || null,
        isTaxable: dto.isTaxable ?? true,
      },
    });

    // Recalculate entry totals
    await this.recalculatePayrollEntry(dto.payrollEntryId);

    await this.audit.log({
      action: 'PAYROLL_BONUS_ADDED',
      entity: 'PayrollEntry',
      entityId: dto.payrollEntryId,
      userId,
      details: {
        bonusType: dto.bonusType,
        amount: dto.amount,
        isTaxable: dto.isTaxable,
      },
    });

    return this.findEntryById(dto.payrollEntryId);
  }

  async addBulkBonus(dto: AddBulkBonusDto, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.periodId },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${dto.periodId}' not found`);
    }
    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot add bonus to closed payroll period');
    }

    const results = { added: 0, failed: 0, errors: [] as string[] };

    for (const employeeId of dto.employeeIds) {
      try {
        const entry = await this.prisma.payrollEntry.findFirst({
          where: { payrollPeriodId: dto.periodId, employeeId },
        });
        if (!entry) {
          results.failed++;
          results.errors.push(`No payroll entry for employee ${employeeId}`);
          continue;
        }

        await this.prisma.payrollBonus.create({
          data: {
            payrollEntryId: entry.id,
            bonusType: dto.bonusType,
            amount: new Prisma.Decimal(dto.amount),
            description: dto.description || null,
            isTaxable: dto.isTaxable ?? true,
          },
        });

        await this.recalculatePayrollEntry(entry.id);
        results.added++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(errorMessage);
      }
    }

    await this.audit.log({
      action: 'PAYROLL_BULK_BONUS_ADDED',
      entity: 'PayrollPeriod',
      entityId: dto.periodId,
      userId,
      details: { added: results.added, failed: results.failed },
    });

    return results;
  }

  async updateBonus(
    bonusId: string,
    dto: UpdateBonusDto,
    userId: string,
  ) {
    const bonus = await this.prisma.payrollBonus.findUnique({
      where: { id: bonusId },
      include: { payrollEntry: { include: { payrollPeriod: true } } },
    });
    if (!bonus) {
      throw new NotFoundException(`Bonus '${bonusId}' not found`);
    }

    if (bonus.payrollEntry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot update bonus in closed payroll period');
    }

    const data: Prisma.PayrollBonusUpdateInput = {};
    if (dto.bonusType !== undefined) data.bonusType = dto.bonusType;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isTaxable !== undefined) data.isTaxable = dto.isTaxable;

    await this.prisma.payrollBonus.update({ where: { id: bonusId }, data });
    await this.recalculatePayrollEntry(bonus.payrollEntryId);

    await this.audit.log({
      action: 'PAYROLL_BONUS_UPDATED',
      entity: 'PayrollBonus',
      entityId: bonusId,
      userId,
      details: { changes: Object.keys(dto) },
    });

    return this.findEntryById(bonus.payrollEntryId);
  }

  async removeBonus(bonusId: string, userId: string) {
    const bonus = await this.prisma.payrollBonus.findUnique({
      where: { id: bonusId },
      include: { payrollEntry: { include: { payrollPeriod: true } } },
    });
    if (!bonus) {
      throw new NotFoundException(`Bonus '${bonusId}' not found`);
    }

    if (bonus.payrollEntry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot remove bonus from closed payroll period');
    }

    await this.prisma.payrollBonus.delete({ where: { id: bonusId } });
    await this.recalculatePayrollEntry(bonus.payrollEntryId);

    await this.audit.log({
      action: 'PAYROLL_BONUS_REMOVED',
      entity: 'PayrollBonus',
      entityId: bonusId,
      userId,
      details: { entryId: bonus.payrollEntryId },
    });

    return { message: 'Bonus removed successfully' };
  }

  // ==================== DEDUCTIONS ====================

  async addDeduction(dto: AddDeductionDto, userId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: dto.payrollEntryId },
      include: { payrollPeriod: true },
    });
    if (!entry) {
      throw new NotFoundException(
        `Payroll entry '${dto.payrollEntryId}' not found`,
      );
    }

    if (entry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException(
        'Cannot add deduction to closed payroll period',
      );
    }

    await this.prisma.payrollDeduction.create({
      data: {
        payrollEntryId: dto.payrollEntryId,
        deductionType: dto.deductionType,
        amount: new Prisma.Decimal(dto.amount),
        description: dto.description || null,
      },
    });

    await this.recalculatePayrollEntry(dto.payrollEntryId);

    await this.audit.log({
      action: 'PAYROLL_DEDUCTION_ADDED',
      entity: 'PayrollEntry',
      entityId: dto.payrollEntryId,
      userId,
      details: { deductionType: dto.deductionType, amount: dto.amount },
    });

    return this.findEntryById(dto.payrollEntryId);
  }

  async addBulkDeduction(dto: AddBulkDeductionDto, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: dto.periodId },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${dto.periodId}' not found`);
    }
    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException(
        'Cannot add deduction to closed payroll period',
      );
    }

    const results = { added: 0, failed: 0, errors: [] as string[] };

    for (const employeeId of dto.employeeIds) {
      try {
        const entry = await this.prisma.payrollEntry.findFirst({
          where: { payrollPeriodId: dto.periodId, employeeId },
        });
        if (!entry) {
          results.failed++;
          results.errors.push(`No payroll entry for employee ${employeeId}`);
          continue;
        }

        await this.prisma.payrollDeduction.create({
          data: {
            payrollEntryId: entry.id,
            deductionType: dto.deductionType,
            amount: new Prisma.Decimal(dto.amount),
            description: dto.description || null,
          },
        });

        await this.recalculatePayrollEntry(entry.id);
        results.added++;
      } catch (error: unknown) {
        results.failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(errorMessage);
      }
    }

    await this.audit.log({
      action: 'PAYROLL_BULK_DEDUCTION_ADDED',
      entity: 'PayrollPeriod',
      entityId: dto.periodId,
      userId,
      details: { added: results.added, failed: results.failed },
    });

    return results;
  }

  async updateDeduction(
    deductionId: string,
    dto: UpdateDeductionDto,
    userId: string,
  ) {
    const deduction = await this.prisma.payrollDeduction.findUnique({
      where: { id: deductionId },
      include: { payrollEntry: { include: { payrollPeriod: true } } },
    });
    if (!deduction) {
      throw new NotFoundException(`Deduction '${deductionId}' not found`);
    }

    if (deduction.payrollEntry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException(
        'Cannot update deduction in closed payroll period',
      );
    }

    const data: Prisma.PayrollDeductionUpdateInput = {};
    if (dto.deductionType !== undefined) data.deductionType = dto.deductionType;
    if (dto.amount !== undefined) data.amount = new Prisma.Decimal(dto.amount);
    if (dto.description !== undefined) data.description = dto.description;

    await this.prisma.payrollDeduction.update({
      where: { id: deductionId },
      data,
    });
    await this.recalculatePayrollEntry(deduction.payrollEntryId);

    await this.audit.log({
      action: 'PAYROLL_DEDUCTION_UPDATED',
      entity: 'PayrollDeduction',
      entityId: deductionId,
      userId,
      details: { changes: Object.keys(dto) },
    });

    return this.findEntryById(deduction.payrollEntryId);
  }

  async removeDeduction(deductionId: string, userId: string) {
    const deduction = await this.prisma.payrollDeduction.findUnique({
      where: { id: deductionId },
      include: { payrollEntry: { include: { payrollPeriod: true } } },
    });
    if (!deduction) {
      throw new NotFoundException(`Deduction '${deductionId}' not found`);
    }

    if (deduction.payrollEntry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException(
        'Cannot remove deduction from closed payroll period',
      );
    }

    await this.prisma.payrollDeduction.delete({ where: { id: deductionId } });
    await this.recalculatePayrollEntry(deduction.payrollEntryId);

    await this.audit.log({
      action: 'PAYROLL_DEDUCTION_REMOVED',
      entity: 'PayrollDeduction',
      entityId: deductionId,
      userId,
      details: { entryId: deduction.payrollEntryId },
    });

    return { message: 'Deduction removed successfully' };
  }

  // ==================== PAYSLIPS ====================

  async getPayslips(filter: PayslipFilterDto) {
    const where: Prisma.PayrollEntryWhereInput = {};

    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.periodId) where.payrollPeriodId = filter.periodId;
    if (filter.year || filter.month) {
      where.payrollPeriod = {};
      if (filter.year) {
        where.payrollPeriod.startDate = {
          gte: new Date(filter.year, 0, 1),
          lte: new Date(filter.year, 11, 31),
        };
      }
      if (filter.month && filter.year) {
        const start = new Date(filter.year, filter.month - 1, 1);
        const end = new Date(filter.year, filter.month, 0);
        where.payrollPeriod.startDate = { gte: start, lte: end };
      }
    }

    const skip = ((filter.page || 1) - 1) * (filter.pageSize || 20);
    const take = filter.pageSize || 20;

    const [data, total] = await Promise.all([
      this.prisma.payrollEntry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              employeeNumber: true,
              displayName: true,
              firstName: true,
              lastName: true,
              email: true,
              department: { select: { name: true } },
              jobTitle: { select: { title: true } },
              branch: { select: { name: true } },
              bankDetails: true,
            },
          },
          payrollPeriod: {
            select: { name: true, startDate: true, endDate: true, paymentDate: true },
          },
          bonuses: true,
          deductions: true,
        },
      }),
      this.prisma.payrollEntry.count({ where }),
    ]);

    return { data, total, page: filter.page || 1, pageSize: filter.pageSize || 20 };
  }

  async getPayslip(entryId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
            firstName: true,
            lastName: true,
            email: true,
            nationalId: true,
            taxId: true,
            socialInsuranceNumber: true,
            department: { select: { name: true } },
            jobTitle: { select: { title: true } },
            branch: { select: { name: true } },
            bankDetails: true,
            hireDate: true,
          },
        },
        payrollPeriod: {
          select: {
            name: true,
            startDate: true,
            endDate: true,
            paymentDate: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });

    if (!entry) {
      throw new NotFoundException(`Payslip entry '${entryId}' not found`);
    }

    // Get YTD totals
    const currentYear = new Date().getFullYear();
    const ytdEntries = await this.prisma.payrollEntry.findMany({
      where: {
        employeeId: entry.employeeId,
        payrollPeriod: {
          startDate: {
            gte: new Date(currentYear, 0, 1),
            lte: entry.payrollPeriod.endDate,
          },
        },
      },
    });

    const ytdTotals = {
      grossSalary: ytdEntries.reduce(
        (sum, e) => sum + Number(e.grossSalary),
        0,
      ),
      netSalary: ytdEntries.reduce((sum, e) => sum + Number(e.netSalary), 0),
      tax: ytdEntries.reduce(
        (sum, e) => sum + Number(e.incomeTax),
        0,
      ),
      socialInsurance: ytdEntries.reduce(
        (sum, e) => sum + Number(e.socialInsurance),
        0,
      ),
      loanDeductions: ytdEntries.reduce(
        (sum, e) => sum + Number(e.loanDeductions),
        0,
      ),
      overtimePay: ytdEntries.reduce(
        (sum, e) => sum + Number(e.overtimePay),
        0,
      ),
    };

    return {
      ...entry,
      ytdTotals,
    };
  }

  // ==================== PAYMENTS ====================

  async recordPayment(dto: PaymentRecordDto, userId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: dto.payrollEntryId },
      include: { payrollPeriod: true },
    });
    if (!entry) {
      throw new NotFoundException(
        `Payroll entry '${dto.payrollEntryId}' not found`,
      );
    }

    if (entry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException(
        'Cannot record payment for closed payroll period',
      );
    }

    const updated = await this.prisma.payrollEntry.update({
      where: { id: dto.payrollEntryId },
      data: {
        paymentStatus: 'PAID',
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.reference || null,
        paymentDate: dto.paymentDate ? new Date(dto.paymentDate) : new Date(),
      },
    });

    await this.audit.log({
      action: 'PAYROLL_PAYMENT_RECORDED',
      entity: 'PayrollEntry',
      entityId: dto.payrollEntryId,
      userId,
      details: {
        paymentMethod: dto.paymentMethod,
        reference: dto.reference,
        amount: Number(entry.netSalary),
      },
    });

    return updated;
  }

  async getPaymentList(periodId: string, paymentMethod?: PaymentMethod) {
    const where: Prisma.PayrollEntryWhereInput = { payrollPeriodId: periodId };
    if (paymentMethod) where.paymentMethod = paymentMethod;

    const entries = await this.prisma.payrollEntry.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
            department: { select: { name: true } },
            bankDetails: true,
          },
        },
      },
      orderBy: { employee: { displayName: 'asc' } },
    });

    const summary = {
      totalAmount: entries.reduce((sum, e) => sum + Number(e.netSalary), 0),
      totalPaid: entries.filter((e) => e.paymentStatus === 'PAID').length,
      totalPending: entries.filter((e) => e.paymentStatus === 'PENDING').length,
    };

    return { entries, summary };
  }

  // ==================== REPORTS ====================

  async getPayrollSummary(periodId: string): Promise<PayrollSummaryDto> {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${periodId}' not found`);
    }

    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
    });

    return {
      periodId,
      periodName: period.name,
      totalEmployees: entries.length,
      totalBasicSalary: Math.round(
        entries.reduce((sum, e) => sum + Number(e.basicSalary), 0) * 100,
      ) / 100,
      totalAllowances: Math.round(
        entries.reduce((sum, e) => sum + Number(e.totalAllowances), 0) * 100,
      ) / 100,
      totalOvertime: Math.round(
        entries.reduce((sum, e) => sum + Number(e.overtimePay), 0) * 100,
      ) / 100,
      totalBonuses: Math.round(
        entries.reduce((sum, e) => sum + Number(e.bonusAmount), 0) * 100,
      ) / 100,
      totalGrossSalary: Math.round(
        entries.reduce((sum, e) => sum + Number(e.grossSalary), 0) * 100,
      ) / 100,
      totalLoanDeductions: Math.round(
        entries.reduce((sum, e) => sum + Number(e.loanDeductions), 0) * 100,
      ) / 100,
      totalSocialInsurance: Math.round(
        entries.reduce((sum, e) => sum + Number(e.socialInsurance), 0) * 100,
      ) / 100,
      totalTax: Math.round(
        entries.reduce((sum, e) => sum + Number(e.incomeTax), 0) * 100,
      ) / 100,
      totalOtherDeductions: Math.round(
        entries.reduce((sum, e) => sum + Number(e.otherDeductions), 0) * 100,
      ) / 100,
      totalNetSalary: Math.round(
        entries.reduce((sum, e) => sum + Number(e.netSalary), 0) * 100,
      ) / 100,
    };
  }

  async getDepartmentPayroll(periodId: string) {
    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        employee: {
          select: {
            department: { select: { id: true, name: true } },
          },
        },
        department: { select: { id: true, name: true } },
      },
    });

    const deptMap: Record<
      string,
      {
        departmentId: string;
        departmentName: string;
        employeeCount: number;
        totalBasicSalary: number;
        totalAllowances: number;
        totalOvertime: number;
        totalBonuses: number;
        totalGrossSalary: number;
        totalDeductions: number;
        totalNetSalary: number;
      }
    > = {};

    for (const entry of entries) {
      const deptId = entry.departmentId || entry.employee.department?.id || 'unknown';
      const deptName = entry.department?.name || entry.employee.department?.name || 'Unknown';

      if (!deptMap[deptId]) {
        deptMap[deptId] = {
          departmentId: deptId,
          departmentName: deptName,
          employeeCount: 0,
          totalBasicSalary: 0,
          totalAllowances: 0,
          totalOvertime: 0,
          totalBonuses: 0,
          totalGrossSalary: 0,
          totalDeductions: 0,
          totalNetSalary: 0,
        };
      }

      deptMap[deptId].employeeCount++;
      deptMap[deptId].totalBasicSalary += Number(entry.basicSalary);
      deptMap[deptId].totalAllowances += Number(entry.totalAllowances);
      deptMap[deptId].totalOvertime += Number(entry.overtimePay);
      deptMap[deptId].totalBonuses += Number(entry.bonusAmount);
      deptMap[deptId].totalGrossSalary += Number(entry.grossSalary);
      deptMap[deptId].totalDeductions += Number(entry.totalDeductions);
      deptMap[deptId].totalNetSalary += Number(entry.netSalary);
    }

    return Object.values(deptMap).map((d) => ({
      ...d,
      totalBasicSalary: Math.round(d.totalBasicSalary * 100) / 100,
      totalAllowances: Math.round(d.totalAllowances * 100) / 100,
      totalOvertime: Math.round(d.totalOvertime * 100) / 100,
      totalBonuses: Math.round(d.totalBonuses * 100) / 100,
      totalGrossSalary: Math.round(d.totalGrossSalary * 100) / 100,
      totalDeductions: Math.round(d.totalDeductions * 100) / 100,
      totalNetSalary: Math.round(d.totalNetSalary * 100) / 100,
    }));
  }

  async getSalaryDistribution(periodId: string) {
    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
    });

    const ranges = [
      { min: 0, max: 5000, label: '0 - 5,000' },
      { min: 5000, max: 10000, label: '5,001 - 10,000' },
      { min: 10000, max: 15000, label: '10,001 - 15,000' },
      { min: 15000, max: 20000, label: '15,001 - 20,000' },
      { min: 20000, max: 30000, label: '20,001 - 30,000' },
      { min: 30000, max: 50000, label: '30,001 - 50,000' },
      { min: 50000, max: Infinity, label: '50,001+' },
    ];

    return ranges.map((range) => {
      const inRange = entries.filter((e) => {
        const net = Number(e.netSalary);
        return net >= range.min && net < (range.max === Infinity ? Infinity : range.max);
      });

      return {
        range: range.label,
        count: inRange.length,
        totalAmount: Math.round(
          inRange.reduce((sum, e) => sum + Number(e.netSalary), 0) * 100,
        ) / 100,
      };
    });
  }

  async getDeductionsSummary(periodId: string) {
    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        deductions: true,
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
          },
        },
      },
    });

    const totalLoanDeductions = entries.reduce(
      (sum, e) => sum + Number(e.loanDeductions),
      0,
    );
    const totalSocialInsurance = entries.reduce(
      (sum, e) => sum + Number(e.socialInsurance),
      0,
    );
    const totalTax = entries.reduce(
      (sum, e) => sum + Number(e.incomeTax),
      0,
    );
    const totalOther = entries.reduce(
      (sum, e) => sum + Number(e.otherDeductions),
      0,
    );

    // Aggregate other deductions by type
    const deductionByType: Record<string, { type: string; count: number; total: number }> = {};
    for (const entry of entries) {
      for (const d of entry.deductions) {
        if (!deductionByType[d.deductionType]) {
          deductionByType[d.deductionType] = {
            type: d.deductionType,
            count: 0,
            total: 0,
          };
        }
        deductionByType[d.deductionType].count++;
        deductionByType[d.deductionType].total += Number(d.amount);
      }
    }

    return {
      summary: {
        totalLoanDeductions: Math.round(totalLoanDeductions * 100) / 100,
        totalSocialInsurance: Math.round(totalSocialInsurance * 100) / 100,
        totalTax: Math.round(totalTax * 100) / 100,
        totalOtherDeductions: Math.round(totalOther * 100) / 100,
        grandTotal: Math.round(
          (totalLoanDeductions + totalSocialInsurance + totalTax + totalOther) * 100,
        ) / 100,
      },
      byType: Object.values(deductionByType).map((d) => ({
        ...d,
        total: Math.round(d.total * 100) / 100,
      })),
    };
  }

  async getTaxReport(periodId: string) {
    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
            taxId: true,
          },
        },
      },
    });

    return entries
      .filter((e) => Number(e.incomeTax) > 0)
      .map((e) => {
        const gross = Number(e.grossSalary);
        const taxable = gross - Number(e.socialInsurance) - this.TAX_PERSONAL_EXEMPTION;
        const bracket = this.getTaxBracket(taxable);

        return {
          employeeId: e.employeeId,
          employeeNumber: e.employee.employeeNumber,
          employeeName: e.employee.displayName,
          taxId: e.employee.taxId,
          grossSalary: Math.round(gross * 100) / 100,
          taxableIncome: Math.round(Math.max(taxable, 0) * 100) / 100,
          taxAmount: Math.round(Number(e.incomeTax) * 100) / 100,
          taxBracket: bracket ? `${bracket.rate * 100}%` : '0%',
        };
      })
      .sort((a, b) => b.taxAmount - a.taxAmount);
  }

  async getSocialInsuranceReport(periodId: string) {
    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
            socialInsuranceNumber: true,
          },
        },
      },
    });

    return entries.map((e) => {
      const basic = Number(e.basicSalary);
      const empContrib = Number(e.socialInsurance);
      const emprContrib = basic * this.SOCIAL_INSURANCE_EMPLOYER_RATE;

      return {
        employeeId: e.employeeId,
        employeeNumber: e.employee.employeeNumber,
        employeeName: e.employee.displayName,
        insuranceNumber: e.employee.socialInsuranceNumber,
        basicSalary: Math.round(basic * 100) / 100,
        employeeContribution: Math.round(empContrib * 100) / 100,
        employerContribution: Math.round(emprContrib * 100) / 100,
        totalContribution: Math.round((empContrib + emprContrib) * 100) / 100,
      };
    });
  }

  // ==================== PAYROLL REVERSAL ====================

  async reversePayroll(periodId: string, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${periodId}' not found`);
    }

    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot reverse a closed payroll period');
    }

    // Get all entries to reverse loan deductions
    const entries = await this.prisma.payrollEntry.findMany({
      where: { payrollPeriodId: periodId },
      select: {
        id: true,
        loanDeductionDetails: true,
        loanDeductions: true,
      },
    });

    // Reverse loan deductions
    for (const entry of entries) {
      const details = entry.loanDeductionDetails;
      if (details && Array.isArray(details)) {
        for (const ld of details) {
          if (ld.loanId && ld.amount) {
            const loan = await this.prisma.employeeLoan.findUnique({
              where: { id: ld.loanId },
            });
            if (loan) {
              await this.prisma.employeeLoan.update({
                where: { id: ld.loanId },
                data: {
                  remainingBalance: {
                    increment: new Prisma.Decimal(ld.amount),
                  },
                  status: 'ACTIVE',
                },
              });
            }
          }
        }
      }
    }

    // Delete all payroll entries
    await this.prisma.payrollEntry.deleteMany({
      where: { payrollPeriodId: periodId },
    });

    // Reset period status to DRAFT
    await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: PayrollPeriodStatus.DRAFT },
    });

    await this.audit.log({
      action: 'PAYROLL_REVERSED',
      entity: 'PayrollPeriod',
      entityId: periodId,
      userId,
      details: {
        name: period.name,
        entriesReversed: entries.length,
      },
    });

    return {
      message: 'Payroll reversed successfully',
      entriesReversed: entries.length,
    };
  }

  async reverseEmployeePayroll(entryId: string, userId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: { payrollPeriod: true },
    });
    if (!entry) {
      throw new NotFoundException(`Payroll entry '${entryId}' not found`);
    }

    if (entry.payrollPeriod.status === PayrollPeriodStatus.CLOSED) {
      throw new ForbiddenException('Cannot reverse closed payroll entry');
    }

    // Reverse loan deductions
    const details = entry.loanDeductionDetails;
    if (details && Array.isArray(details)) {
      for (const ld of details) {
        if (ld.loanId && ld.amount) {
          await this.prisma.employeeLoan.update({
            where: { id: ld.loanId },
            data: {
              remainingBalance: {
                increment: new Prisma.Decimal(ld.amount),
              },
              status: 'ACTIVE',
            },
          });
        }
      }
    }

    await this.prisma.payrollEntry.delete({ where: { id: entryId } });

    await this.audit.log({
      action: 'PAYROLL_ENTRY_REVERSED',
      entity: 'PayrollEntry',
      entityId: entryId,
      userId,
      details: { employeeId: entry.employeeId },
    });

    return { message: 'Payroll entry reversed successfully' };
  }

  // ==================== CLOSE PAYROLL ====================

  async closePayroll(periodId: string, userId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({
      where: { id: periodId },
      include: {
        _count: { select: { payrollEntries: true } },
      },
    });
    if (!period) {
      throw new NotFoundException(`Payroll period '${periodId}' not found`);
    }

    if (period.status === PayrollPeriodStatus.CLOSED) {
      throw new BadRequestException('Payroll period is already closed');
    }

    if (period._count.payrollEntries === 0) {
      throw new BadRequestException('Cannot close payroll with no entries');
    }

    const updated = await this.prisma.payrollPeriod.update({
      where: { id: periodId },
      data: { status: PayrollPeriodStatus.CLOSED },
    });

    await this.audit.log({
      action: 'PAYROLL_CLOSED',
      entity: 'PayrollPeriod',
      entityId: periodId,
      userId,
      details: { name: period.name },
    });

    return updated;
  }

  // ==================== HELPER METHODS ====================

  private async recalculatePayrollEntry(entryId: string) {
    const entry = await this.prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: { bonuses: true, deductions: true },
    });
    if (!entry) return;

    // Recalculate bonuses
    const totalBonuses = entry.bonuses.reduce(
      (sum, b) => sum.add(b.amount),
      new Prisma.Decimal(0),
    );

    // Recalculate other deductions
    const totalOtherDeductions = entry.deductions.reduce(
      (sum, d) => sum.add(d.amount),
      new Prisma.Decimal(0),
    );

    // Recalculate gross (base + allowances + overtime + bonuses)
    const grossSalary = entry.basicSalary
      .add(entry.totalAllowances)
      .add(entry.overtimePay)
      .add(totalBonuses);

    // Recalculate taxable income
    const taxableIncome = Prisma.Decimal.max(
      grossSalary
        .sub(entry.socialInsurance)
        .sub(new Prisma.Decimal(this.TAX_PERSONAL_EXEMPTION)),
      new Prisma.Decimal(0),
    );

    // Recalculate tax
    const incomeTax = new Prisma.Decimal(
      this.calculateProgressiveTax(Number(taxableIncome)),
    );

    // Recalculate total deductions
    const totalDeductions = entry.loanDeductions
      .add(entry.socialInsurance)
      .add(incomeTax)
      .add(totalOtherDeductions);

    // Recalculate net salary
    const netSalary = Prisma.Decimal.max(
      grossSalary.sub(totalDeductions),
      new Prisma.Decimal(0),
    );

    await this.prisma.payrollEntry.update({
      where: { id: entryId },
      data: {
        bonusAmount: totalBonuses,
        otherDeductions: totalOtherDeductions,
        grossSalary,
        incomeTax,
        totalDeductions,
        netSalary,
      },
    });
  }

  private calculateProgressiveTax(taxableIncome: number): number {
    if (taxableIncome <= 0) return 0;

    let tax = 0;
    for (const bracket of this.TAX_BRACKETS) {
      if (taxableIncome > bracket.min) {
        const taxableInBracket = Math.min(
          taxableIncome - bracket.min,
          bracket.max === Infinity ? Infinity : bracket.max - bracket.min,
        );
        tax += taxableInBracket * bracket.rate;
      }
    }

    return Math.round(tax * 100) / 100;
  }

  private getTaxBracket(taxableIncome: number): TaxBracket | null {
    if (taxableIncome <= 0) return null;
    for (const bracket of this.TAX_BRACKETS) {
      if (taxableIncome > bracket.min && taxableIncome <= bracket.max) {
        return bracket;
      }
    }
    return this.TAX_BRACKETS[this.TAX_BRACKETS.length - 1];
  }

  // Find entry by ID with details
  private async findEntryById(entryId: string) {
    return this.prisma.payrollEntry.findUnique({
      where: { id: entryId },
      include: {
        employee: {
          select: {
            employeeNumber: true,
            displayName: true,
          },
        },
        bonuses: true,
        deductions: true,
      },
    });
  }

  // Find payroll entries
  async findEntries(filter: PayrollEntryFilterDto) {
    const where: Prisma.PayrollEntryWhereInput = {};

    if (filter.periodId) where.payrollPeriodId = filter.periodId;
    if (filter.employeeId) where.employeeId = filter.employeeId;
    if (filter.paymentStatus) where.paymentStatus = filter.paymentStatus;
    if (filter.departmentId) where.departmentId = filter.departmentId;

    if (filter.search) {
      where.employee = {
        OR: [
          { displayName: { contains: filter.search, mode: 'insensitive' } },
          { employeeNumber: { contains: filter.search, mode: 'insensitive' } },
        ],
      };
    }

    if (filter.branchId) {
      where.employee = {
        ...(where.employee as Prisma.EmployeeWhereInput),
        branchId: filter.branchId,
      };
    }

    const skip = ((filter.page || 1) - 1) * (filter.pageSize || 20);
    const take = filter.pageSize || 20;

    const [data, total] = await Promise.all([
      this.prisma.payrollEntry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              employeeNumber: true,
              displayName: true,
              department: { select: { name: true } },
              branch: { select: { name: true } },
            },
          },
          payrollPeriod: {
            select: { name: true, startDate: true, endDate: true },
          },
          bonuses: true,
          deductions: true,
        },
      }),
      this.prisma.payrollEntry.count({ where }),
    ]);

    return { data, total, page: filter.page || 1, pageSize: filter.pageSize || 20 };
  }
}
