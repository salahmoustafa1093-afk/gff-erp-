import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { DashboardsService } from './dashboards.service';

@ApiTags('Dashboards')
@ApiBearerAuth('access-token')
@Controller('dashboards')
export class DashboardsController {
  constructor(private readonly dashboardsService: DashboardsService) {}
}
