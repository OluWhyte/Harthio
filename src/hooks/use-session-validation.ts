import { useState, useEffect, useRef } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';

interface SessionValidationResult {
  isValid: boolean;
  isLoading: boolean;
  error: string | null;
  role?: 'author' | 'participant';
  session?: {
    id: string;
    title: string;
    startTime: string;
    endTime: string;
  };
}

export function useSessionValidation(sessionId: string): SessionValidationResult {
  const { user } = useAuth();
  const [result, setResult] = useState<SessionValidationResult>({
    isValid: false,
    isLoading: true,
    error: null
  });
  const validationInProgressRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    let validationTimeout: NodeJS.Timeout | null = null;
    
    if (!user?.uid || !sessionId) {
      setResult({
        isValid: false,
        isLoading: false,
        error: 'Authentication required'
      });
      return;
    }

    // Prevent infinite loops by checking if validation is already in progress
    if (validationInProgressRef.current) {
      console.log('[Session Validation] Validation already in progress, skipping');
      return;
    }

    const validateSession = async () => {
      try {
        if (!isMounted) return;
        
        validationInProgressRef.current = true;
        console.log(`[Session Validation] Starting validation for session ${sessionId}, user ${user.uid}`);
        setResult(prev => ({ ...prev, isLoading: true, error: null }));

        // Add timeout to prevent hanging on slow networks
        const sessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session token fetch timeout')), 8000)
        );
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
        
        if (!isMounted) return;
        
        if (!session?.access_token) {
          console.log('[Session Validation] No access token available');
          setResult({
            isValid: false,
            isLoading: false,
            error: 'Authentication token not available'
          });
          return;
        }

        console.log('[Session Validation] Making API call to validate session');

        // Add timeout for API call
        const controller = new AbortController();
        validationTimeout = setTimeout(() => controller.abort(), 10000);

        // Get CSRF token
        const { getCSRFHeaders } = await import('@/lib/csrf-utils');
        const csrfHeaders = await getCSRFHeaders();

        const response = await fetch('/api/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
            ...csrfHeaders,
          },
          body: JSON.stringify({
            sessionId,
            userId: user.uid
          }),
          signal: controller.signal
        });

        if (validationTimeout) {
          clearTimeout(validationTimeout);
          validationTimeout = null;
        }

        if (!isMounted) return;

        const data = await response.json();
        console.log(`[Session Validation] API response:`, { status: response.status, data });

        if (!response.ok) {
          console.log(`[Session Validation] Validation failed:`, data.error);
          setResult({
            isValid: false,
            isLoading: false,
            error: data.error || 'Session validation failed'
          });
          return;
        }

        if (data.valid) {
          console.log('[Session Validation] Validation successful');
          setResult({
            isValid: true,
            isLoading: false,
            error: null,
            role: data.role,
            session: data.session
          });
        } else {
          console.log('[Session Validation] Access denied by API');
          setResult({
            isValid: false,
            isLoading: false,
            error: 'Session access denied'
          });
        }
      } catch (error: any) {
        console.error('[Session Validation] Error during validation:', error);
        if (isMounted) {
          const errorMessage = error.name === 'AbortError' ? 
            'Session validation timed out' : 
            'Failed to validate session access';
          setResult({
            isValid: false,
            isLoading: false,
            error: errorMessage
          });
        }
      } finally {
        validationInProgressRef.current = false;
      }
    };

    // Use requestIdleCallback for better performance if available
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => validateSession(), { timeout: 1000 });
    } else {
      // Small delay to prevent blocking
      setTimeout(validateSession, 50);
    }

    return () => {
      isMounted = false;
      if (validationTimeout) {
        clearTimeout(validationTimeout);
      }
    };
  }, [user?.uid, sessionId]);

  return result;
}