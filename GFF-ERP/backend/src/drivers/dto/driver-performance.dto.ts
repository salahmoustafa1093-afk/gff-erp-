import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DriverPerformanceMetricsDto {
  @ApiProperty({ description: 'Driver ID' })
  driverId: string;

  @ApiProperty({ description: 'Driver license number' })
  licenseNumber: string;

  @ApiProperty({ description: 'Driver rating' })
  rating: number;

  @ApiProperty({ description: 'Total trips completed (all time)' })
  totalTrips: number;

  @ApiProperty({ description: 'Total distance driven in km (all time)' })
  totalDistanceDriven: number;

  @ApiProperty({ description: 'Trips this month' })
  tripsThisMonth: number;

  @ApiProperty({ description: 'Distance driven this month (km)' })
  distanceThisMonth: number;

  @ApiProperty({ description: 'Trips last month' })
  tripsLastMonth: number;

  @ApiProperty({ description: 'Distance driven last month (km)' })
  distanceLastMonth: number;

  @ApiProperty({ description: 'Trip growth percentage month-over-month' })
  tripGrowthPercent: number;

  @ApiProperty({ description: 'Distance growth percentage month-over-month' })
  distanceGrowthPercent: number;

  @ApiProperty({ description: 'Average fuel efficiency across all trips (L/100km)' })
  avgFuelEfficiency: number;

  @ApiProperty({ description: 'Total fuel consumed (liters)' })
  totalFuelConsumed: number;

  @ApiProperty({ description: 'Total fuel cost' })
  totalFuelCost: number;

  @ApiProperty({ description: 'On-time delivery rate (%)' })
  onTimeDeliveryRate: number;

  @ApiProperty({ description: 'Late deliveries count' })
  lateDeliveries: number;

  @ApiProperty({ description: 'Safety incidents count' })
  safetyIncidents: number;

  @ApiProperty({ description: 'Cancelled trips count' })
  cancelledTrips: number;

  @ApiProperty({ description: 'Average trip duration (hours)' })
  avgTripDuration: number;

  @ApiProperty({ description: 'Average trip distance (km)' })
  avgTripDistance: number;

  @ApiProperty({ description: 'Current status' })
  status: string;

  @ApiProperty({ description: 'Is currently on a trip' })
  isOnTrip: boolean;

  @ApiProperty({ description: 'Current trip ID if on trip' })
  currentTripId?: string;

  @ApiPropertyOptional({ description: 'Recent trips summary' })
  recentTrips?: {
    id: string;
    tripNumber: string;
    status: string;
    startTime: Date | null;
    endTime: Date | null;
    totalDistance: number;
  }[];
}

export class DriverLeaderboardEntryDto {
  @ApiProperty({ description: 'Driver ID' })
  driverId: string;

  @ApiProperty({ description: 'Driver license number' })
  licenseNumber: string;

  @ApiProperty({ description: 'Driver rating' })
  rating: number;

  @ApiProperty({ description: 'Total trips completed' })
  totalTrips: number;

  @ApiProperty({ description: 'Total distance driven' })
  totalDistanceDriven: number;

  @ApiProperty({ description: 'On-time delivery rate (%)' })
  onTimeDeliveryRate: number;

  @ApiProperty({ description: 'Fuel efficiency (L/100km)' })
  avgFuelEfficiency: number;

  @ApiProperty({ description: 'Safety score (incidents inverse)' })
  safetyScore: number;

  @ApiProperty({ description: 'Overall score' })
  overallScore: number;

  @ApiProperty({ description: 'Rank' })
  rank: number;
}

export class DriverScheduleDto {
  @ApiProperty({ description: 'Driver ID' })
  driverId: string;

  @ApiProperty({ description: 'Driver license number' })
  licenseNumber: string;

  @ApiProperty({ description: 'Current status' })
  status: string;

  @ApiProperty({ description: 'Is available for assignment' })
  isAvailable: boolean;

  @ApiProperty({ description: 'Current trip if any' })
  currentTrip?: {
    id: string;
    tripNumber: string;
    status: string;
    startTime: Date | null;
    estimatedEndTime: Date | null;
    vehicleCode: string;
  };

  @ApiProperty({ description: 'Upcoming scheduled trips' })
  upcomingTrips: {
    id: string;
    tripNumber: string;
    plannedStartTime: Date | null;
    estimatedDistance: number;
    stopCount: number;
    vehicleCode: string;
  }[];

  @ApiProperty({ description: 'Completed trips today' })
  completedTripsToday: number;

  @ApiProperty({ description: 'Hours driven today' })
  hoursDrivenToday: number;
}
