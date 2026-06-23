import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ProductionService } from './production.service';

@ApiTags('Production')
@ApiBearerAuth('access-token')
@Controller('production')
export class ProductionController {
  constructor(private readonly productionService: ProductionService) {}
}
