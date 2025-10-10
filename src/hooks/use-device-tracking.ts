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
  enabled = false, // Disabled by default to prevent excessive logging
  activityInterval = 60000 // 1 minute
}: UseDeviceTrackingOptions = {}) {
  const [state, setState] = useState<DeviceTrackingState>({
    sessionId: null,
    deviceFingerprint: null,
    isTracking: false,
    error: 'Device tracking disabled'
  });

  // Device tracking is disabled - no effects or intervals will run
  // This prevents excessive logging and API calls

  // All tracking functions disabled
  const updateActivity = () => {
    // Disabled
  };

  const getUserFootprint = async () => {
    // Disabled
    return null;
  };

  const checkReturningUser = async () => {
    // Disabled
    return false;
  };

  return {
    ...state,
    updateActivity,
    getUserFootprint,
    checkReturningUser
  };
}