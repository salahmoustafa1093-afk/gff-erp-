import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { JournalEntriesService } from '../journal-entries/journal-entries.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import {
  TreasuryPosition,
  CashPosition,
  BankPosition,
  TreasuryTransfer,
  CashFlowSummary,
} from './interfaces/treasury.interface';
import { TreasuryTransferDto, TransferSourceType } from './dto/treasury-transfer.dto';
import { JournalSource, JournalEntryType } from '../journal-entries/interfaces/journal-entry.interface';

@Injectable()
export class TreasuryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly journalService: JournalEntriesService,
  ) {}

  async getCashPosition(branchId: string): Promise<CashPosition[]> {
    const cashboxes = await this.prisma.cashBox.findMany({
      where: { branchId },
      orderBy: [{ name: 'asc' }],
    });

    return cashboxes.map((cb) => ({
      cashboxId: cb.id,
      cashboxName: cb.name,
      balance: new Decimal(cb.currentBalance.toString()),
      currency: 'USD',
      maxLimit: cb.maxLimit ? new Decimal(cb.maxLimit.toString()) : null,
      status: cb.status,
    }));
  }

  async getBankPosition(branchId: string): Promise<BankPosition[]> {
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { branchId },
      orderBy: [{ bankName: 'asc' }],
      include: {
        _count: {
          select: {
            transactions: {
              where: { reconciled: false },
            },
          },
        },
      },
    });

    return bankAccounts.map((ba) => ({
      bankAccountId: ba.id,
      bankName: `${ba.bankName} - ${ba.accountNumber}`,
      accountNumber: ba.accountNumber,
      accountName: ba.accountName,
      balance: new Decimal(ba.currentBalance.toString()),
      currency: ba.currency,
      unreconciledCount: ba._count.transactions,
      status: ba.status,
    }));
  }

  async getTreasuryPosition(branchId: string): Promise<TreasuryPosition> {
    const [cashPositions, bankPositions] = await Promise.all([
      this.getCashPosition(branchId),
      this.getBankPosition(branchId),
    ]);

    let totalCash = new Decimal(0);
    for (const cp of cashPositions) {
      totalCash = totalCash.plus(cp.balance);
    }

    let totalBank = new Decimal(0);
    for (const bp of bankPositions) {
      totalBank = totalBank.plus(bp.balance);
    }

    const currencyBreakdown: Record<string, Decimal> = {};
    for (const cp of cashPositions) {
      const curr = cp.currency || 'USD';
      if (!currencyBreakdown[curr]) {
        currencyBreakdown[curr] = new Decimal(0);
      }
      currencyBreakdown[curr] = currencyBreakdown[curr].plus(cp.balance);
    }
    for (const bp of bankPositions) {
      const curr = bp.currency || 'USD';
      if (!currencyBreakdown[curr]) {
        currencyBreakdown[curr] = new Decimal(0);
      }
      currencyBreakdown[curr] = currencyBreakdown[curr].plus(bp.balance);
    }

    const totalTreasury = totalCash.plus(totalBank);

    return {
      branchId,
      totalCash,
      totalBank,
      totalTreasury,
      currencyBreakdown,
      cashPositions,
      bankPositions,
    };
  }

  async transfer(
    dto: TreasuryTransferDto,
    userId: string,
  ): Promise<TreasuryTransfer> {
    const amount = new Decimal(dto.amount.toString());

    let fromAccountId: string;
    let toAccountId: string;
    let fromName: string;
    let toName: string;
    let fromBalanceChange: Decimal;
    let toBalanceChange: Decimal;
    let branchId: string;

    if (dto.fromType === TransferSourceType.CASH) {
      const cashbox = await this.prisma.cashBox.findUnique({
        where: { id: dto.fromId },
      });
      if (!cashbox) throw new NotFoundException(`Cashbox ${dto.fromId} not found`);
      if (cashbox.status !== 'ACTIVE') throw new ForbiddenException('Source cashbox is not active');
      const currentBalance = new Decimal(cashbox.currentBalance.toString());
      if (currentBalance.lessThan(amount)) {
        throw new BadRequestException(
          `Insufficient cash balance. Available: ${currentBalance.toFixed(2)}`,
        );
      }
      fromAccountId = cashbox.accountId;
      fromName = cashbox.name;
      branchId = cashbox.branchId;
      fromBalanceChange = amount.negated();
    } else {
      const bank = await this.prisma.bankAccount.findUnique({
        where: { id: dto.fromId },
      });
      if (!bank) throw new NotFoundException(`Bank account ${dto.fromId} not found`);
      if (bank.status !== 'ACTIVE') throw new ForbiddenException('Source bank account is not active');
      const currentBalance = new Decimal(bank.currentBalance.toString());
      if (currentBalance.lessThan(amount)) {
        throw new BadRequestException(
          `Insufficient bank balance. Available: ${currentBalance.toFixed(2)}`,
        );
      }
      fromAccountId = bank.accountId;
      fromName = `${bank.bankName} - ${bank.accountNumber}`;
      branchId = bank.branchId;
      fromBalanceChange = amount.negated();
    }

    if (dto.toType === TransferSourceType.CASH) {
      const cashbox = await this.prisma.cashBox.findUnique({
        where: { id: dto.toId },
      });
      if (!cashbox) throw new NotFoundException(`Cashbox ${dto.toId} not found`);
      if (cashbox.status !== 'ACTIVE') throw new ForbiddenException('Destination cashbox is not active');
      if (cashbox.branchId !== branchId) {
        throw new BadRequestException('Cannot transfer between different branches');
      }
      toAccountId = cashbox.accountId;
      toName = cashbox.name;
      toBalanceChange = amount;
    } else {
      const bank = await this.prisma.bankAccount.findUnique({
        where: { id: dto.toId },
      });
      if (!bank) throw new NotFoundException(`Bank account ${dto.toId} not found`);
      if (bank.status !== 'ACTIVE') throw new ForbiddenException('Destination bank account is not active');
      if (bank.branchId !== branchId) {
        throw new BadRequestException('Cannot transfer between different branches');
      }
      toAccountId = bank.accountId;
      toName = `${bank.bankName} - ${bank.accountNumber}`;
      toBalanceChange = amount;
    }

    const result = await this.prisma.$transaction(async (tx) => {
      if (dto.fromType === TransferSourceType.CASH) {
        await tx.cashBox.update({
          where: { id: dto.fromId },
          data: { currentBalance: { increment: fromBalanceChange.toNumber() } },
        });
      } else {
        await tx.bankAccount.update({
          where: { id: dto.fromId },
          data: { currentBalance: { increment: fromBalanceChange.toNumber() } },
        });
      }

      if (dto.toType === TransferSourceType.CASH) {
        await tx.cashBox.update({
          where: { id: dto.toId },
          data: { currentBalance: { increment: toBalanceChange.toNumber() } },
        });
      } else {
        await tx.bankAccount.update({
          where: { id: dto.toId },
          data: { currentBalance: { increment: toBalanceChange.toNumber() } },
        });
      }

      const txRecord = await tx.treasuryTransfer.create({
        data: {
          fromType: dto.fromType,
          fromId: dto.fromId,
          toType: dto.toType,
          toId: dto.toId,
          amount: new Prisma.Decimal(amount.toString()),
          description: dto.description,
          reference: dto.reference || null,
          journalEntryId: '',
          createdBy: userId,
        },
      });

      return txRecord;
    });

    const je = await this.journalService.createAutoJournal({
      date: dto.date || new Date(),
      description: `Treasury transfer: ${dto.description}`,
      reference: dto.reference,
      source: JournalSource.TREASURY_TRANSFER,
      entryType: JournalEntryType.AUTOMATIC,
      branchId,
      lines: [
        {
          accountId: toAccountId,
          debit: amount.toNumber(),
          credit: 0,
          description: `Transfer from ${fromName}: ${dto.description}`,
        },
        {
          accountId: fromAccountId,
          debit: 0,
          credit: amount.toNumber(),
          description: `Transfer to ${toName}: ${dto.description}`,
        },
      ],
      createdBy: userId,
    });

    await this.prisma.treasuryTransfer.update({
      where: { id: result.id },
      data: { journalEntryId: je.id },
    });

    await this.auditService.log({
      action: 'TREASURY_TRANSFER',
      entity: 'TreasuryTransfer',
      entityId: result.id,
      userId,
      branchId,
      details: {
        fromType: dto.fromType,
        fromId: dto.fromId,
        toType: dto.toType,
        toId: dto.toId,
        amount: amount.toNumber(),
        journalEntryId: je.id,
      },
    });

    return {
      id: result.id,
      fromType: result.fromType as 'CASH' | 'BANK',
      fromId: result.fromId,
      fromName,
      toType: result.toType as 'CASH' | 'BANK',
      toId: result.toId,
      toName,
      amount: new Decimal(result.amount.toString()),
      description: result.description,
      reference: result.reference,
      journalEntryId: je.id,
      createdAt: result.createdAt,
      createdBy: result.createdBy,
    };
  }

  async getCashFlowSummary(
    branchId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<CashFlowSummary> {
    const cashboxes = await this.prisma.cashBox.findMany({
      where: { branchId },
    });
    const bankAccounts = await this.prisma.bankAccount.findMany({
      where: { branchId },
    });

    let openingCash = new Decimal(0);
    let closingCash = new Decimal(0);

    for (const cb of cashboxes) {
      openingCash = openingCash.plus(cb.openingBalance.toString());
      closingCash = closingCash.plus(cb.currentBalance.toString());
    }

    let openingBank = new Decimal(0);
    let closingBank = new Decimal(0);

    for (const ba of bankAccounts) {
      openingBank = openingBank.plus(ba.openingBalance.toString());
      closingBank = closingBank.plus(ba.currentBalance.toString());
    }

    const cashTxs = await this.prisma.cashTransaction.findMany({
      where: {
        cashbox: { branchId },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    let receipts = new Decimal(0);
    let payments = new Decimal(0);
    let bankTransfersIn = new Decimal(0);
    let bankTransfersOut = new Decimal(0);

    for (const tx of cashTxs) {
      const amt = new Decimal(tx.amount.toString());
      switch (tx.transactionType) {
        case 'RECEIPT':
          receipts = receipts.plus(amt);
          break;
        case 'PAYMENT':
          payments = payments.plus(amt);
          break;
        case 'TRANSFER_TO_BANK':
          bankTransfersOut = bankTransfersOut.plus(amt);
          break;
        case 'TRANSFER_FROM_BANK':
          bankTransfersIn = bankTransfersIn.plus(amt);
          break;
        case 'ADJUSTMENT':
          receipts = receipts.plus(amt);
          break;
      }
    }

    const bankTxs = await this.prisma.bankTransaction.findMany({
      where: {
        bankAccount: { branchId },
        createdAt: { gte: startDate, lte: endDate },
      },
    });

    let bankDeposits = new Decimal(0);
    let bankWithdrawals = new Decimal(0);

    for (const tx of bankTxs) {
      const amt = new Decimal(tx.amount.toString());
      switch (tx.transactionType) {
        case 'DEPOSIT':
        case 'CHECK_DEPOSIT':
        case 'TRANSFER_IN':
        case 'INTEREST':
          bankDeposits = bankDeposits.plus(amt);
          break;
        case 'WITHDRAWAL':
        case 'TRANSFER_OUT':
        case 'CHECK_ISSUED':
        case 'BANK_CHARGE':
          bankWithdrawals = bankWithdrawals.plus(amt);
          break;
      }
    }

    const cashInflowsTotal = receipts.plus(bankTransfersIn);
    const cashOutflowsTotal = payments.plus(bankTransfersOut);
    const netCashFlow = cashInflowsTotal.minus(cashOutflowsTotal);
    const totalTreasuryChange = closingCash.plus(closingBank).minus(openingCash.plus(openingBank));

    return {
      period: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
      periodStart: startDate,
      periodEnd: endDate,
      branchId,
      openingCash,
      cashInflows: {
        receipts,
        bankTransfersIn,
        total: cashInflowsTotal,
      },
      cashOutflows: {
        payments,
        bankTransfersOut,
        total: cashOutflowsTotal,
      },
      netCashFlow,
      closingCash,
      openingBank,
      bankDeposits,
      bankWithdrawals,
      closingBank,
      totalTreasuryChange,
    };
  }

  async getTransferHistory(
    branchId?: string,
    limit = 50,
  ): Promise<TreasuryTransfer[]> {
    const where: Prisma.TreasuryTransferWhereInput = {};
    if (branchId) {
      where.OR = [
        { fromCashBox: { branchId } },
        { fromBankAccount: { branchId } },
      ];
    }

    const transfers = await this.prisma.treasuryTransfer.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        fromCashBox: { select: { name: true, branchId: true } },
        fromBankAccount: { select: { bankName: true, accountNumber: true, branchId: true } },
        toCashBox: { select: { name: true } },
        toBankAccount: { select: { bankName: true, accountNumber: true } },
      },
    });

    return transfers.map((t) => {
      const fromName = t.fromType === 'CASH'
        ? t.fromCashBox?.name || t.fromId
        : `${t.fromBankAccount?.bankName || ''} - ${t.fromBankAccount?.accountNumber || ''}`;
      const toName = t.toType === 'CASH'
        ? t.toCashBox?.name || t.toId
        : `${t.toBankAccount?.bankName || ''} - ${t.toBankAccount?.accountNumber || ''}`;

      return {
        id: t.id,
        fromType: t.fromType as 'CASH' | 'BANK',
        fromId: t.fromId,
        fromName,
        toType: t.toType as 'CASH' | 'BANK',
        toId: t.toId,
        toName,
        amount: new Decimal(t.amount.toString()),
        description: t.description,
        reference: t.reference,
        journalEntryId: t.journalEntryId,
        createdAt: t.createdAt,
        createdBy: t.createdBy,
      };
    });
  }
}
