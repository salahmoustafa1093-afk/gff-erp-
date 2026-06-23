import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FeedFormulationService } from './feed-formulation.service';

@ApiTags('Feed Formulation')
@ApiBearerAuth('access-token')
@Controller('feed-formulation')
export class FeedFormulationController {
  constructor(private readonly feedFormulationService: FeedFormulationService) {}
}
