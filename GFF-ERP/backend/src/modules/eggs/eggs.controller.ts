import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EggsService } from './eggs.service';

@ApiTags('Eggs')
@ApiBearerAuth('access-token')
@Controller('eggs')
export class EggsController {
  constructor(private readonly eggsService: EggsService) {}
}
