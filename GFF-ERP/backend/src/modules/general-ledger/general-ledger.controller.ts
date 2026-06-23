import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GeneralLedgerService } from './general-ledger.service';

@ApiTags('General Ledger')
@ApiBearerAuth('access-token')
@Controller('general-ledger')
export class GeneralLedgerController {
  constructor(private readonly generalLedgerService: GeneralLedgerService) {}
}
