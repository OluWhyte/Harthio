import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

export function LoadingSpinner({ 
  size = 'md', 
  text = 'Loading...', 
  fullScreen = true,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  const content = (
    <div className="flex flex-col items-center gap-3">
      <Loader2 className={cn('animate-spin text-primary', sizeClasses[size])} />
      {text && <p className="text-sm font-medium text-gray-600">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={cn('flex items-center justify-center min-h-screen', className)}>
        {content}
      </div>
    );
  }

  return content;
}
