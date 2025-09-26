import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if ((error as any)?.response?.status >= 400 && (error as any)?.response?.status < 500) {
          return false
        }
        return failureCount < 3
      }
    },
    mutations: {
      retry: 1
    }
  }
});

// declare global {
//   interface Window {
//     __TANSTACK_QUERY_CLIENT__:
//       import("@tanstack/query-core").QueryClient;
//   }
// }

// window.__TANSTACK_QUERY_CLIENT__ = queryClient;
