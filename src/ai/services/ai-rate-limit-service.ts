import { supabase } from '@/lib/supabase';
import { getUserTier, type UserTier } from '@/lib/services/tier-service';
import { platformSettingsService } from '@/lib/services/platform-settings-service';
import { creditsService } from '@/lib/services/credits-service';

// Rate limits
const FREE_TIER_MESSAGE_LIMIT = 3;
const PRO_TIER_MESSAGE_LIMIT = 200;
const FREE_TIER_TOPIC_HELPER_LIMIT = 1;
const PRO_TIER_TOPIC_HELPER_LIMIT = 5;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetTime: Date;
  userTier: UserTier | 'credits';
  hasCredits?: boolean;
  creditsRemaining?: number;
}

/**
 * Check AI message rate limit
 * Priority: Pro > Credits > Free
 */
export async function checkAIMessageLimit(userId: string, authenticatedClient?: any): Promise<RateLimitResult> {
  const client = authenticatedClient || supabase;
  
  // Check platform settings first
  const settings = await platformSettingsService.getSettings();
  
  console.log('[Rate Limit] Settings loaded:', {
    rateLimitingEnabled: settings.rateLimitingEnabled,
    proTierEnabled: settings.proTierEnabled
  });
  
  // If rate limiting is disabled, everyone has unlimited access
  if (!settings.rateLimitingEnabled) {
    console.log('[Rate Limit] Rate limiting DISABLED - allowing unlimited access');
    return {
      allowed: true,
      remaining: PRO_TIER_MESSAGE_LIMIT,
      limit: PRO_TIER_MESSAGE_LIMIT,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userTier: 'pro'
    };
  }
  
  // Get effective user tier (considers platform settings)
  const userTier = await platformSettingsService.getEffectiveUserTier(userId);
  
  console.log('[Rate Limit] User tier:', userTier);

  // 1. Check if Pro (highest priority)
  if (userTier === 'pro') {
    return {
      allowed: true,
      remaining: PRO_TIER_MESSAGE_LIMIT,
      limit: PRO_TIER_MESSAGE_LIMIT,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userTier: 'pro'
    };
  }

  // 2. Check if has valid credits (second priority)
  const creditBalance = await creditsService.getCreditBalance(userId);
  
  if (!creditBalance.isExpired && creditBalance.credits > 0) {
    console.log('[Rate Limit] User has credits:', creditBalance.credits);
    return {
      allowed: true,
      remaining: creditBalance.credits,
      limit: creditBalance.credits,
      resetTime: creditBalance.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000),
      userTier: 'credits',
      hasCredits: true,
      creditsRemaining: creditBalance.credits
    };
  }

  // 3. Fall back to free tier (3/day limit)
  const today = new Date().toISOString().split('T')[0];

  const { data: usage } = await client
    .from('ai_usage')
    .select('message_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  const currentCount = usage?.message_count || 0;
  const remaining = Math.max(0, FREE_TIER_MESSAGE_LIMIT - currentCount);
  const allowed = currentCount < FREE_TIER_MESSAGE_LIMIT;

  console.log('[Rate Limit] Free tier check:', {
    currentCount,
    limit: FREE_TIER_MESSAGE_LIMIT,
    remaining,
    allowed
  });

  // Calculate reset time (midnight tonight)
  const resetTime = new Date();
  resetTime.setHours(24, 0, 0, 0);

  return {
    allowed,
    remaining,
    limit: FREE_TIER_MESSAGE_LIMIT,
    resetTime,
    userTier: 'free'
  };
}

/**
 * Check topic helper rate limit
 */
export async function checkTopicHelperLimit(userId: string): Promise<RateLimitResult> {
  // Check platform settings first
  const settings = await platformSettingsService.getSettings();
  
  // If rate limiting is disabled, everyone has unlimited access
  if (!settings.rateLimitingEnabled) {
    return {
      allowed: true,
      remaining: PRO_TIER_TOPIC_HELPER_LIMIT,
      limit: PRO_TIER_TOPIC_HELPER_LIMIT,
      resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
      userTier: 'pro' // Treat as Pro when rate limiting is off
    };
  }
  
  // Get effective user tier (considers platform settings)
  const userTier = await platformSettingsService.getEffectiveUserTier(userId);

  // Pro users have higher limit
  const limit = userTier === 'pro' ? PRO_TIER_TOPIC_HELPER_LIMIT : FREE_TIER_TOPIC_HELPER_LIMIT;

  // Get today's usage
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: usage, error } = await supabase
    .from('ai_usage')
    .select('topic_helper_count')
    .eq('user_id', userId)
    .eq('usage_date', today)
    .single();

  const currentCount = usage?.topic_helper_count || 0;
  const remaining = Math.max(0, limit - currentCount);
  const allowed = currentCount < limit;

  // Calculate reset time (midnight tonight)
  const resetTime = new Date();
  resetTime.setHours(24, 0, 0, 0);

  return {
    allowed,
    remaining,
    limit,
    resetTime,
    userTier
  };
}

/**
 * Increment AI message usage count
 * Priority: Pro (no deduction) > Credits (deduct 1) > Free (increment daily count)
 */
export async function incrementAIMessageUsage(userId: string, authenticatedClient?: any): Promise<void> {
  try {
    const client = authenticatedClient || supabase;
    
    // Check user tier
    const userTier = await platformSettingsService.getEffectiveUserTier(userId);
    
    // If Pro, don't deduct anything
    if (userTier === 'pro') {
      console.log('[Rate Limit] Pro user - no deduction');
      return;
    }
    
    // Check if user has valid credits
    const creditBalance = await creditsService.getCreditBalance(userId);
    
    if (!creditBalance.isExpired && creditBalance.credits > 0) {
      // Deduct 1 credit (pass authenticated client)
      const result = await creditsService.deductCredit(userId, client);
      if (result.success) {
        console.log(`[Rate Limit] Deducted 1 credit. Remaining: ${result.remaining}`);
        return;
      }
    }
    
    // Fall back to free tier - increment daily usage
    const today = new Date().toISOString().split('T')[0];
    const { error } = await client.rpc('increment_ai_message_usage', {
      p_user_id: userId,
      p_usage_date: today
    });

    if (error) {
      console.error('Failed to increment AI message usage:', error);
    } else {
      console.log('[Rate Limit] Incremented free tier daily usage');
    }
  } catch (error) {
    console.error('Error in incrementAIMessageUsage:', error);
  }
}

/**
 * Increment topic helper usage count
 */
export async function incrementTopicHelperUsage(userId: string): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Use the atomic increment function from database
    const { error } = await supabase.rpc('increment_topic_helper_usage', {
      p_user_id: userId,
      p_usage_date: today
    });

    if (error) {
      console.error('Failed to increment topic helper usage:', error);
    }
  } catch (error) {
    console.error('Error in incrementTopicHelperUsage:', error);
  }
}

/**
 * Get current usage for display
 */
export async function getCurrentUsage(userId: string): Promise<{
  messageCount: number;
  topicHelperCount: number;
  date: string;
}> {
  try {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('ai_usage')
      .select('message_count, topic_helper_count, usage_date')
      .eq('user_id', userId)
      .eq('usage_date', today)
      .single();

    if (error || !data) {
      return {
        messageCount: 0,
        topicHelperCount: 0,
        date: today
      };
    }

    return {
      messageCount: data.message_count || 0,
      topicHelperCount: data.topic_helper_count || 0,
      date: data.usage_date
    };
  } catch (error) {
    console.error('Error in getCurrentUsage:', error);
    return {
      messageCount: 0,
      topicHelperCount: 0,
      date: new Date().toISOString().split('T')[0]
    };
  }
}

/**
 * Format rate limit error message
 */
export function formatRateLimitMessage(result: RateLimitResult, type: 'message' | 'topic_helper'): string {
  if (type === 'message') {
    return `You've used your ${result.limit} free AI messages today! 💙\n\nUpgrade to Pro for unlimited AI support (up to ${PRO_TIER_MESSAGE_LIMIT}/day), or your messages reset tomorrow at midnight.\n\n[Upgrade to Pro]`;
  } else {
    return `You've used your ${result.limit} free topic helper${result.limit > 1 ? 's' : ''} today! 💙\n\nUpgrade to Pro for ${PRO_TIER_TOPIC_HELPER_LIMIT} topic helpers per day, or your limit resets tomorrow at midnight.\n\n[Upgrade to Pro]`;
  }
}
