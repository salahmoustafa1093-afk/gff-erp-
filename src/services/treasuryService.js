// ============================================
// GFF ERP - Treasury API Service
// ============================================
import { get, post, put, patch } from './api';
const BASE = '/treasury';
export const treasuryService = {
    // Cash Position
    getCashPosition: () => get(`${BASE}/cash-position`),
    getBranchCashPosition: () => get(`${BASE}/branch-cash-position`),
    // Transfers
    getTransfers: (params) => get(`${BASE}/transfers`, { params }),
    getTransferById: (id) => get(`${BASE}/transfers/${id}`),
    createTransfer: (data) => post(`${BASE}/transfers`, data),
    updateTransfer: (id, data) => put(`${BASE}/transfers/${id}`, data),
    approveTransfer: (id) => patch(`${BASE}/transfers/${id}/approve`, {}),
    rejectTransfer: (id, reason) => patch(`${BASE}/transfers/${id}/reject`, { reason }),
    completeTransfer: (id) => patch(`${BASE}/transfers/${id}/complete`, {}),
    // Cash Transactions
    getCashTransactions: (params) => get(`${BASE}/cash-transactions`, { params }),
    // Bank Transactions
    getBankTransactions: (params) => get(`${BASE}/bank-transactions`, { params }),
};
