import { Module } from '@nestjs/common';
import { PurchaseReturnsService } from './purchase-returns.service';
import { PurchaseReturnsController } from './purchase-returns.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [PurchaseReturnsController],
  providers: [PurchaseReturnsService],
  exports: [PurchaseReturnsService],
})
export class PurchaseReturnsModule {}
