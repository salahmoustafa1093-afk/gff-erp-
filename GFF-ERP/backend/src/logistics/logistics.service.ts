import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  LogisticsKpiDto,
  FleetSummaryDto,
  DeliveryPerformanceDto,
  FuelTrendDto,
  CostBreakdownDto,
} from './dto/logistics-kpi.dto';
import {
  LogisticsDashboardDto,
  RecentTripDto,
  MaintenanceAlertItemDto,
  DriverStatusItemDto,
} from './dto/logistics-dashboard.dto';
import { VehicleStatus, Prisma } from '@prisma/client';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  subDays,
  addDays,
} from 'date-fns';

@Injectable()
export class LogisticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get logistics dashboard data
   */
  async getDashboard(branchId?: string): Promise<LogisticsDashboardDto> {
    const [kpis, fleetSummary, recentTrips, criticalAlerts, driverStatus, weeklyTripChart, fuelTrend] =
      await Promise.all([
        this.getKpis(branchId),
        this.getFleetSummary(branchId),
        this.getRecentTrips(branchId),
        this.getCriticalAlerts(branchId),
        this.getDriverStatusOverview(branchId),
        this.getWeeklyTripChart(branchId),
        this.getFuelTrend(7, branchId),
      ]);

    return {
      kpis,
      fleetSummary,
      recentTrips,
      criticalAlerts,
      driverStatus,
      weeklyTripChart,
      fuelTrend,
    };
  }

  /**
   * Get logistics KPIs
   */
  async getKpis(branchId?: string): Promise<LogisticsKpiDto> {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const baseWhere: Prisma.TripWhereInput = branchId ? { branchId } : {};

    const [
      activeTripsCount,
      tripsCompletedToday,
      tripsCompletedThisWeek,
      tripsCompletedThisMonth,
      pendingDeliveries,
      monthTrips,
      monthFuelLogs,
      activeVehicles,
      availableVehicles,
      maintenanceVehicles,
      availableDrivers,
      driversOnTrip,
      expiringLicenses,
      maintenanceAlertsCount,
      criticalAlerts,
    ] = await Promise.all([
      this.prisma.trip.count({
        where: { ...baseWhere, status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
      }),
      this.prisma.trip.count({
        where: {
          ...baseWhere,
          status: 'COMPLETED',
          endTime: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.trip.count({
        where: { ...baseWhere, status: 'COMPLETED', endTime: { gte: weekStart } },
      }),
      this.prisma.trip.count({
        where: {
          ...baseWhere,
          status: 'COMPLETED',
          endTime: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.tripStop.count({
        where: {
          status: 'PENDING',
          trip: branchId ? { branchId } : undefined,
          stopType: 'DELIVERY',
        },
      }),
      this.prisma.trip.findMany({
        where: {
          ...baseWhere,
          status: 'COMPLETED',
          endTime: { gte: monthStart, lte: monthEnd },
        },
      }),
      this.prisma.fuelLog.findMany({
        where: {
          date: { gte: monthStart, lte: monthEnd },
          vehicle: branchId ? { branchId } : undefined,
        },
      }),
      this.prisma.vehicle.count({
        where: {
          ...(branchId ? { branchId } : {}),
          status: 'ACTIVE',
        },
      }),
      this.getAvailableVehicleCount(branchId),
      this.prisma.vehicle.count({
        where: {
          ...(branchId ? { branchId } : {}),
          status: 'MAINTENANCE',
        },
      }),
      this.prisma.driver.count({
        where: {
          ...(branchId ? { branchId } : {}),
          status: 'AVAILABLE',
        },
      }),
      this.prisma.driver.count({
        where: {
          ...(branchId ? { branchId } : {}),
          status: 'ON_TRIP',
        },
      }),
      this.getExpiringLicenseCount(branchId),
      this.getMaintenanceAlertCount(branchId),
      this.getCriticalMaintenanceAlertCount(branchId),
    ]);

    // Calculate averages
    const totalDistance = monthTrips.reduce((s, t) => s + (t.totalDistance || 0), 0);
    const totalFuel = monthFuelLogs.reduce((s, f) => s + f.quantityLiters, 0);
    const totalFuelCost = monthFuelLogs.reduce((s, f) => s + f.totalCost, 0);
    const avgConsumption = totalDistance > 0 ? (totalFuel / totalDistance) * 100 : 0;

    // Total operating cost
    const totalOpCost = monthTrips.reduce(
      (s, t) =>
        s +
        (t.fuelCost || 0) +
        (t.driverCost || 0) +
        (t.tollCost || 0) +
        (t.parkingCost || 0) +
        (t.otherCost || 0),
      0,
    );
    const costPerKm = totalDistance > 0 ? totalOpCost / totalDistance : 0;

    // On-time delivery rate
    const completedWithPlan = monthTrips.filter((t) => t.plannedEndTime && t.endTime);
    const onTime = completedWithPlan.filter(
      (t) => t.plannedEndTime && t.endTime && t.endTime <= t.plannedEndTime,
    );
    const onTimeRate = completedWithPlan.length > 0
      ? Math.round((onTime.length / completedWithPlan.length) * 10000) / 100
      : 100;

    // Average delivery time
    const avgDeliveryTime =
      completedWithPlan.length > 0
        ? Math.round(
            completedWithPlan.reduce((s, t) => {
              if (t.startTime && t.endTime) {
                return s + differenceInHours(t.endTime, t.startTime);
              }
              return s;
            }, 0) / completedWithPlan.length * 10,
          ) / 10
        : 0;

    // Late deliveries today
    const lateToday = await this.prisma.trip.count({
      where: {
        ...baseWhere,
        status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
        plannedEndTime: { lt: now },
      },
    });

    return {
      activeTripsCount,
      tripsCompletedToday,
      tripsCompletedThisWeek,
      tripsCompletedThisMonth,
      pendingDeliveries,
      avgDeliveryTimeHours: avgDeliveryTime,
      totalFuelConsumedThisMonth: Math.round(totalFuel * 100) / 100,
      totalFuelCostThisMonth: Math.round(totalFuelCost * 100) / 100,
      avgFuelConsumptionPer100Km: Math.round(avgConsumption * 100) / 100,
      vehicleUtilizationRate: this.calculateUtilizationRate(activeVehicles, monthTrips),
      totalActiveVehicles: activeVehicles,
      totalAvailableVehicles: availableVehicles,
      vehiclesInMaintenance: maintenanceVehicles,
      availableDrivers,
      driversOnTrip,
      driversWithExpiringLicenses: expiringLicenses,
      maintenanceAlertsCount,
      criticalMaintenanceAlerts: criticalAlerts,
      totalOperatingCostThisMonth: Math.round(totalOpCost * 100) / 100,
      costPerKmThisMonth: Math.round(costPerKm * 100) / 100,
      onTimeDeliveryRate: onTimeRate,
      lateDeliveriesToday: lateToday,
    };
  }

  /**
   * Get fleet summary
   */
  async getFleetSummary(branchId?: string): Promise<FleetSummaryDto> {
    const where: Prisma.VehicleWhereInput = branchId ? { branchId } : {};

    const vehicles = await this.prisma.vehicle.findMany({ where });

    const now = new Date();
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byFuelType: Record<string, number> = {};

    let totalMileage = 0;
    let totalValue = 0;
    let totalAge = 0;
    let maintenanceDueCount = 0;
    let insuranceExpiringCount = 0;
    let registrationExpiringCount = 0;

    for (const v of vehicles) {
      byType[v.type] = (byType[v.type] || 0) + 1;
      byStatus[v.status] = (byStatus[v.status] || 0) + 1;
      byFuelType[v.fuelType] = (byFuelType[v.fuelType] || 0) + 1;
      totalMileage += v.currentMileage;
      totalValue += v.purchasePrice || 0;
      totalAge += now.getFullYear() - v.year;

      if (
        v.nextMaintenanceDate &&
        differenceInDays(v.nextMaintenanceDate, now) <= 14
      ) {
        maintenanceDueCount++;
      }
      if (
        v.insuranceExpiry &&
        differenceInDays(v.insuranceExpiry, now) <= 30
      ) {
        insuranceExpiringCount++;
      }
      if (
        v.registrationExpiry &&
        differenceInDays(v.registrationExpiry, now) <= 30
      ) {
        registrationExpiringCount++;
      }
    }

    const count = vehicles.length || 1;

    return {
      totalVehicles: vehicles.length,
      byType,
      byStatus,
      byFuelType,
      avgAgeYears: Math.round((totalAge / count) * 10) / 10,
      totalFleetValue: Math.round(totalValue * 100) / 100,
      totalMileage: Math.round(totalMileage * 100) / 100,
      avgMileage: Math.round((totalMileage / count) * 100) / 100,
      maintenanceDueCount,
      insuranceExpiringCount,
      registrationExpiringCount,
    };
  }

  /**
   * Get delivery performance report
   */
  async getDeliveryPerformance(
    days: number = 30,
    branchId?: string,
  ): Promise<DeliveryPerformanceDto> {
    const since = subDays(new Date(), days);

    const where: Prisma.TripWhereInput = {
      status: 'COMPLETED',
      tripType: 'DELIVERY',
      endTime: { gte: since },
    };
    if (branchId) where.branchId = branchId;

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        stops: true,
      },
    });

    const completedWithPlan = trips.filter((t) => t.plannedEndTime && t.endTime);
    const onTime = completedWithPlan.filter(
      (t) => t.plannedEndTime && t.endTime && t.endTime <= t.plannedEndTime,
    );

    const deliveryTimes = completedWithPlan
      .map((t) => {
        if (t.startTime && t.endTime) {
          return differenceInHours(t.endTime, t.startTime);
        }
        return 0;
      })
      .filter((h) => h > 0);

    // Group by day
    const byDayMap = new Map<string, { deliveries: number; onTime: number; late: number }>();
    for (const t of completedWithPlan) {
      const dateKey = format(t.endTime || new Date(), 'yyyy-MM-dd');
      const entry = byDayMap.get(dateKey) || { deliveries: 0, onTime: 0, late: 0 };
      entry.deliveries++;
      if (
        t.plannedEndTime &&
        t.endTime &&
        t.endTime <= t.plannedEndTime
      ) {
        entry.onTime++;
      } else {
        entry.late++;
      }
      byDayMap.set(dateKey, entry);
    }

    const byDay = Array.from(byDayMap.entries())
      .map(([date, data]) => ({
        date,
        deliveries: data.deliveries,
        onTime: data.onTime,
        late: data.late,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalDeliveries: completedWithPlan.length,
      onTimeDeliveries: onTime.length,
      lateDeliveries: completedWithPlan.length - onTime.length,
      onTimeRate: completedWithPlan.length > 0
        ? Math.round((onTime.length / completedWithPlan.length) * 10000) / 100
        : 100,
      avgDeliveryTimeHours: deliveryTimes.length > 0
        ? Math.round(
            (deliveryTimes.reduce((s, t) => s + t, 0) / deliveryTimes.length) * 10,
          ) / 10
        : 0,
      fastestDeliveryHours: deliveryTimes.length > 0 ? Math.round(Math.min(...deliveryTimes) * 10) / 10 : 0,
      slowestDeliveryHours: deliveryTimes.length > 0 ? Math.round(Math.max(...deliveryTimes) * 10) / 10 : 0,
      byDay,
      topRoutes: [],
    };
  }

  /**
   * Get fuel consumption trend
   */
  async getFuelTrend(days: number = 30, branchId?: string): Promise<FuelTrendDto[]> {
    const since = subDays(new Date(), days);

    const where: Prisma.FuelLogWhereInput = {
      date: { gte: since },
    };
    if (branchId) {
      where.vehicle = { branchId };
    }

    const fuelLogs = await this.prisma.fuelLog.findMany({ where });

    // Group by date
    const byDate = new Map<
      string,
      { liters: number; cost: number }
    >();

    for (const log of fuelLogs) {
      const dateKey = format(log.date, 'yyyy-MM-dd');
      const entry = byDate.get(dateKey) || { liters: 0, cost: 0 };
      entry.liters += log.quantityLiters;
      entry.cost += log.totalCost;
      byDate.set(dateKey, entry);
    }

    const result: FuelTrendDto[] = [];
    for (let i = days; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const entry = byDate.get(dateKey) || { liters: 0, cost: 0 };

      result.push({
        period: dateKey,
        date: dateKey,
        fuelConsumed: Math.round(entry.liters * 100) / 100,
        fuelCost: Math.round(entry.cost * 100) / 100,
        distanceDriven: 0,
        consumptionPer100Km: 0,
        costPerKm: 0,
      });
    }

    return result;
  }

  /**
   * Get cost breakdown
   */
  async getCostBreakdown(
    startDate?: string,
    endDate?: string,
    branchId?: string,
  ): Promise<CostBreakdownDto> {
    const periodStart = startDate ? new Date(startDate) : startOfMonth(new Date());
    const periodEnd = endDate ? new Date(endDate) : endOfMonth(new Date());

    const where: Prisma.TripWhereInput = {
      status: 'COMPLETED',
      endTime: { gte: periodStart, lte: periodEnd },
    };
    if (branchId) where.branchId = branchId;

    const trips = await this.prisma.trip.findMany({ where });
    const tripCount = trips.length || 1;

    const totalDistance = trips.reduce((s, t) => s + (t.totalDistance || 0), 0);
    const fuelCost = trips.reduce((s, t) => s + (t.fuelCost || 0), 0);
    const driverCost = trips.reduce((s, t) => s + (t.driverCost || 0), 0);
    const tollCost = trips.reduce((s, t) => s + (t.tollCost || 0), 0);
    const parkingCost = trips.reduce((s, t) => s + (t.parkingCost || 0), 0);
    const otherCost = trips.reduce((s, t) => s + (t.otherCost || 0), 0);

    // Get maintenance costs
    const maintenanceRecords = await this.prisma.maintenanceRecord.findMany({
      where: {
        date: { gte: periodStart, lte: periodEnd },
        vehicle: branchId ? { branchId } : undefined,
      },
    });
    const maintenanceCost = maintenanceRecords.reduce((s, m) => s + m.cost, 0);

    const totalCost = fuelCost + driverCost + tollCost + parkingCost + otherCost + maintenanceCost;

    return {
      period: `${format(periodStart, 'yyyy-MM-dd')} to ${format(periodEnd, 'yyyy-MM-dd')}`,
      fuelCost: Math.round(fuelCost * 100) / 100,
      maintenanceCost: Math.round(maintenanceCost * 100) / 100,
      driverCost: Math.round(driverCost * 100) / 100,
      tollCost: Math.round(tollCost * 100) / 100,
      parkingCost: Math.round(parkingCost * 100) / 100,
      otherCost: Math.round(otherCost * 100) / 100,
      insuranceCost: 0,
      totalCost: Math.round(totalCost * 100) / 100,
      costPerKm: totalDistance > 0 ? Math.round((totalCost / totalDistance) * 100) / 100 : 0,
      costPerTrip: Math.round((totalCost / tripCount) * 100) / 100,
    };
  }

  // ==================== PRIVATE HELPERS ====================

  private async getAvailableVehicleCount(branchId?: string): Promise<number> {
    const where: Prisma.VehicleWhereInput = { status: 'ACTIVE' };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });
    let count = 0;
    for (const v of vehicles) {
      const activeTrip = await this.prisma.trip.findFirst({
        where: {
          vehicleId: v.id,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
        },
      });
      if (!activeTrip) count++;
    }
    return count;
  }

  private async getExpiringLicenseCount(branchId?: string): Promise<number> {
    const where: Prisma.DriverWhereInput = {
      status: { not: 'INACTIVE' },
    };
    if (branchId) where.branchId = branchId;

    const drivers = await this.prisma.driver.findMany({ where });
    return drivers.filter((d) => differenceInDays(d.licenseExpiryDate, new Date()) <= 30).length;
  }

  private async getMaintenanceAlertCount(branchId?: string): Promise<number> {
    const where: Prisma.VehicleWhereInput = {
      status: { not: 'RETIRED' },
    };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });
    let count = 0;
    for (const v of vehicles) {
      if (
        (v.nextMaintenanceDate && differenceInDays(v.nextMaintenanceDate, new Date()) <= 14) ||
        (v.insuranceExpiry && differenceInDays(v.insuranceExpiry, new Date()) <= 30) ||
        (v.registrationExpiry && differenceInDays(v.registrationExpiry, new Date()) <= 30)
      ) {
        count++;
      }
    }
    return count;
  }

  private async getCriticalMaintenanceAlertCount(branchId?: string): Promise<number> {
    const where: Prisma.VehicleWhereInput = {
      status: { not: 'RETIRED' },
    };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });
    let count = 0;
    for (const v of vehicles) {
      if (
        (v.nextMaintenanceDate && differenceInDays(v.nextMaintenanceDate, new Date()) <= 0) ||
        (v.insuranceExpiry && differenceInDays(v.insuranceExpiry, new Date()) <= 0) ||
        (v.registrationExpiry && differenceInDays(v.registrationExpiry, new Date()) <= 0)
      ) {
        count++;
      }
    }
    return count;
  }

  private calculateUtilizationRate(
    totalActiveVehicles: number,
    monthTrips: { startTime: Date | null }[],
  ): number {
    if (totalActiveVehicles === 0) return 0;
    const tripsPerDay = monthTrips.length / 30;
    return Math.round(Math.min((tripsPerDay / totalActiveVehicles) * 100, 100) * 100) / 100;
  }

  private async getRecentTrips(branchId?: string): Promise<RecentTripDto[]> {
    const where: Prisma.TripWhereInput = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'] },
    };
    if (branchId) where.branchId = branchId;

    const trips = await this.prisma.trip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        vehicle: { select: { code: true } },
        driver: {
          select: {
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        stops: { select: { id: true, status: true } },
      },
    });

    return trips.map((t) => {
      const completedStops = t.stops.filter((s) => s.status === 'COMPLETED').length;
      const totalStops = t.stops.length;
      const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

      return {
        id: t.id,
        tripNumber: t.tripNumber,
        title: t.title,
        status: t.status,
        tripType: t.tripType,
        vehicleCode: t.vehicle?.code || '',
        driverName: t.driver?.employee
          ? `${t.driver.employee.firstName} ${t.driver.employee.lastName}`
          : '',
        plannedStartTime: t.plannedStartTime,
        startTime: t.startTime,
        stopsCount: totalStops,
        progressPercent,
      };
    });
  }

  private async getCriticalAlerts(branchId?: string): Promise<MaintenanceAlertItemDto[]> {
    const where: Prisma.VehicleWhereInput = {
      status: { not: 'RETIRED' },
    };
    if (branchId) where.branchId = branchId;

    const vehicles = await this.prisma.vehicle.findMany({ where });
    const alerts: MaintenanceAlertItemDto[] = [];

    for (const v of vehicles) {
      if (
        v.nextMaintenanceDate &&
        differenceInDays(v.nextMaintenanceDate, new Date()) <= 7
      ) {
        const days = differenceInDays(v.nextMaintenanceDate, new Date());
        alerts.push({
          vehicleId: v.id,
          vehicleCode: v.code,
          vehicleName: `${v.make} ${v.model}`,
          alertType: 'MAINTENANCE_DUE',
          severity: days <= 0 ? 'CRITICAL' : 'WARNING',
          message: days <= 0 ? 'Maintenance overdue' : `Maintenance due in ${days} days`,
          daysRemaining: days,
        });
      }
      if (
        v.insuranceExpiry &&
        differenceInDays(v.insuranceExpiry, new Date()) <= 7
      ) {
        const days = differenceInDays(v.insuranceExpiry, new Date());
        alerts.push({
          vehicleId: v.id,
          vehicleCode: v.code,
          vehicleName: `${v.make} ${v.model}`,
          alertType: 'INSURANCE_EXPIRY',
          severity: days <= 0 ? 'CRITICAL' : 'WARNING',
          message: days <= 0 ? 'Insurance expired' : `Insurance expires in ${days} days`,
          daysRemaining: days,
        });
      }
      if (
        v.registrationExpiry &&
        differenceInDays(v.registrationExpiry, new Date()) <= 7
      ) {
        const days = differenceInDays(v.registrationExpiry, new Date());
        alerts.push({
          vehicleId: v.id,
          vehicleCode: v.code,
          vehicleName: `${v.make} ${v.model}`,
          alertType: 'REGISTRATION_EXPIRY',
          severity: days <= 0 ? 'CRITICAL' : 'WARNING',
          message: days <= 0 ? 'Registration expired' : `Registration expires in ${days} days`,
          daysRemaining: days,
        });
      }
    }

    return alerts
      .sort((a, b) => (a.daysRemaining || 0) - (b.daysRemaining || 0))
      .slice(0, 10);
  }

  private async getDriverStatusOverview(branchId?: string): Promise<DriverStatusItemDto[]> {
    const where: Prisma.DriverWhereInput = {
      status: { not: 'INACTIVE' },
    };
    if (branchId) where.branchId = branchId;

    const drivers = await this.prisma.driver.findMany({
      where,
      include: {
        employee: { select: { firstName: true, lastName: true } },
        trips: {
          where: { status: { in: ['SCHEDULED', 'IN_PROGRESS'] } },
          select: { tripNumber: true },
          take: 1,
        },
      },
      take: 20,
    });

    return drivers.map((d) => ({
      driverId: d.id,
      licenseNumber: d.licenseNumber,
      driverName: d.employee
        ? `${d.employee.firstName} ${d.employee.lastName}`
        : d.licenseNumber,
      status: d.status,
      isOnTrip: d.status === 'ON_TRIP',
      currentTripNumber: d.trips[0]?.tripNumber,
      rating: d.rating,
      licenseDaysRemaining: differenceInDays(d.licenseExpiryDate, new Date()),
    }));
  }

  private async getWeeklyTripChart(branchId?: string) {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const result = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const where: Prisma.TripWhereInput = {
        createdAt: { gte: dayStart, lte: dayEnd },
      };
      if (branchId) where.branchId = branchId;

      const trips = await this.prisma.trip.findMany({ where });

      result.push({
        day: days[i],
        scheduled: trips.filter((t) => t.status === 'SCHEDULED').length,
        completed: trips.filter((t) => t.status === 'COMPLETED').length,
        cancelled: trips.filter((t) => t.status === 'CANCELLED').length,
      });
    }

    return result;
  }
}
