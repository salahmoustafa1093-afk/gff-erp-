import { Module } from '@nestjs/common';
import { CashboxesController } from './cashboxes.controller';
import { CashboxesService } from './cashboxes.service';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';

@Module({
  imports: [JournalEntriesModule],
  controllers: [CashboxesController],
  providers: [CashboxesService],
  exports: [CashboxesService],
})
export class CashboxesModule {}
