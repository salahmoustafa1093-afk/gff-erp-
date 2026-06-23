import { Module } from '@nestjs/common';
import { HrController } from './hr.controller';
import { HrService } from './hr.service';
import { EmployeesModule } from '../employees/employees.module';
import { AttendanceModule } from '../attendance/attendance.module';
import { PayrollModule } from '../payroll/payroll.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    AuditModule,
    EmployeesModule,
    AttendanceModule,
    PayrollModule,
  ],
  controllers: [HrController],
  providers: [HrService],
  exports: [HrService, EmployeesModule, AttendanceModule, PayrollModule],
})
export class HrModule {}
