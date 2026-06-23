import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';

@ApiTags('Payroll')
@ApiBearerAuth('access-token')
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}
}
