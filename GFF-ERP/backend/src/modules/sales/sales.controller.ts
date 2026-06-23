import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesService } from './sales.service';

@ApiTags('Sales')
@ApiBearerAuth('access-token')
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}
}
