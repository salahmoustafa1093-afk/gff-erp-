import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, Length } from 'class-validator';

export class PostJournalDto {
  @ApiProperty({
    description: 'Approval notes when posting',
    example: 'Reviewed and approved for posting',
  })
  @IsString()
  @IsOptional()
  @Length(0, 500)
  approvalNotes?: string;
}
