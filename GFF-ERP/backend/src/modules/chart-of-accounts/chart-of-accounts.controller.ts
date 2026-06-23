import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ChartOfAccountsService } from './chart-of-accounts.service';

@ApiTags('Chart Of Accounts')
@ApiBearerAuth('access-token')
@Controller('chart-of-accounts')
export class ChartOfAccountsController {
  constructor(private readonly chartOfAccountsService: ChartOfAccountsService) {}
}
