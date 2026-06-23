import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TripsService } from './trips.service';

@ApiTags('Trips')
@ApiBearerAuth('access-token')
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}
}
