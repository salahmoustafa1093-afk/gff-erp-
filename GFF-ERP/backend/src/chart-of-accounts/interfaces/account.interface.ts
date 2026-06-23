import { Decimal } from '@prisma/client/runtime/library';

export enum AccountType {
  ASSET = 'ASSET',
  LIABILITY = 'LIABILITY',
  EQUITY = 'EQUITY',
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

export enum AccountSubType {
  CURRENT_ASSET = 'CURRENT_ASSET',
  FIXED_ASSET = 'FIXED_ASSET',
  INTANGIBLE_ASSET = 'INTANGIBLE_ASSET',
  CURRENT_LIABILITY = 'CURRENT_LIABILITY',
  LONG_TERM_LIABILITY = 'LONG_TERM_LIABILITY',
  EQUITY_CAPITAL = 'EQUITY_CAPITAL',
  RETAINED_EARNINGS = 'RETAINED_EARNINGS',
  REVENUE_SALES = 'REVENUE_SALES',
  REVENUE_OTHER = 'REVENUE_OTHER',
  COGS = 'COGS',
  OPERATING_EXPENSE = 'OPERATING_EXPENSE',
  ADMIN_EXPENSE = 'ADMIN_EXPENSE',
  SELLING_EXPENSE = 'SELLING_EXPENSE',
  FINANCIAL_EXPENSE = 'FINANCIAL_EXPENSE',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export enum NormalBalance {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT',
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FROZEN = 'FROZEN',
}

export interface Account {
  id: string;
  code: string;
  name: string;
  nameAr: string | null;
  accountType: AccountType;
  accountSubType: AccountSubType;
  normalBalance: NormalBalance;
  parentId: string | null;
  isSystem: boolean;
  isBankAccount: boolean;
  isCashAccount: boolean;
  description: string | null;
  openingBalance: Decimal;
  currentBalance: Decimal;
  branchId: string;
  status: AccountStatus;
  level: number;
  path: string;
  children?: Account[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface AccountBalance {
  accountId: string;
  accountCode: string;
  accountName: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  openingBalance: Decimal;
  periodDebits: Decimal;
  periodCredits: Decimal;
  endingBalance: Decimal;
}

export interface AccountTreeNode {
  id: string;
  code: string;
  name: string;
  accountType: AccountType;
  normalBalance: NormalBalance;
  level: number;
  path: string;
  currentBalance: Decimal;
  children: AccountTreeNode[];
}
