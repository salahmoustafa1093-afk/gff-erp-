import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApprovePurchaseDto {
  @ApiProperty({ description: 'Approval action', enum: ['APPROVE', 'REJECT'] })
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ description: 'Approval/rejection reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}
