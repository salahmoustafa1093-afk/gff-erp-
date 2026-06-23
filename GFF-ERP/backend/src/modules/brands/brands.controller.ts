import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BrandsService } from './brands.service';

@ApiTags('Brands')
@ApiBearerAuth('access-token')
@Controller('brands')
export class BrandsController {
  constructor(private readonly brandsService: BrandsService) {}
}
