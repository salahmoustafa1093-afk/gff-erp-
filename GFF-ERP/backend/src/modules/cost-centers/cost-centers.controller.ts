import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CostCentersService } from './cost-centers.service';

@ApiTags('Cost Centers')
@ApiBearerAuth('access-token')
@Controller('cost-centers')
export class CostCentersController {
  constructor(private readonly costCentersService: CostCentersService) {}
}
