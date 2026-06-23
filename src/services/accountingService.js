// ============================================
// GFF ERP - Accounting API Service
// ============================================
import { get, post, put, patch, del } from './api';
const BASE = '/accounting';
export const accountingService = {
    // Chart of Accounts
    getAccounts: (params) => get(`${BASE}/accounts`, { params }),
    getAccountTree: () => get(`${BASE}/accounts/tree`),
    getAccountById: (id) => get(`${BASE}/accounts/${id}`),
    createAccount: (data) => post(`${BASE}/accounts`, data),
    updateAccount: (id, data) => put(`${BASE}/accounts/${id}`, data),
    deleteAccount: (id) => del(`${BASE}/accounts/${id}`),
    // Journal Entries
    getJournalEntries: (params) => get(`${BASE}/journal-entries`, { params }),
    getJournalEntryById: (id) => get(`${BASE}/journal-entries/${id}`),
    createJournalEntry: (data) => post(`${BASE}/journal-entries`, data),
    updateJournalEntry: (id, data) => put(`${BASE}/journal-entries/${id}`, data),
    postJournalEntry: (id) => patch(`${BASE}/journal-entries/${id}/post`, {}),
    reverseJournalEntry: (id, reason) => patch(`${BASE}/journal-entries/${id}/reverse`, { reason }),
    getNextReference: () => get(`${BASE}/journal-entries/next-reference`),
    // General Ledger
    getGeneralLedger: (params) => get(`${BASE}/general-ledger`, { params }),
    getGeneralLedgerSummary: (params) => get(`${BASE}/general-ledger/summary`, { params }),
    // Trial Balance
    getTrialBalance: (params) => get(`${BASE}/reports/trial-balance`, { params }),
    // Balance Sheet
    getBalanceSheet: (params) => get(`${BASE}/reports/balance-sheet`, { params }),
    // Income Statement
    getIncomeStatement: (params) => get(`${BASE}/reports/income-statement`, { params }),
    // Cash Flow
    getCashFlow: (params) => get(`${BASE}/reports/cash-flow`, { params }),
};
