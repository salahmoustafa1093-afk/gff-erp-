import { useQuery, useMutation, useQueryClient, } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { apiService } from '@/app/api';
// ============================================
// Generic Query Hook
// ============================================
export function useApiQuery(queryKey, url, params, options) {
    return useQuery({
        queryKey: [...queryKey, params],
        queryFn: async () => {
            const queryString = params ? buildQueryString(params) : '';
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return apiService.get(fullUrl);
        },
        ...options,
    });
}
// ============================================
// Paginated Query Hook
// ============================================
export function usePaginatedQuery(queryKey, url, params = {}, options) {
    return useQuery({
        queryKey: [...queryKey, params],
        queryFn: async () => {
            const queryString = buildQueryString(params);
            const fullUrl = queryString ? `${url}?${queryString}` : url;
            return apiService.get(fullUrl);
        },
        ...options,
    });
}
// ============================================
// Generic Mutation Hooks
// ============================================
export function useApiMutation(method, url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variables) => {
            switch (method) {
                case 'post':
                    return apiService.post(url, variables);
                case 'put':
                    return apiService.put(url, variables);
                case 'patch':
                    return apiService.patch(url, variables);
                case 'delete':
                    return apiService.delete(url);
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
export function useOptimisticMutation(options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variables) => {
            switch (options.method) {
                case 'post':
                    return apiService.post(options.url, variables);
                case 'put':
                    return apiService.put(options.url, variables);
                case 'patch':
                    return apiService.patch(options.url, variables);
                case 'delete':
                    return apiService.delete(options.url);
                default:
                    throw new Error(`Unsupported method: ${options.method}`);
            }
        },
        onMutate: async (variables) => {
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
        onError: (error, variables, context) => {
            const ctx = context;
            if (ctx?.previousData) {
                queryClient.setQueryData(options.queryKey, ctx.previousData);
            }
            toast.error(error.message || 'An error occurred');
            options.onError?.(error, variables, context);
        },
        onSuccess: (data, variables) => {
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
export function useCreate(url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiService.post(url, data),
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
export function useUpdate(url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiService.put(url, data),
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
export function usePatch(url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => apiService.patch(url, data),
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
export function useDelete(url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => apiService.delete(`${url}/${id}`),
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
export function useBulkDelete(url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ids) => {
            return apiService.post(`${url}/bulk-delete`, { ids });
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
export function useBulkUpdate(url, options) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ ids, data }) => apiService.patch(`${url}/bulk-update`, { ids, data }),
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
function buildQueryString(params) {
    const parts = [];
    if (params.page !== undefined)
        parts.push(`page=${params.page}`);
    if (params.limit !== undefined)
        parts.push(`limit=${params.limit}`);
    if (params.sortBy)
        parts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
    if (params.sortOrder)
        parts.push(`sortOrder=${params.sortOrder}`);
    if (params.search)
        parts.push(`search=${encodeURIComponent(params.search)}`);
    if (params.startDate)
        parts.push(`startDate=${encodeURIComponent(params.startDate)}`);
    if (params.endDate)
        parts.push(`endDate=${encodeURIComponent(params.endDate)}`);
    if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '') {
                if (Array.isArray(value)) {
                    value.forEach((v) => parts.push(`${key}=${encodeURIComponent(String(v))}`));
                }
                else {
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
