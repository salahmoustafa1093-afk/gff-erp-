// ============================================
// GFF ERP - Settings API Service
// ============================================
import { get, post, put } from './api';
import type { CompanySettings, UserProfile, ActivityLogEntry, ApiResponse } from '../types';

const BASE = '/settings';

export const settingsService = {
  getCompanySettings: (): Promise<CompanySettings> =>
    get<CompanySettings>(`${BASE}/company`),

  updateCompanySettings: (data: Partial<CompanySettings>): Promise<CompanySettings> =>
    put<CompanySettings>(`${BASE}/company`, data),

  uploadLogo: (file: File): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append('logo', file);
    return post(`${BASE}/company/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getUserProfile: (): Promise<UserProfile> =>
    get<UserProfile>(`${BASE}/profile`),

  updateUserProfile: (data: Partial<UserProfile>): Promise<UserProfile> =>
    put<UserProfile>(`${BASE}/profile`, data),

  changePassword: (oldPassword: string, newPassword: string): Promise<void> =>
    put(`${BASE}/profile/password`, { oldPassword, newPassword }),

  getActivityLog: (params?: { page?: number; pageSize?: number }) =>
    get<ApiResponse<ActivityLogEntry>>(`${BASE}/profile/activity`, { params }),

  getBranches: () =>
    get<ApiResponse<{ id: string; code: string; name: string }>>(`${BASE}/branches`),

  getCostCenters: () =>
    get<ApiResponse<{ id: string; code: string; name: string }>>(`${BASE}/cost-centers`),
};
