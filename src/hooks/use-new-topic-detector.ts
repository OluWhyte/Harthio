'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { topicService } from '@/lib/supabase-services';

interface UseNewTopicDetectorOptions {
  userId?: string;
  checkInterval?: number; // in milliseconds
  enabled?: boolean;
}

export function useNewTopicDetector(options: UseNewTopicDetectorOptions = {}) {
  const {
    userId,
    checkInterval = 300000, // Check every 5 minutes
    enabled = true
  } = options;

  const [hasNewTopics, setHasNewTopics] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const lastTopicCountRef = useRef<number | null>(null);
  const lastCheckTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout>();
  const showDelayRef = useRef<NodeJS.Timeout>();

  const checkForNewTopics = useCallback(async () => {
    if (!enabled || !userId || isChecking) return;

    // Prevent too frequent checks
    const now = Date.now();
    if (now - lastCheckTimeRef.current < checkInterval) return;

    setIsChecking(true);
    lastCheckTimeRef.current = now;

    try {
      // Get current topic count
      const topics = await topicService.getAllTopics();
      const currentCount = topics.length;

      // If we have a previous count and current count is higher, show arrow with delay
      if (lastTopicCountRef.current !== null && currentCount > lastTopicCountRef.current) {
        // Small delay to avoid flickering and ensure it's a real new topic
        showDelayRef.current = setTimeout(() => {
          setHasNewTopics(true);
        }, 2000);
      }

      // Update the reference count
      lastTopicCountRef.current = currentCount;
    } catch (error) {
      // Silent error - don't show anything to user
      console.debug('Topic check failed:', error);
    } finally {
      setIsChecking(false);
    }
  }, [enabled, userId, checkInterval, isChecking]);

  // Initialize topic count on first load
  const initializeTopicCount = useCallback(async () => {
    if (!enabled || !userId) return;

    try {
      const topics = await topicService.getAllTopics();
      lastTopicCountRef.current = topics.length;
    } catch (error) {
      console.debug('Initial topic count failed:', error);
    }
  }, [enabled, userId]);

  // Set up periodic checking
  useEffect(() => {
    if (!enabled || !userId) return;

    // Initialize count on first load
    initializeTopicCount();

    // Start periodic checking
    intervalRef.current = setInterval(checkForNewTopics, checkInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (showDelayRef.current) {
        clearTimeout(showDelayRef.current);
      }
    };
  }, [enabled, userId, checkInterval, checkForNewTopics, initializeTopicCount]);

  // Manual check function
  const checkNow = useCallback(() => {
    checkForNewTopics();
  }, [checkForNewTopics]);

  // Function to dismiss the arrow (when user refreshes)
  const dismissNewTopics = useCallback(() => {
    if (showDelayRef.current) {
      clearTimeout(showDelayRef.current);
    }
    setHasNewTopics(false);
  }, []);

  // Function to refresh and update count
  const refreshAndDismiss = useCallback(async () => {
    setHasNewTopics(false);
    // Update the count to current state
    await initializeTopicCount();
  }, [initializeTopicCount]);

  return {
    hasNewTopics,
    isChecking,
    checkNow,
    dismissNewTopics,
    refreshAndDismiss
  };
}