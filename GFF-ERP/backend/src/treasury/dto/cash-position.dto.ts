import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CashPositionQueryDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Currency filter',
    example: 'USD',
  })
  @IsString()
  @IsOptional()
  currency?: string;
}
