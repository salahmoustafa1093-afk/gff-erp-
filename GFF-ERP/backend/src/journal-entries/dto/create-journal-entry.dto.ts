import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsEnum,
  ValidateNested,
  ArrayMinSize,
  Length,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import {
  JournalEntryType,
  JournalSource,
} from '../interfaces/journal-entry.interface';
import { CreateJournalLineDto } from './create-journal-line.dto';

export class CreateJournalEntryDto {
  @ApiProperty({
    description: 'Journal entry date',
    example: '2024-01-15',
  })
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  date: Date;

  @ApiProperty({
    description: 'Entry description',
    example: 'Monthly rent payment',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiPropertyOptional({
    description: 'Reference number/document',
    example: 'RENT-JAN-2024',
  })
  @IsString()
  @IsOptional()
  @Length(0, 100)
  reference?: string;

  @ApiPropertyOptional({
    description: 'Journal entry type',
    enum: JournalEntryType,
    default: JournalEntryType.MANUAL,
  })
  @IsEnum(JournalEntryType)
  @IsOptional()
  entryType?: JournalEntryType;

  @ApiPropertyOptional({
    description: 'Source of the journal entry',
    enum: JournalSource,
    default: JournalSource.MANUAL_ENTRY,
  })
  @IsEnum(JournalSource)
  @IsOptional()
  source?: JournalSource;

  @ApiProperty({
    description: 'Branch ID',
    example: 'branch-001',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiPropertyOptional({
    description: 'Accounting period ID',
    example: 'period-2024-01',
  })
  @IsString()
  @IsOptional()
  periodId?: string;

  @ApiPropertyOptional({
    description: 'Source document ID (if auto-generated)',
  })
  @IsString()
  @IsOptional()
  sourceDocumentId?: string;

  @ApiPropertyOptional({
    description: 'Source document type',
    example: 'SalesInvoice',
  })
  @IsString()
  @IsOptional()
  sourceDocumentType?: string;

  @ApiPropertyOptional({
    description: 'Additional notes',
    example: 'Payment via bank transfer',
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    description: 'Journal entry lines (minimum 2 lines required)',
    type: [CreateJournalLineDto],
  })
  @ValidateNested({ each: true })
  @Type(() => CreateJournalLineDto)
  @ArrayMinSize(2, { message: 'Journal entry must have at least 2 lines' })
  lines: CreateJournalLineDto[];
}
