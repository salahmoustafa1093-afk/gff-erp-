import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { HrService } from './hr.service';

@ApiTags('Hr')
@ApiBearerAuth('access-token')
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}
}
