import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveSalesDto {
  @ApiProperty({ description: 'Approval action', example: 'APPROVE' })
  @IsString()
  action: 'APPROVE' | 'REJECT';

  @ApiPropertyOptional({ description: 'Rejection or approval reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}
