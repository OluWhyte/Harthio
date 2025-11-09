/**
 * React Hook for Cached Profile Access
 * 
 * Provides O(1) profile lookups with automatic loading states and error handling.
 * Uses ProfileCacheService under the hood for instant access.
 * 
 * Usage:
 * const { profile, loading, error } = useCachedProfile(userId);
 */

import { useState, useEffect } from 'react';
import { profileCache } from '@/lib/profile-cache-service';
import type { Database } from '@/lib/database-types';

type Profile = Database['public']['Tables']['users']['Row'];

interface UseCachedProfileResult {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to get a single profile with O(1) cache lookup
 */
export function useCachedProfile(userId: string | null | undefined): UseCachedProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async () => {
    if (!userId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // O(1) lookup if cached
      const data = await profileCache.getProfile(userId);
      setProfile(data);
    } catch (err) {
      console.error('Failed to load profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  return {
    profile,
    loading,
    error,
    refresh: loadProfile
  };
}

/**
 * Hook to get multiple profiles with O(1) cache lookups
 */
export function useCachedProfiles(userIds: string[]): {
  profiles: Map<string, Profile>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
} {
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    if (userIds.length === 0) {
      setProfiles(new Map());
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // O(1) lookup per cached profile
      const data = await profileCache.getProfiles(userIds);
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, [userIds.join(',')]); // Re-run when userIds change

  return {
    profiles,
    loading,
    error,
    refresh: loadProfiles
  };
}

/**
 * Hook to get profile cache statistics
 */
export function useProfileCacheStats() {
  const [stats, setStats] = useState({
    size: 0,
    hitRate: 0,
    oldestEntry: null as number | null
  });

  useEffect(() => {
    const updateStats = () => {
      setStats(profileCache.getStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return stats;
}
