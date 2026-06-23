// ============================================
// GFF ERP - Treasury API Service
// ============================================
import { get, post, put, patch } from './api';
import type {
  TreasuryTransfer,
  CashTransaction,
  BankTransaction,
  CashPosition,
  ApiResponse,
} from '../types';

const BASE = '/treasury';

export const treasuryService = {
  // Cash Position
  getCashPosition: (): Promise<CashPosition> =>
    get<CashPosition>(`${BASE}/cash-position`),

  getBranchCashPosition: (): Promise<{ branchId: string; branchName: string; cashAmount: number; bankAmount: number }[]> =>
    get(`${BASE}/branch-cash-position`),

  // Transfers
  getTransfers: (params?: { page?: number; pageSize?: number; status?: string; dateFrom?: string; dateTo?: string }) =>
    get<ApiResponse<TreasuryTransfer>>(`${BASE}/transfers`, { params }),

  getTransferById: (id: string): Promise<TreasuryTransfer> =>
    get<TreasuryTransfer>(`${BASE}/transfers/${id}`),

  createTransfer: (data: Partial<TreasuryTransfer>): Promise<TreasuryTransfer> =>
    post<TreasuryTransfer>(`${BASE}/transfers`, data),

  updateTransfer: (id: string, data: Partial<TreasuryTransfer>): Promise<TreasuryTransfer> =>
    put<TreasuryTransfer>(`${BASE}/transfers/${id}`, data),

  approveTransfer: (id: string): Promise<TreasuryTransfer> =>
    patch<TreasuryTransfer>(`${BASE}/transfers/${id}/approve`, {}),

  rejectTransfer: (id: string, reason: string): Promise<TreasuryTransfer> =>
    patch<TreasuryTransfer>(`${BASE}/transfers/${id}/reject`, { reason }),

  completeTransfer: (id: string): Promise<TreasuryTransfer> =>
    patch<TreasuryTransfer>(`${BASE}/transfers/${id}/complete`, {}),

  // Cash Transactions
  getCashTransactions: (params?: { page?: number; pageSize?: number; cashboxId?: string; dateFrom?: string; dateTo?: string }) =>
    get<ApiResponse<CashTransaction>>(`${BASE}/cash-transactions`, { params }),

  // Bank Transactions
  getBankTransactions: (params?: { page?: number; pageSize?: number; bankAccountId?: string; dateFrom?: string; dateTo?: string }) =>
    get<ApiResponse<BankTransaction>>(`${BASE}/bank-transactions`, { params }),
};
