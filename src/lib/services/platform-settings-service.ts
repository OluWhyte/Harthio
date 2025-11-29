// Platform Settings Service
// Checks admin-controlled feature flags and settings

import { supabaseClient } from '@/lib/supabase';

export interface PlatformSettings {
  proTierEnabled: boolean;
  creditsEnabled: boolean;
  rateLimitingEnabled: boolean;
  trackerLimitsEnabled: boolean;
  trialModeEnabled: boolean;
  maintenanceMode: boolean;
  featureFlags: {
    visualJourney: boolean;
    aiTopicHelper: boolean;
    voiceInput: boolean;
  };
}

export const platformSettingsService = {
  /**
   * Get all platform settings
   */
  async getSettings(): Promise<PlatformSettings> {
    try {
      const { data, error } = await supabaseClient
        .from('platform_settings')
        .select('setting_key, setting_value');

      if (error) {
        console.error('[Platform Settings] Error fetching:', error);
        return this.getDefaultSettings();
      }

      const settingsMap: Record<string, any> = {};
      data?.forEach((setting: any) => {
        settingsMap[setting.setting_key] = setting.setting_value;
      });

      const settings = {
        proTierEnabled: settingsMap['pro_tier_enabled']?.enabled || false,
        creditsEnabled: settingsMap['credits_enabled']?.enabled || false,
        rateLimitingEnabled: settingsMap['ai_rate_limiting_enabled']?.enabled || false,
        trackerLimitsEnabled: settingsMap['tracker_limits_enabled']?.enabled || false,
        trialModeEnabled: settingsMap['trial_mode_enabled']?.enabled || false,
        maintenanceMode: settingsMap['maintenance_mode']?.enabled || false,
        featureFlags: {
          visualJourney: settingsMap['feature_flags']?.visual_journey || false,
          aiTopicHelper: settingsMap['feature_flags']?.ai_topic_helper || false,
          voiceInput: settingsMap['feature_flags']?.voice_input || false,
        }
      };

      console.log('[Platform Settings] Loaded:', {
        proTierEnabled: settings.proTierEnabled,
        rateLimitingEnabled: settings.rateLimitingEnabled,
        rawRateLimitValue: settingsMap['ai_rate_limiting_enabled']
      });

      return settings;
    } catch (err) {
      console.error('[Platform Settings] Error in getSettings:', err);
      return this.getDefaultSettings();
    }
  },

  /**
   * Check if Pro tier is enforced
   */
  async isProTierEnforced(): Promise<boolean> {
    try {
      const { data, error } = await supabaseClient
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'pro_tier_enabled')
        .single();

      if (error || !data) return false;

      return (data as any).setting_value?.enabled || false;
    } catch (err) {
      console.error('Error checking Pro tier:', err);
      return false;
    }
  },

  /**
   * Get effective user tier (considers platform settings)
   * If Pro tier is disabled, everyone gets 'pro'
   * If Pro tier is enabled, returns actual user tier
   */
  async getEffectiveUserTier(userId: string): Promise<'free' | 'pro'> {
    try {
      // Check if Pro tier is enforced
      const proEnforced = await this.isProTierEnforced();
      
      // If not enforced, everyone gets Pro
      if (!proEnforced) {
        return 'pro';
      }

      // Otherwise, get actual user tier
      const { data, error } = await supabaseClient
        .from('users')
        .select('subscription_tier, is_trial_active, trial_end_date')
        .eq('id', userId)
        .single();

      if (error || !data) return 'free';

      const userData = data as any;

      // Check if trial is active and not expired
      // BUT only if trial mode is enabled in platform settings
      const settings = await this.getSettings();
      if (settings.trialModeEnabled && userData.is_trial_active && userData.trial_end_date) {
        const trialEnd = new Date(userData.trial_end_date);
        if (trialEnd > new Date()) {
          return 'pro'; // Active trial = Pro access
        }
      }

      return (userData.subscription_tier as 'free' | 'pro') || 'free';
    } catch (err) {
      console.error('Error getting effective user tier:', err);
      return 'free';
    }
  },

  /**
   * Check if user can access AI (considers rate limiting)
   */
  async canAccessAI(userId: string): Promise<{ allowed: boolean; remaining?: number; limit?: number }> {
    try {
      const settings = await this.getSettings();
      
      // If rate limiting is disabled, everyone has unlimited access
      if (!settings.rateLimitingEnabled) {
        return { allowed: true };
      }

      // Get user's effective tier
      const tier = await this.getEffectiveUserTier(userId);
      
      // Pro users always have unlimited access
      if (tier === 'pro') {
        return { allowed: true };
      }

      // Check free user's usage today
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabaseClient
        .from('ai_usage')
        .select('message_count')
        .eq('user_id', userId)
        .eq('usage_date', today)
        .single();

      const messageCount = (data as any)?.message_count || 0;
      const limit = 3; // Free tier limit
      const remaining = Math.max(0, limit - messageCount);

      return {
        allowed: messageCount < limit,
        remaining,
        limit
      };
    } catch (err) {
      console.error('Error checking AI access:', err);
      // On error, allow access (fail open for better UX)
      return { allowed: true };
    }
  },

  /**
   * Default settings (used as fallback)
   */
  getDefaultSettings(): PlatformSettings {
    return {
      proTierEnabled: false, // Disabled by default for launch
      creditsEnabled: false, // Disabled by default for launch
      rateLimitingEnabled: false,
      trackerLimitsEnabled: false,
      trialModeEnabled: false, // Disabled by default
      maintenanceMode: false,
      featureFlags: {
        visualJourney: false,
        aiTopicHelper: false,
        voiceInput: false,
      }
    };
  }
};
