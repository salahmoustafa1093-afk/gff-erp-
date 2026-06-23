import { Decimal } from '@prisma/client/runtime/library';

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  POSTED = 'POSTED',
  REVERSED = 'REVERSED',
  CANCELLED = 'CANCELLED',
}

export enum JournalEntryType {
  MANUAL = 'MANUAL',
  AUTOMATIC = 'AUTOMATIC',
  RECURRING = 'RECURRING',
  REVERSING = 'REVERSING',
  ADJUSTING = 'ADJUSTING',
  CLOSING = 'CLOSING',
}

export enum JournalSource {
  MANUAL_ENTRY = 'MANUAL_ENTRY',
  SALES_INVOICE = 'SALES_INVOICE',
  PURCHASE_INVOICE = 'PURCHASE_INVOICE',
  INVENTORY = 'INVENTORY',
  PAYROLL = 'PAYROLL',
  BANK_TRANSACTION = 'BANK_TRANSACTION',
  CASH_TRANSACTION = 'CASH_TRANSACTION',
  ASSET_DEPRECIATION = 'ASSET_DEPRECIATION',
  TREASURY_TRANSFER = 'TREASURY_TRANSFER',
  PERIOD_CLOSE = 'PERIOD_CLOSE',
}

export interface JournalEntryLine {
  id: string;
  journalEntryId: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  debit: Decimal;
  credit: Decimal;
  description: string | null;
  costCenterId: string | null;
  costCenterName?: string;
  reference: string | null;
  lineOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  reference: string | null;
  source: JournalSource;
  entryType: JournalEntryType;
  status: JournalEntryStatus;
  totalDebits: Decimal;
  totalCredits: Decimal;
  branchId: string;
  periodId: string;
  sourceDocumentId: string | null;
  sourceDocumentType: string | null;
  reversalOfId: string | null;
  reversedById: string | null;
  postedAt: Date | null;
  postedBy: string | null;
  approvedBy: string | null;
  approvedAt: Date | null;
  notes: string | null;
  lines: JournalEntryLine[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface JournalEntrySummary {
  id: string;
  entryNumber: string;
  date: Date;
  description: string;
  status: JournalEntryStatus;
  totalDebits: Decimal;
  totalCredits: Decimal;
  lineCount: number;
  source: JournalSource;
  createdBy: string;
  createdAt: Date;
}
