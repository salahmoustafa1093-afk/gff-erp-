import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';

@ApiTags('Journal Entries')
@ApiBearerAuth('access-token')
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}
}
