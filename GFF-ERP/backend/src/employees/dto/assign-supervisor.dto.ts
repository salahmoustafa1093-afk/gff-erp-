import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString } from 'class-validator';

export class AssignSupervisorDto {
  @ApiProperty({ description: 'Supervisor employee ID' })
  @IsUUID()
  supervisorId: string;

  @ApiPropertyOptional({ description: 'Reason for assignment change' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class TransferEmployeeDto {
  @ApiPropertyOptional({ description: 'New department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'New branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'New job title ID' })
  @IsOptional()
  @IsUUID()
  jobTitleId?: string;

  @ApiPropertyOptional({ description: 'New supervisor ID' })
  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Effective date' })
  @IsOptional()
  effectiveDate?: string;

  @ApiPropertyOptional({ description: 'Transfer reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}
