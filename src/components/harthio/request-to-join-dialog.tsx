'use client';

import { useState, ReactNode, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
import { useAuth } from '@/hooks/use-auth';
import { topicService } from '@/lib/supabase-services';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import { useRequestErrorHandler } from '@/hooks/use-error-handler';
import { validateTopicId, validateUserId, validateMessage, ErrorType } from '@/lib/error-utils';
import { useRequestSuccessFeedback } from '@/hooks/use-success-feedback';
import { 
  validateJoinRequestAction, 
  checkNetworkConnectivity, 
  checkRateLimit,
  runPreflightChecks,
  createValidationContext
} from '@/lib/error-prevention';
import { EnhancedValidationFeedback, PreventInvalidActions } from '@/components/common/enhanced-form-validation';
import { useJoinRequestConflictCheck } from '@/hooks/use-schedule-conflict-check';
import { ScheduleConflictWarning } from '@/components/common/schedule-conflict-warning';

const requestSchema = z.object({
  message: z.string().max(200, { message: "Message can't be more than 200 characters." }).optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

interface RequestToJoinDialogProps {
    topicId: string;
    onSuccess: () => void;
    children: ReactNode;
}

export function RequestToJoinDialog({ topicId, onSuccess, children }: RequestToJoinDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [topic, setTopic] = useState<any>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuggestion, setValidationSuggestion] = useState<string | null>(null);
  const [lastRequestTime, setLastRequestTime] = useState<Date | null>(null);
  const { toast } = useToast();
  const { user, userProfile } = useAuth();
  const { handleError, executeWithRetry, retry, isRetrying, hasError, clearError } = useRequestErrorHandler();
  const { showRequestSuccess } = useRequestSuccessFeedback();

  // Check for join request conflicts
  const { conflictResult, isChecking: isCheckingConflicts } = useJoinRequestConflictCheck(
    topicId,
    user?.uid || null,
    { enabled: open && !!user }
  );

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      message: '',
    },
  });

  // Enhanced topic validation when dialog opens
  useEffect(() => {
    if (open && topicId) {
      const fetchAndValidateTopic = async () => {
        try {
          // Validate inputs
          const validTopicId = validateTopicId(topicId);
          const validUserId = validateUserId(user?.uid);
          
          const topicData = await executeWithRetry(
            () => topicService.getTopicById(validTopicId),
            'fetchTopicForValidation',
            ErrorType.NETWORK
          );
          
          setTopic(topicData);
          
          if (!topicData) {
            setValidationError('This session is no longer available.');
            setValidationSuggestion('Try refreshing the page');
            return;
          }
          
          // Run comprehensive validation checks
          const validationContext = createValidationContext(user, topicData);
          const preflightChecks = [
            () => checkNetworkConnectivity(),
            () => checkRateLimit(lastRequestTime, 30000, 'sending requests'), // 30 second rate limit
            () => validateJoinRequestAction(validTopicId, validUserId, topicData)
          ];
          
          const validationResult = runPreflightChecks(preflightChecks);
          
          if (!validationResult.canProceed) {
            setValidationError(validationResult.primaryBlocker || 'Cannot send request');
            setValidationSuggestion(validationResult.suggestions[0] || null);
            return;
          }
          
          // Show warnings if any
          if (validationResult.warnings.length > 0) {
            console.warn('Request validation warnings:', validationResult.warnings);
            // Could show warnings in UI if needed
          }
          
          setValidationError(null);
          setValidationSuggestion(null);
          clearError();
        } catch (error) {
          const errorDetails = handleError(error, { topicId, userId: user?.uid });
          setValidationError(errorDetails.message);
          setValidationSuggestion('Please try again or refresh the page');
        }
      };
      
      fetchAndValidateTopic();
    }
  }, [open, topicId, user, lastRequestTime, executeWithRetry, handleError, clearError]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
      setValidationError(null);
      setValidationSuggestion(null);
      setTopic(null);
      form.reset();
      clearError();
    }
  }, [open, form, clearError]);

  const onSubmit = async (data: RequestFormValues) => {
    if (validationError) {
      toast({
        title: 'Invalid Request',
        description: validationError,
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Validate inputs
      const validTopicId = validateTopicId(topicId);
      const validUserId = validateUserId(user?.uid);
      const validMessage = validateMessage(data.message);

      console.log('Submitting join request:', { topicId: validTopicId, userId: validUserId, message: validMessage });

      // Send join request to backend with retry logic
      const result = await executeWithRetry(
        () => topicService.addJoinRequest(validTopicId, validUserId, validMessage),
        'submitJoinRequest',
        ErrorType.NETWORK
      );
      
      console.log('Join request result:', result);
      
      if (result.success) {
        // Record successful request time for rate limiting
        setLastRequestTime(new Date());
        
        // Show success state
        setShowSuccess(true);
        clearError();
        
        // Auto-close dialog after showing success
        setTimeout(() => {
          setOpen(false);
          onSuccess();
          showRequestSuccess(validTopicId, validUserId, topic?.title);
        }, 1500);
      } else {
        throw new Error(result.error || 'Failed to send request');
      }
    } catch (error) {
      handleError(error, { 
        topicId, 
        userId: user?.uid, 
        messageLength: data.message?.length || 0,
        operation: 'submitJoinRequest'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 px-4 sm:px-6 pt-4 sm:pt-6">
          <DialogTitle className="text-lg sm:text-xl">Request to Join Session</DialogTitle>
          <DialogDescription className="text-sm sm:text-base break-words">
            {topic ? `Request to join "${topic.title}" hosted by ${topic.author?.display_name || 'Unknown'}` : 'Loading session details...'}
          </DialogDescription>
        </DialogHeader>
        
        {showSuccess ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4 px-4 sm:px-6">
            <CheckCircle className="h-12 w-12 sm:h-16 sm:w-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-green-700 break-words">Request Sent Successfully!</h3>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">
                The host has been notified and will review your request soon.
              </p>
            </div>
          </div>
        ) : validationError || hasError ? (
          // Enhanced error state
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 space-y-3 sm:space-y-4 px-4 sm:px-6">
            <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive" />
            <div className="text-center space-y-2">
              <h3 className="text-base sm:text-lg font-semibold text-destructive break-words">Cannot Send Request</h3>
              <p className="text-xs sm:text-sm text-muted-foreground break-words">{validationError || 'An error occurred while loading session details.'}</p>
              {validationSuggestion && (
                <p className="text-xs text-muted-foreground italic break-words">
                  💡 {validationSuggestion}
                </p>
              )}
            </div>
            <DialogFooter className="flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-2 w-full">
              {hasError && !validationError && (
                <Button 
                  variant="outline" 
                  onClick={() => retry(() => topicService.getTopicById(topicId))}
                  disabled={isRetrying}
                  className="w-full sm:w-auto px-3 sm:px-4 text-sm"
                >
                  {isRetrying ? (
                    <>
                      <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                      <span className="truncate">Retrying...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="truncate">Retry</span>
                    </>
                  )}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="w-full sm:w-auto px-3 sm:px-4 text-sm">
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Enhanced form state with prevention checks
          <div className="flex-grow overflow-y-auto px-4 sm:px-6 pb-4 sm:pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Message (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Let the host know why you'd like to join..."
                          className="resize-none text-sm sm:text-base min-h-[80px] sm:min-h-[100px]"
                          disabled={isSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 text-xs text-muted-foreground">
                        <span>{field.value?.length || 0}/200 characters</span>
                        {field.value && field.value.length > 150 && (
                          <span className="text-orange-600">
                            {200 - field.value.length} remaining
                          </span>
                        )}
                      </div>
                      {field.value && field.value.length > 200 && (
                        <EnhancedValidationFeedback
                          type="error"
                          message="Message is too long"
                          suggestion="Please keep your message under 200 characters"
                        />
                      )}
                    </FormItem>
                  )}
                />

              {/* Join Request Conflict Warning */}
              {conflictResult?.hasConflict && (
                <ScheduleConflictWarning 
                  conflictResult={conflictResult}
                  className="mt-4"
                />
              )}
              
                <DialogFooter className="flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-3 sm:pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => setOpen(false)}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-3 sm:px-4 text-sm"
                  >
                    Cancel
                  </Button>
                  <PreventInvalidActions
                    conditions={[
                      {
                        condition: !!validationError,
                        message: validationError || '',
                        severity: 'error'
                      },
                      {
                        condition: conflictResult?.hasConflict || false,
                        message: conflictResult?.reason || 'Schedule conflict detected',
                        severity: 'error'
                      },
                      {
                        condition: isSubmitting,
                        message: 'Request is being sent...',
                        severity: 'warning'
                      }
                    ]}
                  >
                    <Button 
                      type="submit" 
                      disabled={
                        isSubmitting || 
                        !!validationError || 
                        conflictResult?.hasConflict ||
                        isCheckingConflicts
                      }
                      className="w-full sm:w-auto px-4 sm:px-6 text-sm sm:text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                          <span className="truncate">Sending...</span>
                        </>
                      ) : (
                        <span className="truncate">Send Request</span>
                      )}
                    </Button>
                  </PreventInvalidActions>
                </DialogFooter>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}