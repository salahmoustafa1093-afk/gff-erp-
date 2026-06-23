import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDate,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { JournalEntryType } from '../interfaces/journal-entry.interface';
import { CreateJournalLineDto } from './create-journal-line.dto';

export class UpdateJournalEntryDto {
  @ApiPropertyOptional({
    description: 'Journal entry date',
    example: '2024-01-15',
  })
  @IsDate()
  @IsOptional()
  @Type(() => Date)
  @Transform(({ value }) => value ? new Date(value) : undefined)
  date?: Date;

  @ApiPropertyOptional({
    description: 'Entry description',
    example: 'Updated description',
  })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Reference number/document',
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Journal entry type',
    enum: JournalEntryType,
  })
  @IsEnum(JournalEntryType)
  @IsOptional()
  entryType?: JournalEntryType;

  @ApiPropertyOptional({
    description: 'Additional notes',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Journal entry lines (replaces all existing lines)',
    type: [CreateJournalLineDto],
  })
  @ValidateNested({ each: true })
  @IsOptional()
  @Type(() => CreateJournalLineDto)
  @ArrayMinSize(2, { message: 'Journal entry must have at least 2 lines' })
  lines?: CreateJournalLineDto[];
}
