// ============================================================================
// TIMEOUT UTILITIES
// ============================================================================
// Comprehensive timeout utilities to prevent hanging operations across the app
// Provides consistent timeout handling for all async operations
// ============================================================================

import { mobileOptimizer } from './mobile-optimizations';

export interface TimeoutConfig {
  operation: string;
  baseTimeout: number;
  retryMultiplier?: number;
  maxTimeout?: number;
}

export class TimeoutError extends Error {
  constructor(operation: string, timeout: number) {
    super(`Operation '${operation}' timed out after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * Wraps a promise with a timeout that adapts to device capabilities
 */
export function withTimeout<T>(
  promise: Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { operation, baseTimeout, retryMultiplier = 1, maxTimeout = 60000 } = config;
  
  // Get device-optimized timeout
  const optimizedTimeout = Math.min(
    mobileOptimizer.getOptimizedTimeout(baseTimeout * retryMultiplier),
    maxTimeout
  );

  return new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new TimeoutError(operation, optimizedTimeout));
    }, optimizedTimeout);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Creates an AbortController with automatic timeout
 */
export function createTimeoutController(timeout: number): {
  controller: AbortController;
  timeoutId: NodeJS.Timeout;
} {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  return { controller, timeoutId };
}

/**
 * Wraps fetch requests with timeout and abort signal
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<Response> {
  const { timeout = 10000, ...fetchOptions } = options;
  
  const optimizedTimeout = mobileOptimizer.getOptimizedTimeout(timeout);
  const { controller, timeoutId } = createTimeoutController(optimizedTimeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new TimeoutError(`fetch to ${url}`, optimizedTimeout);
    }
    
    throw error;
  }
}

/**
 * Database operation timeout configurations
 */
export const DB_TIMEOUTS = {
  SELECT: { operation: 'database_select', baseTimeout: 8000 },
  INSERT: { operation: 'database_insert', baseTimeout: 10000 },
  UPDATE: { operation: 'database_update', baseTimeout: 12000 },
  DELETE: { operation: 'database_delete', baseTimeout: 8000 },
  COMPLEX_QUERY: { operation: 'database_complex', baseTimeout: 15000 },
} as const;

/**
 * Auth operation timeout configurations
 */
export const AUTH_TIMEOUTS = {
  LOGIN: { operation: 'auth_login', baseTimeout: 20000 },
  SIGNUP: { operation: 'auth_signup', baseTimeout: 25000 },
  LOGOUT: { operation: 'auth_logout', baseTimeout: 10000 },
  PASSWORD_RESET: { operation: 'auth_password_reset', baseTimeout: 15000 },
  SESSION_REFRESH: { operation: 'auth_session_refresh', baseTimeout: 10000 },
} as const;

/**
 * WebRTC operation timeout configurations
 */
export const WEBRTC_TIMEOUTS = {
  MEDIA_ACCESS: { operation: 'webrtc_media_access', baseTimeout: 15000 },
  PEER_CONNECTION: { operation: 'webrtc_peer_connection', baseTimeout: 20000 },
  ICE_GATHERING: { operation: 'webrtc_ice_gathering', baseTimeout: 10000 },
  SIGNALING: { operation: 'webrtc_signaling', baseTimeout: 8000 },
} as const;

/**
 * API operation timeout configurations
 */
export const API_TIMEOUTS = {
  STANDARD: { operation: 'api_standard', baseTimeout: 10000 },
  UPLOAD: { operation: 'api_upload', baseTimeout: 30000 },
  VALIDATION: { operation: 'api_validation', baseTimeout: 8000 },
  NOTIFICATION: { operation: 'api_notification', baseTimeout: 5000 },
} as const;

/**
 * Utility function to wrap Supabase operations with timeout
 * Uses Promise.race since Supabase doesn't support AbortController
 */
export function withDatabaseTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { operation: operationName, baseTimeout, retryMultiplier = 1, maxTimeout = 60000 } = config;
  
  // Get device-optimized timeout
  const optimizedTimeout = Math.min(
    mobileOptimizer.getOptimizedTimeout(baseTimeout * retryMultiplier),
    maxTimeout
  );

  const timeoutPromise = new Promise<never>((_, reject) => 
    setTimeout(() => reject(new TimeoutError(operationName, optimizedTimeout)), optimizedTimeout)
  );

  return Promise.race([operation(), timeoutPromise]);
}

/**
 * Utility function to wrap auth operations with timeout
 */
export function withAuthTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  return withTimeout(operation(), config);
}

/**
 * Utility function to wrap WebRTC operations with timeout
 */
export function withWebRTCTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  return withTimeout(operation(), config);
}

/**
 * Utility function to create a timeout promise for racing
 */
export function createTimeoutPromise(timeout: number, operation: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(operation, timeout));
    }, timeout);
  });
}

/**
 * Batch timeout utility for multiple operations
 */
export async function withBatchTimeout<T>(
  operations: Array<() => Promise<T>>,
  config: TimeoutConfig & { maxConcurrent?: number }
): Promise<T[]> {
  const { maxConcurrent = 3 } = config;
  
  // Process operations in batches to prevent overwhelming the system
  const results: T[] = [];
  
  for (let i = 0; i < operations.length; i += maxConcurrent) {
    const batch = operations.slice(i, i + maxConcurrent);
    const batchPromises = batch.map(op => withTimeout(op(), config));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Retry with exponential backoff and timeout
 */
export async function retryWithTimeout<T>(
  operation: () => Promise<T>,
  config: TimeoutConfig & {
    maxRetries?: number;
    backoffMultiplier?: number;
    shouldRetry?: (error: any) => boolean;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    backoffMultiplier = 1.5,
    shouldRetry = () => true,
  } = config;

  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const timeoutConfig = {
        ...config,
        retryMultiplier: Math.pow(backoffMultiplier, attempt - 1),
      };
      
      return await withTimeout(operation(), timeoutConfig);
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries || !shouldRetry(error)) {
        throw error;
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(backoffMultiplier, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * React hook for timeout management
 */
export function useTimeout() {
  const createTimeout = (callback: () => void, delay: number) => {
    const optimizedDelay = mobileOptimizer.getOptimizedTimeout(delay);
    return setTimeout(callback, optimizedDelay);
  };

  const createInterval = (callback: () => void, delay: number) => {
    const optimizedDelay = mobileOptimizer.getOptimizedTimeout(delay);
    return setInterval(callback, optimizedDelay);
  };

  return {
    createTimeout,
    createInterval,
    withTimeout,
    withDatabaseTimeout,
    withAuthTimeout,
    withWebRTCTimeout,
  };
}