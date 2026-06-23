import { Injectable, Logger, Inject } from '@nestjs/common';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger as WinstonLogger } from 'winston';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CostCentersService {
  private readonly logger = new Logger(CostCentersService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly winstonLogger: WinstonLogger,
  ) {}
}
