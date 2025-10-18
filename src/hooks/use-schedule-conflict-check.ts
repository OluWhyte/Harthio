'use client';

import { useState, useEffect, useCallback } from 'react';
import { checkScheduleConflict, checkNewSessionConflict, checkJoinRequestConflict, type ConflictCheckResult } from '@/lib/schedule-conflict-detector';

interface UseScheduleConflictCheckOptions {
  enabled?: boolean;
  debounceMs?: number;
}

/**
 * Hook for checking author approval conflicts when approving requests
 * Authors cannot approve users for overlapping sessions
 */
export function useApprovalConflictCheck(
  topicId: string | null,
  userId: string | null,
  options: UseScheduleConflictCheckOptions = {}
) {
  const { enabled = true, debounceMs = 500 } = options;
  
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConflict = useCallback(async () => {
    if (!enabled || !topicId || !userId) {
      setConflictResult(null);
      return;
    }

    setIsChecking(true);
    
    try {
      const result = await checkScheduleConflict(topicId, userId);
      setConflictResult(result);
    } catch (error) {
      console.error('Error checking approval conflict:', error);
      setConflictResult({
        hasConflict: false,
        canApprove: false,
        reason: 'Error checking approval conflicts'
      });
    } finally {
      setIsChecking(false);
    }
  }, [enabled, topicId, userId]);

  useEffect(() => {
    if (!enabled || !topicId || !userId) {
      setConflictResult(null);
      return;
    }

    const timeoutId = setTimeout(checkConflict, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [checkConflict, debounceMs, enabled, topicId, userId]);

  return {
    conflictResult,
    isChecking,
    recheckConflict: checkConflict
  };
}

/**
 * Hook for checking join request conflicts when users want to request to join sessions
 * Users cannot request to join sessions that overlap with their approved sessions
 */
export function useJoinRequestConflictCheck(
  topicId: string | null,
  userId: string | null,
  options: UseScheduleConflictCheckOptions = {}
) {
  const { enabled = true, debounceMs = 500 } = options;
  
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConflict = useCallback(async () => {
    if (!enabled || !topicId || !userId) {
      setConflictResult(null);
      return;
    }

    setIsChecking(true);
    
    try {
      const result = await checkJoinRequestConflict(topicId, userId);
      setConflictResult(result);
    } catch (error) {
      console.error('Error checking join request conflict:', error);
      setConflictResult({
        hasConflict: false,
        canApprove: false,
        reason: 'Error checking join request conflicts'
      });
    } finally {
      setIsChecking(false);
    }
  }, [enabled, topicId, userId]);

  useEffect(() => {
    if (!enabled || !topicId || !userId) {
      setConflictResult(null);
      return;
    }

    const timeoutId = setTimeout(checkConflict, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [checkConflict, debounceMs, enabled, topicId, userId]);

  return {
    conflictResult,
    isChecking,
    recheckConflict: checkConflict
  };
}

/**
 * Hook for checking schedule conflicts when creating new sessions
 */
export function useNewSessionConflictCheck(
  userId: string | null,
  startTime: Date | null,
  endTime: Date | null,
  options: UseScheduleConflictCheckOptions = {}
) {
  const { enabled = true, debounceMs = 1000 } = options;
  
  const [conflictResult, setConflictResult] = useState<ConflictCheckResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConflict = useCallback(async () => {
    if (!enabled || !userId || !startTime || !endTime) {
      setConflictResult(null);
      return;
    }

    setIsChecking(true);
    
    try {
      const result = await checkNewSessionConflict(userId, startTime, endTime);
      setConflictResult(result);
    } catch (error) {
      console.error('Error checking new session conflict:', error);
      setConflictResult({
        hasConflict: false,
        canApprove: false,
        reason: 'Error checking schedule conflicts'
      });
    } finally {
      setIsChecking(false);
    }
  }, [enabled, userId, startTime, endTime]);

  useEffect(() => {
    if (!enabled || !userId || !startTime || !endTime) {
      setConflictResult(null);
      return;
    }

    const timeoutId = setTimeout(checkConflict, debounceMs);
    return () => clearTimeout(timeoutId);
  }, [checkConflict, debounceMs, enabled, userId, startTime, endTime]);

  return {
    conflictResult,
    isChecking,
    recheckConflict: checkConflict
  };
}