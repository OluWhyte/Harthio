import { supabase } from '@/lib/supabase';

export type UserTier = 'free' | 'pro';

export interface TierInfo {
  tier: UserTier;
  isTrialActive: boolean;
  trialEndDate: Date | null;
  subscriptionStartDate: Date | null;
  subscriptionEndDate: Date | null;
}

/**
 * Get user's current tier (handles trial logic)
 */
export async function getUserTier(userId: string): Promise<UserTier> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('subscription_tier, trial_end_date, is_trial_active')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching user tier:', error);
      return 'free';
    }

    // Check if trial is active and not expired
    if (data.is_trial_active && data.trial_end_date) {
      const trialEnd = new Date(data.trial_end_date);
      if (trialEnd > new Date()) {
        return 'pro'; // Trial users get Pro access
      } else {
        // Trial expired, update database
        await supabase
          .from('users')
          .update({ is_trial_active: false })
          .eq('id', userId);
      }
    }

    return (data.subscription_tier as UserTier) || 'free';
  } catch (error) {
    console.error('Error in getUserTier:', error);
    return 'free';
  }
}

/**
 * Get complete tier information
 */
export async function getTierInfo(userId: string): Promise<TierInfo> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select(`
        subscription_tier,
        is_trial_active,
        trial_end_date,
        subscription_start_date,
        subscription_end_date
      `)
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('Error fetching tier info:', error);
      return {
        tier: 'free',
        isTrialActive: false,
        trialEndDate: null,
        subscriptionStartDate: null,
        subscriptionEndDate: null
      };
    }

    // Check if trial is active and not expired
    let tier: UserTier = (data.subscription_tier as UserTier) || 'free';
    let isTrialActive = data.is_trial_active || false;

    if (isTrialActive && data.trial_end_date) {
      const trialEnd = new Date(data.trial_end_date);
      if (trialEnd > new Date()) {
        tier = 'pro'; // Trial users get Pro access
      } else {
        // Trial expired
        isTrialActive = false;
        await supabase
          .from('users')
          .update({ is_trial_active: false })
          .eq('id', userId);
      }
    }

    return {
      tier,
      isTrialActive,
      trialEndDate: data.trial_end_date ? new Date(data.trial_end_date) : null,
      subscriptionStartDate: data.subscription_start_date ? new Date(data.subscription_start_date) : null,
      subscriptionEndDate: data.subscription_end_date ? new Date(data.subscription_end_date) : null
    };
  } catch (error) {
    console.error('Error in getTierInfo:', error);
    return {
      tier: 'free',
      isTrialActive: false,
      trialEndDate: null,
      subscriptionStartDate: null,
      subscriptionEndDate: null
    };
  }
}

/**
 * Check if user is Pro (including active trial)
 */
export async function isProUser(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === 'pro';
}

/**
 * Start 14-day free trial (only for users who haven't used trial yet)
 */
export async function startFreeTrial(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if user already had a trial
    const { data: existing } = await supabase
      .from('users')
      .select('trial_start_date, subscription_tier')
      .eq('id', userId)
      .single();

    if (existing?.trial_start_date) {
      return {
        success: false,
        error: 'You have already used your free trial. Please subscribe to continue with Pro.'
      };
    }

    const trialStart = new Date();
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 14); // 14-day trial

    const { error } = await supabase
      .from('users')
      .update({
        trial_start_date: trialStart.toISOString(),
        trial_end_date: trialEnd.toISOString(),
        is_trial_active: true,
        subscription_tier: 'pro' // Give Pro access during trial
      })
      .eq('id', userId);

    if (error) {
      console.error('Error starting trial:', error);
      return {
        success: false,
        error: 'Failed to start trial. Please try again.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in startFreeTrial:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Add subscription time (monthly or yearly)
 * Stacks on existing subscription if user is already Pro
 */
export async function addSubscriptionTime(
  userId: string,
  months: number,
  paymentId?: string
): Promise<{ success: boolean; error?: string; monthsRemaining?: number }> {
  try {
    const { data: existing } = await supabase
      .from('users')
      .select('subscription_tier, subscription_end_date, is_trial_active')
      .eq('id', userId)
      .single();

    if (!existing) {
      return {
        success: false,
        error: 'User not found'
      };
    }

    const now = new Date();
    let newEndDate: Date;

    // If user is already Pro with active subscription
    if (existing.subscription_tier === 'pro' && existing.subscription_end_date) {
      const currentEndDate = new Date(existing.subscription_end_date);
      // If subscription is still active, stack on top
      if (currentEndDate > now) {
        newEndDate = new Date(currentEndDate);
        newEndDate.setMonth(newEndDate.getMonth() + months);
      } else {
        // Subscription expired, start fresh
        newEndDate = new Date(now);
        newEndDate.setMonth(newEndDate.getMonth() + months);
      }
    } else {
      // New Pro user or Free user upgrading
      newEndDate = new Date(now);
      newEndDate.setMonth(newEndDate.getMonth() + months);
    }

    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: 'pro',
        subscription_start_date: existing.subscription_tier === 'pro' ? undefined : now.toISOString(),
        subscription_end_date: newEndDate.toISOString(),
        is_trial_active: false // End trial if active
      })
      .eq('id', userId);

    if (error) {
      console.error('Error adding subscription time:', error);
      return {
        success: false,
        error: 'Failed to process subscription. Please try again.'
      };
    }

    // Calculate months remaining
    const monthsRemaining = Math.ceil((newEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return { 
      success: true,
      monthsRemaining
    };
  } catch (error) {
    console.error('Error in addSubscriptionTime:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}

/**
 * Upgrade user to Pro (for payment gateway integration)
 * @deprecated Use addSubscriptionTime instead
 */
export async function upgradeToPro(
  userId: string,
  subscriptionId?: string
): Promise<{ success: boolean; error?: string }> {
  return addSubscriptionTime(userId, 1, subscriptionId);
}

/**
 * Downgrade user to Free (for subscription cancellation)
 */
export async function downgradeToFree(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('users')
      .update({
        subscription_tier: 'free',
        subscription_end_date: new Date().toISOString(),
        is_trial_active: false
      })
      .eq('id', userId);

    if (error) {
      console.error('Error downgrading to Free:', error);
      return {
        success: false,
        error: 'Failed to downgrade. Please contact support.'
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in downgradeToFree:', error);
    return {
      success: false,
      error: 'An unexpected error occurred'
    };
  }
}
