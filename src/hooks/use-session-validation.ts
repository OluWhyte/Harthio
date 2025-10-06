import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';

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

  useEffect(() => {
    if (!user?.uid || !sessionId) {
      setResult({
        isValid: false,
        isLoading: false,
        error: 'Authentication required'
      });
      return;
    }

    const validateSession = async () => {
      try {
        setResult(prev => ({ ...prev, isLoading: true, error: null }));

        const response = await fetch('/api/validate-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            userId: user.uid
          })
        });

        const data = await response.json();

        if (!response.ok) {
          setResult({
            isValid: false,
            isLoading: false,
            error: data.error || 'Session validation failed'
          });
          return;
        }

        if (data.valid) {
          setResult({
            isValid: true,
            isLoading: false,
            error: null,
            role: data.role,
            session: data.session
          });
        } else {
          setResult({
            isValid: false,
            isLoading: false,
            error: 'Session access denied'
          });
        }
      } catch (error) {
        console.error('Session validation error:', error);
        setResult({
          isValid: false,
          isLoading: false,
          error: 'Failed to validate session access'
        });
      }
    };

    validateSession();
  }, [user?.uid, sessionId]);

  return result;
}