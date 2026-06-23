import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChicksService } from './chicks.service';

@ApiTags('Chicks')
@ApiBearerAuth('access-token')
@Controller('chicks')
export class ChicksController {
  constructor(private readonly chicksService: ChicksService) {}
}
