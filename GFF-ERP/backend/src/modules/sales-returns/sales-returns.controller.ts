import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { SalesReturnsService } from './sales-returns.service';

@ApiTags('Sales Returns')
@ApiBearerAuth('access-token')
@Controller('sales-returns')
export class SalesReturnsController {
  constructor(private readonly salesReturnsService: SalesReturnsService) {}
}
