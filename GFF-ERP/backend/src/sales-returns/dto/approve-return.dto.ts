import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveReturnDto {
  @ApiProperty({ description: 'Approval action', enum: ['APPROVE', 'REJECT'] })
  @IsEnum(['APPROVE', 'REJECT'])
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ description: 'Reason for decision' })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: 'Restocking fee percentage', example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  restockingFeePercent?: number;
}
