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

  const handleError = useCallback((error: unknown, additionalData?: Record<string, any> & { silent?: boolean }) => {
    const errorDetails = parseError(error);
    const isSilent = additionalData?.silent === true;
    
    if (logErrors) {
      logError(context, error, additionalData);
    }
    
    if (showToast && !isSilent) {
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
      // Add timeout protection to retry operations
      const operationPromise = withRetry(operation, errorType);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout during retry')), 30000)
      );
      
      const result = await Promise.race([operationPromise, timeoutPromise]);
      setErrorState({ error: null, isRetrying: false, retryCount: 0 });
      return result;
    } catch (error: any) {
      const newRetryCount = errorState.retryCount + 1;
      
      // Prevent infinite retry loops
      if (newRetryCount > 5) {
        const maxRetriesError = new Error('Maximum retry attempts exceeded');
        setErrorState({
          error: maxRetriesError,
          isRetrying: false,
          retryCount: newRetryCount
        });
        handleError(maxRetriesError, { operationName, retryCount: newRetryCount });
        throw maxRetriesError;
      }
      
      setErrorState(prev => ({
        error: error instanceof Error ? error : new Error(String(error)),
        isRetrying: false,
        retryCount: newRetryCount
      }));
      
      handleError(error, { operationName, retryCount: newRetryCount });
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
    showToast: false, // Silent by default for timeline
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