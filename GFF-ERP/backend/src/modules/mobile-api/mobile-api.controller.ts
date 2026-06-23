import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MobileApiService } from './mobile-api.service';

@ApiTags('Mobile Api')
@ApiBearerAuth('access-token')
@Controller('mobile-api')
export class MobileApiController {
  constructor(private readonly mobileApiService: MobileApiService) {}
}
