import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchasesService } from './purchases.service';

@ApiTags('Purchases')
@ApiBearerAuth('access-token')
@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}
}
