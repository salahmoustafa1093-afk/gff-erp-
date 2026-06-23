import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ManufacturingService } from './manufacturing.service';

@ApiTags('Manufacturing')
@ApiBearerAuth('access-token')
@Controller('manufacturing')
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}
}
