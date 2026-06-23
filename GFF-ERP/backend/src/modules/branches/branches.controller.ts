import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BranchesService } from './branches.service';

@ApiTags('Branches')
@ApiBearerAuth('access-token')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}
}
