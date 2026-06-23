import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DriversService } from './drivers.service';

@ApiTags('Drivers')
@ApiBearerAuth('access-token')
@Controller('drivers')
export class DriversController {
  constructor(private readonly driversService: DriversService) {}
}
