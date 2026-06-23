// ============================================
// GFF ERP - Bank API Service
// ============================================
import { get, post, put, patch, del } from './api';
import type { BankAccount, BankTransaction, BankReconciliation, ApiResponse } from '../types';

const BASE = '/banks';

export const bankService = {
  getAccounts: (params?: { page?: number; pageSize?: number; status?: string; search?: string }) =>
    get<ApiResponse<BankAccount>>(`${BASE}/accounts`, { params }),

  getAccountById: (id: string): Promise<BankAccount> =>
    get<BankAccount>(`${BASE}/accounts/${id}`),

  createAccount: (data: Partial<BankAccount>): Promise<BankAccount> =>
    post<BankAccount>(`${BASE}/accounts`, data),

  updateAccount: (id: string, data: Partial<BankAccount>): Promise<BankAccount> =>
    put<BankAccount>(`${BASE}/accounts/${id}`, data),

  deleteAccount: (id: string): Promise<void> =>
    del(`${BASE}/accounts/${id}`),

  toggleAccountStatus: (id: string): Promise<BankAccount> =>
    patch<BankAccount>(`${BASE}/accounts/${id}/toggle-status`, {}),

  getTransactions: (bankAccountId: string, params?: { page?: number; pageSize?: number; type?: string; status?: string; dateFrom?: string; dateTo?: string }) =>
    get<ApiResponse<BankTransaction>>(`${BASE}/accounts/${bankAccountId}/transactions`, { params }),

  createTransaction: (bankAccountId: string, data: Partial<BankTransaction>): Promise<BankTransaction> =>
    post<BankTransaction>(`${BASE}/accounts/${bankAccountId}/transactions`, data),

  getReconciliations: (bankAccountId: string) =>
    get<ApiResponse<BankReconciliation>>(`${BASE}/accounts/${bankAccountId}/reconciliations`),

  getReconciliationById: (id: string): Promise<BankReconciliation> =>
    get<BankReconciliation>(`${BASE}/reconciliations/${id}`),

  createReconciliation: (bankAccountId: string, statementDate: string, statementBalance: number): Promise<BankReconciliation> =>
    post<BankReconciliation>(`${BASE}/reconciliations`, { bankAccountId, statementDate, statementBalance }),

  matchTransaction: (reconciliationId: string, bankTransactionId: string, systemTransactionId: string): Promise<BankReconciliation> =>
    patch<BankReconciliation>(`${BASE}/reconciliations/${reconciliationId}/match`, { bankTransactionId, systemTransactionId }),

  unmatchTransaction: (reconciliationId: string, itemId: string): Promise<BankReconciliation> =>
    patch<BankReconciliation>(`${BASE}/reconciliations/${reconciliationId}/unmatch`, { itemId }),

  completeReconciliation: (reconciliationId: string): Promise<BankReconciliation> =>
    patch<BankReconciliation>(`${BASE}/reconciliations/${reconciliationId}/complete`, {}),
};
