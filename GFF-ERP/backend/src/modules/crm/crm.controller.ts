import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CrmService } from './crm.service';

@ApiTags('Crm')
@ApiBearerAuth('access-token')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}
}
