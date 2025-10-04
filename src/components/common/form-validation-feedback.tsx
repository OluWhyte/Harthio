'use client';

import { AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ValidationFeedbackProps {
  type: 'error' | 'success' | 'warning' | 'info';
  message: string;
  className?: string;
}

export function ValidationFeedback({ type, message, className }: ValidationFeedbackProps) {
  const icons = {
    error: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    error: 'text-destructive',
    success: 'text-green-600',
    warning: 'text-orange-600',
    info: 'text-blue-600'
  };

  const bgColors = {
    error: 'bg-destructive/10 border-destructive/20',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200'
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      'flex items-center gap-2 p-3 rounded-md border text-sm',
      bgColors[type],
      className
    )}>
      <Icon className={cn('h-4 w-4 flex-shrink-0', colors[type])} />
      <span className={colors[type]}>{message}</span>
    </div>
  );
}

interface CharacterCountProps {
  current: number;
  max: number;
  className?: string;
}

export function CharacterCount({ current, max, className }: CharacterCountProps) {
  const percentage = (current / max) * 100;
  const isNearLimit = percentage > 80;
  const isOverLimit = current > max;

  return (
    <div className={cn(
      'text-xs flex items-center justify-between',
      isOverLimit ? 'text-destructive' : isNearLimit ? 'text-orange-600' : 'text-muted-foreground',
      className
    )}>
      <span>{current}/{max} characters</span>
      {isOverLimit && (
        <span className="text-destructive font-medium">
          {current - max} over limit
        </span>
      )}
    </div>
  );
}

interface FieldValidationProps {
  error?: string;
  success?: string;
  warning?: string;
  info?: string;
  characterCount?: {
    current: number;
    max: number;
  };
  className?: string;
}

export function FieldValidation({ 
  error, 
  success, 
  warning, 
  info, 
  characterCount,
  className 
}: FieldValidationProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {error && <ValidationFeedback type="error" message={error} />}
      {success && <ValidationFeedback type="success" message={success} />}
      {warning && <ValidationFeedback type="warning" message={warning} />}
      {info && <ValidationFeedback type="info" message={info} />}
      {characterCount && (
        <CharacterCount 
          current={characterCount.current} 
          max={characterCount.max} 
        />
      )}
    </div>
  );
}

interface FormValidationSummaryProps {
  errors: Record<string, string>;
  className?: string;
}

export function FormValidationSummary({ errors, className }: FormValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;
  
  if (errorCount === 0) return null;

  return (
    <div className={cn(
      'p-4 rounded-md border border-destructive/20 bg-destructive/10',
      className
    )}>
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="font-medium text-destructive">
          Please fix {errorCount} error{errorCount > 1 ? 's' : ''} below:
        </span>
      </div>
      <ul className="space-y-1 text-sm text-destructive">
        {Object.entries(errors).map(([field, error]) => (
          <li key={field} className="flex items-start gap-2">
            <span className="font-medium capitalize">{field}:</span>
            <span>{error}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface RealTimeValidationProps {
  value: string;
  validator: (value: string) => { isValid: boolean; error?: string; warning?: string; };
  debounceMs?: number;
  className?: string;
}

export function RealTimeValidation({ 
  value, 
  validator, 
  debounceMs = 300,
  className 
}: RealTimeValidationProps) {
  const [validationResult, setValidationResult] = React.useState<{
    isValid: boolean;
    error?: string;
    warning?: string;
  }>({ isValid: true });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (value.trim()) {
        const result = validator(value);
        setValidationResult(result);
      } else {
        setValidationResult({ isValid: true });
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validator, debounceMs]);

  if (validationResult.isValid && !validationResult.warning) {
    return null;
  }

  return (
    <div className={className}>
      {validationResult.error && (
        <ValidationFeedback type="error" message={validationResult.error} />
      )}
      {validationResult.warning && (
        <ValidationFeedback type="warning" message={validationResult.warning} />
      )}
    </div>
  );
}

// Import React for the RealTimeValidation component
import React from 'react';