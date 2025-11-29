/**
 * SWR Configuration for Data Fetching and Caching
 * Implements Phase 2 Performance Optimization
 */

import { SWRConfiguration } from 'swr';

export const swrConfig: SWRConfiguration = {
  // Revalidation settings
  revalidateOnFocus: false, // Don't refetch when window regains focus
  revalidateOnReconnect: true, // Refetch when reconnecting
  dedupingInterval: 60000, // Dedupe requests within 1 minute
  
  // Cache settings
  focusThrottleInterval: 5000, // Throttle focus revalidation
  
  // Error handling
  shouldRetryOnError: true,
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  
  // Performance
  suspense: false, // Don't use suspense mode for now
  
  // Polling (disabled by default)
  refreshInterval: 0,
};

// Fetcher function for API calls
export async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);
  
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }
  
  return res.json();
}

// Supabase fetcher for direct queries
export async function supabaseFetcher<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await queryFn();
  
  if (error) {
    throw error;
  }
  
  if (!data) {
    throw new Error('No data returned');
  }
  
  return data;
}
