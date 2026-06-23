// ============================================
// GFF ERP - Cashbox API Service
// ============================================
import { get, post, put, patch, del } from './api';
const BASE = '/cashboxes';
export const cashboxService = {
    getCashboxes: (params) => get(`${BASE}`, { params }),
    getCashboxById: (id) => get(`${BASE}/${id}`),
    createCashbox: (data) => post(`${BASE}`, data),
    updateCashbox: (id, data) => put(`${BASE}/${id}`, data),
    deleteCashbox: (id) => del(`${BASE}/${id}`),
    toggleStatus: (id) => patch(`${BASE}/${id}/toggle-status`, {}),
    getTransactions: (cashboxId, params) => get(`${BASE}/${cashboxId}/transactions`, { params }),
    createTransaction: (cashboxId, data) => post(`${BASE}/${cashboxId}/transactions`, data),
    getDailyReport: (cashboxId, date) => get(`${BASE}/${cashboxId}/daily-report`, { params: { date } }),
};
