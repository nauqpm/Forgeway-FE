"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Singleton pattern - same instance across the app
let _queryClient: QueryClient | undefined = undefined;

function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

export function getQueryClient(): QueryClient {
  if (!_queryClient) {
    _queryClient = createQueryClient();
  }
  return _queryClient;
}

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => {
    if (!_queryClient) {
      _queryClient = createQueryClient();
    }
    return _queryClient;
  });

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
