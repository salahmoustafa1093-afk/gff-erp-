import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VehicleType } from '@prisma/client';

export enum MaintenanceAlertSeverity {
  CRITICAL = 'CRITICAL',
  WARNING = 'WARNING',
  INFO = 'INFO',
}

export class MaintenanceAlertDto {
  @ApiProperty({ description: 'Alert ID (vehicle ID)' })
  vehicleId: string;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Vehicle make' })
  make: string;

  @ApiProperty({ description: 'Vehicle model' })
  model: string;

  @ApiProperty({ description: 'License plate' })
  licensePlate: string;

  @ApiProperty({ enum: VehicleType, description: 'Vehicle type' })
  type: VehicleType;

  @ApiProperty({ description: 'Current mileage' })
  currentMileage: number;

  @ApiProperty({ description: 'Alert type', enum: ['MILEAGE_BASED', 'DATE_BASED', 'INSURANCE_EXPIRY', 'REGISTRATION_EXPIRY'] })
  alertType: 'MILEAGE_BASED' | 'DATE_BASED' | 'INSURANCE_EXPIRY' | 'REGISTRATION_EXPIRY';

  @ApiProperty({ enum: MaintenanceAlertSeverity, description: 'Alert severity' })
  severity: MaintenanceAlertSeverity;

  @ApiProperty({ description: 'Alert message' })
  message: string;

  @ApiProperty({ description: 'Due date for maintenance' })
  dueDate?: Date;

  @ApiProperty({ description: 'Due mileage for maintenance' })
  dueMileage?: number;

  @ApiProperty({ description: 'Days remaining until due date' })
  daysRemaining?: number;

  @ApiProperty({ description: 'Kilometers remaining until due mileage' })
  kmRemaining?: number;

  @ApiPropertyOptional({ description: 'Insurance expiry date' })
  insuranceExpiry?: Date;

  @ApiPropertyOptional({ description: 'Registration expiry date' })
  registrationExpiry?: Date;
}

export class MaintenanceScheduleDto {
  @ApiProperty({ description: 'Vehicle ID' })
  vehicleId: string;

  @ApiProperty({ description: 'Vehicle code' })
  vehicleCode: string;

  @ApiProperty({ description: 'Vehicle name' })
  vehicleName: string;

  @ApiProperty({ description: 'License plate' })
  licensePlate: string;

  @ApiProperty({ description: 'Last maintenance date' })
  lastMaintenanceDate?: Date;

  @ApiProperty({ description: 'Last maintenance mileage' })
  lastMaintenanceMileage?: number;

  @ApiProperty({ description: 'Next scheduled maintenance date' })
  nextMaintenanceDate?: Date;

  @ApiProperty({ description: 'Next scheduled maintenance mileage' })
  nextMaintenanceMileage?: number;

  @ApiProperty({ description: 'Maintenance interval in km' })
  maintenanceIntervalKm?: number;

  @ApiProperty({ description: 'Current mileage' })
  currentMileage: number;

  @ApiProperty({ description: 'Kilometers until next maintenance' })
  kmUntilNextMaintenance?: number;

  @ApiProperty({ description: 'Days until next maintenance' })
  daysUntilNextMaintenance?: number;

  @ApiProperty({ enum: MaintenanceAlertSeverity, description: 'Maintenance severity' })
  severity: MaintenanceAlertSeverity;

  @ApiProperty({ description: 'Is maintenance overdue' })
  isOverdue: boolean;
}
