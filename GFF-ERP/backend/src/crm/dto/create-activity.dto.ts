import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityPriority } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ enum: ActivityType, description: 'Activity type', example: ActivityType.CALL })
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiProperty({ description: 'Activity subject/title', example: 'Follow-up call with prospect' })
  @IsString()
  subject: string;

  @ApiPropertyOptional({ description: 'Activity description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Related lead ID' })
  @IsOptional()
  @IsUUID()
  leadId?: string;

  @ApiPropertyOptional({ description: 'Related customer ID' })
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Related sales order ID' })
  @IsOptional()
  @IsUUID()
  salesOrderId?: string;

  @ApiPropertyOptional({ description: 'Assigned to user ID' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'Scheduled date/time' })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiPropertyOptional({ description: 'Due date/time' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ enum: ActivityPriority, description: 'Priority level', default: ActivityPriority.MEDIUM })
  @IsOptional()
  @IsEnum(ActivityPriority)
  priority?: ActivityPriority;

  @ApiPropertyOptional({ description: 'Activity status', enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
  status?: string;

  @ApiPropertyOptional({ description: 'Activity result/outcome' })
  @IsOptional()
  @IsString()
  result?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
