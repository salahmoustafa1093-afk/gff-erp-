import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PayrollReportFilterDto {
  @ApiPropertyOptional({ description: 'Payroll period ID' })
  @IsOptional()
  @IsUUID()
  periodId?: string;

  @ApiPropertyOptional({ description: 'Department ID' })
  @IsOptional()
  @IsUUID()
  departmentId?: string;

  @ApiPropertyOptional({ description: 'Branch ID' })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiPropertyOptional({ description: 'Year' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  year?: number;

  @ApiPropertyOptional({ description: 'Month (1-12)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  month?: number;
}

export class SalaryDistributionDto {
  @ApiProperty({ description: 'Salary range' })
  range: string;

  @ApiProperty({ description: 'Number of employees in range' })
  count: number;

  @ApiProperty({ description: 'Total salary in range' })
  totalAmount: number;
}

export class DepartmentPayrollSummaryDto {
  @ApiProperty({ description: 'Department ID' })
  departmentId: string;

  @ApiProperty({ description: 'Department name' })
  departmentName: string;

  @ApiProperty({ description: 'Number of employees' })
  employeeCount: number;

  @ApiProperty({ description: 'Total basic salary' })
  totalBasicSalary: number;

  @ApiProperty({ description: 'Total allowances' })
  totalAllowances: number;

  @ApiProperty({ description: 'Total overtime' })
  totalOvertime: number;

  @ApiProperty({ description: 'Total bonuses' })
  totalBonuses: number;

  @ApiProperty({ description: 'Total gross salary' })
  totalGrossSalary: number;

  @ApiProperty({ description: 'Total deductions' })
  totalDeductions: number;

  @ApiProperty({ description: 'Total net salary' })
  totalNetSalary: number;
}

export class TaxReportEntryDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Tax ID' })
  taxId?: string;

  @ApiProperty({ description: 'Gross salary' })
  grossSalary: number;

  @ApiProperty({ description: 'Taxable income' })
  taxableIncome: number;

  @ApiProperty({ description: 'Tax amount' })
  taxAmount: number;

  @ApiProperty({ description: 'Tax bracket' })
  taxBracket?: string;
}

export class SocialInsuranceReportEntryDto {
  @ApiProperty({ description: 'Employee ID' })
  employeeId: string;

  @ApiProperty({ description: 'Employee number' })
  employeeNumber: string;

  @ApiProperty({ description: 'Employee name' })
  employeeName: string;

  @ApiProperty({ description: 'Insurance number' })
  insuranceNumber?: string;

  @ApiProperty({ description: 'Basic salary' })
  basicSalary: number;

  @ApiProperty({ description: 'Employee contribution' })
  employeeContribution: number;

  @ApiProperty({ description: 'Employer contribution' })
  employerContribution: number;

  @ApiProperty({ description: 'Total contribution' })
  totalContribution: number;
}

export class PayrollSummaryDto {
  @ApiProperty({ description: 'Payroll period ID' })
  periodId: string;

  @ApiProperty({ description: 'Period name' })
  periodName: string;

  @ApiProperty({ description: 'Total employees' })
  totalEmployees: number;

  @ApiProperty({ description: 'Total basic salary' })
  totalBasicSalary: number;

  @ApiProperty({ description: 'Total allowances' })
  totalAllowances: number;

  @ApiProperty({ description: 'Total overtime pay' })
  totalOvertime: number;

  @ApiProperty({ description: 'Total bonuses' })
  totalBonuses: number;

  @ApiProperty({ description: 'Total gross salary' })
  totalGrossSalary: number;

  @ApiProperty({ description: 'Total loan deductions' })
  totalLoanDeductions: number;

  @ApiProperty({ description: 'Total social insurance' })
  totalSocialInsurance: number;

  @ApiProperty({ description: 'Total tax' })
  totalTax: number;

  @ApiProperty({ description: 'Total other deductions' })
  totalOtherDeductions: number;

  @ApiProperty({ description: 'Total net salary' })
  totalNetSalary: number;
}
