import { IsString, IsOptional, IsBoolean, MaxLength, IsEmail, IsPhoneNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBranchDto {
  @ApiProperty({ description: 'Branch name', example: 'Casablanca Main' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: 'Branch code', example: 'CAS-001' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  code?: string;

  @ApiPropertyOptional({ description: 'Address line 1', example: '123 Industrial Zone' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address1?: string;

  @ApiPropertyOptional({ description: 'Address line 2', example: 'Building 5' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  address2?: string;

  @ApiPropertyOptional({ description: 'City', example: 'Casablanca' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'Region/State', example: 'Casablanca-Settat' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @ApiPropertyOptional({ description: 'Country', example: 'Morocco' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ description: 'Postal code', example: '20000' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiPropertyOptional({ description: 'Contact phone', example: '+212-522-123456' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ description: 'Contact email', example: 'casablanca@gff.ma' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Branch manager ID', example: 'uuid-here' })
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @ApiPropertyOptional({ description: 'Branch status', example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'GPS latitude', example: 33.5731 })
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional({ description: 'GPS longitude', example: -7.5898 })
  @IsOptional()
  longitude?: number;

  @ApiPropertyOptional({ description: 'Notes', example: 'Main distribution center' })
  @IsOptional()
  @IsString()
  notes?: string;
}
