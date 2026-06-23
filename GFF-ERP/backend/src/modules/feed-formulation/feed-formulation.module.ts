import { Module } from '@nestjs/common';
import { FeedFormulationService } from './feed-formulation.service';
import { FeedFormulationController } from './feed-formulation.controller';

@Module({
  controllers: [FeedFormulationController],
  providers: [FeedFormulationService],
  exports: [FeedFormulationService],
})
export class FeedFormulationModule {}
