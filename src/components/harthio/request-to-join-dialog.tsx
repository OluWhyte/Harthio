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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request to Join Session</DialogTitle>
          {topic ? (
            <div className="space-y-2 pt-2">
              <div className="rounded-lg bg-muted/50 p-3 border">
                <p className="text-sm font-semibold text-foreground mb-1">{topic.title}</p>
                <p className="text-xs text-muted-foreground">
                  Hosted by {topic.author?.display_name || 'Unknown'}
                </p>
              </div>
            </div>
          ) : (
            <DialogDescription>Loading session details...</DialogDescription>
          )}
        </DialogHeader>
        
        {showSuccess ? (
          // Success state
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-green-700">Request Sent Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                The host has been notified and will review your request soon.
              </p>
            </div>
          </div>
        ) : validationError || hasError ? (
          // Enhanced error state
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-destructive">Cannot Send Request</h3>
              <p className="text-sm text-muted-foreground">{validationError || 'An error occurred while loading session details.'}</p>
              {validationSuggestion && (
                <p className="text-xs text-muted-foreground italic">
                  💡 {validationSuggestion}
                </p>
              )}
            </div>
            <DialogFooter className="flex-row justify-center space-x-2">
              {hasError && !validationError && (
                <Button 
                  variant="outline" 
                  onClick={() => retry(() => topicService.getTopicById(topicId))}
                  disabled={isRetrying}
                  className="px-4"
                >
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry
                  </>
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setOpen(false)} className="px-4">
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Enhanced form state with prevention checks
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Let the host know why you'd like to join..."
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
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
              
              <DialogFooter className="flex-row justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => setOpen(false)}
                  disabled={isSubmitting}
                  className="px-4"
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
                    className="px-6"
                  >
                    Send Request
                  </Button>
                </PreventInvalidActions>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}