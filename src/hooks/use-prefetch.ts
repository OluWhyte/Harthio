/**
 * Prefetching Hook for Navigation Optimization
 * Phase 2 Performance Optimization
 */

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Prefetch routes based on user context
 */
export function usePrefetchRoutes(isAuthenticated: boolean) {
  const router = useRouter();
  
  useEffect(() => {
    if (isAuthenticated) {
      // Prefetch authenticated routes
      router.prefetch('/dashboard');
      router.prefetch('/harthio');
      router.prefetch('/sessions');
      router.prefetch('/profile');
    } else {
      // Prefetch public routes
      router.prefetch('/login');
      router.prefetch('/signup');
    }
  }, [isAuthenticated, router]);
}

/**
 * Prefetch route on hover (for links)
 */
export function usePrefetchOnHover(href: string) {
  const router = useRouter();
  
  const handleMouseEnter = () => {
    router.prefetch(href);
  };
  
  return { onMouseEnter: handleMouseEnter };
}

/**
 * Predictive prefetching based on user behavior
 */
export function usePredictivePrefetch(currentPath: string) {
  const router = useRouter();
  
  useEffect(() => {
    // Prefetch likely next pages based on current location
    const prefetchMap: Record<string, string[]> = {
      '/': ['/signup', '/login', '/features'],
      '/login': ['/dashboard', '/signup'],
      '/signup': ['/dashboard'],
      '/dashboard': ['/harthio', '/sessions', '/profile'],
      '/harthio': ['/dashboard', '/sessions'],
      '/sessions': ['/dashboard', '/harthio'],
    };
    
    const routesToPrefetch = prefetchMap[currentPath] || [];
    routesToPrefetch.forEach(route => router.prefetch(route));
  }, [currentPath, router]);
}
