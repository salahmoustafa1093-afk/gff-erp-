import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AuditService } from './audit.service';

@ApiTags('Audit')
@ApiBearerAuth('access-token')
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}
}
