import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query' | 'error'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Prisma Client connected to database');

    this.$on('query', (e: Prisma.QueryEvent) => {
      this.logger.debug(`Query: ${e.query}`);
      this.logger.debug(`Duration: ${e.duration}ms`);
    });

    this.$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(`Prisma Error: ${e.message}`);
    });

    this.$use(this.softDeleteMiddleware);
    this.$use(this.auditLogMiddleware);
    this.$use(this.branchScopeMiddleware);
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Prisma Client disconnected from database');
  }

  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production environment');
    }

    const models = Prisma.dmmf.datamodel.models.map(m => m.name);

    for (const model of models) {
      const lowerModel =
        model.charAt(0).toLowerCase() + model.slice(1);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const delegate = (this as any)[lowerModel];
      if (delegate && typeof delegate.deleteMany === 'function') {
        await delegate.deleteMany({});
      }
    }

    this.logger.log('Database cleaned successfully');
  }

  private softDeleteMiddleware: Prisma.Middleware = async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> => {
    const modelsWithSoftDelete = [
      'User',
      'Role',
      'Permission',
      'Branch',
      'Warehouse',
      'Product',
      'Category',
      'Brand',
      'Customer',
      'Supplier',
      'SalesInvoice',
      'SalesReturn',
      'PurchaseInvoice',
      'PurchaseReturn',
      'JournalEntry',
      'ChartOfAccount',
      'CostCenter',
      'FixedAsset',
      'Employee',
      'Vehicle',
      'Trip',
      'FeedFormula',
      'ProductionOrder',
      'Barn',
      'Flock',
      'EggCollection',
      'Lead',
      'Activity',
      'BankAccount',
      'Cashbox',
      'TreasuryTransaction',
      'Notification',
      'StockMovement',
    ];

    if (!modelsWithSoftDelete.includes(params.model)) {
      return next(params);
    }

    // Intercept findMany to auto-filter deleted records
    if (params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique' || params.action === 'count') {
      if (!params.args) {
        params.args = {};
      }
      if (!params.args.where) {
        params.args.where = {};
      }

      // Only add deletedAt filter if not explicitly requesting deleted records
      if (params.args.where.deletedAt === undefined) {
        params.args.where.deletedAt = null;
      }

      // Handle findUnique by converting to findFirst with proper where
      if (params.action === 'findUnique') {
        params.args = {
          ...params.args,
          where: {
            ...params.args.where,
            deletedAt: params.args.where.deletedAt ?? null,
          },
        };
      }
    }

    // Intercept delete to perform soft delete
    if (params.action === 'delete') {
      params.action = 'update';
      params.args.data = { deletedAt: new Date() };
    }

    // Intercept deleteMany to perform soft delete on many
    if (params.action === 'deleteMany') {
      params.action = 'updateMany';
      if (!params.args.data) {
        params.args.data = { deletedAt: new Date() };
      }
    }

    return next(params);
  };

  private auditLogMiddleware: Prisma.Middleware = async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> => {
    const auditModels = [
      'User',
      'Role',
      'Branch',
      'Product',
      'Customer',
      'Supplier',
      'SalesInvoice',
      'PurchaseInvoice',
      'JournalEntry',
      'Employee',
      'ChartOfAccount',
      'TreasuryTransaction',
      'StockMovement',
      'FeedFormula',
      'ProductionOrder',
    ];

    if (!auditModels.includes(params.model)) {
      return next(params);
    }

    const result = await next(params);

    // Fire and forget audit logging
    if (
      ['create', 'update', 'delete', 'updateMany', 'deleteMany'].some(a =>
        params.action.startsWith(a),
      )
    ) {
      this.logAudit(params, result).catch(err => {
        this.logger.error(`Audit logging failed: ${err.message}`);
      });
    }

    return result;
  };

  private async logAudit(
    params: Prisma.MiddlewareParams,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    result: any,
  ): Promise<void> {
    try {
      const action = this.mapActionToAuditAction(params.action);
      const entityType = params.model;

      // Extract entity ID from result or args
      let entityId: string | undefined;
      if (result && typeof result === 'object') {
        entityId = result.id ?? result.uuid ?? undefined;
      }
      if (!entityId && params.args?.where?.id) {
        entityId = String(params.args.where.id);
      }

      // Store minimal audit info - full audit log creation happens in AuditService
      this.logger.debug(
        `AUDIT: ${action} on ${entityType}${entityId ? ` (ID: ${entityId})` : ''}`,
      );
    } catch {
      // Silently fail audit to not block main operations
    }
  }

  private mapActionToAuditAction(
    prismaAction: string,
  ): 'CREATE' | 'UPDATE' | 'DELETE' | 'BULK_UPDATE' | 'BULK_DELETE' {
    if (prismaAction === 'create' || prismaAction === 'createMany') return 'CREATE';
    if (prismaAction === 'update' || prismaAction === 'upsert') return 'UPDATE';
    if (prismaAction === 'delete') return 'DELETE';
    if (prismaAction === 'updateMany') return 'BULK_UPDATE';
    if (prismaAction === 'deleteMany') return 'BULK_DELETE';
    return 'UPDATE';
  }

  private branchScopeMiddleware: Prisma.Middleware = async (
    params: Prisma.MiddlewareParams,
    next: (params: Prisma.MiddlewareParams) => Promise<unknown>,
  ): Promise<unknown> => {
    const branchScopedModels = [
      'Warehouse',
      'Product',
      'Customer',
      'Supplier',
      'SalesInvoice',
      'SalesReturn',
      'PurchaseInvoice',
      'PurchaseReturn',
      'JournalEntry',
      'Employee',
      'FixedAsset',
      'Vehicle',
      'Trip',
      'FeedFormula',
      'ProductionOrder',
      'Barn',
      'Flock',
      'EggCollection',
      'Lead',
      'Activity',
      'BankAccount',
      'Cashbox',
      'TreasuryTransaction',
      'StockMovement',
      'ChartOfAccount',
      'CostCenter',
    ];

    if (!branchScopedModels.includes(params.model)) {
      return next(params);
    }

    // Apply branch scoping on read operations
    if (
      params.action === 'findMany' ||
      params.action === 'findFirst' ||
      params.action === 'findUnique' ||
      params.action === 'count' ||
      params.action === 'aggregate' ||
      params.action === 'groupBy'
    ) {
      // Branch ID should be set in context by BranchGuard
      const branchId = this.getCurrentBranchId();
      if (branchId && params.args?.where) {
        // Only apply if branchId not already specified
        if (params.args.where.branchId === undefined) {
          params.args.where.branchId = branchId;
        }
      }
    }

    // Auto-set branchId on create
    if (params.action === 'create' || params.action === 'createMany') {
      const branchId = this.getCurrentBranchId();
      if (branchId) {
        if (params.action === 'create' && params.args.data) {
          if (params.args.data.branchId === undefined) {
            params.args.data.branchId = branchId;
          }
        }
        if (params.action === 'createMany' && params.args.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (params.args.data as any[]).forEach((record: Record<string, unknown>) => {
            if (record.branchId === undefined) {
              record.branchId = branchId;
            }
          });
        }
      }
    }

    return next(params);
  };

  private currentBranchId: string | null = null;

  setBranchId(branchId: string | null): void {
    this.currentBranchId = branchId;
  }

  getCurrentBranchId(): string | null {
    return this.currentBranchId;
  }

  clearBranchId(): void {
    this.currentBranchId = null;
  }
}
