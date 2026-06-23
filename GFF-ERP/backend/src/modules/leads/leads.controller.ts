import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LeadsService } from './leads.service';

@ApiTags('Leads')
@ApiBearerAuth('access-token')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}
}
