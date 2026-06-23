import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { Prisma } from '@prisma/client';
import { AccountType, NormalBalance } from '../chart-of-accounts/interfaces/account.interface';

export interface LedgerEntry {
  date: Date;
  entryNumber: string;
  description: string;
  reference: string | null;
  debit: Decimal;
  credit: Decimal;
  balance: Decimal;
  costCenterName: string | null;
}

export interface TrialBalanceRow {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  openingBalance: Decimal;
  periodDebits: Decimal;
  periodCredits: Decimal;
  endingBalance: Decimal;
}

export interface BalanceSheetItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: Decimal;
  level: number;
}

export interface BalanceSheet {
  asOfDate: Date;
  branchId?: string;
  assets: BalanceSheetItem[];
  totalAssets: Decimal;
  liabilities: BalanceSheetItem[];
  totalLiabilities: Decimal;
  equity: BalanceSheetItem[];
  totalEquity: Decimal;
  totalLiabilitiesAndEquity: Decimal;
  isBalanced: boolean;
}

export interface IncomeStatementItem {
  accountId: string;
  accountCode: string;
  accountName: string;
  amount: Decimal;
}

export interface IncomeStatement {
  periodStart: Date;
  periodEnd: Date;
  branchId?: string;
  revenue: IncomeStatementItem[];
  totalRevenue: Decimal;
  cogs: IncomeStatementItem[];
  totalCogs: Decimal;
  grossProfit: Decimal;
  operatingExpenses: IncomeStatementItem[];
  totalOperatingExpenses: Decimal;
  operatingIncome: Decimal;
  otherIncome: IncomeStatementItem[];
  totalOtherIncome: Decimal;
  otherExpenses: IncomeStatementItem[];
  totalOtherExpenses: Decimal;
  netIncomeBeforeTax: Decimal;
  financialExpenses: IncomeStatementItem[];
  totalFinancialExpenses: Decimal;
  netIncome: Decimal;
}

export interface CashFlowItem {
  description: string;
  amount: Decimal;
}

export interface CashFlowStatement {
  periodStart: Date;
  periodEnd: Date;
  branchId?: string;
  operatingActivities: CashFlowItem[];
  netOperating: Decimal;
  investingActivities: CashFlowItem[];
  netInvesting: Decimal;
  financingActivities: CashFlowItem[];
  netFinancing: Decimal;
  netChange: Decimal;
  beginningCash: Decimal;
  endingCash: Decimal;
}

@Injectable()
export class GeneralLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAccountLedger(params: {
    accountId: string;
    startDate: Date;
    endDate: Date;
    branchId?: string;
    skip?: number;
    take?: number;
  }): Promise<{ entries: LedgerEntry[]; openingBalance: Decimal }> {
    const account = await this.prisma.account.findUnique({
      where: { id: params.accountId },
    });
    if (!account) {
      throw new NotFoundException(`Account ${params.accountId} not found`);
    }

    const preLines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: params.accountId,
        journalEntry: {
          status: 'POSTED',
          date: { lt: params.startDate },
          ...(params.branchId ? { branchId: params.branchId } : {}),
        },
      },
    });

    let openingBalance = new Decimal(account.openingBalance.toString());
    for (const line of preLines) {
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());
      if (account.normalBalance === NormalBalance.DEBIT) {
        openingBalance = openingBalance.plus(debit).minus(credit);
      } else {
        openingBalance = openingBalance.plus(credit).minus(debit);
      }
    }

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        accountId: params.accountId,
        journalEntry: {
          status: 'POSTED',
          date: { gte: params.startDate, lte: params.endDate },
          ...(params.branchId ? { branchId: params.branchId } : {}),
        },
      },
      include: {
        journalEntry: {
          select: {
            date: true,
            entryNumber: true,
            description: true,
            reference: true,
          },
        },
        costCenter: { select: { name: true } },
      },
      orderBy: [{ journalEntry: { date: 'asc' } }],
      skip: params.skip || 0,
      take: params.take || 100,
    });

    let runningBalance = new Decimal(openingBalance.toString());
    const entries: LedgerEntry[] = [];

    for (const line of lines) {
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());

      if (account.normalBalance === NormalBalance.DEBIT) {
        runningBalance = runningBalance.plus(debit).minus(credit);
      } else {
        runningBalance = runningBalance.plus(credit).minus(debit);
      }

      entries.push({
        date: line.journalEntry.date,
        entryNumber: line.journalEntry.entryNumber,
        description: line.description || line.journalEntry.description,
        reference: line.reference || line.journalEntry.reference,
        debit,
        credit,
        balance: new Decimal(runningBalance.toString()),
        costCenterName: line.costCenter?.name || null,
      });
    }

    return { entries, openingBalance };
  }

  async getTrialBalance(params: {
    asOfDate: Date;
    branchId?: string;
  }): Promise<TrialBalanceRow[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        ...(params.branchId ? { branchId: params.branchId } : {}),
      },
      orderBy: [{ code: 'asc' }],
    });

    const rows: TrialBalanceRow[] = [];

    for (const account of accounts) {
      const openingBalance = new Decimal(account.openingBalance.toString());

      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            status: 'POSTED',
            date: { lte: params.asOfDate },
            ...(params.branchId ? { branchId: params.branchId } : {}),
          },
        },
      });

      let periodDebits = new Decimal(0);
      let periodCredits = new Decimal(0);

      for (const line of lines) {
        periodDebits = periodDebits.plus(line.debit.toString());
        periodCredits = periodCredits.plus(line.credit.toString());
      }

      let endingBalance: Decimal;
      if (account.normalBalance === NormalBalance.DEBIT) {
        endingBalance = openingBalance.plus(periodDebits).minus(periodCredits);
      } else {
        endingBalance = openingBalance.plus(periodCredits).minus(periodDebits);
      }

      rows.push({
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        accountType: account.accountType as AccountType,
        openingBalance,
        periodDebits,
        periodCredits,
        endingBalance,
      });
    }

    return rows;
  }

  async getBalanceSheet(params: {
    asOfDate: Date;
    branchId?: string;
  }): Promise<BalanceSheet> {
    const trialBalance = await this.getTrialBalance(params);

    const assets: BalanceSheetItem[] = [];
    let totalAssets = new Decimal(0);
    const liabilities: BalanceSheetItem[] = [];
    let totalLiabilities = new Decimal(0);
    const equity: BalanceSheetItem[] = [];
    let totalEquity = new Decimal(0);

    for (const row of trialBalance) {
      if (row.endingBalance.isZero()) continue;

      const item: BalanceSheetItem = {
        accountId: row.accountId,
        accountCode: row.accountCode,
        accountName: row.accountName,
        amount: row.endingBalance,
        level: Math.floor(row.accountCode.length / 2),
      };

      if (row.accountType === AccountType.ASSET) {
        assets.push(item);
        totalAssets = totalAssets.plus(row.endingBalance);
      } else if (row.accountType === AccountType.LIABILITY) {
        liabilities.push(item);
        totalLiabilities = totalLiabilities.plus(row.endingBalance);
      } else if (row.accountType === AccountType.EQUITY) {
        equity.push(item);
        totalEquity = totalEquity.plus(row.endingBalance);
      }
    }

    const currentYearEarnings = await this.calculateCurrentYearEarnings(
      params.asOfDate,
      params.branchId,
    );

    if (!currentYearEarnings.isZero()) {
      equity.push({
        accountId: 'retained-earnings-current',
        accountCode: '5999',
        accountName: 'Current Year Earnings',
        amount: currentYearEarnings,
        level: 1,
      });
      totalEquity = totalEquity.plus(currentYearEarnings);
    }

    const totalLiabilitiesAndEquity = totalLiabilities.plus(totalEquity);
    const difference = totalAssets.minus(totalLiabilitiesAndEquity);

    return {
      asOfDate: params.asOfDate,
      branchId: params.branchId,
      assets,
      totalAssets,
      liabilities,
      totalLiabilities,
      equity,
      totalEquity,
      totalLiabilitiesAndEquity,
      isBalanced: difference.abs().lessThan(0.01),
    };
  }

  async getIncomeStatement(params: {
    startDate: Date;
    endDate: Date;
    branchId?: string;
  }): Promise<IncomeStatement> {
    const accounts = await this.prisma.account.findMany({
      where: {
        accountType: {
          in: [AccountType.REVENUE, AccountType.EXPENSE],
        },
        ...(params.branchId ? { branchId: params.branchId } : {}),
      },
      orderBy: [{ code: 'asc' }],
    });

    const revenue: IncomeStatementItem[] = [];
    let totalRevenue = new Decimal(0);
    const cogs: IncomeStatementItem[] = [];
    let totalCogs = new Decimal(0);
    const operatingExpenses: IncomeStatementItem[] = [];
    let totalOperatingExpenses = new Decimal(0);
    const otherIncome: IncomeStatementItem[] = [];
    let totalOtherIncome = new Decimal(0);
    const otherExpenses: IncomeStatementItem[] = [];
    let totalOtherExpenses = new Decimal(0);
    const financialExpenses: IncomeStatementItem[] = [];
    let totalFinancialExpenses = new Decimal(0);

    for (const account of accounts) {
      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            status: 'POSTED',
            date: { gte: params.startDate, lte: params.endDate },
            ...(params.branchId ? { branchId: params.branchId } : {}),
          },
        },
      });

      let netMovement = new Decimal(0);
      for (const line of lines) {
        const debit = new Decimal(line.debit.toString());
        const credit = new Decimal(line.credit.toString());
        if (account.normalBalance === NormalBalance.CREDIT) {
          netMovement = netMovement.plus(credit).minus(debit);
        } else {
          netMovement = netMovement.plus(debit).minus(credit);
        }
      }

      if (netMovement.isZero()) continue;

      const item: IncomeStatementItem = {
        accountId: account.id,
        accountCode: account.code,
        accountName: account.name,
        amount: netMovement,
      };

      const codePrefix = account.code.substring(0, 1);

      if (account.accountType === AccountType.REVENUE) {
        if (codePrefix === '6') {
          revenue.push(item);
          totalRevenue = totalRevenue.plus(netMovement);
        } else {
          otherIncome.push(item);
          totalOtherIncome = totalOtherIncome.plus(netMovement);
        }
      } else if (account.accountType === AccountType.EXPENSE) {
        if (codePrefix === '7' || account.accountSubType === 'COGS') {
          cogs.push(item);
          totalCogs = totalCogs.plus(netMovement);
        } else if (account.accountSubType === 'FINANCIAL_EXPENSE') {
          financialExpenses.push(item);
          totalFinancialExpenses = totalFinancialExpenses.plus(netMovement);
        } else if (codePrefix === '8' || account.accountSubType === 'OPERATING_EXPENSE' || account.accountSubType === 'ADMIN_EXPENSE' || account.accountSubType === 'SELLING_EXPENSE') {
          operatingExpenses.push(item);
          totalOperatingExpenses = totalOperatingExpenses.plus(netMovement);
        } else {
          otherExpenses.push(item);
          totalOtherExpenses = totalOtherExpenses.plus(netMovement);
        }
      }
    }

    const grossProfit = totalRevenue.minus(totalCogs);
    const operatingIncome = grossProfit.minus(totalOperatingExpenses);
    const netIncomeBeforeTax = operatingIncome.plus(totalOtherIncome).minus(totalOtherExpenses);
    const netIncome = netIncomeBeforeTax.minus(totalFinancialExpenses);

    return {
      periodStart: params.startDate,
      periodEnd: params.endDate,
      branchId: params.branchId,
      revenue,
      totalRevenue,
      cogs,
      totalCogs,
      grossProfit,
      operatingExpenses,
      totalOperatingExpenses,
      operatingIncome,
      otherIncome,
      totalOtherIncome,
      otherExpenses,
      totalOtherExpenses,
      netIncomeBeforeTax,
      financialExpenses,
      totalFinancialExpenses,
      netIncome,
    };
  }

  async getCashFlowStatement(params: {
    startDate: Date;
    endDate: Date;
    branchId?: string;
  }): Promise<CashFlowStatement> {
    const is = await this.getIncomeStatement(params);

    const operatingActivities: CashFlowItem[] = [
      { description: 'Net Income', amount: is.netIncome },
      { description: 'Adjustments for non-cash items', amount: new Decimal(0) },
    ];

    const depLines = await this.prisma.journalEntryLine.findMany({
      where: {
        account: {
          accountSubType: { contains: 'DEPRECIATION' },
        },
        journalEntry: {
          status: 'POSTED',
          date: { gte: params.startDate, lte: params.endDate },
          ...(params.branchId ? { branchId: params.branchId } : {}),
        },
      },
    });
    let totalDepreciation = new Decimal(0);
    for (const line of depLines) {
      totalDepreciation = totalDepreciation.plus(line.debit.toString());
    }
    if (!totalDepreciation.isZero()) {
      operatingActivities.push({ description: 'Depreciation', amount: totalDepreciation });
    }

    const netOperating = is.netIncome.plus(totalDepreciation);

    const investingActivities: CashFlowItem[] = [];
    let netInvesting = new Decimal(0);

    const assetLines = await this.prisma.journalEntryLine.findMany({
      where: {
        account: {
          accountSubType: { in: ['FIXED_ASSET', 'INTANGIBLE_ASSET'] },
        },
        journalEntry: {
          status: 'POSTED',
          date: { gte: params.startDate, lte: params.endDate },
          ...(params.branchId ? { branchId: params.branchId } : {}),
        },
      },
      include: { account: { select: { name: true, normalBalance: true } } },
    });

    for (const line of assetLines) {
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());
      const netChange = debit.minus(credit);
      if (!netChange.isZero()) {
        investingActivities.push({
          description: `Purchase of ${line.account.name}`,
          amount: netChange.negated(),
        });
        netInvesting = netInvesting.minus(netChange);
      }
    }

    const financingActivities: CashFlowItem[] = [];
    let netFinancing = new Decimal(0);

    const loanLines = await this.prisma.journalEntryLine.findMany({
      where: {
        account: {
          OR: [
            { accountSubType: 'LONG_TERM_LIABILITY' },
            { accountSubType: 'EQUITY_CAPITAL' },
          ],
        },
        journalEntry: {
          status: 'POSTED',
          date: { gte: params.startDate, lte: params.endDate },
          ...(params.branchId ? { branchId: params.branchId } : {}),
        },
      },
      include: { account: { select: { name: true } } },
    });

    for (const line of loanLines) {
      const debit = new Decimal(line.debit.toString());
      const credit = new Decimal(line.credit.toString());
      const netChange = credit.minus(debit);
      if (!netChange.isZero()) {
        financingActivities.push({
          description: line.account.name,
          amount: netChange,
        });
        netFinancing = netFinancing.plus(netChange);
      }
    }

    const netChange = netOperating.plus(netInvesting).plus(netFinancing);

    const beginningCash = await this.getCashBalanceAtDate(
      params.startDate,
      params.branchId,
      true,
    );
    const endingCash = beginningCash.plus(netChange);

    return {
      periodStart: params.startDate,
      periodEnd: params.endDate,
      branchId: params.branchId,
      operatingActivities,
      netOperating,
      investingActivities,
      netInvesting,
      financingActivities,
      netFinancing,
      netChange,
      beginningCash,
      endingCash,
    };
  }

  private async calculateCurrentYearEarnings(
    asOfDate: Date,
    branchId?: string,
  ): Promise<Decimal> {
    const startOfYear = new Date(asOfDate.getFullYear(), 0, 1);

    const is = await this.getIncomeStatement({
      startDate: startOfYear,
      endDate: asOfDate,
      branchId,
    });

    return is.netIncome;
  }

  private async getCashBalanceAtDate(
    date: Date,
    branchId?: string,
    beforeDate = false,
  ): Promise<Decimal> {
    const dateFilter = beforeDate ? { lt: date } : { lte: date };

    const cashAccounts = await this.prisma.account.findMany({
      where: {
        OR: [{ isCashAccount: true }, { isBankAccount: true }],
        ...(branchId ? { branchId } : {}),
      },
    });

    let totalCash = new Decimal(0);

    for (const account of cashAccounts) {
      const openingBalance = new Decimal(account.openingBalance.toString());

      const lines = await this.prisma.journalEntryLine.findMany({
        where: {
          accountId: account.id,
          journalEntry: {
            status: 'POSTED',
            date: dateFilter,
            ...(branchId ? { branchId } : {}),
          },
        },
      });

      let balance = openingBalance;
      for (const line of lines) {
        const debit = new Decimal(line.debit.toString());
        const credit = new Decimal(line.credit.toString());
        if (account.normalBalance === NormalBalance.DEBIT) {
          balance = balance.plus(debit).minus(credit);
        } else {
          balance = balance.plus(credit).minus(debit);
        }
      }

      totalCash = totalCash.plus(balance);
    }

    return totalCash;
  }
}
