import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TripType, TripStatus } from '@prisma/client';

export class TripReportFilterDto {
  @ApiPropertyOptional({ description: 'Report start date' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'Report end date' })
  endDate?: string;

  @ApiPropertyOptional({ enum: TripType, description: 'Filter by trip type' })
  tripType?: TripType;

  @ApiPropertyOptional({ description: 'Filter by vehicle ID' })
  vehicleId?: string;

  @ApiPropertyOptional({ description: 'Filter by driver ID' })
  driverId?: string;

  @ApiPropertyOptional({ description: 'Filter by branch ID' })
  branchId?: string;
}

export class TripDailySummaryDto {
  @ApiProperty({ description: 'Date' })
  date: string;

  @ApiProperty({ description: 'Total trips scheduled' })
  totalScheduled: number;

  @ApiProperty({ description: 'Total trips in progress' })
  totalInProgress: number;

  @ApiProperty({ description: 'Total trips completed' })
  totalCompleted: number;

  @ApiProperty({ description: 'Total trips cancelled' })
  totalCancelled: number;

  @ApiProperty({ description: 'Total distance driven' })
  totalDistance: number;

  @ApiProperty({ description: 'Total fuel consumed' })
  totalFuelConsumed: number;

  @ApiProperty({ description: 'Total fuel cost' })
  totalFuelCost: number;

  @ApiProperty({ description: 'Total toll cost' })
  totalTollCost: number;

  @ApiProperty({ description: 'Total driver cost' })
  totalDriverCost: number;

  @ApiProperty({ description: 'Total other costs' })
  totalOtherCost: number;

  @ApiProperty({ description: 'Total revenue from delivery trips' })
  totalRevenue: number;

  @ApiProperty({ description: 'Net profit/loss' })
  netProfit: number;
}

export class TripProfitabilityDto {
  @ApiProperty({ description: 'Trip ID' })
  tripId: string;

  @ApiProperty({ description: 'Trip number' })
  tripNumber: string;

  @ApiProperty({ description: 'Trip title' })
  title: string;

  @ApiProperty({ enum: TripType })
  tripType: TripType;

  @ApiProperty({ enum: TripStatus })
  status: TripStatus;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Driver license number' })
  driverLicense: string;

  @ApiProperty({ description: 'Total distance (km)' })
  totalDistance: number;

  @ApiProperty({ description: 'Fuel cost' })
  fuelCost: number;

  @ApiProperty({ description: 'Driver cost' })
  driverCost: number;

  @ApiProperty({ description: 'Toll cost' })
  tollCost: number;

  @ApiProperty({ description: 'Parking cost' })
  parkingCost: number;

  @ApiProperty({ description: 'Other costs' })
  otherCost: number;

  @ApiProperty({ description: 'Total trip cost' })
  totalCost: number;

  @ApiProperty({ description: 'Revenue from linked sales' })
  revenue: number;

  @ApiProperty({ description: 'Profit/Loss' })
  profit: number;

  @ApiProperty({ description: 'Profit margin (%)' })
  profitMargin: number;

  @ApiProperty({ description: 'Cost per km' })
  costPerKm: number;
}

export class DeliveryTrackingDto {
  @ApiProperty({ description: 'Trip ID' })
  tripId: string;

  @ApiProperty({ description: 'Trip number' })
  tripNumber: string;

  @ApiProperty({ description: 'Trip status' })
  status: TripStatus;

  @ApiProperty({ description: 'Current stop index' })
  currentStopIndex: number;

  @ApiProperty({ description: 'Total stops' })
  totalStops: number;

  @ApiProperty({ description: 'Completed stops' })
  completedStops: number;

  @ApiProperty({ description: 'Progress percentage' })
  progressPercent: number;

  @ApiProperty({ description: 'Stops detail' })
  stops: {
    id: string;
    sequenceNumber: number;
    stopType: string;
    location: string;
    status: string;
    contactName?: string;
    contactPhone?: string;
    expectedArrival?: Date;
    actualArrival?: Date;
    completedAt?: Date;
    proofOfDelivery?: {
      signedBy: string;
      signatureUrl?: string;
      photoUrl?: string;
      notes?: string;
      deliveredAt: Date;
    };
  }[];

  @ApiProperty({ description: 'Vehicle location if available' })
  currentLocation?: {
    lat: number;
    lng: number;
    updatedAt: Date;
  };

  @ApiProperty({ description: 'Estimated remaining distance (km)' })
  estimatedRemainingDistance?: number;

  @ApiProperty({ description: 'Estimated remaining time (minutes)' })
  estimatedRemainingMinutes?: number;
}

export class ProofOfDeliveryDto {
  @ApiProperty({ description: 'Stop ID' })
  stopId: string;

  @ApiProperty({ description: 'Signed by name' })
  signedBy: string;

  @ApiPropertyOptional({ description: 'Signature image URL' })
  signatureUrl?: string;

  @ApiPropertyOptional({ description: 'Delivery photo URL' })
  photoUrl?: string;

  @ApiPropertyOptional({ description: 'Delivery notes' })
  notes?: string;
}
