import { Decimal } from '@prisma/client/runtime/library';

export interface CashPosition {
  cashboxId: string;
  cashboxName: string;
  balance: Decimal;
  currency: string;
  maxLimit: Decimal | null;
  status: string;
}

export interface BankPosition {
  bankAccountId: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  balance: Decimal;
  currency: string;
  unreconciledCount: number;
  status: string;
}

export interface TreasuryPosition {
  branchId: string;
  totalCash: Decimal;
  totalBank: Decimal;
  totalTreasury: Decimal;
  currencyBreakdown: Record<string, Decimal>;
  cashPositions: CashPosition[];
  bankPositions: BankPosition[];
}

export interface TreasuryTransfer {
  id: string;
  fromType: 'CASH' | 'BANK';
  fromId: string;
  fromName: string;
  toType: 'CASH' | 'BANK';
  toId: string;
  toName: string;
  amount: Decimal;
  description: string;
  reference: string | null;
  journalEntryId: string;
  createdAt: Date;
  createdBy: string;
}

export interface CashFlowSummary {
  period: string;
  periodStart: Date;
  periodEnd: Date;
  branchId: string;
  openingCash: Decimal;
  cashInflows: {
    receipts: Decimal;
    bankTransfersIn: Decimal;
    total: Decimal;
  };
  cashOutflows: {
    payments: Decimal;
    bankTransfersOut: Decimal;
    total: Decimal;
  };
  netCashFlow: Decimal;
  closingCash: Decimal;
  openingBank: Decimal;
  bankDeposits: Decimal;
  bankWithdrawals: Decimal;
  closingBank: Decimal;
  totalTreasuryChange: Decimal;
}
