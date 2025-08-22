import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// Lazy-load devtools only when enabled to avoid bloating vendor
const DevtoolsLazy = React.lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })));
import { shouldRetry } from '../../lib/utils/api';
import { config, isDevelopment } from '../../config/environment';

interface QueryProviderProps {
  children: React.ReactNode;
}

// Create optimized query client with better defaults
const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: shouldRetry,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchInterval: false,
      },
      mutations: {
        retry: 1,
        onError: (error) => {
          console.error('Mutation error:', error);
        },
      },
    },
  });
};

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  // Memoize query client to prevent recreation
  const queryClient = useMemo(() => createQueryClient(), []);

  const isDevToolsEnabled = useMemo(() => 
    isDevelopment && config.features.devTools, 
    []
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDevToolsEnabled && (
        <React.Suspense fallback={null}>
          <DevtoolsLazy
            initialIsOpen={false}
            buttonPosition="bottom-right"
          />
        </React.Suspense>
      )}
    </QueryClientProvider>
  );
};