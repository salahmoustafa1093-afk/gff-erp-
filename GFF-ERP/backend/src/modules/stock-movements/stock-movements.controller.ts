import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StockMovementsService } from './stock-movements.service';

@ApiTags('Stock Movements')
@ApiBearerAuth('access-token')
@Controller('stock-movements')
export class StockMovementsController {
  constructor(private readonly stockMovementsService: StockMovementsService) {}
}
