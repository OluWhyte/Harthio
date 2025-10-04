'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  validateFields, 
  ValidationResult, 
  EnhancedValidationResult,
  validateWithContext 
} from '@/lib/validation-utils';

interface EnhancedValidationFeedbackProps {
  type: 'error' | 'success' | 'warning' | 'info' | 'loading';
  message: string;
  suggestion?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function EnhancedValidationFeedback({ 
  type, 
  message, 
  suggestion,
  onRetry,
  onDismiss,
  className 
}: EnhancedValidationFeedbackProps) {
  const icons = {
    error: AlertTriangle,
    success: CheckCircle,
    warning: AlertTriangle,
    info: Info,
    loading: Loader2
  };

  const colors = {
    error: 'text-destructive',
    success: 'text-green-600',
    warning: 'text-orange-600',
    info: 'text-blue-600',
    loading: 'text-muted-foreground'
  };

  const bgColors = {
    error: 'bg-destructive/10 border-destructive/20',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-orange-50 border-orange-200',
    info: 'bg-blue-50 border-blue-200',
    loading: 'bg-muted/50 border-muted'
  };

  const Icon = icons[type];

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-md border text-sm',
      bgColors[type],
      className
    )}>
      <Icon className={cn(
        'h-4 w-4 flex-shrink-0 mt-0.5',
        colors[type],
        type === 'loading' && 'animate-spin'
      )} />
      <div className="flex-1 space-y-2">
        <p className={colors[type]}>{message}</p>
        {suggestion && (
          <p className="text-xs text-muted-foreground italic">
            💡 {suggestion}
          </p>
        )}
        {(onRetry || onDismiss) && (
          <div className="flex gap-2">
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="h-6 px-2 text-xs"
              >
                Try Again
              </Button>
            )}
            {onDismiss && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface RealTimeFieldValidationProps {
  value: string;
  validator: (value: string) => EnhancedValidationResult;
  debounceMs?: number;
  showSuccessState?: boolean;
  context?: {
    userLevel?: 'new' | 'experienced';
    previousValues?: string[];
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
  };
  className?: string;
}

export function RealTimeFieldValidation({ 
  value, 
  validator, 
  debounceMs = 300,
  showSuccessState = false,
  context,
  className 
}: RealTimeFieldValidationProps) {
  const [validationState, setValidationState] = useState<{
    result: EnhancedValidationResult | null;
    isValidating: boolean;
  }>({ result: null, isValidating: false });

  const validateValue = useCallback(async (inputValue: string) => {
    if (!inputValue.trim()) {
      setValidationState({ result: null, isValidating: false });
      return;
    }

    setValidationState(prev => ({ ...prev, isValidating: true }));

    // Simulate async validation delay
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const result = context 
        ? validateWithContext(inputValue, validator, context)
        : validator(inputValue);
      
      setValidationState({ result, isValidating: false });
    } catch (error) {
      setValidationState({
        result: {
          isValid: false,
          error: 'Validation failed. Please try again.'
        },
        isValidating: false
      });
    }
  }, [validator, context]);

  useEffect(() => {
    const timer = setTimeout(() => {
      validateValue(value);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [value, validateValue, debounceMs]);

  const { result, isValidating } = validationState;

  if (isValidating) {
    return (
      <EnhancedValidationFeedback
        type="loading"
        message="Validating..."
        className={className}
      />
    );
  }

  if (!result) return null;

  if (result.error) {
    return (
      <EnhancedValidationFeedback
        type="error"
        message={result.error}
        suggestion={result.suggestion}
        className={className}
      />
    );
  }

  if (result.warning) {
    return (
      <EnhancedValidationFeedback
        type="warning"
        message={result.warning}
        suggestion={result.suggestion}
        className={className}
      />
    );
  }

  if (showSuccessState && result.isValid) {
    return (
      <EnhancedValidationFeedback
        type="success"
        message="Looks good!"
        suggestion={result.suggestion}
        className={className}
      />
    );
  }

  if (result.suggestion) {
    return (
      <EnhancedValidationFeedback
        type="info"
        message="Valid input"
        suggestion={result.suggestion}
        className={className}
      />
    );
  }

  return null;
}

interface FormValidationSummaryProps {
  errors: Record<string, string>;
  warnings?: Record<string, string>;
  isSubmitting?: boolean;
  onRetryValidation?: () => void;
  className?: string;
}

export function FormValidationSummary({ 
  errors, 
  warnings = {},
  isSubmitting = false,
  onRetryValidation,
  className 
}: FormValidationSummaryProps) {
  const errorCount = Object.keys(errors).length;
  const warningCount = Object.keys(warnings).length;
  
  if (errorCount === 0 && warningCount === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      {errorCount > 0 && (
        <div className="p-4 rounded-md border border-destructive/20 bg-destructive/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">
                {errorCount} error{errorCount > 1 ? 's' : ''} found
              </span>
            </div>
            {onRetryValidation && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetryValidation}
                disabled={isSubmitting}
                className="h-6 px-2 text-xs"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  'Revalidate'
                )}
              </Button>
            )}
          </div>
          <ul className="space-y-1 text-sm text-destructive">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field} className="flex items-start gap-2">
                <span className="font-medium capitalize min-w-0 flex-shrink-0">
                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <span className="min-w-0">{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {warningCount > 0 && (
        <div className="p-4 rounded-md border border-orange-200 bg-orange-50">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-600">
              {warningCount} suggestion{warningCount > 1 ? 's' : ''}
            </span>
          </div>
          <ul className="space-y-1 text-sm text-orange-700">
            {Object.entries(warnings).map(([field, warning]) => (
              <li key={field} className="flex items-start gap-2">
                <span className="font-medium capitalize min-w-0 flex-shrink-0">
                  {field.replace(/([A-Z])/g, ' $1').toLowerCase()}:
                </span>
                <span className="min-w-0">{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface OperationFeedbackProps {
  isLoading: boolean;
  error?: string | null;
  success?: string | null;
  loadingMessage?: string;
  onRetry?: () => void;
  onDismissError?: () => void;
  onDismissSuccess?: () => void;
  className?: string;
}

export function OperationFeedback({
  isLoading,
  error,
  success,
  loadingMessage = 'Processing...',
  onRetry,
  onDismissError,
  onDismissSuccess,
  className
}: OperationFeedbackProps) {
  if (isLoading) {
    return (
      <EnhancedValidationFeedback
        type="loading"
        message={loadingMessage}
        className={className}
      />
    );
  }

  if (error) {
    return (
      <EnhancedValidationFeedback
        type="error"
        message={error}
        onRetry={onRetry}
        onDismiss={onDismissError}
        className={className}
      />
    );
  }

  if (success) {
    return (
      <EnhancedValidationFeedback
        type="success"
        message={success}
        onDismiss={onDismissSuccess}
        className={className}
      />
    );
  }

  return null;
}

interface PreventInvalidActionsProps {
  conditions: Array<{
    condition: boolean;
    message: string;
    severity?: 'error' | 'warning';
  }>;
  children: React.ReactNode;
  showAllMessages?: boolean;
  className?: string;
}

export function PreventInvalidActions({
  conditions,
  children,
  showAllMessages = false,
  className
}: PreventInvalidActionsProps) {
  const errors = conditions.filter(c => c.condition && c.severity !== 'warning');
  const warnings = conditions.filter(c => c.condition && c.severity === 'warning');
  
  const hasErrors = errors.length > 0;
  const hasWarnings = warnings.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {(hasErrors || hasWarnings) && (
        <div className="space-y-2">
          {(showAllMessages ? errors : errors.slice(0, 1)).map((condition, index) => (
            <EnhancedValidationFeedback
              key={`error-${index}`}
              type="error"
              message={condition.message}
            />
          ))}
          {(showAllMessages ? warnings : warnings.slice(0, 1)).map((condition, index) => (
            <EnhancedValidationFeedback
              key={`warning-${index}`}
              type="warning"
              message={condition.message}
            />
          ))}
          {!showAllMessages && (errors.length > 1 || warnings.length > 1) && (
            <p className="text-xs text-muted-foreground">
              {errors.length > 1 && `+${errors.length - 1} more error${errors.length > 2 ? 's' : ''}`}
              {errors.length > 1 && warnings.length > 1 && ', '}
              {warnings.length > 1 && `+${warnings.length - 1} more warning${warnings.length > 2 ? 's' : ''}`}
            </p>
          )}
        </div>
      )}
      
      {React.cloneElement(children as React.ReactElement, {
        disabled: hasErrors || (children as React.ReactElement).props.disabled
      })}
    </div>
  );
}

interface SmartFormValidationProps {
  fields: Record<string, {
    value: any;
    validator: (value: any) => EnhancedValidationResult;
    required?: boolean;
    context?: any;
  }>;
  onValidationChange?: (isValid: boolean, errors: Record<string, string>, warnings: Record<string, string>) => void;
  debounceMs?: number;
  showRealTimeValidation?: boolean;
  className?: string;
  children: (validationProps: {
    errors: Record<string, string>;
    warnings: Record<string, string>;
    isValid: boolean;
    isValidating: boolean;
    getFieldValidation: (fieldName: string) => React.ReactNode;
  }) => React.ReactNode;
}

export function SmartFormValidation({
  fields,
  onValidationChange,
  debounceMs = 300,
  showRealTimeValidation = true,
  className,
  children
}: SmartFormValidationProps) {
  const [validationState, setValidationState] = useState<{
    errors: Record<string, string>;
    warnings: Record<string, string>;
    isValid: boolean;
    isValidating: boolean;
  }>({
    errors: {},
    warnings: {},
    isValid: true,
    isValidating: false
  });

  const validateAllFields = useCallback(async () => {
    setValidationState(prev => ({ ...prev, isValidating: true }));

    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};

    for (const [fieldName, fieldConfig] of Object.entries(fields)) {
      const { value, validator, required = false, context } = fieldConfig;

      // Skip validation for optional empty fields
      if (!required && (!value || (typeof value === 'string' && value.trim() === ''))) {
        continue;
      }

      try {
        const result = context 
          ? validateWithContext(value, validator, context)
          : validator(value);

        if (!result.isValid && result.error) {
          errors[fieldName] = result.error;
        } else if (result.warning) {
          warnings[fieldName] = result.warning;
        }
      } catch (error) {
        errors[fieldName] = 'Validation failed';
      }
    }

    const isValid = Object.keys(errors).length === 0;

    setValidationState({
      errors,
      warnings,
      isValid,
      isValidating: false
    });

    onValidationChange?.(isValid, errors, warnings);
  }, [fields, onValidationChange]);

  useEffect(() => {
    const timer = setTimeout(validateAllFields, debounceMs);
    return () => clearTimeout(timer);
  }, [validateAllFields, debounceMs]);

  const getFieldValidation = useCallback((fieldName: string) => {
    if (!showRealTimeValidation) return null;

    const fieldConfig = fields[fieldName];
    if (!fieldConfig) return null;

    const error = validationState.errors[fieldName];
    const warning = validationState.warnings[fieldName];

    if (error) {
      return (
        <EnhancedValidationFeedback
          type="error"
          message={error}
          className="mt-1"
        />
      );
    }

    if (warning) {
      return (
        <EnhancedValidationFeedback
          type="warning"
          message={warning}
          className="mt-1"
        />
      );
    }

    return null;
  }, [fields, validationState, showRealTimeValidation]);

  return (
    <div className={className}>
      {children({
        errors: validationState.errors,
        warnings: validationState.warnings,
        isValid: validationState.isValid,
        isValidating: validationState.isValidating,
        getFieldValidation
      })}
    </div>
  );
}