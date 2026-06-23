import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TreasuryService } from './treasury.service';

@ApiTags('Treasury')
@ApiBearerAuth('access-token')
@Controller('treasury')
export class TreasuryController {
  constructor(private readonly treasuryService: TreasuryService) {}
}
