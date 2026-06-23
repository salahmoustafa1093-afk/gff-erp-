import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import { toast } from 'react-toastify';
import Cookies from 'js-cookie';
import { store } from './store';
import { clearCredentials } from './slices/authSlice';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      paramsSerializer: (params) => {
        const parts: string[] = [];
        Object.entries(params).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (Array.isArray(value)) {
            value.forEach((v) => {
              parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
            });
          } else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
          }
        });
        return parts.join('&');
      },
    });

    this.setupRequestInterceptors();
    this.setupResponseInterceptors();
  }

  private setupRequestInterceptors(): void {
    // Request interceptor - attach JWT token
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = Cookies.get('auth_token');
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );

    // Request interceptor - attach branch header
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const state = store.getState();
        const currentBranch = state.branch.currentBranch;
        if (currentBranch?.id) {
          config.headers = config.headers || {};
          config.headers['X-Branch-Id'] = String(currentBranch.id);
        }
        return config;
      },
      (error: AxiosError) => {
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptors(): void {
    // Response interceptor - handle 401 unauthorized
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
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
          const message =
            (error.response.data as { message?: string })?.message || 'Resource not found';
          toast.error(message);
          return Promise.reject(error);
        }

        if (error.response?.status === 422) {
          const errors = (error.response.data as { errors?: Record<string, string[]> })?.errors;
          if (errors) {
            Object.values(errors).forEach((fieldErrors) => {
              fieldErrors.forEach((err) => toast.error(err));
            });
          } else {
            const message =
              (error.response.data as { message?: string })?.message || 'Validation error';
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

        const errorMessage =
          (error.response.data as { message?: string })?.message ||
          'An unexpected error occurred';
        toast.error(errorMessage);

        return Promise.reject(error);
      }
    );
  }

  getClient(): AxiosInstance {
    return this.client;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiService = new ApiService();

export const api = apiService.getClient();

export default apiService;