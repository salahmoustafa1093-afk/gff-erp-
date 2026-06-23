import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UnitsService } from './units.service';

@ApiTags('Units')
@ApiBearerAuth('access-token')
@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}
}
