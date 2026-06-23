import { Module } from '@nestjs/common';
import { ChicksService } from './chicks.service';
import { ChicksController } from './chicks.controller';

@Module({
  controllers: [ChicksController],
  providers: [ChicksService],
  exports: [ChicksService],
})
export class ChicksModule {}
