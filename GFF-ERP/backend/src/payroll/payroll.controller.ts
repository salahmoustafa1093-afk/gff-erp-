import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import {
  CreatePayrollPeriodDto,
  UpdatePayrollPeriodDto,
} from './dto/create-payroll-period.dto';
import {
  ProcessPayrollDto,
  ProcessEmployeePayrollDto,
  PayslipFilterDto,
  PaymentRecordDto,
} from './dto/process-payroll.dto';
import {
  PayrollPeriodFilterDto,
  PayrollEntryFilterDto,
} from './dto/payroll-filter.dto';
import {
  AddBonusDto,
  AddBulkBonusDto,
  UpdateBonusDto,
} from './dto/add-bonus.dto';
import {
  AddDeductionDto,
  AddBulkDeductionDto,
  UpdateDeductionDto,
} from './dto/add-deduction.dto';
import { PayrollReportFilterDto } from './dto/payroll-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ==================== PAYROLL PERIODS ====================

  @Post('periods')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create payroll period' })
  @ApiResponse({ status: 201, description: 'Payroll period created' })
  async createPeriod(
    @Body() dto: CreatePayrollPeriodDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.createPeriod(dto, req.user.userId);
  }

  @Get('periods')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get all payroll periods' })
  async findAllPeriods(
    @Query() filter: PayrollPeriodFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.payrollService.findAllPeriods(filter);
  }

  @Get('periods/:id')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get payroll period by ID with entries' })
  @ApiParam({ name: 'id', description: 'Payroll period UUID' })
  async findPeriodById(
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.payrollService.findPeriodById(id);
  }

  @Put('periods/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update payroll period' })
  async updatePeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePayrollPeriodDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.updatePeriod(id, dto, req.user.userId);
  }

  @Delete('periods/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Delete payroll period' })
  async deletePeriod(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.deletePeriod(id, req.user.userId);
  }

  // ==================== PAYROLL PROCESSING ====================

  @Post('process')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payroll for a period' })
  @ApiResponse({ status: 200, description: 'Payroll processed' })
  async processPayroll(
    @Body() dto: ProcessPayrollDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.processPayroll(dto, req.user.userId);
  }

  @Post('process/employee')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payroll for single employee' })
  async processEmployeePayroll(
    @Body() dto: ProcessEmployeePayrollDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.processEmployeePayroll(dto, req.user.userId);
  }

  @Post('reverse/:periodId')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse entire payroll period' })
  async reversePayroll(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.reversePayroll(periodId, req.user.userId);
  }

  @Post('reverse-entry/:entryId')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reverse single payroll entry' })
  async reverseEmployeePayroll(
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.reverseEmployeePayroll(entryId, req.user.userId);
  }

  @Post('close/:periodId')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close payroll period' })
  async closePayroll(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.closePayroll(periodId, req.user.userId);
  }

  // ==================== PAYROLL ENTRIES ====================

  @Get('entries')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get payroll entries' })
  async findEntries(
    @Query() filter: PayrollEntryFilterDto,
    @Request() req: { user: { branchId?: string } },
  ) {
    if (req.user.branchId) {
      filter.branchId = req.user.branchId;
    }
    return this.payrollService.findEntries(filter);
  }

  // ==================== BONUSES ====================

  @Post('bonuses')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add bonus to payroll entry' })
  async addBonus(
    @Body() dto: AddBonusDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.addBonus(dto, req.user.userId);
  }

  @Post('bonuses/bulk')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add bonus to multiple employees' })
  async addBulkBonus(
    @Body() dto: AddBulkBonusDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.addBulkBonus(dto, req.user.userId);
  }

  @Put('bonuses/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update bonus' })
  async updateBonus(
    @Param('id', ParseUUIDPipe) bonusId: string,
    @Body() dto: UpdateBonusDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.updateBonus(bonusId, dto, req.user.userId);
  }

  @Delete('bonuses/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Remove bonus' })
  async removeBonus(
    @Param('id', ParseUUIDPipe) bonusId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.removeBonus(bonusId, req.user.userId);
  }

  // ==================== DEDUCTIONS ====================

  @Post('deductions')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Add deduction to payroll entry' })
  async addDeduction(
    @Body() dto: AddDeductionDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.addDeduction(dto, req.user.userId);
  }

  @Post('deductions/bulk')
  @Roles('HR_ADMIN', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add deduction to multiple employees' })
  async addBulkDeduction(
    @Body() dto: AddBulkDeductionDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.addBulkDeduction(dto, req.user.userId);
  }

  @Put('deductions/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update deduction' })
  async updateDeduction(
    @Param('id', ParseUUIDPipe) deductionId: string,
    @Body() dto: UpdateDeductionDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.updateDeduction(deductionId, dto, req.user.userId);
  }

  @Delete('deductions/:id')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Remove deduction' })
  async removeDeduction(
    @Param('id', ParseUUIDPipe) deductionId: string,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.removeDeduction(deductionId, req.user.userId);
  }

  // ==================== PAYSLIPS ====================

  @Get('payslips')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get payslips' })
  async getPayslips(@Query() filter: PayslipFilterDto) {
    return this.payrollService.getPayslips(filter);
  }

  @Get('payslips/:entryId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER', 'HR_USER')
  @ApiOperation({ summary: 'Get detailed payslip' })
  @ApiParam({ name: 'entryId', description: 'Payroll entry UUID' })
  async getPayslip(
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ) {
    return this.payrollService.getPayslip(entryId);
  }

  // ==================== PAYMENTS ====================

  @Post('payments')
  @Roles('HR_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Record payment for payroll entry' })
  async recordPayment(
    @Body() dto: PaymentRecordDto,
    @Request() req: { user: { userId: string } },
  ) {
    return this.payrollService.recordPayment(dto, req.user.userId);
  }

  @Get('payments/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get payment list for period' })
  async getPaymentList(
    @Param('periodId', ParseUUIDPipe) periodId: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    return this.payrollService.getPaymentList(
      periodId,
      paymentMethod as any,
    );
  }

  // ==================== REPORTS ====================

  @Get('reports/summary/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get payroll summary report' })
  async getPayrollSummary(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.payrollService.getPayrollSummary(periodId);
  }

  @Get('reports/department/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get department-wise payroll report' })
  async getDepartmentPayroll(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.payrollService.getDepartmentPayroll(periodId);
  }

  @Get('reports/salary-distribution/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get salary distribution report' })
  async getSalaryDistribution(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.payrollService.getSalaryDistribution(periodId);
  }

  @Get('reports/deductions/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get deductions summary report' })
  async getDeductionsSummary(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.payrollService.getDeductionsSummary(periodId);
  }

  @Get('reports/tax/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get tax report' })
  async getTaxReport(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.payrollService.getTaxReport(periodId);
  }

  @Get('reports/social-insurance/:periodId')
  @Roles('HR_ADMIN', 'ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Get social insurance report' })
  async getSocialInsuranceReport(
    @Param('periodId', ParseUUIDPipe) periodId: string,
  ) {
    return this.payrollService.getSocialInsuranceReport(periodId);
  }
}
