/**
 * Performance Optimization Utilities
 * Phase 2 - React.memo and useMemo helpers
 */

import { memo, useMemo, useCallback } from 'react';

/**
 * Deep comparison for React.memo
 * Use sparingly - only for complex objects
 */
export function deepEqual(prevProps: any, nextProps: any): boolean {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
}

/**
 * Shallow comparison for React.memo (default behavior)
 * More performant than deep comparison
 */
export function shallowEqual(prevProps: any, nextProps: any): boolean {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  for (const key of prevKeys) {
    if (prevProps[key] !== nextProps[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Memoize expensive calculations
 */
export function useMemoizedValue<T>(factory: () => T, deps: React.DependencyList): T {
  return useMemo(factory, deps);
}

/**
 * Memoize callback functions
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

/**
 * Format time breakdown - memoized
 */
export function useFormattedTime(startDate: Date) {
  return useMemo(() => {
    const now = new Date();
    const diff = now.getTime() - startDate.getTime();
    
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);
    
    return {
      months,
      days: days % 30,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
      totalDays: days,
    };
  }, [startDate]);
}

/**
 * Debounce hook for performance
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle hook for performance
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = React.useRef(Date.now());

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
}

// Import React for hooks
import * as React from 'react';
