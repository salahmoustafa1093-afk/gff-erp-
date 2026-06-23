import { ApiProperty } from '@nestjs/swagger';
import { LogisticsKpiDto, FleetSummaryDto } from './logistics-kpi.dto';

export class RecentTripDto {
  @ApiProperty({ description: 'Trip ID' })
  id: string;

  @ApiProperty({ description: 'Trip number' })
  tripNumber: string;

  @ApiProperty({ description: 'Trip title' })
  title: string;

  @ApiProperty({ description: 'Trip status' })
  status: string;

  @ApiProperty({ description: 'Trip type' })
  tripType: string;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Driver name' })
  driverName: string;

  @ApiProperty({ description: 'Planned start time' })
  plannedStartTime: Date | null;

  @ApiProperty({ description: 'Actual start time' })
  startTime: Date | null;

  @ApiProperty({ description: 'Stops count' })
  stopsCount: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercent: number;
}

export class MaintenanceAlertItemDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Vehicle name' })
  vehicleName: string;

  @ApiProperty({ description: 'Alert type' })
  alertType: string;

  @ApiProperty({ description: 'Severity' })
  severity: string;

  @ApiProperty({ description: 'Message' })
  message: string;

  @ApiProperty({ description: 'Days remaining until due' })
  daysRemaining?: number;

  @ApiProperty({ description: 'Kilometers remaining until due' })
  kmRemaining?: number;
}

export class DriverStatusItemDto {
  @ApiProperty({ description: 'Driver ID' })
  driverId: string;

  @ApiProperty({ description: 'License number' })
  licenseNumber: string;

  @ApiProperty({ description: 'Driver name' })
  driverName: string;

  @ApiProperty({ description: 'Status' })
  status: string;

  @ApiProperty({ description: 'Is on trip' })
  isOnTrip: boolean;

  @ApiProperty({ description: 'Current trip number if on trip' })
  currentTripNumber?: string;

  @ApiProperty({ description: 'Rating' })
  rating: number;

  @ApiProperty({ description: 'License days remaining' })
  licenseDaysRemaining: number;
}

export class LogisticsDashboardDto {
  @ApiProperty({ description: 'Key performance indicators', type: LogisticsKpiDto })
  kpis: LogisticsKpiDto;

  @ApiProperty({ description: 'Fleet summary', type: FleetSummaryDto })
  fleetSummary: FleetSummaryDto;

  @ApiProperty({ description: 'Recent active trips', type: [RecentTripDto] })
  recentTrips: RecentTripDto[];

  @ApiProperty({ description: 'Critical maintenance alerts', type: [MaintenanceAlertItemDto] })
  criticalAlerts: MaintenanceAlertItemDto[];

  @ApiProperty({ description: 'Driver status overview', type: [DriverStatusItemDto] })
  driverStatus: DriverStatusItemDto[];

  @ApiProperty({ description: 'Weekly trip completion chart data' })
  weeklyTripChart: { day: string; scheduled: number; completed: number; cancelled: number }[];

  @ApiProperty({ description: 'Fuel consumption trend (last 7 days)' })
  fuelTrend: { date: string; liters: number; cost: number }[];
}
