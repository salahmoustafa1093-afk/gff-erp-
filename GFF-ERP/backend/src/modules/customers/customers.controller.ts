import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';

@ApiTags('Customers')
@ApiBearerAuth('access-token')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}
}
