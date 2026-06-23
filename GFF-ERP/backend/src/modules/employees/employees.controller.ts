import { Controller } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';

@ApiTags('Employees')
@ApiBearerAuth('access-token')
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}
}
