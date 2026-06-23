import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import {
  Account,
  AccountBalance,
  AccountTreeNode,
  AccountStatus,
  AccountType,
} from './interfaces/account.interface';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

@Injectable()
export class ChartOfAccountsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateAccountDto, userId: string): Promise<Account> {
    const existing = await this.prisma.account.findUnique({
      where: { code_branchId: { code: dto.code, branchId: dto.branchId } },
    });
    if (existing) {
      throw new ConflictException(
        `Account with code ${dto.code} already exists in this branch`,
      );
    }

    let level = 1;
    let path = dto.code;

    if (dto.parentId) {
      const parent = await this.prisma.account.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException(`Parent account ${dto.parentId} not found`);
      }
      level = parent.level + 1;
      path = `${parent.path}.${dto.code}`;
    }

    const account = await this.prisma.account.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameAr: dto.nameAr || null,
        accountType: dto.accountType,
        accountSubType: dto.accountSubType,
        normalBalance: dto.normalBalance,
        parentId: dto.parentId || null,
        isSystem: dto.isSystem ?? false,
        isBankAccount: dto.isBankAccount ?? false,
        isCashAccount: dto.isCashAccount ?? false,
        description: dto.description || null,
        openingBalance: dto.openingBalance
          ? new Prisma.Decimal(dto.openingBalance.toString())
          : new Prisma.Decimal(0),
        currentBalance: dto.openingBalance
          ? new Prisma.Decimal(dto.openingBalance.toString())
          : new Prisma.Decimal(0),
        branchId: dto.branchId,
        status: AccountStatus.ACTIVE,
        level,
        path,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.auditService.log({
      action: 'ACCOUNT_CREATE',
      entity: 'Account',
      entityId: account.id,
      userId,
      branchId: dto.branchId,
      details: { code: dto.code, name: dto.name, type: dto.accountType },
    });

    return this.mapToAccountInterface(account);
  }

  async findAll(branchId?: string): Promise<Account[]> {
    const where: Prisma.AccountWhereInput = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });

    return accounts.map((a) => this.mapToAccountInterface(a));
  }

  async findOne(id: string, branchId?: string): Promise<Account> {
    const where: Prisma.AccountWhereUniqueInput = { id };
    const account = await this.prisma.account.findUnique({ where });
    if (!account) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }
    if (branchId && account.branchId !== branchId) {
      throw new ForbiddenException('Account does not belong to this branch');
    }
    return this.mapToAccountInterface(account);
  }

  async findByCode(code: string, branchId: string): Promise<Account> {
    const account = await this.prisma.account.findUnique({
      where: { code_branchId: { code, branchId } },
    });
    if (!account) {
      throw new NotFoundException(
        `Account with code ${code} not found in branch ${branchId}`,
      );
    }
    return this.mapToAccountInterface(account);
  }

  async update(
    id: string,
    dto: UpdateAccountDto,
    userId: string,
  ): Promise<Account> {
    const existing = await this.prisma.account.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    if (existing.isSystem) {
      throw new ForbiddenException('Cannot modify system accounts');
    }

    const data: Prisma.AccountUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr || null;
    if (dto.accountType !== undefined) data.accountType = dto.accountType;
    if (dto.accountSubType !== undefined) data.accountSubType = dto.accountSubType;
    if (dto.normalBalance !== undefined) data.normalBalance = dto.normalBalance;
    if (dto.isBankAccount !== undefined) data.isBankAccount = dto.isBankAccount;
    if (dto.isCashAccount !== undefined) data.isCashAccount = dto.isCashAccount;
    if (dto.description !== undefined) data.description = dto.description || null;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.openingBalance !== undefined) {
      const newOpening = new Prisma.Decimal(dto.openingBalance.toString());
      const balanceDiff = newOpening.minus(existing.openingBalance);
      data.openingBalance = newOpening;
      data.currentBalance = existing.currentBalance.plus(balanceDiff);
    }

    if (dto.parentId !== undefined) {
      if (dto.parentId === id) {
        throw new BadRequestException('Account cannot be its own parent');
      }
      if (dto.parentId) {
        const parent = await this.prisma.account.findUnique({
          where: { id: dto.parentId },
        });
        if (!parent) {
          throw new NotFoundException(`Parent account ${dto.parentId} not found`);
        }
        data.parentId = dto.parentId;
        data.level = parent.level + 1;
        data.path = `${parent.path}.${existing.code}`;
      } else {
        data.parentId = null;
        data.level = 1;
        data.path = existing.code;
      }
    }

    data.updatedBy = userId;

    const updated = await this.prisma.account.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      action: 'ACCOUNT_UPDATE',
      entity: 'Account',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: dto,
    });

    return this.mapToAccountInterface(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.account.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Account with ID ${id} not found`);
    }

    if (existing.isSystem) {
      throw new ForbiddenException('Cannot delete system accounts');
    }

    const childrenCount = await this.prisma.account.count({
      where: { parentId: id },
    });
    if (childrenCount > 0) {
      throw new BadRequestException(
        'Cannot delete account with child accounts',
      );
    }

    const journalLinesCount = await this.prisma.journalEntryLine.count({
      where: { accountId: id },
    });
    if (journalLinesCount > 0) {
      throw new BadRequestException(
        'Cannot delete account with journal entries',
      );
    }

    await this.prisma.account.delete({ where: { id } });

    await this.auditService.log({
      action: 'ACCOUNT_DELETE',
      entity: 'Account',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { code: existing.code, name: existing.name },
    });
  }

  async getTree(branchId?: string, accountType?: AccountType): Promise<AccountTreeNode[]> {
    const where: Prisma.AccountWhereInput = {};
    if (branchId) where.branchId = branchId;
    if (accountType) where.accountType = accountType;

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });

    const accountMap = new Map<string, AccountTreeNode>();
    const roots: AccountTreeNode[] = [];

    for (const acc of accounts) {
      const node: AccountTreeNode = {
        id: acc.id,
        code: acc.code,
        name: acc.name,
        accountType: acc.accountType as AccountType,
        normalBalance: acc.normalBalance as 'DEBIT' | 'CREDIT',
        level: acc.level,
        path: acc.path,
        currentBalance: new Decimal(acc.currentBalance.toString()),
        children: [],
      };
      accountMap.set(acc.id, node);
    }

    for (const acc of accounts) {
      const node = accountMap.get(acc.id)!;
      if (acc.parentId && accountMap.has(acc.parentId)) {
        const parent = accountMap.get(acc.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async getAccountBalance(accountId: string): Promise<AccountBalance> {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${accountId} not found`);
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId,
        journalEntry: { status: 'POSTED' },
      },
    });

    let periodDebits = new Decimal(0);
    let periodCredits = new Decimal(0);

    for (const line of lines) {
      periodDebits = periodDebits.plus(line.debit.toString());
      periodCredits = periodCredits.plus(line.credit.toString());
    }

    const openingBalance = new Decimal(account.openingBalance.toString());
    const netChange = periodDebits.minus(periodCredits);
    const endingBalance =
      account.normalBalance === 'DEBIT'
        ? openingBalance.plus(netChange)
        : openingBalance.minus(netChange);

    return {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType as AccountType,
      normalBalance: account.normalBalance as 'DEBIT' | 'CREDIT',
      openingBalance,
      periodDebits,
      periodCredits,
      endingBalance,
    };
  }

  async searchAccounts(query: string, branchId?: string, limit = 20): Promise<Account[]> {
    const where: Prisma.AccountWhereInput = {
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    };
    if (branchId) {
      where.branchId = branchId;
    }

    const accounts = await this.prisma.account.findMany({
      where,
      take: limit,
      orderBy: [{ code: 'asc' }],
    });

    return accounts.map((a) => this.mapToAccountInterface(a));
  }

  async exportCoa(branchId?: string): Promise<Record<string, unknown>[]> {
    const where: Prisma.AccountWhereInput = {};
    if (branchId) where.branchId = branchId;

    const accounts = await this.prisma.account.findMany({
      where,
      orderBy: [{ code: 'asc' }],
      select: {
        code: true,
        name: true,
        nameAr: true,
        accountType: true,
        accountSubType: true,
        normalBalance: true,
        openingBalance: true,
        currentBalance: true,
        status: true,
        level: true,
        description: true,
      },
    });

    return accounts.map((a) => ({
      code: a.code,
      name: a.name,
      nameAr: a.nameAr,
      accountType: a.accountType,
      accountSubType: a.accountSubType,
      normalBalance: a.normalBalance,
      openingBalance: a.openingBalance.toString(),
      currentBalance: a.currentBalance.toString(),
      status: a.status,
      level: a.level,
      description: a.description,
    }));
  }

  private mapToAccountInterface(account: {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
    accountType: string;
    accountSubType: string;
    normalBalance: string;
    parentId: string | null;
    isSystem: boolean;
    isBankAccount: boolean;
    isCashAccount: boolean;
    description: string | null;
    openingBalance: Prisma.Decimal;
    currentBalance: Prisma.Decimal;
    branchId: string;
    status: string;
    level: number;
    path: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }): Account {
    return {
      id: account.id,
      code: account.code,
      name: account.name,
      nameAr: account.nameAr,
      accountType: account.accountType as AccountType,
      accountSubType: account.accountSubType as Account['accountSubType'],
      normalBalance: account.normalBalance as NormalBalance,
      parentId: account.parentId,
      isSystem: account.isSystem,
      isBankAccount: account.isBankAccount,
      isCashAccount: account.isCashAccount,
      description: account.description,
      openingBalance: new Decimal(account.openingBalance.toString()),
      currentBalance: new Decimal(account.currentBalance.toString()),
      branchId: account.branchId,
      status: account.status as AccountStatus,
      level: account.level,
      path: account.path,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
      createdBy: account.createdBy,
      updatedBy: account.updatedBy,
    };
  }
}
