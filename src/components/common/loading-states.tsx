'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Loader2, Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="text-center">
        <Loader2 className={`${sizeClasses[size]} animate-spin mx-auto mb-2`} />
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
    </div>
  );
}

export function TopicCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex gap-4">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function RequestCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-16 w-full" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

interface ConnectionStatusProps {
  isOnline: boolean;
  className?: string;
}

export function ConnectionStatus({ isOnline, className = '' }: ConnectionStatusProps) {
  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {isOnline ? (
        <>
          <Wifi className="h-4 w-4 text-green-500" />
          <span className="text-green-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4 text-destructive" />
          <span className="text-destructive">Offline</span>
        </>
      )}
    </div>
  );
}

interface RetryIndicatorProps {
  isRetrying: boolean;
  retryCount: number;
  maxRetries?: number;
  className?: string;
}

export function RetryIndicator({ 
  isRetrying, 
  retryCount, 
  maxRetries = 3, 
  className = '' 
}: RetryIndicatorProps) {
  if (!isRetrying && retryCount === 0) return null;

  return (
    <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
      {isRetrying && <Loader2 className="h-4 w-4 animate-spin" />}
      <span>
        {isRetrying 
          ? `Retrying... (${retryCount}/${maxRetries})`
          : `Retry attempt ${retryCount}/${maxRetries}`
        }
      </span>
    </div>
  );
}

export function EmptyState({ 
  title, 
  description, 
  icon: Icon,
  action 
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  action?: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-6 text-center">
        <Icon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4">{description}</p>
        {action}
      </CardContent>
    </Card>
  );
}

interface ProgressIndicatorProps {
  progress: number;
  label?: string;
  className?: string;
}

export function ProgressIndicator({ progress, label, className = '' }: ProgressIndicatorProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {Math.round(progress)}%
      </p>
    </div>
  );
}

interface ActionLoadingProps {
  isLoading: boolean;
  loadingText: string;
  children: React.ReactNode;
  className?: string;
  showProgress?: boolean;
  progress?: number;
  error?: string | null;
  onRetry?: () => void;
}

export function ActionLoading({ 
  isLoading, 
  loadingText, 
  children, 
  className = '',
  showProgress = false,
  progress = 0,
  error = null,
  onRetry
}: ActionLoadingProps) {
  return (
    <div className={`relative ${className}`}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center gap-2 text-sm">
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{loadingText}</span>
            </div>
            {showProgress && (
              <div className="w-32 bg-muted rounded-full h-1">
                <div 
                  className="bg-primary h-1 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {error && !isLoading && (
        <div className="absolute inset-0 bg-background/90 backdrop-blur-sm flex items-center justify-center rounded-md">
          <div className="flex flex-col items-center gap-2 text-sm text-center p-4">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <span className="text-destructive">{error}</span>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Try Again
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface LoadingOverlayProps {
  isVisible: boolean;
  message?: string;
  progress?: number;
  className?: string;
}

export function LoadingOverlay({ 
  isVisible, 
  message = 'Loading...', 
  progress,
  className = '' 
}: LoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}>
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <div className="space-y-2">
            <p className="font-medium">{message}</p>
            {progress !== undefined && (
              <ProgressIndicator progress={progress} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface SkeletonListProps {
  count: number;
  itemHeight?: string;
  className?: string;
}

export function SkeletonList({ count, itemHeight = 'h-16', className = '' }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${itemHeight} bg-muted animate-pulse rounded-md`} />
      ))}
    </div>
  );
}

interface PulsingDotProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'green' | 'orange' | 'red';
  className?: string;
}

export function PulsingDot({ size = 'md', color = 'primary', className = '' }: PulsingDotProps) {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const colorClasses = {
    primary: 'bg-primary',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    red: 'bg-red-500'
  };

  return (
    <div className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse ${className}`} />
  );
}