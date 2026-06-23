import { Module } from '@nestjs/common';
import { MobileApiService } from './mobile-api.service';
import { MobileApiController } from './mobile-api.controller';

@Module({
  controllers: [MobileApiController],
  providers: [MobileApiService],
  exports: [MobileApiService],
})
export class MobileApiModule {}
