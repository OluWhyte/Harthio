'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { supabase } from '@/lib/supabase';
import { realtimeManager } from '@/lib/realtime-manager';

/**
 * Lightweight hook for getting just the count of pending requests
 * Used for badge display in navigation - much more efficient than full request fetching
 */
export function useRequestsCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const subscriptionRef = useRef<string | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchCount = useCallback(async () => {
    if (!user) {
      setCount(0);
      return;
    }

    // Debounce: Don't fetch more than once per 5 seconds
    const now = Date.now();
    if (now - lastFetchRef.current < 5000) {
      return;
    }
    lastFetchRef.current = now;

    try {
      // Lightweight query: Only get topics authored by user with requests
      const { data: topics, error } = await supabase
        .from('topics')
        .select('requests, start_time')
        .eq('author_id', user.uid)
        .not('requests', 'is', null);

      if (error) {
        console.error('Error fetching requests count:', error);
        return;
      }

      if (!topics) {
        setCount(0);
        return;
      }

      // Count only requests for future sessions
      const now = new Date();
      let totalCount = 0;

      for (const topic of topics) {
        const startTime = new Date(topic.start_time);
        // Only count requests for sessions that haven't started yet
        if (startTime > now && Array.isArray(topic.requests)) {
          totalCount += topic.requests.length;
        }
      }

      setCount(totalCount);
    } catch (error) {
      console.error('Error in useRequestsCount:', error);
    }
  }, [user]);

  // Real-time updates - only refresh count when topics change
  useEffect(() => {
    if (!user) return;

    const channelId = realtimeManager.subscribeToTopics(
      (payload) => {
        const { eventType, new: newTopic } = payload;
        
        // Only refresh if it's a topic authored by this user
        if (newTopic?.author_id === user.uid) {
          // Debounced refresh
          setTimeout(() => fetchCount(), 1000);
        }
      },
      {
        debounceMs: 2000,
        userId: user.uid,
      }
    );

    subscriptionRef.current = channelId;

    return () => {
      if (subscriptionRef.current) {
        realtimeManager.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [user?.uid, fetchCount]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchCount();
    }
  }, [user, fetchCount]);

  return count;
}
