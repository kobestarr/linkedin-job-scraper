'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useRef } from 'react';

// Module-level QueryClient instance to ensure stability across renders and HMR
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30 seconds
      refetchOnWindowFocus: false,
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Singleton QueryClient for the module (safe for SSR/SSG)
let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // Server: always make a new query client
    return createQueryClient();
  }
  // Browser: make a new query client if we don't already have one
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Use ref to ensure QueryClient is only created once, even with StrictMode
  const queryClientRef = useRef<QueryClient | null>(null);
  
  if (!queryClientRef.current) {
    queryClientRef.current = getQueryClient();
  }

  return (
    <QueryClientProvider client={queryClientRef.current}>
      {children}
    </QueryClientProvider>
  );
}
