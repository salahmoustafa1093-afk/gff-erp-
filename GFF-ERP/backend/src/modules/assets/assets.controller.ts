import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';

@ApiTags('Assets')
@ApiBearerAuth('access-token')
@Controller('assets')
export class AssetsController {
  constructor(private readonly assetsService: AssetsService) {}
}
