import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDate,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class ReverseJournalDto {
  @ApiProperty({
    description: 'Reversal date',
    example: '2024-01-20',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  reversalDate: Date;

  @ApiProperty({
    description: 'Reason for reversal',
    example: 'Incorrect amount entered',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Will create corrected entry',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
