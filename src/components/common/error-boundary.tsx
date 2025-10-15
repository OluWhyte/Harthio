'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { performanceMonitor } from '@/lib/performance-monitor';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRecovering: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;
  private recoveryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Log to performance monitor
    performanceMonitor.startTiming('error_recovery', {
      errorName: error.name,
      errorMessage: error.message,
      componentStack: errorInfo.componentStack
    });

    // Call custom error handler
    this.props.onError?.(error, errorInfo);

    // Send to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_parameters: {
          error_boundary: true,
          component_stack: errorInfo.componentStack?.substring(0, 500)
        }
      });
    }
  }

  handleRetry = () => {
    if (this.retryCount >= this.maxRetries) {
      console.warn('Max retry attempts reached');
      return;
    }

    this.retryCount++;
    this.setState({ isRecovering: true });

    // Clear any existing timeout
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }

    // Attempt recovery after a delay
    this.recoveryTimeout = setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRecovering: false
      });

      performanceMonitor.endTiming('error_recovery');
    }, 1000);
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleRefreshPage = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error, isRecovering } = this.state;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-semibold text-gray-900">
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm text-gray-600 text-center">
                {error?.message === 'ChunkLoadError' || error?.message?.includes('Loading chunk') ? (
                  <p>
                    There was a problem loading the application. This usually happens when the app has been updated.
                  </p>
                ) : error?.message?.includes('timeout') || error?.message?.includes('hanging') ? (
                  <p>
                    The operation took too long to complete. This might be due to a slow network connection or device performance.
                  </p>
                ) : (
                  <p>
                    An unexpected error occurred. Don't worry, this has been logged and we're working to fix it.
                  </p>
                )}
              </div>

              {process.env.NODE_ENV === 'development' && error && (
                <details className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                  <summary className="cursor-pointer font-medium">Error Details</summary>
                  <pre className="mt-2 whitespace-pre-wrap break-words">
                    {error.name}: {error.message}
                    {error.stack && `\n\nStack trace:\n${error.stack}`}
                  </pre>
                </details>
              )}

              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button
                    onClick={this.handleRetry}
                    disabled={isRecovering}
                    className="w-full"
                  >
                    {isRecovering ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Recovering...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Try Again ({this.maxRetries - this.retryCount} attempts left)
                      </>
                    )}
                  </Button>
                )}

                <Button
                  onClick={this.handleRefreshPage}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  onClick={this.handleGoHome}
                  variant="ghost"
                  className="w-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              <div className="text-xs text-gray-400 text-center">
                If this problem persists, please contact support.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }

  componentWillUnmount() {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
    }
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Topic-specific error boundary
export function TopicErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Topic error:', error, errorInfo);
        // Additional topic-specific error handling
      }}
      fallback={
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800 text-sm">
            Unable to load this session. Please try refreshing the page.
          </p>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Request-specific error boundary
export function RequestErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Request error:', error, errorInfo);
        // Additional request-specific error handling
      }}
      fallback={
        <div className="container mx-auto p-6">
          <div className="p-4 border border-red-200 rounded-lg bg-red-50">
            <h2 className="text-red-800 font-semibold mb-2">Unable to load requests</h2>
            <p className="text-red-700 text-sm">
              There was an error loading your join requests. Please try refreshing the page.
            </p>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Hook for error reporting
export function useErrorHandler() {
  const reportError = React.useCallback((error: Error, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);
    
    // Log to performance monitor
    performanceMonitor.startTiming('manual_error_report', {
      errorName: error.name,
      errorMessage: error.message,
      context
    });

    // Send to analytics if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.message,
        fatal: false,
        custom_parameters: {
          manual_report: true,
          context: context || 'unknown'
        }
      });
    }
  }, []);

  return { reportError };
}