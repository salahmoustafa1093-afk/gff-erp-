import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateEmployeeDto, EmployeeStatus } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { AssignSupervisorDto, TransferEmployeeDto } from './dto/assign-supervisor.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class EmployeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateEmployeeDto, userId: string, branchId?: string) {
    // Check for duplicate employee number
    const existing = await this.prisma.employee.findUnique({
      where: { employeeNumber: dto.employeeNumber },
    });
    if (existing) {
      throw new ConflictException(
        `Employee number '${dto.employeeNumber}' already exists`,
      );
    }

    // Check for duplicate email
    const emailExists = await this.prisma.employee.findUnique({
      where: { email: dto.email },
    });
    if (emailExists) {
      throw new ConflictException(`Email '${dto.email}' already in use`);
    }

    // Verify department exists
    const dept = await this.prisma.department.findUnique({
      where: { id: dto.departmentId },
    });
    if (!dept) {
      throw new NotFoundException(
        `Department '${dto.departmentId}' not found`,
      );
    }

    // Verify job title exists
    const job = await this.prisma.jobTitle.findUnique({
      where: { id: dto.jobTitleId },
    });
    if (!job) {
      throw new NotFoundException(`Job title '${dto.jobTitleId}' not found`);
    }

    // Verify supervisor if provided
    if (dto.supervisorId) {
      const sup = await this.prisma.employee.findUnique({
        where: { id: dto.supervisorId },
      });
      if (!sup) {
        throw new NotFoundException(
          `Supervisor '${dto.supervisorId}' not found`,
        );
      }
    }

    const data: Prisma.EmployeeCreateInput = {
      employeeNumber: dto.employeeNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      middleName: dto.middleName || null,
      displayName: dto.displayName || `${dto.firstName} ${dto.lastName}`,
      email: dto.email,
      personalEmail: dto.personalEmail || null,
      phone: dto.phone,
      secondaryPhone: dto.secondaryPhone || null,
      gender: dto.gender,
      dateOfBirth: new Date(dto.dateOfBirth),
      nationalId: dto.nationalId || null,
      nationality: dto.nationality || null,
      maritalStatus: dto.maritalStatus || null,
      address: dto.address || null,
      city: dto.city || null,
      country: dto.country || null,
      employmentType: dto.employmentType,
      hireDate: new Date(dto.hireDate),
      probationEndDate: dto.probationEndDate
        ? new Date(dto.probationEndDate)
        : null,
      terminationDate: null,
      terminationReason: null,
      status: dto.status || EmployeeStatus.ACTIVE,
      basicSalary: new Prisma.Decimal(dto.basicSalary),
      housingAllowance: new Prisma.Decimal(dto.housingAllowance ?? 0),
      transportAllowance: new Prisma.Decimal(dto.transportAllowance ?? 0),
      foodAllowance: new Prisma.Decimal(dto.foodAllowance ?? 0),
      otherAllowance: new Prisma.Decimal(dto.otherAllowance ?? 0),
      socialInsuranceNumber: dto.socialInsuranceNumber || null,
      taxId: dto.taxId || null,
      workLocation: dto.workLocation || null,
      education: dto.education || null,
      skills: dto.skills || null,
      notes: dto.notes || null,
      photoUrl: dto.photoUrl || null,
      isOvertimeEligible: dto.isOvertimeEligible ?? true,
      annualLeaveBalance: dto.annualLeaveBalance ?? 21,
      sickLeaveBalance: dto.sickLeaveBalance ?? 14,
      emergencyContact: dto.emergencyContact
        ? (JSON.parse(JSON.stringify(dto.emergencyContact)) as Prisma.JsonObject)
        : Prisma.JsonNull,
      bankDetails: dto.bankDetails
        ? (JSON.parse(JSON.stringify(dto.bankDetails)) as Prisma.JsonObject)
        : Prisma.JsonNull,
      department: { connect: { id: dto.departmentId } },
      jobTitle: { connect: { id: dto.jobTitleId } },
      ...(dto.branchId && { branch: { connect: { id: dto.branchId } } }),
      ...(dto.supervisorId && {
        supervisor: { connect: { id: dto.supervisorId } },
      }),
      ...(dto.shiftId && { shift: { connect: { id: dto.shiftId } } }),
    };

    const employee = await this.prisma.employee.create({ data });

    await this.audit.log({
      action: 'EMPLOYEE_CREATED',
      entity: 'Employee',
      entityId: employee.id,
      userId,
      details: {
        employeeNumber: employee.employeeNumber,
        name: employee.displayName,
        departmentId: dto.departmentId,
      },
    });

    return employee;
  }

  async findAll(filter: EmployeeFilterDto) {
    const {
      search,
      status,
      departmentId,
      branchId,
      jobTitleId,
      employmentType,
      supervisorId,
      hireDateFrom,
      hireDateTo,
      page,
      pageSize,
      sortBy,
      sortOrder,
    } = filter;

    const where: Prisma.EmployeeWhereInput = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { displayName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { employeeNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (status) where.status = status;
    if (departmentId) where.departmentId = departmentId;
    if (branchId) where.branchId = branchId;
    if (jobTitleId) where.jobTitleId = jobTitleId;
    if (employmentType) where.employmentType = employmentType;
    if (supervisorId) where.supervisorId = supervisorId;

    if (hireDateFrom || hireDateTo) {
      where.hireDate = {};
      if (hireDateFrom) where.hireDate.gte = new Date(hireDateFrom);
      if (hireDateTo) where.hireDate.lte = new Date(hireDateTo);
    }

    const skip = ((page || 1) - 1) * (pageSize || 20);
    const take = pageSize || 20;
    const orderBy: Prisma.EmployeeOrderByWithRelationInput = {
      [sortBy || 'createdAt']: sortOrder || 'desc',
    };

    const [data, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          department: { select: { id: true, name: true, code: true } },
          jobTitle: { select: { id: true, title: true, grade: true } },
          branch: { select: { id: true, name: true } },
          supervisor: {
            select: { id: true, firstName: true, lastName: true, displayName: true },
          },
          _count: {
            select: {
              subordinates: true,
              attendanceRecords: true,
              loans: true,
            },
          },
        },
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { data, total, page: page || 1, pageSize: pageSize || 20 };
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        jobTitle: true,
        branch: true,
        supervisor: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            employeeNumber: true,
            firstName: true,
            lastName: true,
            displayName: true,
            email: true,
            status: true,
          },
        },
        shift: true,
        attendanceRecords: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        loans: {
          where: { status: { in: ['ACTIVE', 'PENDING'] } },
        },
        payrollEntries: {
          orderBy: { createdAt: 'desc' },
          take: 6,
          include: {
            payrollPeriod: {
              select: { name: true, startDate: true, endDate: true },
            },
          },
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(`Employee with id '${id}' not found`);
    }

    return employee;
  }

  async findByEmployeeNumber(employeeNumber: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { employeeNumber },
      include: {
        department: { select: { id: true, name: true, code: true } },
        jobTitle: { select: { id: true, title: true } },
        branch: { select: { id: true, name: true } },
        supervisor: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!employee) {
      throw new NotFoundException(
        `Employee with number '${employeeNumber}' not found`,
      );
    }

    return employee;
  }

  async update(id: string, dto: UpdateEmployeeDto, userId: string) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Employee with id '${id}' not found`);
    }

    // Check duplicate email if changing
    if (dto.email && dto.email !== existing.email) {
      const emailExists = await this.prisma.employee.findUnique({
        where: { email: dto.email },
      });
      if (emailExists) {
        throw new ConflictException(`Email '${dto.email}' already in use`);
      }
    }

    // Check duplicate employee number if changing
    if (dto.employeeNumber && dto.employeeNumber !== existing.employeeNumber) {
      const numExists = await this.prisma.employee.findUnique({
        where: { employeeNumber: dto.employeeNumber },
      });
      if (numExists) {
        throw new ConflictException(
          `Employee number '${dto.employeeNumber}' already exists`,
        );
      }
    }

    const data: Prisma.EmployeeUpdateInput = {};

    if (dto.employeeNumber !== undefined)
      data.employeeNumber = dto.employeeNumber;
    if (dto.firstName !== undefined) data.firstName = dto.firstName;
    if (dto.lastName !== undefined) data.lastName = dto.lastName;
    if (dto.middleName !== undefined) data.middleName = dto.middleName;
    if (dto.displayName !== undefined) data.displayName = dto.displayName;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.personalEmail !== undefined) data.personalEmail = dto.personalEmail;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.secondaryPhone !== undefined)
      data.secondaryPhone = dto.secondaryPhone;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.dateOfBirth !== undefined)
      data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.nationalId !== undefined) data.nationalId = dto.nationalId;
    if (dto.nationality !== undefined) data.nationality = dto.nationality;
    if (dto.maritalStatus !== undefined) data.maritalStatus = dto.maritalStatus;
    if (dto.address !== undefined) data.address = dto.address;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.country !== undefined) data.country = dto.country;
    if (dto.employmentType !== undefined) data.employmentType = dto.employmentType;
    if (dto.hireDate !== undefined) data.hireDate = new Date(dto.hireDate);
    if (dto.probationEndDate !== undefined)
      data.probationEndDate = dto.probationEndDate
        ? new Date(dto.probationEndDate)
        : null;
    if (dto.terminationDate !== undefined)
      data.terminationDate = dto.terminationDate
        ? new Date(dto.terminationDate)
        : null;
    if (dto.terminationReason !== undefined)
      data.terminationReason = dto.terminationReason;
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.basicSalary !== undefined)
      data.basicSalary = new Prisma.Decimal(dto.basicSalary);
    if (dto.housingAllowance !== undefined)
      data.housingAllowance = new Prisma.Decimal(dto.housingAllowance);
    if (dto.transportAllowance !== undefined)
      data.transportAllowance = new Prisma.Decimal(dto.transportAllowance);
    if (dto.foodAllowance !== undefined)
      data.foodAllowance = new Prisma.Decimal(dto.foodAllowance);
    if (dto.otherAllowance !== undefined)
      data.otherAllowance = new Prisma.Decimal(dto.otherAllowance);
    if (dto.socialInsuranceNumber !== undefined)
      data.socialInsuranceNumber = dto.socialInsuranceNumber;
    if (dto.taxId !== undefined) data.taxId = dto.taxId;
    if (dto.workLocation !== undefined) data.workLocation = dto.workLocation;
    if (dto.education !== undefined) data.education = dto.education;
    if (dto.skills !== undefined) data.skills = dto.skills;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.photoUrl !== undefined) data.photoUrl = dto.photoUrl;
    if (dto.isOvertimeEligible !== undefined)
      data.isOvertimeEligible = dto.isOvertimeEligible;
    if (dto.annualLeaveBalance !== undefined)
      data.annualLeaveBalance = dto.annualLeaveBalance;
    if (dto.sickLeaveBalance !== undefined)
      data.sickLeaveBalance = dto.sickLeaveBalance;

    if (dto.departmentId !== undefined) {
      data.department = { connect: { id: dto.departmentId } };
    }
    if (dto.jobTitleId !== undefined) {
      data.jobTitle = { connect: { id: dto.jobTitleId } };
    }
    if (dto.branchId !== undefined) {
      data.branch =
        dto.branchId === null
          ? { disconnect: true }
          : { connect: { id: dto.branchId } };
    }
    if (dto.supervisorId !== undefined) {
      data.supervisor =
        dto.supervisorId === null
          ? { disconnect: true }
          : { connect: { id: dto.supervisorId } };
    }
    if (dto.shiftId !== undefined) {
      data.shift =
        dto.shiftId === null
          ? { disconnect: true }
          : { connect: { id: dto.shiftId } };
    }
    if (dto.emergencyContact !== undefined) {
      data.emergencyContact = JSON.parse(
        JSON.stringify(dto.emergencyContact),
      ) as Prisma.JsonObject;
    }
    if (dto.bankDetails !== undefined) {
      data.bankDetails = JSON.parse(
        JSON.stringify(dto.bankDetails),
      ) as Prisma.JsonObject;
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true } },
        jobTitle: { select: { id: true, title: true } },
      },
    });

    await this.audit.log({
      action: 'EMPLOYEE_UPDATED',
      entity: 'Employee',
      entityId: id,
      userId,
      details: { employeeNumber: updated.employeeNumber, changes: Object.keys(dto) },
    });

    return updated;
  }

  async remove(id: string, userId: string) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Employee with id '${id}' not found`);
    }

    // Check for blocking references
    const hasPayroll = await this.prisma.payrollEntry.count({
      where: { employeeId: id },
    });
    if (hasPayroll > 0) {
      throw new BadRequestException(
        'Cannot delete employee with payroll history. Set status to TERMINATED instead.',
      );
    }

    const hasLoans = await this.prisma.employeeLoan.count({
      where: { employeeId: id, status: { in: ['ACTIVE', 'PENDING'] } },
    });
    if (hasLoans > 0) {
      throw new BadRequestException(
        'Cannot delete employee with active loans. Close loans first.',
      );
    }

    await this.prisma.employee.delete({ where: { id } });

    await this.audit.log({
      action: 'EMPLOYEE_DELETED',
      entity: 'Employee',
      entityId: id,
      userId,
      details: {
        employeeNumber: existing.employeeNumber,
        name: existing.displayName,
      },
    });

    return { message: 'Employee deleted successfully' };
  }

  async assignSupervisor(
    id: string,
    dto: AssignSupervisorDto,
    userId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with id '${id}' not found`);
    }

    const supervisor = await this.prisma.employee.findUnique({
      where: { id: dto.supervisorId },
    });
    if (!supervisor) {
      throw new NotFoundException(
        `Supervisor with id '${dto.supervisorId}' not found`,
      );
    }

    // Prevent self-supervision
    if (id === dto.supervisorId) {
      throw new BadRequestException('Employee cannot be their own supervisor');
    }

    // Prevent circular supervision
    let current = supervisor;
    while (current.supervisorId) {
      if (current.supervisorId === id) {
        throw new BadRequestException(
          'Circular supervisor chain detected',
        );
      }
      current = await this.prisma.employee.findUnique({
        where: { id: current.supervisorId },
      });
      if (!current) break;
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: { supervisor: { connect: { id: dto.supervisorId } } },
      include: {
        supervisor: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    await this.audit.log({
      action: 'EMPLOYEE_SUPERVISOR_ASSIGNED',
      entity: 'Employee',
      entityId: id,
      userId,
      details: {
        supervisorId: dto.supervisorId,
        supervisorName: supervisor.displayName,
        reason: dto.reason,
      },
    });

    return updated;
  }

  async transfer(id: string, dto: TransferEmployeeDto, userId: string) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with id '${id}' not found`);
    }

    const updateData: Prisma.EmployeeUpdateInput = {};

    if (dto.departmentId) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new NotFoundException(
          `Department '${dto.departmentId}' not found`,
        );
      }
      updateData.department = { connect: { id: dto.departmentId } };
    }

    if (dto.branchId) {
      updateData.branch = { connect: { id: dto.branchId } };
    }

    if (dto.jobTitleId) {
      const job = await this.prisma.jobTitle.findUnique({
        where: { id: dto.jobTitleId },
      });
      if (!job) {
        throw new NotFoundException(
          `Job title '${dto.jobTitleId}' not found`,
        );
      }
      updateData.jobTitle = { connect: { id: dto.jobTitleId } };
    }

    if (dto.supervisorId) {
      const sup = await this.prisma.employee.findUnique({
        where: { id: dto.supervisorId },
      });
      if (!sup) {
        throw new NotFoundException(
          `Supervisor '${dto.supervisorId}' not found`,
        );
      }
      updateData.supervisor = { connect: { id: dto.supervisorId } };
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: updateData,
      include: {
        department: { select: { id: true, name: true } },
        jobTitle: { select: { id: true, title: true } },
        branch: { select: { id: true, name: true } },
        supervisor: { select: { id: true, displayName: true } },
      },
    });

    await this.audit.log({
      action: 'EMPLOYEE_TRANSFERRED',
      entity: 'Employee',
      entityId: id,
      userId,
      details: {
        fromDepartment: employee.departmentId,
        toDepartment: dto.departmentId,
        fromBranch: employee.branchId,
        toBranch: dto.branchId,
        reason: dto.reason,
        effectiveDate: dto.effectiveDate,
      },
    });

    return updated;
  }

  // Get employee directory (flattened list)
  async getDirectory(filter: EmployeeFilterDto) {
    const result = await this.findAll({
      ...filter,
      status: filter.status || EmployeeStatus.ACTIVE,
    });

    const flattened = result.data.map((emp) => ({
      id: emp.id,
      employeeNumber: emp.employeeNumber,
      displayName: emp.displayName,
      email: emp.email,
      phone: emp.phone,
      department: emp.department,
      jobTitle: emp.jobTitle,
      branch: emp.branch,
      supervisor: emp.supervisor,
      status: emp.status,
      photoUrl: emp.photoUrl,
    }));

    return { ...result, data: flattened };
  }

  // Get employee statistics
  async getStatistics(branchId?: string) {
    const where: Prisma.EmployeeWhereInput = {};
    if (branchId) where.branchId = branchId;

    const [
      totalEmployees,
      byStatus,
      byDepartment,
      byBranch,
      byEmploymentType,
      byGender,
      newHiresThisMonth,
      terminationsThisMonth,
    ] = await Promise.all([
      this.prisma.employee.count({ where }),

      this.prisma.employee.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),

      this.prisma.employee.groupBy({
        by: ['departmentId'],
        where,
        _count: { id: true },
      }),

      this.prisma.employee.groupBy({
        by: ['branchId'],
        where,
        _count: { id: true },
      }),

      this.prisma.employee.groupBy({
        by: ['employmentType'],
        where,
        _count: { id: true },
      }),

      this.prisma.employee.groupBy({
        by: ['gender'],
        where,
        _count: { id: true },
      }),

      this.prisma.employee.count({
        where: {
          ...where,
          hireDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),

      this.prisma.employee.count({
        where: {
          ...where,
          status: EmployeeStatus.TERMINATED,
          terminationDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Get department names
    const departmentIds = byDepartment.map((d) => d.departmentId).filter(Boolean);
    const departments = await this.prisma.department.findMany({
      where: { id: { in: departmentIds } },
      select: { id: true, name: true },
    });
    const deptMap = new Map(departments.map((d) => [d.id, d.name]));

    // Get branch names
    const branchIds = byBranch.map((b) => b.branchId).filter(Boolean);
    const branches = await this.prisma.branch.findMany({
      where: { id: { in: branchIds } },
      select: { id: true, name: true },
    });
    const branchMap = new Map(branches.map((b) => [b.id, b.name]));

    return {
      totalEmployees,
      byStatus: byStatus.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
      byDepartment: byDepartment.map((d) => ({
        departmentId: d.departmentId,
        departmentName: deptMap.get(d.departmentId) || 'Unknown',
        count: d._count.id,
      })),
      byBranch: byBranch.map((b) => ({
        branchId: b.branchId,
        branchName: branchMap.get(b.branchId) || 'Unknown',
        count: b._count.id,
      })),
      byEmploymentType: byEmploymentType.map((e) => ({
        type: e.employmentType,
        count: e._count.id,
      })),
      byGender: byGender.map((g) => ({
        gender: g.gender,
        count: g._count.id,
      })),
      newHiresThisMonth,
      terminationsThisMonth,
    };
  }

  // Get subordinates
  async getSubordinates(supervisorId: string) {
    return this.prisma.employee.findMany({
      where: { supervisorId },
      select: {
        id: true,
        employeeNumber: true,
        firstName: true,
        lastName: true,
        displayName: true,
        email: true,
        phone: true,
        status: true,
        jobTitle: { select: { title: true } },
        department: { select: { name: true } },
      },
    });
  }

  // Get upcoming birthdays (next 30 days)
  async getUpcomingBirthdays(branchId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: {
        status: { not: EmployeeStatus.TERMINATED },
        ...(branchId && { branchId }),
        dateOfBirth: { not: null },
      },
      select: {
        id: true,
        employeeNumber: true,
        displayName: true,
        firstName: true,
        lastName: true,
        dateOfBirth: true,
        department: { select: { name: true } },
        photoUrl: true,
      },
    });

    const today = new Date();
    const upcoming = employees
      .map((emp) => {
        const dob = new Date(emp.dateOfBirth);
        const thisYearBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate(),
        );
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil(
          (thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return {
          ...emp,
          birthMonth: dob.getMonth() + 1,
          birthDay: dob.getDate(),
          daysUntil,
        };
      })
      .filter((emp) => emp.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcoming;
  }

  // Get upcoming work anniversaries
  async getUpcomingAnniversaries(branchId?: string) {
    const employees = await this.prisma.employee.findMany({
      where: {
        status: { not: EmployeeStatus.TERMINATED },
        ...(branchId && { branchId }),
      },
      select: {
        id: true,
        employeeNumber: true,
        displayName: true,
        firstName: true,
        lastName: true,
        hireDate: true,
        department: { select: { name: true } },
        photoUrl: true,
      },
    });

    const today = new Date();
    const upcoming = employees
      .map((emp) => {
        const hd = new Date(emp.hireDate);
        const thisYearAnniv = new Date(
          today.getFullYear(),
          hd.getMonth(),
          hd.getDate(),
        );
        if (thisYearAnniv < today) {
          thisYearAnniv.setFullYear(today.getFullYear() + 1);
        }
        const daysUntil = Math.ceil(
          (thisYearAnniv.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        const years = today.getFullYear() - hd.getFullYear();
        return {
          ...emp,
          hireMonth: hd.getMonth() + 1,
          hireDay: hd.getDate(),
          daysUntil,
          yearsOfService: years,
        };
      })
      .filter((emp) => emp.daysUntil <= 30)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return upcoming;
  }

  // Terminate employee
  async terminate(
    id: string,
    dto: { terminationDate: string; terminationReason: string },
    userId: string,
  ) {
    const employee = await this.prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      throw new NotFoundException(`Employee with id '${id}' not found`);
    }

    if (employee.status === EmployeeStatus.TERMINATED) {
      throw new BadRequestException('Employee is already terminated');
    }

    const updated = await this.prisma.employee.update({
      where: { id },
      data: {
        status: EmployeeStatus.TERMINATED,
        terminationDate: new Date(dto.terminationDate),
        terminationReason: dto.terminationReason,
      },
    });

    await this.audit.log({
      action: 'EMPLOYEE_TERMINATED',
      entity: 'Employee',
      entityId: id,
      userId,
      details: {
        employeeNumber: employee.employeeNumber,
        terminationDate: dto.terminationDate,
        reason: dto.terminationReason,
      },
    });

    return updated;
  }

  // Bulk status update
  async bulkUpdateStatus(
    ids: string[],
    status: EmployeeStatus,
    userId: string,
  ) {
    const result = await this.prisma.employee.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });

    await this.audit.log({
      action: 'EMPLOYEE_BULK_STATUS_UPDATE',
      entity: 'Employee',
      entityId: ids.join(','),
      userId,
      details: { status, count: result.count },
    });

    return { updated: result.count };
  }
}
