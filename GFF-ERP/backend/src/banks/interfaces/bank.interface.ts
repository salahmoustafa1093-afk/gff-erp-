import { Decimal } from '@prisma/client/runtime/library';

export enum BankTransactionType {
  DEPOSIT = 'DEPOSIT',
  WITHDRAWAL = 'WITHDRAWAL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  CHECK_DEPOSIT = 'CHECK_DEPOSIT',
  CHECK_ISSUED = 'CHECK_ISSUED',
  BANK_CHARGE = 'BANK_CHARGE',
  INTEREST = 'INTEREST',
}

export enum BankAccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FROZEN = 'FROZEN',
  CLOSED = 'CLOSED',
}

export enum ReconciliationStatus {
  UNRECONCILED = 'UNRECONCILED',
  PARTIAL = 'PARTIAL',
  RECONCILED = 'RECONCILED',
}

export interface BankAccount {
  id: string;
  bankName: string;
  bankNameAr: string | null;
  accountNumber: string;
  accountName: string;
  branchName: string | null;
  branchId: string;
  accountId: string;
  currency: string;
  currentBalance: Decimal;
  openingBalance: Decimal;
  swiftCode: string | null;
  iban: string | null;
  status: BankAccountStatus;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  transactionType: BankTransactionType;
  amount: Decimal;
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
}

export interface BankReconciliation {
  id: string;
  bankAccountId: string;
  statementDate: Date;
  statementBalance: Decimal;
  bookBalance: Decimal;
  difference: Decimal;
  status: ReconciliationStatus;
  reconciledTransactions: string[];
  unreconciledTransactions: string[];
  notes: string | null;
  createdAt: Date;
  createdBy: string;
}

export interface BankStatementLine {
  date: Date;
  description: string;
  reference: string;
  debit: Decimal;
  credit: Decimal;
  balance: Decimal;
}
