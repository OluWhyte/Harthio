'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { parseError, withRetry, ErrorType, logError } from '@/lib/error-utils';

interface UseErrorHandlerOptions {
  context?: string;
  showToast?: boolean;
  logErrors?: boolean;
}

interface ErrorState {
  error: Error | null;
  isRetrying: boolean;
  retryCount: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const { context = 'Unknown', showToast = true, logErrors = true } = options;
  const { toast } = useToast();
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    isRetrying: false,
    retryCount: 0
  });

  const handleError = useCallback((error: unknown, additionalData?: Record<string, any>) => {
    const errorDetails = parseError(error);
    
    if (logErrors) {
      logError(context, error, additionalData);
    }
    
    if (showToast) {
      toast({
        title: errorDetails.title,
        description: errorDetails.message,
        variant: 'destructive',
        duration: errorDetails.actionable ? 8000 : 5000
      });
    }
    
    setErrorState(prev => ({
      error: error instanceof Error ? error : new Error(String(error)),
      isRetrying: false,
      retryCount: prev.retryCount
    }));
    
    return errorDetails;
  }, [context, showToast, logErrors, toast]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    operationName?: string,
    errorType?: ErrorType
  ): Promise<T> => {
    setErrorState(prev => ({ ...prev, isRetrying: true, error: null }));
    
    try {
      const result = await withRetry(operation, errorType);
      setErrorState({ error: null, isRetrying: false, retryCount: 0 });
      return result;
    } catch (error) {
      setErrorState(prev => ({
        error: error instanceof Error ? error : new Error(String(error)),
        isRetrying: false,
        retryCount: prev.retryCount + 1
      }));
      
      handleError(error, { operationName, retryCount: errorState.retryCount + 1 });
      throw error;
    }
  }, [handleError, errorState.retryCount]);

  const clearError = useCallback(() => {
    setErrorState({ error: null, isRetrying: false, retryCount: 0 });
  }, []);

  const retry = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    return executeWithRetry(operation, 'retry');
  }, [executeWithRetry]);

  return {
    handleError,
    executeWithRetry,
    clearError,
    retry,
    error: errorState.error,
    isRetrying: errorState.isRetrying,
    retryCount: errorState.retryCount,
    hasError: errorState.error !== null
  };
}

// Specialized hooks for different contexts
export function useRequestErrorHandler() {
  return useErrorHandler({
    context: 'Request Management',
    showToast: true,
    logErrors: true
  });
}

export function useTopicErrorHandler() {
  return useErrorHandler({
    context: 'Topic Management',
    showToast: true,
    logErrors: true
  });
}

export function useSessionErrorHandler() {
  return useErrorHandler({
    context: 'Session Management',
    showToast: true,
    logErrors: true
  });
}