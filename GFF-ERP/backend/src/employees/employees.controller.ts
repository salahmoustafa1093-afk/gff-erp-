import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, EmployeeStatus } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeeFilterDto } from './dto/employee-filter.dto';
import { AssignSupervisorDto, TransferEmployeeDto } from './dto/assign-supervisor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Employees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create new employee' })
  @ApiResponse({ status: 201, description: 'Employee created successfully' })
  @ApiResponse({ status: 409, description: 'Duplicate employee number or email' })
  async create(
    @Body() dto: CreateEmployeeDto,
    @Request() req: { user: { userId: string; branchId?: string } },
  ) {
    return this.employeesService.create(dto, req.user.userId, req.user.branchId);
  }

  @Get()
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get all employees with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of employees' })
  async findAll(
    @Query() filter: EmployeeFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.employeesService.findAll(filter);
  }

  @Get('directory')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get employee directory (flattened)' })
  @ApiResponse({ status: 200, description: 'Employee directory' })
  async getDirectory(
    @Query() filter: EmployeeFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.employeesService.getDirectory(filter);
  }

  @Get('statistics')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get employee statistics' })
  @ApiResponse({ status: 200, description: 'Employee statistics' })
  async getStatistics(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.employeesService.getStatistics(req.user.branchId);
  }

  @Get('upcoming-birthdays')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get upcoming birthdays (next 30 days)' })
  @ApiResponse({ status: 200, description: 'Upcoming birthdays' })
  async getUpcomingBirthdays(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.employeesService.getUpcomingBirthdays(req.user.branchId);
  }

  @Get('upcoming-anniversaries')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get upcoming work anniversaries (next 30 days)' })
  @ApiResponse({ status: 200, description: 'Upcoming anniversaries' })
  async getUpcomingAnniversaries(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.employeesService.getUpcomingAnniversaries(req.user.branchId);
  }

  @Get('by-number/:employeeNumber')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get employee by employee number' })
  @ApiParam({ name: 'employeeNumber', description: 'Employee number/code' })
  async findByEmployeeNumber(
    @Param('employeeNumber') employeeNumber: string,
  ) {
    return this.employeesService.findByEmployeeNumber(employeeNumber);
  }

  @Get(':id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get employee by ID with full details' })
  @ApiParam({ name: 'id', description: 'Employee UUID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.employeesService.findOne(id);
  }

  @Put(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update employee' })
  @ApiResponse({ status: 200, description: 'Employee updated' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.employeesService.update(id, dto, req.user.userId);
  }

  @Patch(':id/supervisor')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Assign supervisor to employee' })
  async assignSupervisor(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignSupervisorDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.employeesService.assignSupervisor(id, dto, req.user.userId);
  }

  @Post(':id/transfer')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Transfer employee to new department/branch' })
  async transfer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferEmployeeDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.employeesService.transfer(id, dto, req.user.userId);
  }

  @Post(':id/terminate')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminate employee' })
  async terminate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: { terminationDate: string; terminationReason: string },
    @Request() req: { user: { userId: string } },
  ) {
    return this.employeesService.terminate(id, dto, req.user.userId);
  }

  @Get(':id/subordinates')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get subordinates of an employee' })
  async getSubordinates(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.employeesService.getSubordinates(id);
  }

  @Delete(':id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete employee' })
  @ApiResponse({ status: 200, description: 'Employee deleted' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.employeesService.remove(id, req.user.userId);
  }

  @Post('bulk-status-update')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Bulk update employee status' })
  async bulkUpdateStatus(
    @Body() dto: { ids: string[]; status: EmployeeStatus },
    @Request() req: { user: { userId: string } },
  ) {
    return this.employeesService.bulkUpdateStatus(
      dto.ids,
      dto.status,
      req.user.userId,
    );
  }
}
