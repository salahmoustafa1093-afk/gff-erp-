import axios from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { store } from './store';
import { clearCredentials } from './slices/authSlice';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
class ApiService {
    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            paramsSerializer: (params) => {
                const parts = [];
                Object.entries(params).forEach(([key, value]) => {
                    if (value === undefined || value === null)
                        return;
                    if (Array.isArray(value)) {
                        value.forEach((v) => {
                            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
                        });
                    }
                    else {
                        parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
                    }
                });
                return parts.join('&');
            },
        });
        this.setupRequestInterceptors();
        this.setupResponseInterceptors();
    }
    setupRequestInterceptors() {
        // Request interceptor - attach JWT token
        this.client.interceptors.request.use((config) => {
            const token = Cookies.get('auth_token');
            if (token) {
                config.headers = config.headers || {};
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // Request interceptor - attach branch header
        this.client.interceptors.request.use((config) => {
            const state = store.getState();
            const currentBranch = state.branch.currentBranch;
            if (currentBranch?.id) {
                config.headers = config.headers || {};
                config.headers['X-Branch-Id'] = String(currentBranch.id);
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
    }
    setupResponseInterceptors() {
        // Response interceptor - handle 401 unauthorized
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                store.dispatch(clearCredentials());
                Cookies.remove('auth_token');
                Cookies.remove('refresh_token');
                window.location.href = '/login';
                return Promise.reject(error);
            }
            if (error.response?.status === 403) {
                toast.error('You do not have permission to perform this action');
                return Promise.reject(error);
            }
            if (error.response?.status === 404) {
                const message = error.response.data?.message || 'Resource not found';
                toast.error(message);
                return Promise.reject(error);
            }
            if (error.response?.status === 422) {
                const errors = error.response.data?.errors;
                if (errors) {
                    Object.values(errors).forEach((fieldErrors) => {
                        fieldErrors.forEach((err) => toast.error(err));
                    });
                }
                else {
                    const message = error.response.data?.message || 'Validation error';
                    toast.error(message);
                }
                return Promise.reject(error);
            }
            if (error.response?.status >= 500) {
                toast.error('Server error. Please try again later or contact support.');
                return Promise.reject(error);
            }
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timed out. Please check your connection and try again.');
                return Promise.reject(error);
            }
            if (!error.response) {
                toast.error('Network error. Please check your connection.');
                return Promise.reject(error);
            }
            const errorMessage = error.response.data?.message ||
                'An unexpected error occurred';
            toast.error(errorMessage);
            return Promise.reject(error);
        });
    }
    getClient() {
        return this.client;
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async patch(url, data, config) {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
}
export const apiService = new ApiService();
export const api = apiService.getClient();
export default apiService;
