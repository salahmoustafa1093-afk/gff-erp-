import { Module } from '@nestjs/common';
import { BanksController } from './banks.controller';
import { BanksService } from './banks.service';
import { JournalEntriesModule } from '../journal-entries/journal-entries.module';

@Module({
  imports: [JournalEntriesModule],
  controllers: [BanksController],
  providers: [BanksService],
  exports: [BanksService],
})
export class BanksModule {}
