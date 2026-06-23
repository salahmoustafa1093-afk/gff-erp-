import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import {
  BankAccount,
  BankAccountStatus,
  BankTransaction,
  BankTransactionType,
  BankReconciliation,
  ReconciliationStatus,
  BankStatementLine,
} from './interfaces/bank.interface';
import { CreateBankDto } from './dto/create-bank.dto';
import { UpdateBankDto } from './dto/update-bank.dto';
import { BankTransactionDto } from './dto/bank-transaction.dto';
import { ReconcileDto } from './dto/reconcile.dto';
import { JournalSource, JournalEntryType } from '../journal-entries/interfaces/journal-entry.interface';

@Injectable()
export class BanksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly journalService: JournalEntriesService,
  ) {}

  async create(dto: CreateBankDto, userId: string): Promise<BankAccount> {
    const existing = await this.prisma.bankAccount.findFirst({
      where: {
        accountNumber: dto.accountNumber,
        branchId: dto.branchId,
      },
    });
    if (existing) {
      throw new ConflictException(
        `Bank account with number ${dto.accountNumber} already exists in this branch`,
      );
    }

    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    const ba = await this.prisma.bankAccount.create({
      data: {
        bankName: dto.bankName,
        bankNameAr: dto.bankNameAr || null,
        accountNumber: dto.accountNumber,
        accountName: dto.accountName,
        branchName: dto.branchName || null,
        branchId: dto.branchId,
        accountId: dto.accountId,
        currency: dto.currency || 'USD',
        currentBalance: new Prisma.Decimal(
          dto.openingBalance ? dto.openingBalance.toString() : 0,
        ),
        openingBalance: new Prisma.Decimal(
          dto.openingBalance ? dto.openingBalance.toString() : 0,
        ),
        swiftCode: dto.swiftCode || null,
        iban: dto.iban || null,
        status: BankAccountStatus.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.auditService.log({
      action: 'BANK_ACCOUNT_CREATE',
      entity: 'BankAccount',
      entityId: ba.id,
      userId,
      branchId: dto.branchId,
      details: { bankName: dto.bankName, accountNumber: dto.accountNumber },
    });

    return this.mapToInterface(ba);
  }

  async findAll(branchId?: string): Promise<BankAccount[]> {
    const where: Prisma.BankAccountWhereInput = {};
    if (branchId) where.branchId = branchId;

    const accounts = await this.prisma.bankAccount.findMany({
      where,
      orderBy: [{ bankName: 'asc' }],
    });

    return accounts.map((a) => this.mapToInterface(a));
  }

  async findOne(id: string, branchId?: string): Promise<BankAccount> {
    const ba = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!ba) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }
    if (branchId && ba.branchId !== branchId) {
      throw new ForbiddenException('Bank account does not belong to this branch');
    }
    return this.mapToInterface(ba);
  }

  async update(
    id: string,
    dto: UpdateBankDto,
    userId: string,
  ): Promise<BankAccount> {
    const existing = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    const data: Prisma.BankAccountUpdateInput = {};

    if (dto.bankName !== undefined) data.bankName = dto.bankName;
    if (dto.bankNameAr !== undefined) data.bankNameAr = dto.bankNameAr || null;
    if (dto.accountName !== undefined) data.accountName = dto.accountName;
    if (dto.branchName !== undefined) data.branchName = dto.branchName || null;
    if (dto.accountId !== undefined) data.accountId = dto.accountId;
    if (dto.currency !== undefined) data.currency = dto.currency;
    if (dto.swiftCode !== undefined) data.swiftCode = dto.swiftCode || null;
    if (dto.iban !== undefined) data.iban = dto.iban || null;
    if (dto.status !== undefined) data.status = dto.status;

    if (dto.openingBalance !== undefined) {
      const newOpening = new Prisma.Decimal(dto.openingBalance.toString());
      const diff = newOpening.minus(existing.openingBalance);
      data.openingBalance = newOpening;
      data.currentBalance = existing.currentBalance.plus(diff);
    }

    data.updatedBy = userId;

    const updated = await this.prisma.bankAccount.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      action: 'BANK_ACCOUNT_UPDATE',
      entity: 'BankAccount',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: dto,
    });

    return this.mapToInterface(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.bankAccount.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Bank account ${id} not found`);
    }

    const txCount = await this.prisma.bankTransaction.count({
      where: { bankAccountId: id },
    });
    if (txCount > 0) {
      throw new BadRequestException(
        'Cannot delete bank account with transactions',
      );
    }

    await this.prisma.bankAccount.delete({ where: { id } });

    await this.auditService.log({
      action: 'BANK_ACCOUNT_DELETE',
      entity: 'BankAccount',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { bankName: existing.bankName, accountNumber: existing.accountNumber },
    });
  }

  async createTransaction(
    dto: BankTransactionDto,
    userId: string,
  ): Promise<{ transaction: BankTransaction; journalEntryId: string }> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }

    if (bankAccount.status !== BankAccountStatus.ACTIVE) {
      throw new ForbiddenException('Bank account is not active');
    }

    const amount = new Decimal(dto.amount.toString());

    if (
      dto.transactionType === BankTransactionType.WITHDRAWAL ||
      dto.transactionType === BankTransactionType.TRANSFER_OUT ||
      dto.transactionType === BankTransactionType.CHECK_ISSUED ||
      dto.transactionType === BankTransactionType.BANK_CHARGE
    ) {
      const currentBalance = new Decimal(bankAccount.currentBalance.toString());
      if (currentBalance.lessThan(amount)) {
        throw new BadRequestException(
          `Insufficient bank balance. Available: ${currentBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
        );
      }
    }

    let bankBalanceChange = new Decimal(0);
    const debitLines: { accountId: string; debit: number; credit: number; description?: string; costCenterId?: string }[] = [];

    switch (dto.transactionType) {
      case BankTransactionType.DEPOSIT:
      case BankTransactionType.TRANSFER_IN:
      case BankTransactionType.CHECK_DEPOSIT:
      case BankTransactionType.INTEREST:
        bankBalanceChange = amount;
        break;
      case BankTransactionType.WITHDRAWAL:
      case BankTransactionType.TRANSFER_OUT:
      case BankTransactionType.CHECK_ISSUED:
      case BankTransactionType.BANK_CHARGE:
        bankBalanceChange = amount.negated();
        break;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.bankTransaction.create({
        data: {
          bankAccountId: dto.bankAccountId,
          transactionType: dto.transactionType,
          amount: new Prisma.Decimal(amount.toString()),
          description: dto.description,
          reference: dto.reference || null,
          counterpartyName: dto.counterpartyName || null,
          counterpartyAccount: dto.counterpartyAccount || null,
          checkNumber: dto.checkNumber || null,
          journalEntryId: null,
          reconciled: false,
          statementDate: dto.date || null,
          createdBy: userId,
        },
      });

      await tx.bankAccount.update({
        where: { id: dto.bankAccountId },
        data: {
          currentBalance: {
            increment: bankBalanceChange.toNumber(),
          },
        },
      });

      return transaction;
    });

    const isIncoming =
      dto.transactionType === BankTransactionType.DEPOSIT ||
      dto.transactionType === BankTransactionType.TRANSFER_IN ||
      dto.transactionType === BankTransactionType.CHECK_DEPOSIT ||
      dto.transactionType === BankTransactionType.INTEREST;

    const je = await this.journalService.createAutoJournal({
      date: dto.date || new Date(),
      description: `${dto.transactionType}: ${dto.description}`,
      reference: dto.reference,
      source: JournalSource.BANK_TRANSACTION,
      entryType: JournalEntryType.AUTOMATIC,
      branchId: bankAccount.branchId,
      lines: [
        {
          accountId: dto.debitAccountId,
          debit: isIncoming ? amount.toNumber() : 0,
          credit: !isIncoming ? amount.toNumber() : 0,
          description: dto.description,
          costCenterId: dto.costCenterId,
        },
        {
          accountId: dto.creditAccountId,
          debit: !isIncoming ? amount.toNumber() : 0,
          credit: isIncoming ? amount.toNumber() : 0,
          description: dto.description,
          costCenterId: dto.costCenterId,
        },
      ],
      createdBy: userId,
    });

    await this.prisma.bankTransaction.update({
      where: { id: result.id },
      data: { journalEntryId: je.id },
    });

    await this.auditService.log({
      action: 'BANK_TRANSACTION_CREATE',
      entity: 'BankTransaction',
      entityId: result.id,
      userId,
      branchId: bankAccount.branchId,
      details: {
        type: dto.transactionType,
        amount: amount.toNumber(),
        bankAccountId: dto.bankAccountId,
      },
    });

    return {
      transaction: this.mapTxToInterface(result),
      journalEntryId: je.id,
    };
  }

  async getTransactions(
    bankAccountId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<BankTransaction[]> {
    const where: Prisma.BankTransactionWhereInput = { bankAccountId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const txs = await this.prisma.bankTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return txs.map((t) => this.mapTxToInterface(t));
  }

  async getUnreconciledTransactions(bankAccountId: string): Promise<BankTransaction[]> {
    const txs = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId,
        reconciled: false,
      },
      orderBy: { createdAt: 'desc' },
    });

    return txs.map((t) => this.mapTxToInterface(t));
  }

  async reconcile(dto: ReconcileDto, userId: string): Promise<BankReconciliation> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }

    const statementBalance = new Decimal(dto.statementBalance.toString());
    const bookBalance = new Decimal(bankAccount.currentBalance.toString());
    const difference = statementBalance.minus(bookBalance);

    const unreconciledTxs = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId: dto.bankAccountId,
        reconciled: false,
      },
    });

    const unreconciledIds = unreconciledTxs.map((t) => t.id);

    const reconciledTxs = await this.prisma.bankTransaction.findMany({
      where: {
        id: { in: dto.reconciledTransactionIds },
        bankAccountId: dto.bankAccountId,
      },
    });

    if (reconciledTxs.length !== dto.reconciledTransactionIds.length) {
      throw new BadRequestException('Some transaction IDs are invalid');
    }

    let status = ReconciliationStatus.RECONCILED;
    if (!difference.isZero()) {
      status = unreconciledIds.length > 0
        ? ReconciliationStatus.PARTIAL
        : ReconciliationStatus.UNRECONCILED;
    } else if (unreconciledIds.length > 0) {
      status = ReconciliationStatus.PARTIAL;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.bankTransaction.updateMany({
        where: {
          id: { in: dto.reconciledTransactionIds },
        },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          statementDate: dto.statementDate,
        },
      });

      return tx.bankReconciliation.create({
        data: {
          bankAccountId: dto.bankAccountId,
          statementDate: dto.statementDate,
          statementBalance: new Prisma.Decimal(statementBalance.toString()),
          bookBalance: new Prisma.Decimal(bookBalance.toString()),
          difference: new Prisma.Decimal(difference.toString()),
          status,
          reconciledTransactions: dto.reconciledTransactionIds,
          unreconciledTransactions: unreconciledIds,
          notes: dto.notes || null,
          createdBy: userId,
        },
      });
    });

    await this.auditService.log({
      action: 'BANK_RECONCILE',
      entity: 'BankReconciliation',
      entityId: result.id,
      userId,
      branchId: bankAccount.branchId,
      details: {
        bankAccountId: dto.bankAccountId,
        statementBalance: statementBalance.toNumber(),
        bookBalance: bookBalance.toNumber(),
        difference: difference.toNumber(),
        status,
      },
    });

    return {
      id: result.id,
      bankAccountId: result.bankAccountId,
      statementDate: result.statementDate,
      statementBalance: new Decimal(result.statementBalance.toString()),
      bookBalance: new Decimal(result.bookBalance.toString()),
      difference: new Decimal(result.difference.toString()),
      status: result.status as ReconciliationStatus,
      reconciledTransactions: result.reconciledTransactions as string[],
      unreconciledTransactions: result.unreconciledTransactions as string[],
      notes: result.notes,
      createdAt: result.createdAt,
      createdBy: result.createdBy,
    };
  }

  async getStatement(
    bankAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<BankStatementLine[]> {
    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${bankAccountId} not found`);
    }

    const txs = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccountId,
        createdAt: { gte: startDate, lte: endDate },
      },
      orderBy: { createdAt: 'asc' },
    });

    let runningBalance = new Decimal(bankAccount.openingBalance.toString());

    const lines: BankStatementLine[] = [];

    for (const tx of txs) {
      const amount = new Decimal(tx.amount.toString());
      let debit = new Decimal(0);
      let credit = new Decimal(0);

      switch (tx.transactionType) {
        case 'DEPOSIT':
        case 'TRANSFER_IN':
        case 'CHECK_DEPOSIT':
        case 'INTEREST':
          credit = amount;
          runningBalance = runningBalance.plus(amount);
          break;
        default:
          debit = amount;
          runningBalance = runningBalance.minus(amount);
          break;
      }

      lines.push({
        date: tx.createdAt,
        description: tx.description,
        reference: tx.reference || '',
        debit,
        credit,
        balance: new Decimal(runningBalance.toString()),
      });
    }

    return lines;
  }

  async getBalance(bankAccountId: string): Promise<Decimal> {
    const ba = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
      select: { currentBalance: true },
    });
    if (!ba) {
      throw new NotFoundException(`Bank account ${bankAccountId} not found`);
    }
    return new Decimal(ba.currentBalance.toString());
  }

  private mapToInterface(ba: {
    id: string;
    bankName: string;
    bankNameAr: string | null;
    accountNumber: string;
    accountName: string;
    branchName: string | null;
    branchId: string;
    accountId: string;
    currency: string;
    currentBalance: Prisma.Decimal;
    openingBalance: Prisma.Decimal;
    swiftCode: string | null;
    iban: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }): BankAccount {
    return {
      id: ba.id,
      bankName: ba.bankName,
      bankNameAr: ba.bankNameAr,
      accountNumber: ba.accountNumber,
      accountName: ba.accountName,
      branchName: ba.branchName,
      branchId: ba.branchId,
      accountId: ba.accountId,
      currency: ba.currency,
      currentBalance: new Decimal(ba.currentBalance.toString()),
      openingBalance: new Decimal(ba.openingBalance.toString()),
      swiftCode: ba.swiftCode,
      iban: ba.iban,
      status: ba.status as BankAccountStatus,
      createdAt: ba.createdAt,
      updatedAt: ba.updatedAt,
      createdBy: ba.createdBy,
      updatedBy: ba.updatedBy,
    };
  }

  private mapTxToInterface(tx: {
    id: string;
    bankAccountId: string;
    transactionType: string;
    amount: Prisma.Decimal;
    description: string;
    reference: string | null;
    counterpartyName: string | null;
    counterpartyAccount: string | null;
    checkNumber: string | null;
    journalEntryId: string | null;
    reconciled: boolean;
    reconciledAt: Date | null;
    statementDate: Date | null;
    createdAt: Date;
    createdBy: string;
  }): BankTransaction {
    return {
      id: tx.id,
      bankAccountId: tx.bankAccountId,
      transactionType: tx.transactionType as BankTransactionType,
      amount: new Decimal(tx.amount.toString()),
      description: tx.description,
      reference: tx.reference,
      counterpartyName: tx.counterpartyName,
      counterpartyAccount: tx.counterpartyAccount,
      checkNumber: tx.checkNumber,
      journalEntryId: tx.journalEntryId,
      reconciled: tx.reconciled,
      reconciledAt: tx.reconciledAt,
      statementDate: tx.statementDate,
      createdAt: tx.createdAt,
      createdBy: tx.createdBy,
    };
  }
}
