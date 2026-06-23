import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LogisticsKpiDto {
  @ApiProperty({ description: 'Active trips count (scheduled + in progress)' })
  activeTripsCount: number;

  @ApiProperty({ description: 'Trips completed today' })
  tripsCompletedToday: number;

  @ApiProperty({ description: 'Trips completed this week' })
  tripsCompletedThisWeek: number;

  @ApiProperty({ description: 'Trips completed this month' })
  tripsCompletedThisMonth: number;

  @ApiProperty({ description: 'Pending deliveries count' })
  pendingDeliveries: number;

  @ApiProperty({ description: 'Average delivery time in hours' })
  avgDeliveryTimeHours: number;

  @ApiProperty({ description: 'Total fuel consumed this month (liters)' })
  totalFuelConsumedThisMonth: number;

  @ApiProperty({ description: 'Total fuel cost this month' })
  totalFuelCostThisMonth: number;

  @ApiProperty({ description: 'Average fuel consumption per 100km' })
  avgFuelConsumptionPer100Km: number;

  @ApiProperty({ description: 'Vehicle utilization rate (%)' })
  vehicleUtilizationRate: number;

  @ApiProperty({ description: 'Total active vehicles count' })
  totalActiveVehicles: number;

  @ApiProperty({ description: 'Total available vehicles count' })
  totalAvailableVehicles: number;

  @ApiProperty({ description: 'Total vehicles in maintenance' })
  vehiclesInMaintenance: number;

  @ApiProperty({ description: 'Available drivers count' })
  availableDrivers: number;

  @ApiProperty({ description: 'Drivers on trip count' })
  driversOnTrip: number;

  @ApiProperty({ description: 'Drivers with expired/expiring licenses' })
  driversWithExpiringLicenses: number;

  @ApiProperty({ description: 'Total maintenance alerts count' })
  maintenanceAlertsCount: number;

  @ApiProperty({ description: 'Critical maintenance alerts' })
  criticalMaintenanceAlerts: number;

  @ApiProperty({ description: 'Total operating cost this month' })
  totalOperatingCostThisMonth: number;

  @ApiProperty({ description: 'Cost per km this month' })
  costPerKmThisMonth: number;

  @ApiProperty({ description: 'On-time delivery rate (%)' })
  onTimeDeliveryRate: number;

  @ApiProperty({ description: 'Late deliveries count today' })
  lateDeliveriesToday: number;
}

export class FleetSummaryDto {
  @ApiProperty({ description: 'Total vehicles' })
  totalVehicles: number;

  @ApiProperty({ description: 'By type counts' })
  byType: Record<string, number>;

  @ApiProperty({ description: 'By status counts' })
  byStatus: Record<string, number>;

  @ApiProperty({ description: 'By fuel type counts' })
  byFuelType: Record<string, number>;

  @ApiProperty({ description: 'Average vehicle age in years' })
  avgAgeYears: number;

  @ApiProperty({ description: 'Total fleet value' })
  totalFleetValue: number;

  @ApiProperty({ description: 'Total current mileage across fleet' })
  totalMileage: number;

  @ApiProperty({ description: 'Average mileage per vehicle' })
  avgMileage: number;

  @ApiProperty({ description: 'Vehicles needing maintenance soon' })
  maintenanceDueCount: number;

  @ApiProperty({ description: 'Vehicles with expired/expiring insurance' })
  insuranceExpiringCount: number;

  @ApiProperty({ description: 'Vehicles with expired/expiring registration' })
  registrationExpiringCount: number;
}

export class DeliveryPerformanceDto {
  @ApiProperty({ description: 'Total deliveries in period' })
  totalDeliveries: number;

  @ApiProperty({ description: 'On-time deliveries' })
  onTimeDeliveries: number;

  @ApiProperty({ description: 'Late deliveries' })
  lateDeliveries: number;

  @ApiProperty({ description: 'On-time delivery rate (%)' })
  onTimeRate: number;

  @ApiProperty({ description: 'Average delivery time (hours)' })
  avgDeliveryTimeHours: number;

  @ApiProperty({ description: 'Fastest delivery (hours)' })
  fastestDeliveryHours: number;

  @ApiProperty({ description: 'Slowest delivery (hours)' })
  slowestDeliveryHours: number;

  @ApiProperty({ description: 'Deliveries by day' })
  byDay: { date: string; deliveries: number; onTime: number; late: number }[];

  @ApiProperty({ description: 'Top delivery routes' })
  topRoutes: { from: string; to: string; count: number; avgTime: number }[];
}

export class FuelTrendDto {
  @ApiProperty({ description: 'Period (daily/weekly)' })
  period: string;

  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Fuel consumed (liters)' })
  fuelConsumed: number;

  @ApiProperty({ description: 'Fuel cost' })
  fuelCost: number;

  @ApiProperty({ description: 'Distance driven (km)' })
  distanceDriven: number;

  @ApiProperty({ description: 'Consumption L/100km' })
  consumptionPer100Km: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm: number;
}

export class CostBreakdownDto {
  @ApiProperty({ description: 'Period' })
  period: string;

  @ApiProperty({ description: 'Fuel cost' })
  fuelCost: number;

  @ApiProperty({ description: 'Maintenance cost' })
  maintenanceCost: number;

  @ApiProperty({ description: 'Driver cost' })
  driverCost: number;

  @ApiProperty({ description: 'Toll cost' })
  tollCost: number;

  @ApiProperty({ description: 'Parking cost' })
  parkingCost: number;

  @ApiProperty({ description: 'Other costs' })
  otherCost: number;

  @ApiProperty({ description: 'Insurance cost' })
  insuranceCost: number;

  @ApiProperty({ description: 'Total cost' })
  totalCost: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm: number;

  @ApiProperty({ description: 'Cost per trip' })
  costPerTrip: number;
}
