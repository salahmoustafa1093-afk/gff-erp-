import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';

@ApiTags('Accounting')
@ApiBearerAuth('access-token')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}
}
