import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BanksService } from './banks.service';

@ApiTags('Banks')
@ApiBearerAuth('access-token')
@Controller('banks')
export class BanksController {
  constructor(private readonly banksService: BanksService) {}
}
