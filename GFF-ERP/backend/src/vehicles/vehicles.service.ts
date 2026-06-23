import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  VehicleFilterDto,
  VehicleUtilizationDto,
  FuelConsumptionDto,
  VehicleCostSummaryDto,
} from './dto/vehicle-report.dto';
import {
  MaintenanceAlertDto,
  MaintenanceAlertSeverity,
  MaintenanceScheduleDto,
} from './dto/maintenance-alert.dto';
import { VehicleStatus, Prisma } from '@prisma/client';
import { startOfDay, endOfDay, differenceInDays, addDays, isBefore, isAfter } from 'date-fns';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new vehicle record
   */
  async create(dto: CreateVehicleDto, userId: string, branchId?: string) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Vehicle with code '${dto.code}' already exists`);
    }

    const existingPlate = await this.prisma.vehicle.findUnique({
      where: { licensePlate: dto.licensePlate },
    });
    if (existingPlate) {
      throw new ConflictException(`Vehicle with license plate '${dto.licensePlate}' already exists`);
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        code: dto.code,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        licensePlate: dto.licensePlate,
        chassisNumber: dto.chassisNumber,
        engineNumber: dto.engineNumber,
        type: dto.type,
        fuelType: dto.fuelType,
        tankCapacity: dto.tankCapacity ?? 0,
        loadCapacity: dto.loadCapacity ?? 0,
        seatingCapacity: dto.seatingCapacity ?? 0,
        currentMileage: dto.currentMileage,
        status: VehicleStatus.ACTIVE,
        branchId: dto.branchId ?? branchId ?? null,
        gpsDeviceId: dto.gpsDeviceId,
        color: dto.color,
        insurancePolicyNumber: dto.insurancePolicyNumber,
        insuranceCompany: dto.insuranceCompany,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : null,
        registrationExpiry: dto.registrationExpiry ? new Date(dto.registrationExpiry) : null,
        nextMaintenanceDate: dto.nextMaintenanceDate ? new Date(dto.nextMaintenanceDate) : null,
        nextMaintenanceMileage: dto.nextMaintenanceMileage,
        maintenanceIntervalKm: dto.maintenanceIntervalKm,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : null,
        purchasePrice: dto.purchasePrice,
        notes: dto.notes,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    return vehicle;
  }

  /**
   * Find all vehicles with filtering and pagination
   */
  async findAll(filter: VehicleFilterDto, branchId?: string) {
    const {
      search,
      type,
      status,
      fuelType,
      page,
      limit,
      sortBy,
      sortOrder,
      maintenanceDue,
      insuranceExpiring,
      registrationExpiring,
      insuranceExpiryBefore,
      registrationExpiryBefore,
      maintenanceDueBefore,
    } = filter;

    const where: Prisma.VehicleWhereInput = {};

    if (branchId) {
      where.branchId = branchId;
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (fuelType) where.fuelType = fuelType;

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { make: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (maintenanceDue) {
      where.OR = [
        ...(where.OR || []),
        {
          AND: [
            { nextMaintenanceDate: { not: null } },
            { nextMaintenanceDate: { lte: addDays(new Date(), 14) } },
          ],
        },
        {
          AND: [
            { nextMaintenanceMileage: { not: null } },
            { currentMileage: { gte: Prisma.raw('"nextMaintenanceMileage" - 500') } },
          ],
        },
      ];
    }

    if (insuranceExpiring || insuranceExpiryBefore) {
      where.insuranceExpiry = {
        lte: insuranceExpiryBefore
          ? new Date(insuranceExpiryBefore)
          : addDays(new Date(), 30),
      };
    }

    if (registrationExpiring || registrationExpiryBefore) {
      where.registrationExpiry = {
        lte: registrationExpiryBefore
          ? new Date(registrationExpiryBefore)
          : addDays(new Date(), 30),
      };
    }

    if (maintenanceDueBefore) {
      where.nextMaintenanceDate = { lte: new Date(maintenanceDueBefore) };
    }

    const orderBy: Prisma.VehicleOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          branch: { select: { id: true, name: true } },
          _count: {
            select: { trips: true, fuelLogs: true },
          },
        },
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a single vehicle by ID
   */
  async findOne(id: string, branchId?: string) {
    const where: Prisma.VehicleWhereUniqueInput = { id };
    const vehicle = await this.prisma.vehicle.findUnique({
      where,
      include: {
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
          },
        },
        fuelLogs: {
          orderBy: { date: 'desc' },
          take: 20,
        },
        _count: {
          select: { trips: true, fuelLogs: true, maintenanceRecords: true },
        },
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${id}' not found`);
    }

    if (branchId && vehicle.branchId && vehicle.branchId !== branchId) {
      throw new NotFoundException(`Vehicle with ID '${id}' not found in this branch`);
    }

    return vehicle;
  }

  /**
   * Update a vehicle
   */
  async update(id: string, dto: UpdateVehicleDto, userId: string, branchId?: string) {
    const existing = await this.findOne(id, branchId);

    if (dto.code && dto.code !== existing.code) {
      const codeExists = await this.prisma.vehicle.findUnique({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw new ConflictException(`Vehicle with code '${dto.code}' already exists`);
      }
    }

    if (dto.licensePlate && dto.licensePlate !== existing.licensePlate) {
      const plateExists = await this.prisma.vehicle.findUnique({
        where: { licensePlate: dto.licensePlate },
      });
      if (plateExists) {
        throw new ConflictException(
          `Vehicle with license plate '${dto.licensePlate}' already exists`,
        );
      }
    }

    const vehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        code: dto.code,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        licensePlate: dto.licensePlate,
        chassisNumber: dto.chassisNumber,
        engineNumber: dto.engineNumber,
        type: dto.type,
        status: dto.status,
        fuelType: dto.fuelType,
        tankCapacity: dto.tankCapacity,
        loadCapacity: dto.loadCapacity,
        seatingCapacity: dto.seatingCapacity,
        currentMileage: dto.currentMileage,
        branchId: dto.branchId,
        gpsDeviceId: dto.gpsDeviceId,
        color: dto.color,
        insurancePolicyNumber: dto.insurancePolicyNumber,
        insuranceCompany: dto.insuranceCompany,
        insuranceExpiry: dto.insuranceExpiry ? new Date(dto.insuranceExpiry) : undefined,
        registrationExpiry: dto.registrationExpiry
          ? new Date(dto.registrationExpiry)
          : undefined,
        nextMaintenanceDate: dto.nextMaintenanceDate
          ? new Date(dto.nextMaintenanceDate)
          : undefined,
        nextMaintenanceMileage: dto.nextMaintenanceMileage,
        maintenanceIntervalKm: dto.maintenanceIntervalKm,
        purchaseDate: dto.purchaseDate ? new Date(dto.purchaseDate) : undefined,
        purchasePrice: dto.purchasePrice,
        notes: dto.notes,
        updatedBy: userId,
      },
    });

    return vehicle;
  }

  /**
   * Remove a vehicle (soft delete by setting to RETIRED)
   */
  async remove(id: string, userId: string, branchId?: string) {
    const vehicle = await this.findOne(id, branchId);

    const activeTrips = await this.prisma.trip.count({
      where: {
        vehicleId: id,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });

    if (activeTrips > 0) {
      throw new BadRequestException(
        'Cannot retire vehicle with active or scheduled trips',
      );
    }

    const updated = await this.prisma.vehicle.update({
      where: { id },
      data: { status: VehicleStatus.RETIRED, updatedBy: userId },
    });

    return updated;
  }

  /**
   * Get maintenance alerts for all vehicles
   */
  async getMaintenanceAlerts(branchId?: string): Promise<MaintenanceAlertDto[]> {
    const where: Prisma.VehicleWhereInput = {
      status: { not: VehicleStatus.RETIRED },
    };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });

    const alerts: MaintenanceAlertDto[] = [];

    for (const vehicle of vehicles) {
      const daysUntilMaint = vehicle.nextMaintenanceDate
        ? differenceInDays(vehicle.nextMaintenanceDate, new Date())
        : null;
      const kmUntilMaint =
        vehicle.nextMaintenanceMileage && vehicle.currentMileage
          ? vehicle.nextMaintenanceMileage - vehicle.currentMileage
          : null;

      // Mileage-based maintenance alert
      if (kmUntilMaint !== null && kmUntilMaint <= 500) {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleCode: vehicle.code,
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          currentMileage: vehicle.currentMileage,
          alertType: 'MILEAGE_BASED',
          severity:
            kmUntilMaint <= 0
              ? MaintenanceAlertSeverity.CRITICAL
              : MaintenanceAlertSeverity.WARNING,
          message:
            kmUntilMaint <= 0
              ? `Maintenance overdue by ${Math.abs(kmUntilMaint)} km`
              : `Maintenance due in ${kmUntilMaint} km`,
          dueMileage: vehicle.nextMaintenanceMileage ?? undefined,
          kmRemaining: kmUntilMaint,
        });
      }

      // Date-based maintenance alert
      if (daysUntilMaint !== null && daysUntilMaint <= 14) {
        alerts.push({
          vehicleId: vehicle.id,
          vehicleCode: vehicle.code,
          make: vehicle.make,
          model: vehicle.model,
          licensePlate: vehicle.licensePlate,
          type: vehicle.type,
          currentMileage: vehicle.currentMileage,
          alertType: 'DATE_BASED',
          severity:
            daysUntilMaint <= 0
              ? MaintenanceAlertSeverity.CRITICAL
              : daysUntilMaint <= 7
                ? MaintenanceAlertSeverity.WARNING
                : MaintenanceAlertSeverity.INFO,
          message:
            daysUntilMaint <= 0
              ? `Maintenance overdue by ${Math.abs(daysUntilMaint)} days`
              : `Maintenance due in ${daysUntilMaint} days`,
          dueDate: vehicle.nextMaintenanceDate ?? undefined,
          daysRemaining: daysUntilMaint,
        });
      }

      // Insurance expiry alert
      if (vehicle.insuranceExpiry) {
        const daysUntilInsurance = differenceInDays(vehicle.insuranceExpiry, new Date());
        if (daysUntilInsurance <= 30) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleCode: vehicle.code,
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
            type: vehicle.type,
            currentMileage: vehicle.currentMileage,
            alertType: 'INSURANCE_EXPIRY',
            severity:
              daysUntilInsurance <= 0
                ? MaintenanceAlertSeverity.CRITICAL
                : daysUntilInsurance <= 7
                  ? MaintenanceAlertSeverity.WARNING
                  : MaintenanceAlertSeverity.INFO,
            message:
              daysUntilInsurance <= 0
                ? `Insurance expired ${Math.abs(daysUntilInsurance)} days ago`
                : `Insurance expires in ${daysUntilInsurance} days`,
            insuranceExpiry: vehicle.insuranceExpiry,
            daysRemaining: daysUntilInsurance,
          });
        }
      }

      // Registration expiry alert
      if (vehicle.registrationExpiry) {
        const daysUntilReg = differenceInDays(vehicle.registrationExpiry, new Date());
        if (daysUntilReg <= 30) {
          alerts.push({
            vehicleId: vehicle.id,
            vehicleCode: vehicle.code,
            make: vehicle.make,
            model: vehicle.model,
            licensePlate: vehicle.licensePlate,
            type: vehicle.type,
            currentMileage: vehicle.currentMileage,
            alertType: 'REGISTRATION_EXPIRY',
            severity:
              daysUntilReg <= 0
                ? MaintenanceAlertSeverity.CRITICAL
                : daysUntilReg <= 7
                  ? MaintenanceAlertSeverity.WARNING
                  : MaintenanceAlertSeverity.INFO,
            message:
              daysUntilReg <= 0
                ? `Registration expired ${Math.abs(daysUntilReg)} days ago`
                : `Registration expires in ${daysUntilReg} days`,
            registrationExpiry: vehicle.registrationExpiry,
            daysRemaining: daysUntilReg,
          });
        }
      }
    }

    return alerts.sort((a, b) => {
      const sevOrder = { CRITICAL: 0, WARNING: 1, INFO: 2 };
      return sevOrder[a.severity] - sevOrder[b.severity];
    });
  }

  /**
   * Get maintenance schedule for all vehicles
   */
  async getMaintenanceSchedule(branchId?: string): Promise<MaintenanceScheduleDto[]> {
    const where: Prisma.VehicleWhereInput = {
      status: { not: VehicleStatus.RETIRED },
    };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        maintenanceRecords: {
          orderBy: { date: 'desc' },
          take: 1,
        },
      },
    });

    return vehicles.map((v) => {
      const lastMaint = v.maintenanceRecords[0];
      const daysUntil = v.nextMaintenanceDate
        ? differenceInDays(v.nextMaintenanceDate, new Date())
        : null;
      const kmUntil =
        v.nextMaintenanceMileage && v.currentMileage
          ? v.nextMaintenanceMileage - v.currentMileage
          : null;

      let severity = MaintenanceAlertSeverity.INFO;
      let isOverdue = false;

      if ((daysUntil !== null && daysUntil <= 0) || (kmUntil !== null && kmUntil <= 0)) {
        severity = MaintenanceAlertSeverity.CRITICAL;
        isOverdue = true;
      } else if (
        (daysUntil !== null && daysUntil <= 7) ||
        (kmUntil !== null && kmUntil <= 500)
      ) {
        severity = MaintenanceAlertSeverity.WARNING;
      }

      return {
        vehicleId: v.id,
        vehicleCode: v.code,
        vehicleName: `${v.make} ${v.model} (${v.year})`,
        licensePlate: v.licensePlate,
        lastMaintenanceDate: lastMaint?.date ?? null,
        lastMaintenanceMileage: lastMaint?.mileage ?? null,
        nextMaintenanceDate: v.nextMaintenanceDate,
        nextMaintenanceMileage: v.nextMaintenanceMileage,
        maintenanceIntervalKm: v.maintenanceIntervalKm,
        currentMileage: v.currentMileage,
        kmUntilNextMaintenance: kmUntil,
        daysUntilNextMaintenance: daysUntil,
        severity,
        isOverdue,
      };
    });
  }

  /**
   * Get vehicle utilization report
   */
  async getVehicleUtilization(
    filter: VehicleFilterDto,
    branchId?: string,
  ): Promise<{ data: VehicleUtilizationDto[]; meta: any }> {
    const { page, limit } = filter;
    const where: Prisma.VehicleWhereInput = {};
    if (branchId) where.branchId = branchId;

    const [vehicles, total] = await Promise.all([
      this.prisma.vehicle.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.vehicle.count({ where }),
    ]);

    const utilizationData: VehicleUtilizationDto[] = [];

    for (const v of vehicles) {
      const trips = await this.prisma.trip.findMany({
        where: { vehicleId: v.id, status: 'COMPLETED' },
      });
      const fuelLogs = await this.prisma.fuelLog.findMany({
        where: { vehicleId: v.id },
      });
      const maintenanceRecords = await this.prisma.maintenanceRecord.findMany({
        where: { vehicleId: v.id },
      });

      const totalTrips = trips.length;
      const totalDistance = trips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);
      const totalFuel = fuelLogs.reduce((sum, f) => sum + f.quantityLiters, 0);
      const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
      const totalMaintCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);

      const avgConsumption = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;
      const costPerKm = totalDistance > 0
        ? (totalFuelCost + totalMaintCost) / totalDistance
        : 0;

      const lastTrip = trips.sort(
        (a, b) => (b.endTime?.getTime() || 0) - (a.endTime?.getTime() || 0),
      )[0];
      const daysSinceLastUsed = lastTrip?.endTime
        ? differenceInDays(new Date(), lastTrip.endTime)
        : 999;

      // Calculate utilization rate (trips in last 30 days vs. capacity)
      const tripsLast30Days = trips.filter(
        (t) => t.startTime && differenceInDays(new Date(), t.startTime) <= 30,
      ).length;
      const utilizationRate = Math.min((tripsLast30Days / 30) * 100, 100);

      utilizationData.push({
        id: v.id,
        code: v.code,
        make: v.make,
        model: v.model,
        licensePlate: v.licensePlate,
        type: v.type,
        totalTrips,
        totalDistanceKm: totalDistance,
        totalFuelConsumed: totalFuel,
        avgFuelConsumption: Math.round(avgConsumption * 100) / 100,
        totalFuelCost,
        totalMaintenanceCost: totalMaintCost,
        costPerKm: Math.round(costPerKm * 100) / 100,
        daysSinceLastUsed,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        currentMileage: v.currentMileage,
        status: v.status,
      });
    }

    return {
      data: utilizationData,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get fuel consumption report for all vehicles
   */
  async getFuelConsumptionReport(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Promise<FuelConsumptionDto[]> {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDate) dateFilter.gte = startOfDay(new Date(startDate));
    if (endDate) dateFilter.lte = endOfDay(new Date(endDate));

    const where: Prisma.VehicleWhereInput = {};
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });

    const report: FuelConsumptionDto[] = [];

    for (const v of vehicles) {
      const fuelLogs = await this.prisma.fuelLog.findMany({
        where: {
          vehicleId: v.id,
          date: Object.keys(dateFilter).length > 0 ? dateFilter : undefined,
        },
        orderBy: { date: 'asc' },
      });

      if (fuelLogs.length === 0) continue;

      const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.quantityLiters, 0);
      const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
      const distanceDriven =
        fuelLogs.length > 1
          ? fuelLogs[fuelLogs.length - 1].odometerReading - fuelLogs[0].odometerReading
          : 0;

      const avgConsumption = distanceDriven > 0 ? (totalFuelLiters / distanceDriven) * 100 : 0;
      const avgCostPerLiter = totalFuelLiters > 0 ? totalFuelCost / totalFuelLiters : 0;
      const costPerKm = distanceDriven > 0 ? totalFuelCost / distanceDriven : 0;

      // Calculate consumption per fill
      const consumptions: number[] = [];
      for (let i = 1; i < fuelLogs.length; i++) {
        const km = fuelLogs[i].odometerReading - fuelLogs[i - 1].odometerReading;
        if (km > 0) {
          consumptions.push((fuelLogs[i].quantityLiters / km) * 100);
        }
      }

      report.push({
        vehicleId: v.id,
        vehicleCode: v.code,
        vehicleName: `${v.make} ${v.model}`,
        periodStart: fuelLogs[0].date,
        periodEnd: fuelLogs[fuelLogs.length - 1].date,
        totalFuelLiters: Math.round(totalFuelLiters * 100) / 100,
        totalFuelCost: Math.round(totalFuelCost * 100) / 100,
        distanceDriven: Math.round(distanceDriven * 100) / 100,
        avgConsumptionPer100Km: Math.round(avgConsumption * 100) / 100,
        avgCostPerLiter: Math.round(avgCostPerLiter * 100) / 100,
        costPerKm: Math.round(costPerKm * 100) / 100,
        fuelEntriesCount: fuelLogs.length,
        bestConsumption: consumptions.length > 0 ? Math.round(Math.min(...consumptions) * 100) / 100 : 0,
        worstConsumption: consumptions.length > 0 ? Math.round(Math.max(...consumptions) * 100) / 100 : 0,
      });
    }

    return report;
  }

  /**
   * Get vehicle cost summary
   */
  async getVehicleCostSummary(branchId?: string): Promise<VehicleCostSummaryDto[]> {
    const where: Prisma.VehicleWhereInput = {};
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });

    const summary: VehicleCostSummaryDto[] = [];

    for (const v of vehicles) {
      const [trips, fuelLogs, maintenanceRecords] = await Promise.all([
        this.prisma.trip.findMany({ where: { vehicleId: v.id, status: 'COMPLETED' } }),
        this.prisma.fuelLog.findMany({ where: { vehicleId: v.id } }),
        this.prisma.maintenanceRecord.findMany({ where: { vehicleId: v.id } }),
      ]);

      const fuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
      const maintCost = maintenanceRecords.reduce((sum, m) => sum + m.cost, 0);
      const tripCost = trips.reduce(
        (sum, t) => sum + (t.tollCost || 0) + (t.parkingCost || 0) + (t.otherCost || 0),
        0,
      );
      const totalDistance = trips.reduce((sum, t) => sum + (t.totalDistance || 0), 0);
      const totalTrips = trips.length;
      const totalCost = fuelCost + maintCost + tripCost;

      summary.push({
        vehicleId: v.id,
        vehicleCode: v.code,
        vehicleName: `${v.make} ${v.model} (${v.year})`,
        fuelCost: Math.round(fuelCost * 100) / 100,
        maintenanceCost: Math.round(maintCost * 100) / 100,
        tripCost: Math.round(tripCost * 100) / 100,
        insuranceCost: 0,
        totalCost: Math.round(totalCost * 100) / 100,
        totalDistanceKm: Math.round(totalDistance * 100) / 100,
        costPerKm: totalDistance > 0 ? Math.round((totalCost / totalDistance) * 100) / 100 : 0,
        costPerTrip: totalTrips > 0 ? Math.round((totalCost / totalTrips) * 100) / 100 : 0,
      });
    }

    return summary;
  }

  /**
   * Get available vehicles (ACTIVE status, not on active trip)
   */
  async getAvailableVehicles(branchId?: string) {
    const where: Prisma.VehicleWhereInput = {
      status: VehicleStatus.ACTIVE,
    };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });

    const availableVehicles = [];
    for (const v of vehicles) {
      const activeTrip = await this.prisma.trip.findFirst({
        where: {
          vehicleId: v.id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      });
      if (!activeTrip) {
        availableVehicles.push(v);
      }
    }

    return availableVehicles;
  }

  /**
   * Update vehicle mileage (called on trip completion)
   */
  async updateMileage(id: string, newMileage: number, userId: string) {
    const vehicle = await this.findOne(id);

    if (newMileage < vehicle.currentMileage) {
      throw new BadRequestException(
        `New mileage (${newMileage}) cannot be less than current mileage (${vehicle.currentMileage})`,
      );
    }

    return this.prisma.vehicle.update({
      where: { id },
      data: {
        currentMileage: newMileage,
        updatedBy: userId,
      },
    });
  }

  /**
   * Get vehicle performance metrics
   */
  async getVehiclePerformance(id: string, branchId?: string) {
    const vehicle = await this.findOne(id, branchId);

    const thirtyDaysAgo = addDays(new Date(), -30);
    const sixtyDaysAgo = addDays(new Date(), -60);

    const [
      tripsThisMonth,
      tripsLastMonth,
      fuelLogs,
      maintenanceRecords,
      allTimeTrips,
    ] = await Promise.all([
      this.prisma.trip.findMany({
        where: {
          vehicleId: id,
          status: 'COMPLETED',
          startTime: { gte: thirtyDaysAgo },
        },
      }),
      this.prisma.trip.findMany({
        where: {
          vehicleId: id,
          status: 'COMPLETED',
          startTime: { gte: sixtyDaysAgo, lt: thirtyDaysAgo },
        },
      }),
      this.prisma.fuelLog.findMany({ where: { vehicleId: id } }),
      this.prisma.maintenanceRecord.findMany({
        where: { vehicleId: id },
        orderBy: { date: 'desc' },
        take: 5,
      }),
      this.prisma.trip.findMany({
        where: { vehicleId: id, status: 'COMPLETED' },
      }),
    ]);

    const distanceThisMonth = tripsThisMonth.reduce(
      (sum, t) => sum + (t.totalDistance || 0),
      0,
    );
    const distanceLastMonth = tripsLastMonth.reduce(
      (sum, t) => sum + (t.totalDistance || 0),
      0,
    );
    const totalFuelCost = fuelLogs.reduce((sum, f) => sum + f.totalCost, 0);
    const totalFuelLiters = fuelLogs.reduce((sum, f) => sum + f.quantityLiters, 0);

    return {
      vehicle: {
        id: vehicle.id,
        code: vehicle.code,
        make: vehicle.make,
        model: vehicle.model,
        licensePlate: vehicle.licensePlate,
        status: vehicle.status,
        currentMileage: vehicle.currentMileage,
      },
      tripsThisMonth: tripsThisMonth.length,
      tripsLastMonth: tripsLastMonth.length,
      distanceThisMonth: Math.round(distanceThisMonth * 100) / 100,
      distanceLastMonth: Math.round(distanceLastMonth * 100) / 100,
      distanceGrowth:
        distanceLastMonth > 0
          ? Math.round(((distanceThisMonth - distanceLastMonth) / distanceLastMonth) * 10000) / 100
          : 0,
      totalTripsAllTime: allTimeTrips.length,
      totalDistanceAllTime: Math.round(
        allTimeTrips.reduce((sum, t) => sum + (t.totalDistance || 0), 0) * 100,
      ) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalFuelLiters: Math.round(totalFuelLiters * 100) / 100,
      avgFuelConsumptionPer100Km:
        vehicle.currentMileage > 0
          ? Math.round((totalFuelLiters / vehicle.currentMileage) * 10000) / 100
          : 0,
      totalMaintenanceCost: Math.round(
        maintenanceRecords.reduce((sum, m) => sum + m.cost, 0) * 100,
      ) / 100,
      recentMaintenance: maintenanceRecords,
    };
  }

  /**
   * Bulk update vehicle statuses (e.g., mark multiple for maintenance)
   */
  async bulkUpdateStatus(
    ids: string[],
    status: VehicleStatus,
    userId: string,
    branchId?: string,
  ) {
    const where: Prisma.VehicleWhereInput = { id: { in: ids } };
    if (branchId) where.branchId = branchId;

    const result = await this.prisma.vehicle.updateMany({
      where,
      data: { status, updatedBy: userId },
    });

    return { updatedCount: result.count };
  }
}
