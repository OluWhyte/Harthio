'use client';

import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useAuth } from './use-auth';
import { topicService } from '@/lib/supabase-services';
import { realtimeManager } from '@/lib/realtime-manager';

interface RequestsState {
  receivedRequests: any[];
  sentRequests: any[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

interface UseOptimizedRequestsOptions {
  enableCache?: boolean;
  enableRealtime?: boolean;
  refreshInterval?: number;
}

/**
 * Optimized hook for managing join requests with caching and real-time updates
 */
export function useOptimizedRequests(options: UseOptimizedRequestsOptions = {}) {
  const { user } = useAuth();
  const {
    enableCache = true,
    enableRealtime = true,
    refreshInterval = 2 * 60 * 1000, // 2 minutes
  } = options;

  const [state, setState] = useState<RequestsState>({
    receivedRequests: [],
    sentRequests: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
  });

  const subscriptionRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Optimized fetch function
  const fetchRequests = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const startTime = performance.now();
      
      // Fetch both types of requests in parallel using original service
      const [receivedRequests, sentRequests] = await Promise.all([
        topicService.getReceivedJoinRequests(user.uid),
        topicService.getSentJoinRequests(user.uid),
      ]);

      const fetchTime = performance.now() - startTime;
      
      setState({
        receivedRequests,
        sentRequests,
        isLoading: false,
        error: null,
        lastUpdated: new Date(),
      });

      console.log(`Requests fetched in ${fetchTime.toFixed(2)}ms`);
    } catch (error) {
      console.error('Error fetching optimized requests:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch requests',
      }));
    }
  }, [user, enableCache]);

  // Optimized real-time update handler with better debouncing
  const lastChangeRef = useRef<number>(0);
  
  const handleTopicChange = useCallback((payload: any) => {
    const { eventType, new: newTopic, old: oldTopic } = payload;
    
    // Prevent rapid successive updates
    const now = Date.now();
    if (now - lastChangeRef.current < 2000) {
      console.log('Skipping topic change - too soon after last change');
      return;
    }
    
    // Only refresh if the change affects requests or participants
    if (eventType === 'UPDATE' && newTopic && oldTopic) {
      const requestsChanged = JSON.stringify(oldTopic.requests || []) !== JSON.stringify(newTopic.requests || []);
      const participantsChanged = JSON.stringify(oldTopic.participants || []) !== JSON.stringify(newTopic.participants || []);
      
      if (requestsChanged || participantsChanged) {
        console.log('Requests or participants changed, refreshing requests...');
        lastChangeRef.current = now;
        
        // Longer debounce to prevent excessive updates
        setTimeout(() => fetchRequests(true), 800);
      }
    } else if (eventType === 'DELETE') {
      // Topic deleted, refresh to remove related requests
      lastChangeRef.current = now;
      setTimeout(() => fetchRequests(true), 500);
    }
  }, [fetchRequests, user?.uid]);

  // Optimized real-time subscriptions - prevent duplicate subscriptions
  useEffect(() => {
    if (!enableRealtime || !user) return;

    console.log('Setting up optimized requests real-time subscription');
    
    const channelId = realtimeManager.subscribeToTopics(handleTopicChange, {
      debounceMs: 1500, // Increased debounce from 1s to 1.5s for better performance
      userId: user.uid, // Only subscribe to user-relevant topics
    });
    
    subscriptionRef.current = channelId;

    return () => {
      if (subscriptionRef.current) {
        realtimeManager.unsubscribe(subscriptionRef.current);
        subscriptionRef.current = null;
      }
    };
  }, [enableRealtime, user?.uid]); // Removed handleTopicChange from dependencies

  // Optimized periodic refresh - less frequent
  useEffect(() => {
    if (refreshInterval <= 0) return;

    const scheduleRefresh = () => {
      refreshTimeoutRef.current = setTimeout(() => {
        // Only refresh if we haven't refreshed recently
        const timeSinceLastUpdate = state.lastUpdated ? 
          Date.now() - state.lastUpdated.getTime() : Infinity;
        
        if (timeSinceLastUpdate > refreshInterval * 0.8) {
          fetchRequests(false);
        }
        scheduleRefresh();
      }, refreshInterval);
    };

    scheduleRefresh();

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
    };
  }, [refreshInterval]); // Removed fetchRequests from dependencies

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchRequests();
    }
  }, [user, fetchRequests]);

  // Memoized processed requests with sorting and filtering
  const processedRequests = useMemo(() => {
    const sortByTimestamp = (requests: any[]) => 
      requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return {
      receivedRequests: sortByTimestamp([...state.receivedRequests]),
      sentRequests: sortByTimestamp([...state.sentRequests]),
    };
  }, [state.receivedRequests, state.sentRequests]);

  // Refresh function for manual refresh
  const refresh = useCallback((force = false) => {
    return fetchRequests(force);
  }, [fetchRequests]);

  // Performance metrics
  const performanceMetrics = useMemo(() => ({
    lastUpdated: state.lastUpdated,
    receivedCount: processedRequests.receivedRequests.length,
    sentCount: processedRequests.sentRequests.length,
    isRealtimeConnected: subscriptionRef.current ? 
      realtimeManager.isChannelHealthy(subscriptionRef.current) : false,
  }), [state.lastUpdated, processedRequests, subscriptionRef.current]);

  return {
    receivedRequests: processedRequests.receivedRequests,
    sentRequests: processedRequests.sentRequests,
    isLoading: state.isLoading,
    error: state.error,
    refresh,
    performanceMetrics,
  };
}