// ============================================
// GFF ERP - Bank API Service
// ============================================
import { get, post, put, patch, del } from './api';
const BASE = '/banks';
export const bankService = {
    getAccounts: (params) => get(`${BASE}/accounts`, { params }),
    getAccountById: (id) => get(`${BASE}/accounts/${id}`),
    createAccount: (data) => post(`${BASE}/accounts`, data),
    updateAccount: (id, data) => put(`${BASE}/accounts/${id}`, data),
    deleteAccount: (id) => del(`${BASE}/accounts/${id}`),
    toggleAccountStatus: (id) => patch(`${BASE}/accounts/${id}/toggle-status`, {}),
    getTransactions: (bankAccountId, params) => get(`${BASE}/accounts/${bankAccountId}/transactions`, { params }),
    createTransaction: (bankAccountId, data) => post(`${BASE}/accounts/${bankAccountId}/transactions`, data),
    getReconciliations: (bankAccountId) => get(`${BASE}/accounts/${bankAccountId}/reconciliations`),
    getReconciliationById: (id) => get(`${BASE}/reconciliations/${id}`),
    createReconciliation: (bankAccountId, statementDate, statementBalance) => post(`${BASE}/reconciliations`, { bankAccountId, statementDate, statementBalance }),
    matchTransaction: (reconciliationId, bankTransactionId, systemTransactionId) => patch(`${BASE}/reconciliations/${reconciliationId}/match`, { bankTransactionId, systemTransactionId }),
    unmatchTransaction: (reconciliationId, itemId) => patch(`${BASE}/reconciliations/${reconciliationId}/unmatch`, { itemId }),
    completeReconciliation: (reconciliationId) => patch(`${BASE}/reconciliations/${reconciliationId}/complete`, {}),
};
