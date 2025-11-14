/**
 * Optimized hook for fetching and caching topics
 * Reduces API calls and improves performance
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { topicService } from '@/lib/supabase-services';
import type { TopicWithAuthor } from '@/lib/database-types';

interface UseCachedTopicsOptions {
  cacheTime?: number; // Cache duration in milliseconds
  enableRealtime?: boolean; // Enable real-time updates
  realtimeInterval?: number; // Real-time polling interval
}

interface CachedTopicsState {
  topics: TopicWithAuthor[];
  isLoading: boolean;
  error: string | null;
  lastFetched: Date | null;
  cacheHit: boolean;
}

const CACHE_KEY = 'harthio_topics_cache';
const DEFAULT_CACHE_TIME = 2 * 60 * 1000; // 2 minutes
const DEFAULT_REALTIME_INTERVAL = 60 * 1000; // 60 seconds

export function useCachedTopics(options: UseCachedTopicsOptions = {}) {
  const {
    cacheTime = DEFAULT_CACHE_TIME,
    enableRealtime = true,
    realtimeInterval = DEFAULT_REALTIME_INTERVAL,
  } = options;

  const [state, setState] = useState<CachedTopicsState>({
    topics: [],
    isLoading: true,
    error: null,
    lastFetched: null,
    cacheHit: false,
  });

  const realtimeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);

  // Load from cache
  const loadFromCache = useCallback((): TopicWithAuthor[] | null => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age < cacheTime) {
        console.log(`📦 [CACHE] Hit - Age: ${(age / 1000).toFixed(0)}s`);
        return data;
      }

      console.log(`📦 [CACHE] Expired - Age: ${(age / 1000).toFixed(0)}s`);
      return null;
    } catch (error) {
      console.error('📦 [CACHE] Error loading:', error);
      return null;
    }
  }, [cacheTime]);

  // Save to cache
  const saveToCache = useCallback((data: TopicWithAuthor[]) => {
    try {
      sessionStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
      console.log(`📦 [CACHE] Saved ${data.length} topics`);
    } catch (error) {
      console.error('📦 [CACHE] Error saving:', error);
    }
  }, []);

  // Fetch topics
  const fetchTopics = useCallback(
    async (forceRefresh = false) => {
      // Prevent concurrent fetches
      if (isFetchingRef.current && !forceRefresh) {
        console.log('⏭️ [FETCH] Skipping - already fetching');
        return;
      }

      // Try cache first (unless force refresh)
      if (!forceRefresh) {
        const cached = loadFromCache();
        if (cached) {
          setState({
            topics: cached,
            isLoading: false,
            error: null,
            lastFetched: new Date(),
            cacheHit: true,
          });
          return;
        }
      }

      isFetchingRef.current = true;
      setState((prev) => ({ ...prev, isLoading: true, cacheHit: false }));

      const startTime = performance.now();

      try {
        const data = await topicService.getAllTopics();
        const fetchTime = performance.now() - startTime;

        console.log(`⚡ [FETCH] Loaded ${data.length} topics in ${fetchTime.toFixed(0)}ms`);

        saveToCache(data);

        setState({
          topics: data,
          isLoading: false,
          error: null,
          lastFetched: new Date(),
          cacheHit: false,
        });
      } catch (error) {
        console.error('❌ [FETCH] Error:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to fetch topics',
        }));
      } finally {
        isFetchingRef.current = false;
      }
    },
    [loadFromCache, saveToCache]
  );

  // Initial fetch
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealtime) return;

    realtimeIntervalRef.current = setInterval(() => {
      console.log('🔄 [REALTIME] Refreshing topics...');
      fetchTopics(true);
    }, realtimeInterval);

    return () => {
      if (realtimeIntervalRef.current) {
        clearInterval(realtimeIntervalRef.current);
      }
    };
  }, [enableRealtime, realtimeInterval, fetchTopics]);

  // Manual refresh
  const refresh = useCallback(() => {
    return fetchTopics(true);
  }, [fetchTopics]);

  // Clear cache
  const clearCache = useCallback(() => {
    sessionStorage.removeItem(CACHE_KEY);
    console.log('📦 [CACHE] Cleared');
  }, []);

  return {
    topics: state.topics,
    isLoading: state.isLoading,
    error: state.error,
    lastFetched: state.lastFetched,
    cacheHit: state.cacheHit,
    refresh,
    clearCache,
  };
}
