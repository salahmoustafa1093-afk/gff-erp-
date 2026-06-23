import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CashboxesService } from './cashboxes.service';

@ApiTags('Cashboxes')
@ApiBearerAuth('access-token')
@Controller('cashboxes')
export class CashboxesController {
  constructor(private readonly cashboxesService: CashboxesService) {}
}
