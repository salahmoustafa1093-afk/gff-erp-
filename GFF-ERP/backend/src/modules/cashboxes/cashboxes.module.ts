import { Module } from '@nestjs/common';
import { CashboxesService } from './cashboxes.service';
import { CashboxesController } from './cashboxes.controller';

@Module({
  controllers: [CashboxesController],
  providers: [CashboxesService],
  exports: [CashboxesService],
})
export class CashboxesModule {}
