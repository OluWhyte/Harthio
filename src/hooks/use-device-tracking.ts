import { useEffect, useRef, useState } from 'react';
import { DeviceTrackingService } from '@/lib/services/device-tracking';

interface UseDeviceTrackingOptions {
  userId?: string;
  enabled?: boolean;
  activityInterval?: number; // in milliseconds
}

interface DeviceTrackingState {
  sessionId: string | null;
  deviceFingerprint: string | null;
  isTracking: boolean;
  error: string | null;
}

export function useDeviceTracking({
  userId,
  enabled = true,
  activityInterval = 60000 // 1 minute
}: UseDeviceTrackingOptions = {}) {
  const [state, setState] = useState<DeviceTrackingState>({
    sessionId: null,
    deviceFingerprint: null,
    isTracking: false,
    error: null
  });

  const activityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Start tracking when user is available and tracking is enabled
  useEffect(() => {
    if (!enabled || !userId) return;

    const startTracking = async () => {
      try {
        setState(prev => ({ ...prev, isTracking: true, error: null }));
        
        const sessionId = await DeviceTrackingService.trackUserSession(userId);
        const deviceFingerprint = DeviceTrackingService.generateDeviceFingerprint();
        
        if (sessionId) {
          sessionIdRef.current = sessionId;
          setState(prev => ({
            ...prev,
            sessionId,
            deviceFingerprint,
            isTracking: true
          }));

          // Start activity tracking interval
          activityIntervalRef.current = setInterval(() => {
            if (sessionIdRef.current) {
              DeviceTrackingService.updateSessionActivity(sessionIdRef.current);
            }
          }, activityInterval);
        } else {
          setState(prev => ({
            ...prev,
            error: 'Failed to start session tracking',
            isTracking: false
          }));
        }
      } catch (error) {
        console.error('Device tracking error:', error);
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error.message : 'Unknown error',
          isTracking: false
        }));
      }
    };

    startTracking();

    // Cleanup function
    return () => {
      if (activityIntervalRef.current) {
        clearInterval(activityIntervalRef.current);
        activityIntervalRef.current = null;
      }
      
      if (sessionIdRef.current) {
        DeviceTrackingService.endSession(sessionIdRef.current);
        sessionIdRef.current = null;
      }
    };
  }, [userId, enabled, activityInterval]);

  // Handle page visibility changes
  useEffect(() => {
    if (!enabled || !sessionIdRef.current) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && sessionIdRef.current) {
        // Update activity when page becomes visible
        DeviceTrackingService.updateSessionActivity(sessionIdRef.current);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled]);

  // Handle beforeunload to end session
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      if (sessionIdRef.current) {
        // Use sendBeacon for reliable session ending
        const data = JSON.stringify({ session_id: sessionIdRef.current });
        navigator.sendBeacon('/api/device-tracking/end-session', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [enabled]);

  // Manual session update
  const updateActivity = () => {
    if (sessionIdRef.current) {
      DeviceTrackingService.updateSessionActivity(sessionIdRef.current);
    }
  };

  // Get user footprint
  const getUserFootprint = async () => {
    if (!userId) return null;
    return await DeviceTrackingService.getUserFootprint(userId);
  };

  // Check if returning user
  const checkReturningUser = async () => {
    if (!state.deviceFingerprint) return false;
    return await DeviceTrackingService.isReturningUser(state.deviceFingerprint);
  };

  return {
    ...state,
    updateActivity,
    getUserFootprint,
    checkReturningUser
  };
}