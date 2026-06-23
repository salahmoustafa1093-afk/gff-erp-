// ============================================
// GFF ERP - Cashbox API Service
// ============================================
import { get, post, put, patch, del } from './api';
import type { Cashbox, CashboxTransaction, ApiResponse } from '../types';

const BASE = '/cashboxes';

export const cashboxService = {
  getCashboxes: (params?: { page?: number; pageSize?: number; status?: string; branchId?: string }) =>
    get<ApiResponse<Cashbox>>(`${BASE}`, { params }),

  getCashboxById: (id: string): Promise<Cashbox> =>
    get<Cashbox>(`${BASE}/${id}`),

  createCashbox: (data: Partial<Cashbox>): Promise<Cashbox> =>
    post<Cashbox>(`${BASE}`, data),

  updateCashbox: (id: string, data: Partial<Cashbox>): Promise<Cashbox> =>
    put<Cashbox>(`${BASE}/${id}`, data),

  deleteCashbox: (id: string): Promise<void> =>
    del(`${BASE}/${id}`),

  toggleStatus: (id: string): Promise<Cashbox> =>
    patch<Cashbox>(`${BASE}/${id}/toggle-status`, {}),

  getTransactions: (cashboxId: string, params?: { page?: number; pageSize?: number; type?: string; dateFrom?: string; dateTo?: string }) =>
    get<ApiResponse<CashboxTransaction>>(`${BASE}/${cashboxId}/transactions`, { params }),

  createTransaction: (cashboxId: string, data: Partial<CashboxTransaction>): Promise<CashboxTransaction> =>
    post<CashboxTransaction>(`${BASE}/${cashboxId}/transactions`, data),

  getDailyReport: (cashboxId: string, date: string): Promise<{
    openingBalance: number;
    receipts: number;
    payments: number;
    closingBalance: number;
    transactions: CashboxTransaction[];
  }> =>
    get(`${BASE}/${cashboxId}/daily-report`, { params: { date } }),
};
