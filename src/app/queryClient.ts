import { QueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes
const GC_TIME = 10 * 60 * 1000; // 10 minutes (formerly cacheTime)

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE_TIME,
      gcTime: GC_TIME,
      retry: (failureCount: number, error: Error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.message?.includes('4') || error?.message?.includes('Unauthorized')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: 'always',
      networkMode: 'online',
    },
    mutations: {
      retry: false,
      networkMode: 'online',
      onError: (error: Error) => {
        toast.error(error?.message || 'An error occurred while processing your request');
      },
    },
  },
});

export default queryClient;