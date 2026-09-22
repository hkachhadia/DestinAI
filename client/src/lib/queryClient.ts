import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      // 2-minute stale time for most data — balance freshness vs API calls
      staleTime: 2 * 60 * 1000,
      // Keep cache for 5 minutes even when unused
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});
