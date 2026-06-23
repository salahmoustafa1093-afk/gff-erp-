import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PoultryService } from './poultry.service';

@ApiTags('Poultry')
@ApiBearerAuth('access-token')
@Controller('poultry')
export class PoultryController {
  constructor(private readonly poultryService: PoultryService) {}
}
