"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { logger } from "@/lib/logger";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ToastContainer } from "@/components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Set up global error handler for React Query
  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event?.type === 'updated' && event.query.state.status === 'error') {
        logger.error(
          "React Query error",
          event.query.state.error as Error,
          { queryKey: event.query.queryKey }
        );
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Set up mutation error handler
  useEffect(() => {
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === 'updated' && event.mutation.state.status === 'error') {
        logger.error(
          "React Query mutation error",
          event.mutation.state.error as Error,
          { mutationKey: event.mutation.options.mutationKey }
        );
      }
    });

    return () => unsubscribe();
  }, [queryClient]);

  // Initialize logging on mount
  useEffect(() => {
    // Log page view on initial load
    logger.logPageView(window.location.pathname);

    // Log route changes
    const handleRouteChange = () => {
      logger.logPageView(window.location.pathname);
    };

    // Listen for route changes (Next.js doesn't have built-in events, 
    // so we use popstate for browser navigation)
    window.addEventListener('popstate', handleRouteChange);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  // Handle unhandled promise rejections
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      logger.error(
        "Unhandled promise rejection",
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        { type: 'unhandledrejection' }
      );
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {children}
        <ToastContainer />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
