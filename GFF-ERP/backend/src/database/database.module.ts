import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrismaService } from '../../prisma/prisma.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class DatabaseModule {}
