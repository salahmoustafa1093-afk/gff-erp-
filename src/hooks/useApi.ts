import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
  type QueryKey,
} from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiService } from '@/app/api';
import type { QueryParams, PaginatedResponse } from '@/types';

// ============================================
// Generic Query Hook
// ============================================

export function useApiQuery<T>(
  queryKey: QueryKey,
  url: string,
  params?: QueryParams,
  options?: Omit<UseQueryOptions<T, Error, T, QueryKey>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T, Error>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const queryString = params ? buildQueryString(params) : '';
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      return apiService.get<T>(fullUrl);
    },
    ...options,
  });
}

// ============================================
// Paginated Query Hook
// ============================================

export function usePaginatedQuery<T>(
  queryKey: QueryKey,
  url: string,
  params: QueryParams = {},
  options?: Omit<
    UseQueryOptions<PaginatedResponse<T>, Error, PaginatedResponse<T>, QueryKey>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<PaginatedResponse<T>, Error>({
    queryKey: [...queryKey, params],
    queryFn: async () => {
      const queryString = buildQueryString(params);
      const fullUrl = queryString ? `${url}?${queryString}` : url;
      return apiService.get<PaginatedResponse<T>>(fullUrl);
    },
    ...options,
  });
}

// ============================================
// Generic Mutation Hooks
// ============================================

export function useApiMutation<TData = unknown, TVariables = unknown>(
  method: 'post' | 'put' | 'patch' | 'delete',
  url: string,
  options?: Omit<UseMutationOptions<TData, Error, TVariables, unknown>, 'mutationFn'>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      switch (method) {
        case 'post':
          return apiService.post<TData>(url, variables);
        case 'put':
          return apiService.put<TData>(url, variables);
        case 'patch':
          return apiService.patch<TData>(url, variables);
        case 'delete':
          return apiService.delete<TData>(url);
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    },
    onError: (error) => {
      toast.error(error.message || 'An error occurred');
    },
    ...options,
    onSuccess: (data, variables, context) => {
      options?.onSuccess?.(data, variables, context);
    },
  });
}

// ============================================
// Optimistic Update Mutation
// ============================================

interface OptimisticMutationOptions<TData, TVariables> {
  url: string;
  method: 'post' | 'put' | 'patch' | 'delete';
  queryKey: QueryKey;
  onMutate?: (variables: TVariables) => TData | void;
  onError?: (error: Error, variables: TVariables, context: unknown) => void;
  onSuccess?: (data: TData, variables: TVariables) => void;
  invalidateKeys?: QueryKey[];
}

export function useOptimisticMutation<TData = unknown, TVariables = unknown>(
  options: OptimisticMutationOptions<TData, TVariables>
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: async (variables: TVariables) => {
      switch (options.method) {
        case 'post':
          return apiService.post<TData>(options.url, variables);
        case 'put':
          return apiService.put<TData>(options.url, variables);
        case 'patch':
          return apiService.patch<TData>(options.url, variables);
        case 'delete':
          return apiService.delete<TData>(options.url);
        default:
          throw new Error(`Unsupported method: ${options.method}`);
      }
    },
    onMutate: async (variables: TVariables) => {
      await queryClient.cancelQueries({ queryKey: options.queryKey });
      const previousData = queryClient.getQueryData(options.queryKey);

      if (options.onMutate) {
        const optimisticData = options.onMutate(variables);
        if (optimisticData) {
          queryClient.setQueryData(options.queryKey, optimisticData);
        }
      }

      return { previousData };
    },
    onError: (error: Error, variables: TVariables, context: unknown) => {
      const ctx = context as { previousData: unknown } | undefined;
      if (ctx?.previousData) {
        queryClient.setQueryData(options.queryKey, ctx.previousData);
      }
      toast.error(error.message || 'An error occurred');
      options.onError?.(error, variables, context);
    },
    onSuccess: (data: TData, variables: TVariables) => {
      options.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      queryClient.invalidateQueries({ queryKey: options.queryKey });
      options.onSuccess?.(data, variables);
    },
  });
}

// ============================================
// Create, Update, Delete Hooks
// ============================================

export function useCreate<TData = unknown, TVariables = Record<string, unknown>>(
  url: string,
  options?: {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
    onSuccess?: (data: TData) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: (data: TVariables) => apiService.post<TData>(url, data),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create');
    },
  });
}

export function useUpdate<TData = unknown, TVariables = Record<string, unknown>>(
  url: string,
  options?: {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
    onSuccess?: (data: TData) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: (data: TVariables) => apiService.put<TData>(url, data),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update');
    },
  });
}

export function usePatch<TData = unknown, TVariables = Record<string, unknown>>(
  url: string,
  options?: {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
    onSuccess?: (data: TData) => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables>({
    mutationFn: (data: TVariables) => apiService.patch<TData>(url, data),
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update');
    },
  });
}

export function useDelete<TData = unknown>(
  url: string,
  options?: {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
    onSuccess?: () => void;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, string>({
    mutationFn: (id: string) => apiService.delete<TData>(`${url}/${id}`),
    onSuccess: () => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      if (options?.successMessage) {
        toast.success(options.successMessage);
      }
      options?.onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete');
    },
  });
}

// ============================================
// Bulk Operations
// ============================================

export function useBulkDelete(
  url: string,
  options?: {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: number }, Error, string[]>({
    mutationFn: async (ids: string[]) => {
      return apiService.post<{ deleted: number }>(`${url}/bulk-delete`, { ids });
    },
    onSuccess: (data) => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      toast.success(options?.successMessage || `${data.deleted} items deleted successfully`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete items');
    },
  });
}

export function useBulkUpdate<TData = unknown>(
  url: string,
  options?: {
    invalidateKeys?: QueryKey[];
    successMessage?: string;
  }
) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, { ids: string[]; data: Record<string, unknown> }>({
    mutationFn: ({ ids, data }) => apiService.patch<TData>(`${url}/bulk-update`, { ids, data }),
    onSuccess: () => {
      options?.invalidateKeys?.forEach((key) => {
        queryClient.invalidateQueries({ queryKey: key });
      });
      toast.success(options?.successMessage || 'Items updated successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update items');
    },
  });
}

// ============================================
// Utility Functions
// ============================================

function buildQueryString(params: QueryParams): string {
  const parts: string[] = [];

  if (params.page !== undefined) parts.push(`page=${params.page}`);
  if (params.limit !== undefined) parts.push(`limit=${params.limit}`);
  if (params.sortBy) parts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.sortOrder) parts.push(`sortOrder=${params.sortOrder}`);
  if (params.search) parts.push(`search=${encodeURIComponent(params.search)}`);
  if (params.startDate) parts.push(`startDate=${encodeURIComponent(params.startDate)}`);
  if (params.endDate) parts.push(`endDate=${encodeURIComponent(params.endDate)}`);

  if (params.filters) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => parts.push(`${key}=${encodeURIComponent(String(v))}`));
        } else {
          parts.push(`${key}=${encodeURIComponent(String(value))}`);
        }
      }
    });
  }

  return parts.join('&');
}

// ============================================
// Export All
// ============================================

export default {
  useApiQuery,
  usePaginatedQuery,
  useApiMutation,
  useOptimisticMutation,
  useCreate,
  useUpdate,
  usePatch,
  useDelete,
  useBulkDelete,
  useBulkUpdate,
};