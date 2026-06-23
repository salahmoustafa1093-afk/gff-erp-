import { Decimal } from '@prisma/client/runtime/library';

export enum CashTransactionType {
  RECEIPT = 'RECEIPT',
  PAYMENT = 'PAYMENT',
  TRANSFER_TO_BANK = 'TRANSFER_TO_BANK',
  TRANSFER_FROM_BANK = 'TRANSFER_FROM_BANK',
  ADJUSTMENT = 'ADJUSTMENT',
}

export enum CashboxStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED',
}

export interface Cashbox {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  branchId: string;
  accountId: string;
  currentBalance: Decimal;
  maxLimit: Decimal | null;
  location: string | null;
  cashierName: string | null;
  status: CashboxStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface CashTransaction {
  id: string;
  cashboxId: string;
  transactionType: CashTransactionType;
  amount: Decimal;
  description: string;
  reference: string | null;
  counterpartyName: string | null;
  relatedBankAccountId: string | null;
  journalEntryId: string | null;
  createdAt: Date;
  createdBy: string;
}

export interface DailyCashReport {
  cashboxId: string;
  cashboxName: string;
  date: string;
  openingBalance: Decimal;
  totalReceipts: Decimal;
  totalPayments: Decimal;
  totalTransfersToBank: Decimal;
  totalTransfersFromBank: Decimal;
  netChange: Decimal;
  closingBalance: Decimal;
  transactionCount: number;
  transactions: CashTransaction[];
}
