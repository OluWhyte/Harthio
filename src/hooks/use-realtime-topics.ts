'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { useAuth } from './use-auth';
import { realtimeManager } from '@/lib/realtime-manager';

interface UseRealtimeTopicsOptions {
  onTopicInsert?: (topic: any) => void;
  onTopicUpdate?: (topic: any, oldTopic: any) => void;
  onTopicDelete?: (topicId: string) => void;
  onUserUpdate?: (user: any) => void;
  debounceMs?: number;
  enableUserUpdates?: boolean;
  enableRequestUpdates?: boolean;
  immediateRequestUpdates?: boolean;
}

/**
 * Custom hook for managing real-time topic subscriptions
 * Provides optimized, user-filtered real-time updates for topics and users
 */
export function useRealtimeTopics(options: UseRealtimeTopicsOptions = {}) {
  const { user } = useAuth();
  const subscriptionRefs = useRef<{
    topicsChannelId?: string;
    usersChannelId?: string;
    requestUpdatesChannelId?: string;
  }>({});
  const [connectionStatus, setConnectionStatus] = useState<{
    isConnected: boolean;
    hasErrors: boolean;
    lastError?: string;
    requestUpdatesConnected?: boolean;
  }>({ isConnected: false, hasErrors: false, requestUpdatesConnected: false });

  const {
    onTopicInsert,
    onTopicUpdate,
    onTopicDelete,
    onUserUpdate,
    debounceMs = 300,
    enableUserUpdates = true,
    enableRequestUpdates = true,
    immediateRequestUpdates = true
  } = options;

  // Memoized callbacks to prevent unnecessary re-subscriptions
  const handleTopicChange = useCallback((payload: any) => {
    console.log('Real-time topic change:', payload.eventType, payload.new?.id);
    
    // Update connection status on successful message
    setConnectionStatus(prev => ({ ...prev, isConnected: true, hasErrors: false }));
    
    try {
      switch (payload.eventType) {
        case 'INSERT':
          if (onTopicInsert && payload.new) {
            onTopicInsert(payload.new);
          }
          break;
        case 'UPDATE':
          if (onTopicUpdate && payload.new && payload.old) {
            onTopicUpdate(payload.new, payload.old);
          }
          break;
        case 'DELETE':
          if (onTopicDelete && payload.old?.id) {
            onTopicDelete(payload.old.id);
          }
          break;
      }
    } catch (error) {
      console.error('Error handling real-time topic change:', error);
      setConnectionStatus(prev => ({ 
        ...prev, 
        hasErrors: true, 
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [onTopicInsert, onTopicUpdate, onTopicDelete]);

  const handleUserChange = useCallback((payload: any) => {
    console.log('Real-time user change:', payload.eventType, payload.new?.id);
    
    try {
      if (payload.eventType === 'UPDATE' && onUserUpdate && payload.new) {
        onUserUpdate(payload.new);
      }
    } catch (error) {
      console.error('Error handling real-time user change:', error);
      setConnectionStatus(prev => ({ 
        ...prev, 
        hasErrors: true, 
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [onUserUpdate]);

  // Enhanced request update handler for immediate propagation
  const handleRequestUpdate = useCallback((payload: any) => {
    console.log('Real-time request update:', payload.eventType, payload.new?.id);
    
    // Update connection status on successful message
    setConnectionStatus(prev => ({ 
      ...prev, 
      isConnected: true, 
      hasErrors: false,
      requestUpdatesConnected: true 
    }));
    
    try {
      // Call the regular topic update handler for request changes
      if (onTopicUpdate && payload.eventType === 'UPDATE' && payload.new && payload.old) {
        onTopicUpdate(payload.new, payload.old);
      } else if (onTopicInsert && payload.eventType === 'INSERT' && payload.new) {
        onTopicInsert(payload.new);
      } else if (onTopicDelete && payload.eventType === 'DELETE' && payload.old?.id) {
        onTopicDelete(payload.old.id);
      }
    } catch (error) {
      console.error('Error handling real-time request update:', error);
      setConnectionStatus(prev => ({ 
        ...prev, 
        hasErrors: true, 
        lastError: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [onTopicInsert, onTopicUpdate, onTopicDelete]);

  // Optimized subscriptions - prevent excessive re-subscriptions
  useEffect(() => {
    if (!user) return;

    // Prevent duplicate subscriptions
    if (subscriptionRefs.current.topicsChannelId) {
      console.log('Real-time subscriptions already active, skipping setup');
      return;
    }

    console.log('Setting up real-time subscriptions for user:', user.uid);

    // Subscribe to topic changes with user filtering
    const topicsChannelId = realtimeManager.subscribeToTopics(handleTopicChange, {
      debounceMs: Math.max(debounceMs, 2000), // Increased minimum debounce to 2s for better performance
      userId: user.uid
    });
    subscriptionRefs.current.topicsChannelId = topicsChannelId;

    // Subscribe to user profile changes if enabled
    let usersChannelId: string | undefined;
    if (enableUserUpdates && !subscriptionRefs.current.usersChannelId) {
      usersChannelId = realtimeManager.subscribeToUsers(handleUserChange, {
        debounceMs: Math.max(debounceMs * 2, 3000) // Longer debounce for user updates (3s)
      });
      subscriptionRefs.current.usersChannelId = usersChannelId;
    }

    // Only subscribe to request updates if explicitly enabled and not already covered
    let requestUpdatesChannelId: string | undefined;
    if (enableRequestUpdates && immediateRequestUpdates && !subscriptionRefs.current.requestUpdatesChannelId) {
      requestUpdatesChannelId = realtimeManager.subscribeToRequestUpdates(handleRequestUpdate, {
        userId: user.uid,
        immediateUpdates: false // Disable immediate updates to prevent cascading
      });
      subscriptionRefs.current.requestUpdatesChannelId = requestUpdatesChannelId;
    }

    // Cleanup function
    return () => {
      console.log('Cleaning up real-time subscriptions');
      if (subscriptionRefs.current.topicsChannelId) {
        realtimeManager.unsubscribe(subscriptionRefs.current.topicsChannelId);
      }
      if (subscriptionRefs.current.usersChannelId) {
        realtimeManager.unsubscribe(subscriptionRefs.current.usersChannelId);
      }
      if (subscriptionRefs.current.requestUpdatesChannelId) {
        realtimeManager.unsubscribe(subscriptionRefs.current.requestUpdatesChannelId);
      }
      subscriptionRefs.current = {};
    };
  }, [user?.uid, debounceMs, enableUserUpdates, enableRequestUpdates, immediateRequestUpdates]); // Removed callback dependencies

  // Monitor connection health
  useEffect(() => {
    if (!subscriptionRefs.current.topicsChannelId) return;

    const healthCheckInterval = setInterval(() => {
      const isTopicsHealthy = realtimeManager.isChannelHealthy(subscriptionRefs.current.topicsChannelId!);
      const isRequestUpdatesHealthy = subscriptionRefs.current.requestUpdatesChannelId ? 
        realtimeManager.isChannelHealthy(subscriptionRefs.current.requestUpdatesChannelId) : true;
      
      setConnectionStatus(prev => ({ 
        ...prev, 
        isConnected: isTopicsHealthy,
        requestUpdatesConnected: isRequestUpdatesHealthy,
        hasErrors: (!isTopicsHealthy || !isRequestUpdatesHealthy) && prev.isConnected // Only set error if we were previously connected
      }));
    }, 5000); // Check every 5 seconds

    return () => clearInterval(healthCheckInterval);
  }, [subscriptionRefs.current.topicsChannelId, subscriptionRefs.current.requestUpdatesChannelId]);

  // Return subscription info for debugging
  return {
    isSubscribed: !!subscriptionRefs.current.topicsChannelId,
    connectionStatus,
    subscriptionInfo: realtimeManager.getSubscriptionInfo(),
    retryInfo: realtimeManager.getRetryInfo()
  };
}