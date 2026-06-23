import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTripDto } from './dto/create-trip.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripFilterDto } from './dto/trip-filter.dto';
import {
  TripReportFilterDto,
  TripDailySummaryDto,
  TripProfitabilityDto,
  DeliveryTrackingDto,
} from './dto/trip-report.dto';
import { AddStopDto, UpdateStopDto, CompleteStopDto } from './dto/add-stop.dto';
import { StartTripDto, CompleteTripDto, CancelTripDto } from './dto/complete-trip.dto';
import { TripStatus, TripType, Prisma } from '@prisma/client';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  differenceInDays,
  differenceInHours,
  differenceInMinutes,
  format,
  addDays,
} from 'date-fns';

@Injectable()
export class TripsService {
  constructor(private readonly prisma: PrismaService) {}

  // ==================== NUMBER SEQUENCE ====================

  private async generateTripNumber(): Promise<string> {
    const today = new Date();
    const datePrefix = format(today, 'yyyyMMdd');

    const countToday = await this.prisma.trip.count({
      where: {
        createdAt: {
          gte: startOfDay(today),
          lte: endOfDay(today),
        },
      },
    });

    const sequence = String(countToday + 1).padStart(4, '0');
    return `TRP-${datePrefix}-${sequence}`;
  }

  // ==================== CRUD OPERATIONS ====================

  /**
   * Create a new trip with stops
   */
  async create(dto: CreateTripDto, userId: string, branchId?: string) {
    // Validate vehicle exists and is active
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID '${dto.vehicleId}' not found`);
    }
    if (vehicle.status !== 'ACTIVE') {
      throw new BadRequestException(
        `Vehicle '${vehicle.code}' is not ACTIVE (current status: ${vehicle.status})`,
      );
    }

    // Validate driver exists and is available
    const driver = await this.prisma.driver.findUnique({
      where: { id: dto.driverId },
    });
    if (!driver) {
      throw new NotFoundException(`Driver with ID '${dto.driverId}' not found`);
    }
    if (driver.status === 'INACTIVE') {
      throw new BadRequestException(`Driver '${driver.licenseNumber}' is INACTIVE`);
    }

    // Check driver is not on another active trip
    const driverActiveTrip = await this.prisma.trip.findFirst({
      where: {
        driverId: dto.driverId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });
    if (driverActiveTrip) {
      throw new BadRequestException(
        `Driver is already assigned to active trip '${driverActiveTrip.tripNumber}'`,
      );
    }

    // Check vehicle is not on another active trip
    const vehicleActiveTrip = await this.prisma.trip.findFirst({
      where: {
        vehicleId: dto.vehicleId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      },
    });
    if (vehicleActiveTrip) {
      throw new BadRequestException(
        `Vehicle is already assigned to active trip '${vehicleActiveTrip.tripNumber}'`,
      );
    }

    const tripNumber = await this.generateTripNumber();

    // Build stops data
    const stopsData = dto.stops.map((stop) => ({
      sequenceNumber: stop.sequenceNumber,
      stopType: stop.stopType,
      location: stop.location,
      contactName: stop.contactName,
      contactPhone: stop.contactPhone,
      salesOrderId: stop.salesOrderId,
      purchaseOrderId: stop.purchaseOrderId,
      invoiceId: stop.invoiceId,
      expectedArrival: stop.expectedArrival ? new Date(stop.expectedArrival) : null,
      specialInstructions: stop.specialInstructions,
      status: 'PENDING',
    }));

    const trip = await this.prisma.trip.create({
      data: {
        tripNumber,
        tripType: dto.tripType,
        title: dto.title,
        description: dto.description,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        status: TripStatus.SCHEDULED,
        plannedStartTime: dto.plannedStartTime ? new Date(dto.plannedStartTime) : null,
        plannedEndTime: dto.plannedEndTime ? new Date(dto.plannedEndTime) : null,
        estimatedDistance: dto.estimatedDistance,
        estimatedFuel: dto.estimatedFuel,
        estimatedFuelCost: dto.estimatedFuelCost,
        estimatedTollCost: dto.estimatedTollCost,
        routeNotes: dto.routeNotes,
        branchId: dto.branchId ?? branchId ?? null,
        stops: {
          create: stopsData,
        },
        createdBy: userId,
        updatedBy: userId,
      },
      include: {
        stops: { orderBy: { sequenceNumber: 'asc' } },
        vehicle: { select: { id: true, code: true, licensePlate: true } },
        driver: { select: { id: true, licenseNumber: true } },
      },
    });

    // Update driver status to ASSIGNED
    await this.prisma.driver.update({
      where: { id: dto.driverId },
      data: { status: 'ASSIGNED' },
    });

    return trip;
  }

  /**
   * Find all trips with filtering
   */
  async findAll(filter: TripFilterDto, branchId?: string) {
    const {
      search,
      tripType,
      status,
      vehicleId,
      driverId,
      page,
      limit,
      sortBy,
      sortOrder,
      startDateFrom,
      startDateTo,
      today,
      thisWeek,
      lateDeliveries,
      hasSalesOrder,
    } = filter;

    const where: Prisma.TripWhereInput = {};

    if (branchId) where.branchId = branchId;
    if (tripType) where.tripType = tripType;
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = vehicleId;
    if (driverId) where.driverId = driverId;

    if (search) {
      where.OR = [
        { tripNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (today) {
      const now = new Date();
      where.plannedStartTime = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      };
    }

    if (thisWeek) {
      const now = new Date();
      where.plannedStartTime = {
        gte: startOfWeek(now, { weekStartsOn: 1 }),
        lte: endOfWeek(now, { weekStartsOn: 1 }),
      };
    }

    if (startDateFrom || startDateTo) {
      where.plannedStartTime = {};
      if (startDateFrom) where.plannedStartTime.gte = startOfDay(new Date(startDateFrom));
      if (startDateTo) where.plannedStartTime.lte = endOfDay(new Date(startDateTo));
    }

    if (lateDeliveries) {
      where.AND = [
        ...(where.AND ? (where.AND as any[]) : []),
        { plannedEndTime: { not: null } },
        { endTime: { not: null } },
        { endTime: { gt: Prisma.raw('"plannedEndTime"') } },
      ];
    }

    if (hasSalesOrder) {
      where.stops = {
        some: { salesOrderId: { not: null } },
      };
    }

    const orderBy: Prisma.TripOrderByWithRelationInput = {};
    if (sortBy) {
      orderBy[sortBy] = sortOrder;
    }

    const [data, total] = await Promise.all([
      this.prisma.trip.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          vehicle: { select: { id: true, code: true, licensePlate: true, type: true } },
          driver: {
            select: {
              id: true,
              licenseNumber: true,
              employee: { select: { firstName: true, lastName: true } },
            },
          },
          stops: {
            orderBy: { sequenceNumber: 'asc' },
            select: {
              id: true,
              sequenceNumber: true,
              stopType: true,
              location: true,
              status: true,
              expectedArrival: true,
              actualArrival: true,
              salesOrderId: true,
            },
          },
          _count: { select: { stops: true, fuelLogs: true } },
        },
      }),
      this.prisma.trip.count({ where }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Find a single trip by ID
   */
  async findOne(id: string, branchId?: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: {
          select: {
            id: true,
            code: true,
            make: true,
            model: true,
            licensePlate: true,
            currentMileage: true,
            fuelType: true,
            type: true,
          },
        },
        driver: {
          select: {
            id: true,
            licenseNumber: true,
            rating: true,
            employee: { select: { firstName: true, lastName: true, phone: true } },
          },
        },
        stops: {
          orderBy: { sequenceNumber: 'asc' },
          include: {
            salesOrder: { select: { id: true, orderNumber: true, customerId: true } },
          },
        },
        fuelLogs: { orderBy: { date: 'desc' } },
        salesDeliveries: {
          include: {
            salesOrder: { select: { id: true, orderNumber: true } },
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException(`Trip with ID '${id}' not found`);
    }

    if (branchId && trip.branchId && trip.branchId !== branchId) {
      throw new NotFoundException(`Trip with ID '${id}' not found in this branch`);
    }

    return trip;
  }

  /**
   * Update a trip
   */
  async update(id: string, dto: UpdateTripDto, userId: string, branchId?: string) {
    const existing = await this.findOne(id, branchId);

    if (existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot update ${existing.status.toLowerCase()} trip`,
      );
    }

    // Validate new vehicle if changed
    if (dto.vehicleId && dto.vehicleId !== existing.vehicleId) {
      const vehicle = await this.prisma.vehicle.findUnique({
        where: { id: dto.vehicleId },
      });
      if (!vehicle || vehicle.status !== 'ACTIVE') {
        throw new BadRequestException('New vehicle must be ACTIVE');
      }
      const vehicleTrip = await this.prisma.trip.findFirst({
        where: {
          vehicleId: dto.vehicleId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          id: { not: id },
        },
      });
      if (vehicleTrip) {
        throw new BadRequestException('New vehicle is already assigned to another trip');
      }
    }

    // Validate new driver if changed
    if (dto.driverId && dto.driverId !== existing.driverId) {
      const driver = await this.prisma.driver.findUnique({
        where: { id: dto.driverId },
      });
      if (!driver || driver.status === 'INACTIVE') {
        throw new BadRequestException('New driver must be active');
      }
      const driverTrip = await this.prisma.trip.findFirst({
        where: {
          driverId: dto.driverId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
          id: { not: id },
        },
      });
      if (driverTrip) {
        throw new BadRequestException('New driver is already assigned to another trip');
      }

      // Release old driver, assign new driver
      await this.prisma.driver.update({
        where: { id: existing.driverId },
        data: { status: 'AVAILABLE' },
      });
      await this.prisma.driver.update({
        where: { id: dto.driverId },
        data: { status: 'ASSIGNED' },
      });
    }

    const trip = await this.prisma.trip.update({
      where: { id },
      data: {
        tripType: dto.tripType,
        title: dto.title,
        description: dto.description,
        vehicleId: dto.vehicleId,
        driverId: dto.driverId,
        plannedStartTime: dto.plannedStartTime
          ? new Date(dto.plannedStartTime)
          : undefined,
        plannedEndTime: dto.plannedEndTime
          ? new Date(dto.plannedEndTime)
          : undefined,
        estimatedDistance: dto.estimatedDistance,
        estimatedFuel: dto.estimatedFuel,
        estimatedFuelCost: dto.estimatedFuelCost,
        estimatedTollCost: dto.estimatedTollCost,
        routeNotes: dto.routeNotes,
        branchId: dto.branchId,
        cancellationReason: dto.cancellationReason,
        updatedBy: userId,
      },
      include: {
        stops: { orderBy: { sequenceNumber: 'asc' } },
        vehicle: { select: { id: true, code: true } },
        driver: { select: { id: true, licenseNumber: true } },
      },
    });

    return trip;
  }

  /**
   * Delete a trip (only SCHEDULED trips)
   */
  async remove(id: string, userId: string, branchId?: string) {
    const trip = await this.findOne(id, branchId);

    if (trip.status === 'IN_PROGRESS') {
      throw new BadRequestException('Cannot delete a trip that is in progress');
    }

    if (trip.status === 'COMPLETED') {
      throw new BadRequestException('Cannot delete a completed trip');
    }

    // Release driver
    await this.prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: 'AVAILABLE' },
    });

    await this.prisma.trip.delete({ where: { id } });

    return { deleted: true, tripNumber: trip.tripNumber };
  }

  // ==================== TRIP LIFECYCLE ====================

  /**
   * Start a trip (SCHEDULED → IN_PROGRESS)
   */
  async startTrip(id: string, dto: StartTripDto, userId: string, branchId?: string) {
    const trip = await this.findOne(id, branchId);

    if (trip.status !== 'SCHEDULED') {
      throw new BadRequestException(`Cannot start trip with status '${trip.status}'`);
    }

    // Validate odometer reading
    if (dto.startOdometer < trip.vehicle.currentMileage) {
      throw new BadRequestException(
        `Start odometer (${dto.startOdometer}) cannot be less than vehicle mileage (${trip.vehicle.currentMileage})`,
      );
    }

    const startTime = dto.startTime ? new Date(dto.startTime) : new Date();

    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.IN_PROGRESS,
        startTime,
        startOdometer: dto.startOdometer,
        updatedBy: userId,
      },
      include: {
        stops: { orderBy: { sequenceNumber: 'asc' } },
        vehicle: { select: { id: true, code: true } },
        driver: { select: { id: true, licenseNumber: true } },
      },
    });

    // Update driver status
    await this.prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: 'ON_TRIP' },
    });

    return updated;
  }

  /**
   * Complete a trip (IN_PROGRESS → COMPLETED)
   */
  async completeTrip(
    id: string,
    dto: CompleteTripDto,
    userId: string,
    branchId?: string,
  ) {
    const trip = await this.findOne(id, branchId);

    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException(
        `Cannot complete trip with status '${trip.status}'`,
      );
    }

    // Validate all stops are completed
    const pendingStops = trip.stops.filter((s) => s.status !== 'COMPLETED');
    if (pendingStops.length > 0) {
      throw new BadRequestException(
        `${pendingStops.length} stop(s) are still pending. Complete all stops first.`,
      );
    }

    // Validate odometer
    if (dto.endOdometer < trip.startOdometer) {
      throw new BadRequestException(
        `End odometer (${dto.endOdometer}) cannot be less than start odometer (${trip.startOdometer})`,
      );
    }

    const endTime = dto.endTime ? new Date(dto.endTime) : new Date();
    const totalCost =
      (dto.fuelCost || 0) +
      (dto.tollCost || 0) +
      (dto.parkingCost || 0) +
      (dto.otherCost || 0) +
      (dto.driverCost || 0);

    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.COMPLETED,
        endTime,
        endOdometer: dto.endOdometer,
        totalDistance: dto.totalDistance,
        totalFuelConsumed: dto.totalFuelConsumed,
        fuelCost: dto.fuelCost,
        tollCost: dto.tollCost,
        parkingCost: dto.parkingCost,
        otherCost: dto.otherCost,
        driverCost: dto.driverCost,
        totalCost,
        updatedBy: userId,
      },
      include: {
        stops: { orderBy: { sequenceNumber: 'asc' } },
        vehicle: { select: { id: true, code: true } },
        driver: { select: { id: true, licenseNumber: true } },
      },
    });

    // Update vehicle mileage
    await this.prisma.vehicle.update({
      where: { id: trip.vehicleId },
      data: { currentMileage: dto.endOdometer },
    });

    // Update driver stats
    await this.prisma.driver.update({
      where: { id: trip.driverId },
      data: {
        status: 'AVAILABLE',
        totalTrips: { increment: 1 },
        totalDistanceDriven: { increment: dto.totalDistance },
      },
    });

    return updated;
  }

  /**
   * Cancel a trip
   */
  async cancelTrip(
    id: string,
    dto: CancelTripDto,
    userId: string,
    branchId?: string,
  ) {
    const trip = await this.findOne(id, branchId);

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new BadRequestException(
        `Cannot cancel ${trip.status.toLowerCase()} trip`,
      );
    }

    const updated = await this.prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.CANCELLED,
        cancellationReason: dto.reason,
        updatedBy: userId,
      },
      include: {
        stops: { orderBy: { sequenceNumber: 'asc' } },
        vehicle: { select: { id: true, code: true } },
        driver: { select: { id: true, licenseNumber: true } },
      },
    });

    // Release driver and vehicle
    await this.prisma.driver.update({
      where: { id: trip.driverId },
      data: { status: 'AVAILABLE' },
    });

    return updated;
  }

  // ==================== STOP MANAGEMENT ====================

  /**
   * Add a stop to a trip
   */
  async addStop(
    tripId: string,
    dto: AddStopDto,
    userId: string,
    branchId?: string,
  ) {
    const trip = await this.findOne(tripId, branchId);

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new BadRequestException('Cannot add stops to completed/cancelled trips');
    }

    const stop = await this.prisma.tripStop.create({
      data: {
        tripId,
        sequenceNumber: dto.sequenceNumber,
        stopType: dto.stopType,
        location: dto.location,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        salesOrderId: dto.salesOrderId,
        purchaseOrderId: dto.purchaseOrderId,
        invoiceId: dto.invoiceId,
        expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : null,
        specialInstructions: dto.specialInstructions,
        latitude: dto.latitude,
        longitude: dto.longitude,
        status: 'PENDING',
      },
    });

    return stop;
  }

  /**
   * Update a stop
   */
  async updateStop(
    tripId: string,
    stopId: string,
    dto: UpdateStopDto,
    userId: string,
    branchId?: string,
  ) {
    await this.findOne(tripId, branchId);

    const stop = await this.prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop || stop.tripId !== tripId) {
      throw new NotFoundException(`Stop with ID '${stopId}' not found on this trip`);
    }

    if (stop.status === 'COMPLETED') {
      throw new BadRequestException('Cannot update a completed stop');
    }

    return this.prisma.tripStop.update({
      where: { id: stopId },
      data: {
        sequenceNumber: dto.sequenceNumber,
        stopType: dto.stopType,
        location: dto.location,
        contactName: dto.contactName,
        contactPhone: dto.contactPhone,
        expectedArrival: dto.expectedArrival ? new Date(dto.expectedArrival) : undefined,
        specialInstructions: dto.specialInstructions,
      },
    });
  }

  /**
   * Mark a stop as complete with proof of delivery
   */
  async completeStop(
    tripId: string,
    stopId: string,
    dto: CompleteStopDto,
    userId: string,
    branchId?: string,
  ) {
    const trip = await this.findOne(tripId, branchId);

    if (trip.status !== 'IN_PROGRESS') {
      throw new BadRequestException('Trip must be in progress to complete stops');
    }

    const stop = await this.prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop || stop.tripId !== tripId) {
      throw new NotFoundException(`Stop with ID '${stopId}' not found on this trip`);
    }

    if (stop.status === 'COMPLETED') {
      throw new BadRequestException('Stop is already completed');
    }

    const actualArrival = new Date(dto.actualArrival);

    // Determine if delivery was late
    let deliveryStatus = 'ON_TIME';
    if (stop.expectedArrival && actualArrival > new Date(stop.expectedArrival)) {
      deliveryStatus = 'LATE';
    }

    const updated = await this.prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status: 'COMPLETED',
        actualArrival,
        completedAt: new Date(),
        completionNotes: dto.notes,
        podSignedBy: dto.podSignedBy,
        podSignatureUrl: dto.podSignatureUrl,
        podPhotoUrl: dto.podPhotoUrl,
        podNotes: dto.podNotes,
        deliveryStatus,
      },
    });

    // If linked to a sales order, update delivery status
    if (stop.salesOrderId) {
      await this.prisma.salesOrder.update({
        where: { id: stop.salesOrderId },
        data: { deliveryStatus: deliveryStatus === 'LATE' ? 'LATE' : 'DELIVERED' },
      });
    }

    return updated;
  }

  /**
   * Remove a stop from a trip
   */
  async removeStop(
    tripId: string,
    stopId: string,
    userId: string,
    branchId?: string,
  ) {
    const trip = await this.findOne(tripId, branchId);

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new BadRequestException('Cannot remove stops from completed/cancelled trips');
    }

    const stop = await this.prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop || stop.tripId !== tripId) {
      throw new NotFoundException(`Stop with ID '${stopId}' not found on this trip`);
    }

    if (stop.status === 'COMPLETED') {
      throw new BadRequestException('Cannot remove a completed stop');
    }

    await this.prisma.tripStop.delete({ where: { id: stopId } });

    return { deleted: true, stopId };
  }

  // ==================== DELIVERY TRACKING ====================

  /**
   * Get delivery tracking for a trip
   */
  async getDeliveryTracking(
    tripId: string,
    branchId?: string,
  ): Promise<DeliveryTrackingDto> {
    const trip = await this.findOne(tripId, branchId);

    const stops = trip.stops.map((s) => ({
      id: s.id,
      sequenceNumber: s.sequenceNumber,
      stopType: s.stopType,
      location: s.location,
      status: s.status,
      contactName: s.contactName,
      contactPhone: s.contactPhone,
      expectedArrival: s.expectedArrival,
      actualArrival: s.actualArrival,
      completedAt: s.completedAt,
      proofOfDelivery:
        s.status === 'COMPLETED'
          ? {
              signedBy: s.podSignedBy || '',
              signatureUrl: s.podSignatureUrl || undefined,
              photoUrl: s.podPhotoUrl || undefined,
              notes: s.podNotes || undefined,
              deliveredAt: s.completedAt!,
            }
          : undefined,
    }));

    const completedStops = stops.filter((s) => s.status === 'COMPLETED').length;
    const totalStops = stops.length;
    const progressPercent = totalStops > 0 ? Math.round((completedStops / totalStops) * 100) : 0;

    return {
      tripId: trip.id,
      tripNumber: trip.tripNumber,
      status: trip.status,
      currentStopIndex: completedStops + 1,
      totalStops,
      completedStops,
      progressPercent,
      stops,
      estimatedRemainingDistance: trip.estimatedDistance
        ? trip.estimatedDistance - (trip.totalDistance || 0)
        : undefined,
      estimatedRemainingMinutes:
        trip.plannedEndTime && trip.endTime === null
          ? differenceInMinutes(new Date(trip.plannedEndTime), new Date())
          : undefined,
    };
  }

  // ==================== REPORTS & ANALYTICS ====================

  /**
   * Get daily trip summary
   */
  async getDailySummary(
    date?: string,
    branchId?: string,
  ): Promise<TripDailySummaryDto> {
    const targetDate = date ? new Date(date) : new Date();
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    const where: Prisma.TripWhereInput = {
      createdAt: { gte: dayStart, lte: dayEnd },
    };
    if (branchId) where.branchId = branchId;

    const trips = await this.prisma.trip.findMany({ where });

    const scheduled = trips.filter((t) => t.status === 'SCHEDULED').length;
    const inProgress = trips.filter((t) => t.status === 'IN_PROGRESS').length;
    const completed = trips.filter((t) => t.status === 'COMPLETED').length;
    const cancelled = trips.filter((t) => t.status === 'CANCELLED').length;

    const totalDistance = trips.reduce((s, t) => s + (t.totalDistance || 0), 0);
    const totalFuel = trips.reduce((s, t) => s + (t.totalFuelConsumed || 0), 0);
    const totalFuelCost = trips.reduce((s, t) => s + (t.fuelCost || 0), 0);
    const totalToll = trips.reduce((s, t) => s + (t.tollCost || 0), 0);
    const totalDriver = trips.reduce((s, t) => s + (t.driverCost || 0), 0);
    const totalOther = trips.reduce(
      (s, t) => s + (t.parkingCost || 0) + (t.otherCost || 0),
      0,
    );
    const totalCost = totalFuelCost + totalToll + totalDriver + totalOther;

    return {
      date: format(targetDate, 'yyyy-MM-dd'),
      totalScheduled: scheduled,
      totalInProgress: inProgress,
      totalCompleted: completed,
      totalCancelled: cancelled,
      totalDistance: Math.round(totalDistance * 100) / 100,
      totalFuelConsumed: Math.round(totalFuel * 100) / 100,
      totalFuelCost: Math.round(totalFuelCost * 100) / 100,
      totalTollCost: Math.round(totalToll * 100) / 100,
      totalDriverCost: Math.round(totalDriver * 100) / 100,
      totalOtherCost: Math.round(totalOther * 100) / 100,
      totalRevenue: 0,
      netProfit: Math.round(-totalCost * 100) / 100,
    };
  }

  /**
   * Get trip profitability report
   */
  async getProfitabilityReport(
    filter: TripReportFilterDto,
    branchId?: string,
  ): Promise<TripProfitabilityDto[]> {
    const where: Prisma.TripWhereInput = {
      status: 'COMPLETED',
    };

    if (branchId) where.branchId = branchId;
    if (filter.tripType) where.tripType = filter.tripType;
    if (filter.vehicleId) where.vehicleId = filter.vehicleId;
    if (filter.driverId) where.driverId = filter.driverId;
    if (filter.startDate) {
      where.startTime = { gte: new Date(filter.startDate) };
    }
    if (filter.endDate) {
      where.endTime = { lte: new Date(filter.endDate) };
    }

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        vehicle: { select: { code: true } },
        driver: { select: { licenseNumber: true } },
        stops: {
          where: { salesOrderId: { not: null } },
          include: {
            salesOrder: true,
          },
        },
      },
    });

    return trips.map((t) => {
      const fuelCost = t.fuelCost || 0;
      const driverCost = t.driverCost || 0;
      const tollCost = t.tollCost || 0;
      const parkingCost = t.parkingCost || 0;
      const otherCost = t.otherCost || 0;
      const totalCost = fuelCost + driverCost + tollCost + parkingCost + otherCost;

      // Calculate revenue from linked sales
      const revenue = t.stops.reduce((s, stop) => {
        return s + 0; // Revenue would come from sales order amounts
      }, 0);

      const profit = revenue - totalCost;
      const profitMargin = revenue > 0 ? Math.round((profit / revenue) * 10000) / 100 : 0;
      const costPerKm = t.totalDistance > 0 ? totalCost / t.totalDistance : 0;

      return {
        tripId: t.id,
        tripNumber: t.tripNumber,
        title: t.title,
        tripType: t.tripType,
        status: t.status,
        vehicleCode: t.vehicle?.code || '',
        driverLicense: t.driver?.licenseNumber || '',
        totalDistance: t.totalDistance || 0,
        fuelCost: Math.round(fuelCost * 100) / 100,
        driverCost: Math.round(driverCost * 100) / 100,
        tollCost: Math.round(tollCost * 100) / 100,
        parkingCost: Math.round(parkingCost * 100) / 100,
        otherCost: Math.round(otherCost * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
        revenue: Math.round(revenue * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        profitMargin,
        costPerKm: Math.round(costPerKm * 100) / 100,
      };
    });
  }

  /**
   * Get upcoming trips schedule
   */
  async getUpcomingSchedule(branchId?: string) {
    const now = new Date();

    const where: Prisma.TripWhereInput = {
      status: { in: ['SCHEDULED', 'IN_PROGRESS'] },
      plannedStartTime: { gte: startOfDay(now) },
    };
    if (branchId) where.branchId = branchId;

    const trips = await this.prisma.trip.findMany({
      where,
      orderBy: { plannedStartTime: 'asc' },
      include: {
        vehicle: { select: { code: true, licensePlate: true, type: true } },
        driver: {
          select: {
            licenseNumber: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        stops: {
          orderBy: { sequenceNumber: 'asc' },
          select: {
            id: true,
            sequenceNumber: true,
            stopType: true,
            location: true,
            status: true,
            expectedArrival: true,
          },
        },
      },
      take: 100,
    });

    return trips;
  }

  /**
   * Get late delivery alerts
   */
  async getLateDeliveryAlerts(branchId?: string) {
    const now = new Date();

    const where: Prisma.TripWhereInput = {
      status: { in: ['IN_PROGRESS', 'SCHEDULED'] },
      plannedEndTime: { lt: now },
    };
    if (branchId) where.branchId = branchId;

    const trips = await this.prisma.trip.findMany({
      where,
      include: {
        vehicle: { select: { code: true } },
        driver: {
          select: {
            licenseNumber: true,
            employee: { select: { firstName: true, lastName: true } },
          },
        },
        stops: {
          orderBy: { sequenceNumber: 'asc' },
          select: {
            location: true,
            status: true,
            expectedArrival: true,
            actualArrival: true,
          },
        },
      },
    });

    return trips.map((t) => {
      const delayMinutes = t.plannedEndTime
        ? differenceInMinutes(now, t.plannedEndTime)
        : 0;
      const remainingStops = t.stops.filter((s) => s.status !== 'COMPLETED');

      return {
        tripId: t.id,
        tripNumber: t.tripNumber,
        title: t.title,
        status: t.status,
        vehicleCode: t.vehicle?.code || '',
        driverName: t.driver?.employee
          ? `${t.driver.employee.firstName} ${t.driver.employee.lastName}`
          : t.driver?.licenseNumber || '',
        plannedEndTime: t.plannedEndTime,
        delayMinutes: Math.max(0, delayMinutes),
        delayHours: Math.round((Math.max(0, delayMinutes) / 60) * 10) / 10,
        remainingStops: remainingStops.length,
        nextStop: remainingStops[0]?.location || 'N/A',
        severity: delayMinutes > 120 ? 'CRITICAL' : delayMinutes > 30 ? 'WARNING' : 'INFO',
      };
    });
  }

  /**
   * Get trip status counts for dashboard
   */
  async getStatusCounts(branchId?: string) {
    const where: Prisma.TripWhereInput = {};
    if (branchId) where.branchId = branchId;

    const today = new Date();
    const todayStart = startOfDay(today);
    const todayEnd = endOfDay(today);
    const weekStart = startOfWeek(today, { weekStartsOn: 1 });
    const monthStart = startOfDay(new Date(today.getFullYear(), today.getMonth(), 1));

    const [
      totalScheduled,
      totalInProgress,
      totalCompleted,
      totalCancelled,
      todayCompleted,
      weekCompleted,
      monthCompleted,
    ] = await Promise.all([
      this.prisma.trip.count({ where: { ...where, status: 'SCHEDULED' } }),
      this.prisma.trip.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      this.prisma.trip.count({ where: { ...where, status: 'COMPLETED' } }),
      this.prisma.trip.count({ where: { ...where, status: 'CANCELLED' } }),
      this.prisma.trip.count({
        where: {
          ...where,
          status: 'COMPLETED',
          endTime: { gte: todayStart, lte: todayEnd },
        },
      }),
      this.prisma.trip.count({
        where: {
          ...where,
          status: 'COMPLETED',
          endTime: { gte: weekStart },
        },
      }),
      this.prisma.trip.count({
        where: {
          ...where,
          status: 'COMPLETED',
          endTime: { gte: monthStart },
        },
      }),
    ]);

    return {
      totalScheduled,
      totalInProgress,
      totalCompleted,
      totalCancelled,
      todayCompleted,
      weekCompleted,
      monthCompleted,
      totalActive: totalScheduled + totalInProgress,
    };
  }
}
