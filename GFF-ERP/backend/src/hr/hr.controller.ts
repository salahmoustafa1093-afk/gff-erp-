import {
  Controller,
  Get,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { HrService } from './hr.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('HR Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Get('dashboard')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get HR dashboard statistics' })
  @ApiResponse({ status: 200, description: 'HR dashboard data' })
  async getDashboardStats(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.hrService.getDashboardStats(req.user.branchId);
  }

  @Get('kpis')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get HR KPIs' })
  @ApiResponse({ status: 200, description: 'HR KPIs' })
  async getHrKpis(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.hrService.getHrKpis(req.user.branchId);
  }

  @Get('leave-balance-summary')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get leave balance summary for all employees' })
  @ApiResponse({ status: 200, description: 'Leave balance summary' })
  async getLeaveBalanceSummary(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.hrService.getLeaveBalanceSummary(req.user.branchId);
  }

  @Get('upcoming-birthdays')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get upcoming birthdays (next 30 days)' })
  @ApiResponse({ status: 200, description: 'Upcoming birthdays' })
  async getUpcomingBirthdays(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.hrService.getUpcomingBirthdays(req.user.branchId);
  }

  @Get('upcoming-anniversaries')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get upcoming work anniversaries (next 30 days)' })
  @ApiResponse({ status: 200, description: 'Upcoming anniversaries' })
  async getUpcomingAnniversaries(
    @Request() req: { user: { branchId?: string } },
  ) {
    return this.hrService.getUpcomingAnniversaries(req.user.branchId);
  }

  @Get('employee-overview/:employeeId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get comprehensive employee overview' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  async getEmployeeOverview(
    @Param('employeeId') employeeId: string,
  ) {
    return this.hrService.getEmployeeOverview(employeeId);
  }
}
