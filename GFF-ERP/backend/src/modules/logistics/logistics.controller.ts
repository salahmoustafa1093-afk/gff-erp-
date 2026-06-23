import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LogisticsService } from './logistics.service';

@ApiTags('Logistics')
@ApiBearerAuth('access-token')
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}
}
