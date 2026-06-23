import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PurchaseReturnsService } from './purchase-returns.service';

@ApiTags('Purchase Returns')
@ApiBearerAuth('access-token')
@Controller('purchase-returns')
export class PurchaseReturnsController {
  constructor(private readonly purchaseReturnsService: PurchaseReturnsService) {}
}
