/**
 * Profile Cache Service - O(1) Profile Lookups
 * 
 * Provides instant profile access using in-memory Map for O(1) time complexity.
 * Automatically handles cache invalidation and updates.
 * 
 * Benefits:
 * - Instant profile lookups (O(1) instead of O(n) database queries)
 * - Reduces database load
 * - Improves dashboard, session lists, and admin page performance
 * - Automatic cache invalidation on profile updates
 */

import { supabaseClient } from './supabase';
import type { Database } from './database-types';

type Profile = Database['public']['Tables']['users']['Row'];

export class ProfileCacheService {
  private static instance: ProfileCacheService;
  private cache: Map<string, Profile>; // O(1) lookups by userId
  private cacheTimestamps: Map<string, number>; // Track when cached
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private realtimeSubscription: any = null;

  private constructor() {
    this.cache = new Map();
    this.cacheTimestamps = new Map();
    this.setupRealtimeUpdates();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): ProfileCacheService {
    if (!ProfileCacheService.instance) {
      ProfileCacheService.instance = new ProfileCacheService();
    }
    return ProfileCacheService.instance;
  }

  /**
   * Get profile by userId - O(1) if cached, otherwise fetches and caches
   */
  async getProfile(userId: string): Promise<Profile | null> {
    // Check cache first - O(1)
    const cached = this.cache.get(userId);
    const timestamp = this.cacheTimestamps.get(userId);

    // Return cached if valid
    if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
      return cached;
    }

    // Fetch from database if not cached or expired
    return await this.fetchAndCache(userId);
  }

  /**
   * Get multiple profiles - O(1) per cached profile
   */
  async getProfiles(userIds: string[]): Promise<Map<string, Profile>> {
    const results = new Map<string, Profile>();
    const uncachedIds: string[] = [];

    // Check cache for each userId - O(1) per lookup
    for (const userId of userIds) {
      const cached = this.cache.get(userId);
      const timestamp = this.cacheTimestamps.get(userId);

      if (cached && timestamp && Date.now() - timestamp < this.CACHE_TTL) {
        results.set(userId, cached);
      } else {
        uncachedIds.push(userId);
      }
    }

    // Fetch uncached profiles in batch
    if (uncachedIds.length > 0) {
      const fetched = await this.fetchAndCacheMultiple(uncachedIds);
      fetched.forEach((profile, userId) => {
        results.set(userId, profile);
      });
    }

    return results;
  }

  /**
   * Manually update cache (e.g., after profile edit)
   */
  updateCache(userId: string, profile: Profile): void {
    this.cache.set(userId, profile);
    this.cacheTimestamps.set(userId, Date.now());
  }

  /**
   * Invalidate specific profile
   */
  invalidate(userId: string): void {
    this.cache.delete(userId);
    this.cacheTimestamps.delete(userId);
  }

  /**
   * Clear entire cache
   */
  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    oldestEntry: number | null;
  } {
    const now = Date.now();
    let oldestTimestamp: number | null = null;

    this.cacheTimestamps.forEach((timestamp) => {
      if (oldestTimestamp === null || timestamp < oldestTimestamp) {
        oldestTimestamp = timestamp;
      }
    });

    return {
      size: this.cache.size,
      hitRate: 0, // Would need to track hits/misses for accurate rate
      oldestEntry: oldestTimestamp ? now - oldestTimestamp : null
    };
  }

  /**
   * Fetch single profile from database and cache it
   */
  private async fetchAndCache(userId: string): Promise<Profile | null> {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to fetch profile:', error);
        return null;
      }

      if (data) {
        this.cache.set(userId, data);
        this.cacheTimestamps.set(userId, Date.now());
      }

      return data;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Fetch multiple profiles from database and cache them
   */
  private async fetchAndCacheMultiple(userIds: string[]): Promise<Map<string, Profile>> {
    const results = new Map<string, Profile>();

    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .in('id', userIds);

      if (error) {
        console.error('Failed to fetch profiles:', error);
        return results;
      }

      if (data) {
        const now = Date.now();
        data.forEach((profile) => {
          this.cache.set(profile.id, profile);
          this.cacheTimestamps.set(profile.id, now);
          results.set(profile.id, profile);
        });
      }

      return results;
    } catch (error) {
      console.error('Error fetching profiles:', error);
      return results;
    }
  }

  /**
   * Setup real-time updates to invalidate cache when profiles change
   */
  private setupRealtimeUpdates(): void {
    try {
      this.realtimeSubscription = supabaseClient
        .channel('profile-cache-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'users'
          },
          (payload) => {
            console.log('Profile update detected:', payload);

            if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
              const profile = payload.new as Profile;
              this.updateCache(profile.id, profile);
            } else if (payload.eventType === 'DELETE') {
              const oldProfile = payload.old as { id: string };
              this.invalidate(oldProfile.id);
            }
          }
        )
        .subscribe();

      console.log('✅ Profile cache real-time updates enabled');
    } catch (error) {
      console.error('Failed to setup profile cache real-time updates:', error);
    }
  }

  /**
   * Cleanup subscriptions
   */
  destroy(): void {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
    }
    this.clearCache();
  }
}

// Export singleton instance
export const profileCache = ProfileCacheService.getInstance();

/**
 * React Hook for profile caching
 */
export function useProfileCache() {
  const cache = ProfileCacheService.getInstance();

  return {
    getProfile: (userId: string) => cache.getProfile(userId),
    getProfiles: (userIds: string[]) => cache.getProfiles(userIds),
    updateCache: (userId: string, profile: Profile) => cache.updateCache(userId, profile),
    invalidate: (userId: string) => cache.invalidate(userId),
    clearCache: () => cache.clearCache(),
    getStats: () => cache.getStats()
  };
}
