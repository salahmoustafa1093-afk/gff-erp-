import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverFilterDto } from './dto/driver-filter.dto';
import {
  DriverPerformanceMetricsDto,
  DriverLeaderboardEntryDto,
  DriverScheduleDto,
} from './dto/driver-performance.dto';
import { DriverStatus, Prisma } from '@prisma/client';
import { differenceInDays, addDays, startOfDay, endOfDay, format, subDays } from 'date-fns';

@Injectable()
export class DriversService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new driver
   */
  async create(dto: CreateDriverDto, userId: string, branchId?: string) {
    const existingLicense = await this.prisma.driver.findUnique({
      where: { licenseNumber: dto.licenseNumber },
    });
    if (existingLicense) {
      throw new ConflictException(
        `Driver with license number '${dto.licenseNumber}' already exists`,
      );
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!employee) {
        throw new BadRequestException('Linked employee not found');
      }
    }

    const driver = await this.prisma.driver.create({
      data: {
        employeeId: dto.employeeId ?? null,
        licenseNumber: dto.licenseNumber,
        licenseClass: dto.licenseClass,
        licenseIssueDate: new Date(dto.licenseIssueDate),
        licenseExpiryDate: new Date(dto.licenseExpiryDate),
        licenseIssuingAuthority: dto.licenseIssuingAuthority,
        yearsOfExperience: dto.yearsOfExperience ?? 0,
        certifications: dto.certifications ?? '[]',
        allowedVehicleTypes: dto.allowedVehicleTypes ?? '[]',
        status: DriverStatus.AVAILABLE,
        medicalCertificateExpiry: dto.medicalCertificateExpiry
          ? new Date(dto.medicalCertificateExpiry)
          : null,
        rating: dto.rating ?? 0,
        totalTrips: 0,
        totalDistanceDriven: 0,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        emergencyContactRelation: dto.emergencyContactRelation,
        branchId: dto.branchId ?? branchId ?? null,
        baseSalary: dto.baseSalary ?? 0,
        costPerTrip: dto.costPerTrip ?? 0,
        costPerKm: dto.costPerKm ?? 0,
        notes: dto.notes,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return driver;
  }

  /**
   * Find all drivers with filtering
   */
  async findAll(filter: DriverFilterDto, branchId?: string) {
    const {
      search,
      status,
      licenseClass,
      page,
      limit,
      sortBy,
      sortOrder,
      available,
    } = filter;

    const where: Prisma.DriverWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (status) where.status = status;
    if (licenseClass) where.licenseClass = { contains: licenseClass };

    if (search) {
      where.OR = [
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { employee: { firstName: { contains: search, mode: 'insensitive' } } },
        { employee: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (available) {
      where.status = DriverStatus.AVAILABLE;
    }

    const orderBy: Prisma.DriverOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.driver.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          branch: { select: { id: true, name: true } },
          _count: {
            select: { trips: true },
          },
        },
      }),
      this.prisma.driver.count({ where }),
    ]);

    // If filtering by availability, also check active trips
    let filteredData = data;
    if (available) {
      const availableDrivers = [];
      for (const d of data) {
        const activeTrip = await this.prisma.trip.findFirst({
          where: {
            driverId: d.id,
            status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          },
        });
        if (!activeTrip) {
          availableDrivers.push(d);
        }
      }
      filteredData = availableDrivers;
    }

    return {
      data: filteredData,
      meta: {
        page,
        limit,
        total: available ? filteredData.length : total,
        totalPages: Math.ceil((available ? filteredData.length : total) / limit),
      },
    };
  }

  /**
   * Find a driver by ID
   */
  async findOne(id: string, branchId?: string) {
    const driver = await this.prisma.driver.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            department: true,
            position: true,
          },
        },
        branch: { select: { id: true, name: true } },
        trips: {
          orderBy: { startTime: 'desc' },
          take: 20,
          select: {
            id: true,
            tripNumber: true,
            status: true,
            startTime: true,
            endTime: true,
            totalDistance: true,
            totalFuelConsumed: true,
          },
        },
        _count: {
          select: { trips: true },
        },
      },
    });

    if (!driver) {
      throw new NotFoundException(`Driver with ID '${id}' not found`);
    }

    if (branchId && driver.branchId && driver.branchId !== branchId) {
      throw new NotFoundException(`Driver with ID '${id}' not found in this branch`);
    }

    return driver;
  }

  /**
   * Update a driver
   */
  async update(id: string, dto: UpdateDriverDto, userId: string, branchId?: string) {
    const existing = await this.findOne(id, branchId);

    if (dto.licenseNumber && dto.licenseNumber !== existing.licenseNumber) {
      const licenseExists = await this.prisma.driver.findUnique({
        where: { licenseNumber: dto.licenseNumber },
      });
      if (licenseExists) {
        throw new ConflictException(
          `Driver with license number '${dto.licenseNumber}' already exists`,
        );
      }
    }

    if (dto.employeeId) {
      const employee = await this.prisma.employee.findUnique({
        where: { id: dto.employeeId },
      });
      if (!employee) {
        throw new BadRequestException('Linked employee not found');
      }
    }

    const driver = await this.prisma.driver.update({
      where: { id },
      data: {
        employeeId: dto.employeeId ?? undefined,
        licenseNumber: dto.licenseNumber,
        licenseClass: dto.licenseClass,
        licenseIssueDate: dto.licenseIssueDate
          ? new Date(dto.licenseIssueDate)
          : undefined,
        licenseExpiryDate: dto.licenseExpiryDate
          ? new Date(dto.licenseExpiryDate)
          : undefined,
        licenseIssuingAuthority: dto.licenseIssuingAuthority,
        yearsOfExperience: dto.yearsOfExperience,
        certifications: dto.certifications,
        allowedVehicleTypes: dto.allowedVehicleTypes,
        status: dto.status,
        medicalCertificateExpiry: dto.medicalCertificateExpiry
          ? new Date(dto.medicalCertificateExpiry)
          : undefined,
        rating: dto.rating,
        totalTrips: dto.totalTrips,
        totalDistanceDriven: dto.totalDistanceDriven,
        emergencyContactName: dto.emergencyContactName,
        emergencyContactPhone: dto.emergencyContactPhone,
        emergencyContactRelation: dto.emergencyContactRelation,
        branchId: dto.branchId,
        baseSalary: dto.baseSalary,
        costPerTrip: dto.costPerTrip,
        costPerKm: dto.costPerKm,
        notes: dto.notes,
        updatedBy: userId,
      },
    });

    return driver;
  }

  /**
   * Remove a driver (soft delete by setting to INACTIVE)
   */
  async remove(id: string, userId: string, branchId?: string) {
    const driver = await this.findOne(id, branchId);

    const activeTrip = await this.prisma.trip.findFirst({
      where: {
        driverId: id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeTrip) {
      throw new BadRequestException(
        'Cannot deactivate driver with active or scheduled trips',
      );
    }

    return this.prisma.driver.update({
      where: { id },
      data: { status: DriverStatus.INACTIVE, updatedBy: userId },
    });
  }

  /**
   * Get driver performance metrics
   */
  async getPerformanceMetrics(
    id: string,
    branchId?: string,
  ): Promise<DriverPerformanceMetricsDto> {
    const driver = await this.findOne(id, branchId);

    const now = new Date();
    const startOfThisMonth = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
    const startOfLastMonth = startOfDay(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const endOfLastMonth = endOfDay(new Date(now.getFullYear(), now.getMonth(), 0));

    const [
      tripsThisMonth,
      tripsLastMonth,
      allTrips,
      activeTrip,
      fuelLogs,
    ] = await Promise.all([
      this.prisma.trip.findMany({
        where: {
          driverId: id,
          status: 'COMPLETED',
          startTime: { gte: startOfThisMonth },
        },
      }),
      this.prisma.trip.findMany({
        where: {
          driverId: id,
          status: 'COMPLETED',
          startTime: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      this.prisma.trip.findMany({
        where: { driverId: id },
        include: { fuelLogs: true },
      }),
      this.prisma.trip.findFirst({
        where: {
          driverId: id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        include: { vehicle: { select: { code: true } } },
      }),
      this.prisma.fuelLog.findMany({
        where: { driverId: id },
      }),
    ]);

    const completedTrips = allTrips.filter((t) => t.status === 'COMPLETED');
    const distanceThisMonth = tripsThisMonth.reduce(
      (s, t) => s + (t.totalDistance || 0),
      0,
    );
    const distanceLastMonth = tripsLastMonth.reduce(
      (s, t) => s + (t.totalDistance || 0),
      0,
    );

    const tripGrowthPercent =
      tripsLastMonth.length > 0
        ? Math.round(
            ((tripsThisMonth.length - tripsLastMonth.length) /
              tripsLastMonth.length) *
              10000,
          ) / 100
        : 0;

    const distanceGrowthPercent =
      distanceLastMonth > 0
        ? Math.round(
            ((distanceThisMonth - distanceLastMonth) / distanceLastMonth) * 10000,
          ) / 100
        : 0;

    const totalDistance = completedTrips.reduce(
      (s, t) => s + (t.totalDistance || 0),
      0,
    );
    const totalFuelConsumed = completedTrips.reduce(
      (s, t) => s + (t.totalFuelConsumed || 0),
      0,
    );
    const avgFuelEfficiency =
      totalDistance > 0
        ? Math.round((totalFuelConsumed / totalDistance) * 100 * 100) / 100
        : 0;

    const totalFuelCost = fuelLogs.reduce((s, f) => s + f.totalCost, 0);

    // On-time delivery calculation
    const deliveriesWithSchedule = completedTrips.filter(
      (t) => t.plannedEndTime && t.endTime,
    );
    const onTimeDeliveries = deliveriesWithSchedule.filter(
      (t) =>
        t.plannedEndTime &&
        t.endTime &&
        new Date(t.endTime) <= new Date(t.plannedEndTime),
    );
    const onTimeDeliveryRate =
      deliveriesWithSchedule.length > 0
        ? Math.round(
            (onTimeDeliveries.length / deliveriesWithSchedule.length) * 10000,
          ) / 100
        : 100;

    // Average trip duration and distance
    const avgTripDuration =
      completedTrips.length > 0
        ? Math.round(
            completedTrips.reduce((s, t) => {
              if (t.startTime && t.endTime) {
                return s + (t.endTime.getTime() - t.startTime.getTime()) / 3600000;
              }
              return s;
            }, 0) / completedTrips.length * 100,
          ) / 100
        : 0;

    const avgTripDistance =
      completedTrips.length > 0
        ? Math.round((totalDistance / completedTrips.length) * 100) / 100
        : 0;

    return {
      driverId: driver.id,
      licenseNumber: driver.licenseNumber,
      rating: driver.rating,
      totalTrips: driver.totalTrips || completedTrips.length,
      totalDistanceDriven: driver.totalDistanceDriven || totalDistance,
      tripsThisMonth: tripsThisMonth.length,
      distanceThisMonth: Math.round(distanceThisMonth * 100) / 100,
      tripsLastMonth: tripsLastMonth.length,
      distanceLastMonth: Math.round(distanceLastMonth * 100) / 100,
      tripGrowthPercent,
      distanceGrowthPercent,
      avgFuelEfficiency,
      totalFuelConsumed: Math.round(totalFuelConsumed * 100) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      onTimeDeliveryRate,
      lateDeliveries: deliveriesWithSchedule.length - onTimeDeliveries.length,
      safetyIncidents: 0,
      cancelledTrips: allTrips.filter((t) => t.status === 'CANCELLED').length,
      avgTripDuration,
      avgTripDistance,
      status: driver.status,
      isOnTrip: !!activeTrip,
      currentTripId: activeTrip?.id,
      recentTrips: completedTrips.slice(0, 10).map((t) => ({
        id: t.id,
        tripNumber: t.tripNumber,
        status: t.status,
        startTime: t.startTime,
        endTime: t.endTime,
        totalDistance: t.totalDistance || 0,
      })),
    };
  }

  /**
   * Get driver leaderboard
   */
  async getLeaderboard(branchId?: string): Promise<DriverLeaderboardEntryDto[]> {
    const where: Prisma.DriverWhereInput = { status: { not: 'INACTIVE' } };
    if (branchId) where.branchId = branchId;

    const drivers = await this.prisma.driver.findMany({ where });

    const entries: DriverLeaderboardEntryDto[] = [];

    for (const d of drivers) {
      const completedTrips = await this.prisma.trip.findMany({
        where: { driverId: d.id, status: 'COMPLETED' },
      });

      const totalDistance = completedTrips.reduce(
        (s, t) => s + (t.totalDistance || 0),
        0,
      );
      const totalFuel = completedTrips.reduce(
        (s, t) => s + (t.totalFuelConsumed || 0),
        0,
      );
      const avgFuelEfficiency = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;

      // Calculate on-time rate
      const scheduled = completedTrips.filter((t) => t.plannedEndTime && t.endTime);
      const onTime = scheduled.filter(
        (t) => t.plannedEndTime && t.endTime && t.endTime <= t.plannedEndTime,
      );
      const onTimeRate = scheduled.length > 0 ? (onTime.length / scheduled.length) * 100 : 100;

      // Safety score (inverse of incidents)
      const safetyScore = 100;

      // Overall score (weighted average)
      const overallScore = Math.round(
        (d.rating * 20 * 0.25 + // Rating out of 5 -> 100 * 25%
          Math.min(onTimeRate, 100) * 0.3 + // On-time rate * 30%
          Math.max(0, 100 - avgFuelEfficiency) * 0.2 + // Fuel efficiency * 20%
          safetyScore * 0.25) * // Safety * 25%
          100,
      ) / 100;

      entries.push({
        driverId: d.id,
        licenseNumber: d.licenseNumber,
        rating: d.rating,
        totalTrips: d.totalTrips || completedTrips.length,
        totalDistanceDriven: d.totalDistanceDriven || totalDistance,
        onTimeDeliveryRate: Math.round(onTimeRate * 100) / 100,
        avgFuelEfficiency: Math.round(avgFuelEfficiency * 100) / 100,
        safetyScore,
        overallScore: Math.round(overallScore * 100) / 100,
        rank: 0,
      });
    }

    // Sort by overall score descending and assign ranks
    entries.sort((a, b) => b.overallScore - a.overallScore);
    entries.forEach((e, i) => (e.rank = i + 1));

    return entries;
  }

  /**
   * Get driver schedule and availability
   */
  async getDriverSchedule(id: string, branchId?: string): Promise<DriverScheduleDto> {
    const driver = await this.findOne(id, branchId);

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const [currentTrip, upcomingTrips, todaysCompletedTrips] = await Promise.all([
      this.prisma.trip.findFirst({
        where: {
          driverId: id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
        include: { vehicle: { select: { code: true } } },
        orderBy: { startTime: 'desc' },
      }),
      this.prisma.trip.findMany({
        where: {
          driverId: id,
          status: 'SCHEDULED',
          plannedStartTime: { gte: new Date() },
        },
        include: {
          vehicle: { select: { code: true } },
          stops: true,
        },
        orderBy: { plannedStartTime: 'asc' },
        take: 10,
      }),
      this.prisma.trip.findMany({
        where: {
          driverId: id,
          status: 'COMPLETED',
          endTime: { gte: todayStart, lte: todayEnd },
        },
      }),
    ]);

    const hoursDrivenToday = todaysCompletedTrips.reduce((sum, t) => {
      if (t.startTime && t.endTime) {
        return sum + (t.endTime.getTime() - t.startTime.getTime()) / 3600000;
      }
      return sum;
    }, 0);

    const isAvailable =
      driver.status === DriverStatus.AVAILABLE && !currentTrip;

    return {
      driverId: driver.id,
      licenseNumber: driver.licenseNumber,
      status: driver.status,
      isAvailable,
      currentTrip: currentTrip
        ? {
            id: currentTrip.id,
            tripNumber: currentTrip.tripNumber,
            status: currentTrip.status,
            startTime: currentTrip.startTime,
            estimatedEndTime: currentTrip.plannedEndTime,
            vehicleCode: currentTrip.vehicle?.code || '',
          }
        : undefined,
      upcomingTrips: upcomingTrips.map((t) => ({
        id: t.id,
        tripNumber: t.tripNumber,
        plannedStartTime: t.plannedStartTime,
        estimatedDistance: t.estimatedDistance || 0,
        stopCount: t.stops?.length || 0,
        vehicleCode: t.vehicle?.code || '',
      })),
      completedTripsToday: todaysCompletedTrips.length,
      hoursDrivenToday: Math.round(hoursDrivenToday * 100) / 100,
    };
  }

  /**
   * Get available drivers for trip assignment
   */
  async getAvailableDrivers(branchId?: string) {
    const where: Prisma.DriverWhereInput = {
      status: DriverStatus.AVAILABLE,
    };
    if (branchId) where.branchId = branchId;

    const drivers = await this.prisma.driver.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    // Filter out those on active trips
    const availableDrivers = [];
    for (const d of drivers) {
      const activeTrip = await this.prisma.trip.findFirst({
        where: {
          driverId: d.id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      });
      if (!activeTrip) {
        // Check license expiry
        const licenseExpired = isLicenseExpired(d.licenseExpiryDate);
        availableDrivers.push({
          ...d,
          licenseExpired,
          licenseDaysRemaining: differenceInDays(d.licenseExpiryDate, new Date()),
        });
      }
    }

    return availableDrivers;
  }

  /**
   * Check license expiry for all drivers and return warnings
   */
  async getLicenseExpiryAlerts(branchId?: string) {
    const where: Prisma.DriverWhereInput = {
      status: { not: 'INACTIVE' },
    };
    if (branchId) where.branchId = branchId;

    const drivers = await this.prisma.driver.findMany({
      where,
      include: {
        employee: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    const alerts = drivers
      .map((d) => {
        const daysRemaining = differenceInDays(d.licenseExpiryDate, new Date());
        if (daysRemaining > 30) return null;

        return {
          driverId: d.id,
          licenseNumber: d.licenseNumber,
          driverName: d.employee
            ? `${d.employee.firstName} ${d.employee.lastName}`
            : d.licenseNumber,
          licenseExpiryDate: d.licenseExpiryDate,
          daysRemaining,
          severity:
            daysRemaining <= 0
              ? 'CRITICAL'
              : daysRemaining <= 7
                ? 'WARNING'
                : 'INFO',
          message:
            daysRemaining <= 0
              ? `License expired ${Math.abs(daysRemaining)} days ago`
              : `License expires in ${daysRemaining} days`,
        };
      })
      .filter((a): a is NonNullable<typeof a> => a !== null);

    return alerts.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  /**
   * Update driver stats after trip completion
   */
  async updateTripStats(
    driverId: string,
    distanceDriven: number,
    userId: string,
  ) {
    const driver = await this.findOne(driverId);

    return this.prisma.driver.update({
      where: { id: driverId },
      data: {
        totalTrips: { increment: 1 },
        totalDistanceDriven: { increment: distanceDriven },
        status: DriverStatus.AVAILABLE,
        updatedBy: userId,
      },
    });
  }

  /**
   * Bulk update driver status
   */
  async bulkUpdateStatus(
    ids: string[],
    status: DriverStatus,
    userId: string,
    branchId?: string,
  ) {
    const where: Prisma.DriverWhereInput = { id: { in: ids } };
    if (branchId) where.branchId = branchId;

    const result = await this.prisma.driver.updateMany({
      where,
      data: { status, updatedBy: userId },
    });

    return { updatedCount: result.count };
  }
}

function isLicenseExpiryDate(date: Date): boolean {
  return new Date(date) < new Date();
}

function isLicenseExpired(expiryDate: Date): boolean {
  return new Date(expiryDate) < new Date();
}
