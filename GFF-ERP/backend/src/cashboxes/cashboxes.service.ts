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
  Cashbox,
  CashboxStatus,
  CashTransactionType,
  CashTransaction,
  DailyCashReport,
} from './interfaces/cashbox.interface';
import { CreateCashboxDto } from './dto/create-cashbox.dto';
import { UpdateCashboxDto } from './dto/update-cashbox.dto';
import { CashTransactionDto, TransferToBankDto } from './dto/cash-transaction.dto';
import { JournalSource, JournalEntryType } from '../journal-entries/interfaces/journal-entry.interface';

@Injectable()
export class CashboxesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly journalService: JournalEntriesService,
  ) {}

  async create(dto: CreateCashboxDto, userId: string): Promise<Cashbox> {
    const existing = await this.prisma.cashBox.findUnique({
      where: { code_branchId: { code: dto.code, branchId: dto.branchId } },
    });
    if (existing) {
      throw new ConflictException(
        `Cashbox with code ${dto.code} already exists in this branch`,
      );
    }

    const account = await this.prisma.account.findUnique({
      where: { id: dto.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${dto.accountId} not found`);
    }

    const cb = await this.prisma.cashBox.create({
      data: {
        code: dto.code,
        name: dto.name,
        nameAr: dto.nameAr || null,
        branchId: dto.branchId,
        accountId: dto.accountId,
        currentBalance: new Prisma.Decimal(0),
        maxLimit: dto.maxLimit
          ? new Prisma.Decimal(dto.maxLimit.toString())
          : null,
        location: dto.location || null,
        cashierName: dto.cashierName || null,
        status: CashboxStatus.ACTIVE,
        createdBy: userId,
        updatedBy: userId,
      },
    });

    await this.auditService.log({
      action: 'CASHBOX_CREATE',
      entity: 'CashBox',
      entityId: cb.id,
      userId,
      branchId: dto.branchId,
      details: { code: dto.code, name: dto.name, accountId: dto.accountId },
    });

    return this.mapToInterface(cb);
  }

  async findAll(branchId?: string): Promise<Cashbox[]> {
    const where: Prisma.CashBoxWhereInput = {};
    if (branchId) where.branchId = branchId;

    const boxes = await this.prisma.cashBox.findMany({
      where,
      orderBy: [{ code: 'asc' }],
    });

    return boxes.map((b) => this.mapToInterface(b));
  }

  async findOne(id: string, branchId?: string): Promise<Cashbox> {
    const cb = await this.prisma.cashBox.findUnique({ where: { id } });
    if (!cb) {
      throw new NotFoundException(`Cashbox ${id} not found`);
    }
    if (branchId && cb.branchId !== branchId) {
      throw new ForbiddenException('Cashbox does not belong to this branch');
    }
    return this.mapToInterface(cb);
  }

  async update(
    id: string,
    dto: UpdateCashboxDto,
    userId: string,
  ): Promise<Cashbox> {
    const existing = await this.prisma.cashBox.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Cashbox ${id} not found`);
    }

    const data: Prisma.CashBoxUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name;
    if (dto.nameAr !== undefined) data.nameAr = dto.nameAr || null;
    if (dto.accountId !== undefined) data.accountId = dto.accountId;
    if (dto.maxLimit !== undefined) {
      data.maxLimit = dto.maxLimit
        ? new Prisma.Decimal(dto.maxLimit.toString())
        : null;
    }
    if (dto.location !== undefined) data.location = dto.location || null;
    if (dto.cashierName !== undefined) data.cashierName = dto.cashierName || null;
    if (dto.status !== undefined) data.status = dto.status;

    data.updatedBy = userId;

    const updated = await this.prisma.cashBox.update({
      where: { id },
      data,
    });

    await this.auditService.log({
      action: 'CASHBOX_UPDATE',
      entity: 'CashBox',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: dto,
    });

    return this.mapToInterface(updated);
  }

  async remove(id: string, userId: string): Promise<void> {
    const existing = await this.prisma.cashBox.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Cashbox ${id} not found`);
    }

    const txCount = await this.prisma.cashTransaction.count({
      where: { cashboxId: id },
    });
    if (txCount > 0) {
      throw new BadRequestException(
        'Cannot delete cashbox with transactions',
      );
    }

    await this.prisma.cashBox.delete({ where: { id } });

    await this.auditService.log({
      action: 'CASHBOX_DELETE',
      entity: 'CashBox',
      entityId: id,
      userId,
      branchId: existing.branchId,
      details: { code: existing.code, name: existing.name },
    });
  }

  async createTransaction(
    dto: CashTransactionDto,
    userId: string,
  ): Promise<{ transaction: CashTransaction; journalEntryId: string }> {
    const cashbox = await this.prisma.cashBox.findUnique({
      where: { id: dto.cashboxId },
    });
    if (!cashbox) {
      throw new NotFoundException(`Cashbox ${dto.cashboxId} not found`);
    }

    if (cashbox.status !== CashboxStatus.ACTIVE) {
      throw new ForbiddenException('Cashbox is not active');
    }

    const amount = new Decimal(dto.amount.toString());

    if (
      dto.transactionType === CashTransactionType.PAYMENT ||
      dto.transactionType === CashTransactionType.TRANSFER_TO_BANK
    ) {
      const currentBalance = new Decimal(cashbox.currentBalance.toString());
      if (currentBalance.lessThan(amount)) {
        throw new BadRequestException(
          `Insufficient balance. Available: ${currentBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
        );
      }
    }

    let debitAccountId = dto.debitAccountId;
    let creditAccountId = dto.creditAccountId;
    let cashboxBalanceChange = new Decimal(0);

    switch (dto.transactionType) {
      case CashTransactionType.RECEIPT:
        cashboxBalanceChange = amount;
        break;
      case CashTransactionType.PAYMENT:
        cashboxBalanceChange = amount.negated();
        break;
      case CashTransactionType.TRANSFER_TO_BANK:
        cashboxBalanceChange = amount.negated();
        break;
      case CashTransactionType.TRANSFER_FROM_BANK:
        cashboxBalanceChange = amount;
        break;
      case CashTransactionType.ADJUSTMENT:
        cashboxBalanceChange = amount;
        break;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.cashTransaction.create({
        data: {
          cashboxId: dto.cashboxId,
          transactionType: dto.transactionType,
          amount: new Prisma.Decimal(amount.toString()),
          description: dto.description,
          reference: dto.reference || null,
          counterpartyName: dto.counterpartyName || null,
          relatedBankAccountId: dto.relatedBankAccountId || null,
          journalEntryId: null,
          createdBy: userId,
        },
      });

      await tx.cashBox.update({
        where: { id: dto.cashboxId },
        data: {
          currentBalance: {
            increment: cashboxBalanceChange.toNumber(),
          },
        },
      });

      return transaction;
    });

    const je = await this.journalService.createAutoJournal({
      date: dto.date || new Date(),
      description: `${dto.transactionType}: ${dto.description}`,
      reference: dto.reference,
      source: JournalSource.CASH_TRANSACTION,
      entryType: JournalEntryType.AUTOMATIC,
      branchId: cashbox.branchId,
      lines: [
        {
          accountId: debitAccountId,
          debit: dto.transactionType === CashTransactionType.RECEIPT || dto.transactionType === CashTransactionType.TRANSFER_FROM_BANK
            ? amount.toNumber() : 0,
          credit: dto.transactionType === CashTransactionType.PAYMENT || dto.transactionType === CashTransactionType.TRANSFER_TO_BANK
            ? amount.toNumber() : 0,
          description: dto.description,
          costCenterId: dto.costCenterId,
        },
        {
          accountId: creditAccountId,
          debit: dto.transactionType === CashTransactionType.PAYMENT || dto.transactionType === CashTransactionType.TRANSFER_TO_BANK
            ? amount.toNumber() : 0,
          credit: dto.transactionType === CashTransactionType.RECEIPT || dto.transactionType === CashTransactionType.TRANSFER_FROM_BANK
            ? amount.toNumber() : 0,
          description: dto.description,
          costCenterId: dto.costCenterId,
        },
      ],
      createdBy: userId,
    });

    await this.prisma.cashTransaction.update({
      where: { id: result.id },
      data: { journalEntryId: je.id },
    });

    await this.auditService.log({
      action: 'CASH_TRANSACTION_CREATE',
      entity: 'CashTransaction',
      entityId: result.id,
      userId,
      branchId: cashbox.branchId,
      details: {
        type: dto.transactionType,
        amount: amount.toNumber(),
        cashboxId: dto.cashboxId,
      },
    });

    return {
      transaction: this.mapTxToInterface(result),
      journalEntryId: je.id,
    };
  }

  async transferToBank(
    dto: TransferToBankDto,
    userId: string,
  ): Promise<{ transaction: CashTransaction; journalEntryId: string }> {
    const cashbox = await this.prisma.cashBox.findUnique({
      where: { id: dto.cashboxId },
    });
    if (!cashbox) {
      throw new NotFoundException(`Cashbox ${dto.cashboxId} not found`);
    }

    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!bankAccount) {
      throw new NotFoundException(`Bank account ${dto.bankAccountId} not found`);
    }

    const amount = new Decimal(dto.amount.toString());
    const currentBalance = new Decimal(cashbox.currentBalance.toString());
    if (currentBalance.lessThan(amount)) {
      throw new BadRequestException(
        `Insufficient cash balance. Available: ${currentBalance.toFixed(2)}, Requested: ${amount.toFixed(2)}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.cashTransaction.create({
        data: {
          cashboxId: dto.cashboxId,
          transactionType: CashTransactionType.TRANSFER_TO_BANK,
          amount: new Prisma.Decimal(amount.toString()),
          description: dto.description,
          reference: dto.reference || null,
          counterpartyName: bankAccount.bankName || null,
          relatedBankAccountId: dto.bankAccountId,
          journalEntryId: null,
          createdBy: userId,
        },
      });

      await tx.cashBox.update({
        where: { id: dto.cashboxId },
        data: {
          currentBalance: {
            increment: amount.negated().toNumber(),
          },
        },
      });

      return transaction;
    });

    const je = await this.journalService.createAutoJournal({
      date: dto.date || new Date(),
      description: `Cash transfer to bank: ${dto.description}`,
      reference: dto.reference,
      source: JournalSource.CASH_TRANSACTION,
      entryType: JournalEntryType.AUTOMATIC,
      branchId: cashbox.branchId,
      lines: [
        {
          accountId: bankAccount.accountId,
          debit: amount.toNumber(),
          credit: 0,
          description: dto.description,
        },
        {
          accountId: cashbox.accountId,
          debit: 0,
          credit: amount.toNumber(),
          description: dto.description,
        },
      ],
      createdBy: userId,
    });

    await this.prisma.cashTransaction.update({
      where: { id: result.id },
      data: { journalEntryId: je.id },
    });

    await this.auditService.log({
      action: 'CASH_TRANSFER_TO_BANK',
      entity: 'CashTransaction',
      entityId: result.id,
      userId,
      branchId: cashbox.branchId,
      details: {
        amount: amount.toNumber(),
        cashboxId: dto.cashboxId,
        bankAccountId: dto.bankAccountId,
      },
    });

    return {
      transaction: this.mapTxToInterface(result),
      journalEntryId: je.id,
    };
  }

  async getTransactions(
    cashboxId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CashTransaction[]> {
    const where: Prisma.CashTransactionWhereInput = { cashboxId };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const txs = await this.prisma.cashTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return txs.map((t) => this.mapTxToInterface(t));
  }

  async getDailyReport(
    cashboxId: string,
    date: Date,
  ): Promise<DailyCashReport> {
    const cashbox = await this.prisma.cashBox.findUnique({
      where: { id: cashboxId },
    });
    if (!cashbox) {
      throw new NotFoundException(`Cashbox ${cashboxId} not found`);
    }

    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

    const prevTxs = await this.prisma.cashTransaction.findMany({
      where: {
        cashboxId,
        createdAt: { lt: startOfDay },
      },
    });

    let openingBalance = new Decimal(0);
    for (const tx of prevTxs) {
      const amt = new Decimal(tx.amount.toString());
      switch (tx.transactionType) {
        case 'RECEIPT':
        case 'TRANSFER_FROM_BANK':
          openingBalance = openingBalance.plus(amt);
          break;
        case 'PAYMENT':
        case 'TRANSFER_TO_BANK':
          openingBalance = openingBalance.minus(amt);
          break;
        case 'ADJUSTMENT':
          openingBalance = openingBalance.plus(amt);
          break;
      }
    }

    const dayTxs = await this.prisma.cashTransaction.findMany({
      where: {
        cashboxId,
        createdAt: { gte: startOfDay, lt: endOfDay },
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalReceipts = new Decimal(0);
    let totalPayments = new Decimal(0);
    let totalTransfersToBank = new Decimal(0);
    let totalTransfersFromBank = new Decimal(0);

    for (const tx of dayTxs) {
      const amt = new Decimal(tx.amount.toString());
      switch (tx.transactionType) {
        case 'RECEIPT':
          totalReceipts = totalReceipts.plus(amt);
          break;
        case 'PAYMENT':
          totalPayments = totalPayments.plus(amt);
          break;
        case 'TRANSFER_TO_BANK':
          totalTransfersToBank = totalTransfersToBank.plus(amt);
          break;
        case 'TRANSFER_FROM_BANK':
          totalTransfersFromBank = totalTransfersFromBank.plus(amt);
          break;
        case 'ADJUSTMENT':
          totalReceipts = totalReceipts.plus(amt);
          break;
      }
    }

    const netChange = totalReceipts
      .plus(totalTransfersFromBank)
      .minus(totalPayments)
      .minus(totalTransfersToBank);

    const closingBalance = openingBalance.plus(netChange);

    return {
      cashboxId,
      cashboxName: cashbox.name,
      date: date.toISOString().split('T')[0],
      openingBalance,
      totalReceipts,
      totalPayments,
      totalTransfersToBank,
      totalTransfersFromBank,
      netChange,
      closingBalance,
      transactionCount: dayTxs.length,
      transactions: dayTxs.map((t) => this.mapTxToInterface(t)),
    };
  }

  private mapToInterface(cb: {
    id: string;
    code: string;
    name: string;
    nameAr: string | null;
    branchId: string;
    accountId: string;
    currentBalance: Prisma.Decimal;
    maxLimit: Prisma.Decimal | null;
    location: string | null;
    cashierName: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
  }): Cashbox {
    return {
      id: cb.id,
      code: cb.code,
      name: cb.name,
      nameAr: cb.nameAr,
      branchId: cb.branchId,
      accountId: cb.accountId,
      currentBalance: new Decimal(cb.currentBalance.toString()),
      maxLimit: cb.maxLimit ? new Decimal(cb.maxLimit.toString()) : null,
      location: cb.location,
      cashierName: cb.cashierName,
      status: cb.status as CashboxStatus,
      createdAt: cb.createdAt,
      updatedAt: cb.updatedAt,
      createdBy: cb.createdBy,
      updatedBy: cb.updatedBy,
    };
  }

  private mapTxToInterface(tx: {
    id: string;
    cashboxId: string;
    transactionType: string;
    amount: Prisma.Decimal;
    description: string;
    reference: string | null;
    counterpartyName: string | null;
    relatedBankAccountId: string | null;
    journalEntryId: string | null;
    createdAt: Date;
    createdBy: string;
  }): CashTransaction {
    return {
      id: tx.id,
      cashboxId: tx.cashboxId,
      transactionType: tx.transactionType as CashTransactionType,
      amount: new Decimal(tx.amount.toString()),
      description: tx.description,
      reference: tx.reference,
      counterpartyName: tx.counterpartyName,
      relatedBankAccountId: tx.relatedBankAccountId,
      journalEntryId: tx.journalEntryId,
      createdAt: tx.createdAt,
      createdBy: tx.createdBy,
    };
  }
}
