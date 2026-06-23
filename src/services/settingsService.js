// ============================================
// GFF ERP - Settings API Service
// ============================================
import { get, post, put } from './api';
const BASE = '/settings';
export const settingsService = {
    getCompanySettings: () => get(`${BASE}/company`),
    updateCompanySettings: (data) => put(`${BASE}/company`, data),
    uploadLogo: (file) => {
        const formData = new FormData();
        formData.append('logo', file);
        return post(`${BASE}/company/logo`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getUserProfile: () => get(`${BASE}/profile`),
    updateUserProfile: (data) => put(`${BASE}/profile`, data),
    changePassword: (oldPassword, newPassword) => put(`${BASE}/profile/password`, { oldPassword, newPassword }),
    getActivityLog: (params) => get(`${BASE}/profile/activity`, { params }),
    getBranches: () => get(`${BASE}/branches`),
    getCostCenters: () => get(`${BASE}/cost-centers`),
};
