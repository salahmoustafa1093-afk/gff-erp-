// ============================================
// GFF ERP - Accounting API Service
// ============================================
import { get, post, put, patch, del } from './api';
import type {
  ChartOfAccount,
  JournalEntry,
  JournalEntryLine,
  LedgerEntry,
  TrialBalanceRow,
  BalanceSheetSection,
  IncomeStatementSection,
  CashFlowSection,
  ApiResponse,
  EntryStatus,
} from '../types';

const BASE = '/accounting';

export const accountingService = {
  // Chart of Accounts
  getAccounts: (params?: { type?: string; search?: string; includeInactive?: boolean }) =>
    get<ApiResponse<ChartOfAccount>>(`${BASE}/accounts`, { params }),

  getAccountTree: (): Promise<ChartOfAccount[]> =>
    get<ChartOfAccount[]>(`${BASE}/accounts/tree`),

  getAccountById: (id: string): Promise<ChartOfAccount> =>
    get<ChartOfAccount>(`${BASE}/accounts/${id}`),

  createAccount: (data: Partial<ChartOfAccount>): Promise<ChartOfAccount> =>
    post<ChartOfAccount>(`${BASE}/accounts`, data),

  updateAccount: (id: string, data: Partial<ChartOfAccount>): Promise<ChartOfAccount> =>
    put<ChartOfAccount>(`${BASE}/accounts/${id}`, data),

  deleteAccount: (id: string): Promise<void> =>
    del(`${BASE}/accounts/${id}`),

  // Journal Entries
  getJournalEntries: (params?: { page?: number; pageSize?: number; status?: EntryStatus; dateFrom?: string; dateTo?: string; branchId?: string }) =>
    get<ApiResponse<JournalEntry>>(`${BASE}/journal-entries`, { params }),

  getJournalEntryById: (id: string): Promise<JournalEntry> =>
    get<JournalEntry>(`${BASE}/journal-entries/${id}`),

  createJournalEntry: (data: Partial<JournalEntry>): Promise<JournalEntry> =>
    post<JournalEntry>(`${BASE}/journal-entries`, data),

  updateJournalEntry: (id: string, data: Partial<JournalEntry>): Promise<JournalEntry> =>
    put<JournalEntry>(`${BASE}/journal-entries/${id}`, data),

  postJournalEntry: (id: string): Promise<JournalEntry> =>
    patch<JournalEntry>(`${BASE}/journal-entries/${id}/post`, {}),

  reverseJournalEntry: (id: string, reason: string): Promise<JournalEntry> =>
    patch<JournalEntry>(`${BASE}/journal-entries/${id}/reverse`, { reason }),

  getNextReference: (): Promise<{ reference: string }> =>
    get(`${BASE}/journal-entries/next-reference`),

  // General Ledger
  getGeneralLedger: (params: { accountId?: string; accountFrom?: string; accountTo?: string; dateFrom: string; dateTo: string; branchId?: string; costCenterId?: string; page?: number; pageSize?: number }) =>
    get<ApiResponse<LedgerEntry>>(`${BASE}/general-ledger`, { params }),

  getGeneralLedgerSummary: (params: { accountId?: string; dateFrom: string; dateTo: string }) =>
    get<{ openingBalance: number; totalDebits: number; totalCredits: number; closingBalance: number }>(`${BASE}/general-ledger/summary`, { params }),

  // Trial Balance
  getTrialBalance: (params: { dateFrom: string; dateTo: string; branchId?: string }) =>
    get<{ rows: TrialBalanceRow[]; totalDebit: number; totalCredit: number; isBalanced: boolean }>(`${BASE}/reports/trial-balance`, { params }),

  // Balance Sheet
  getBalanceSheet: (params: { asOfDate: string; branchId?: string }) =>
    get<{ assets: BalanceSheetSection; liabilities: BalanceSheetSection; equity: BalanceSheetSection; totalAssets: number; totalLiabilities: number; totalEquity: number; isBalanced: boolean }>(`${BASE}/reports/balance-sheet`, { params }),

  // Income Statement
  getIncomeStatement: (params: { dateFrom: string; dateTo: string; branchId?: string }) =>
    get<{ revenue: IncomeStatementSection; cogs: IncomeStatementSection; grossProfit: number; operatingExpenses: IncomeStatementSection; netOperatingIncome: number; otherIncome: IncomeStatementSection; otherExpenses: IncomeStatementSection; netIncome: number; revenueChart: { label: string; revenue: number; expense: number }[] }>(`${BASE}/reports/income-statement`, { params }),

  // Cash Flow
  getCashFlow: (params: { dateFrom: string; dateTo: string }) =>
    get<{ operating: CashFlowSection; investing: CashFlowSection; financing: CashFlowSection; netChange: number; openingBalance: number; closingBalance: number }>(`${BASE}/reports/cash-flow`, { params }),
};
