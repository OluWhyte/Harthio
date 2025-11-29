// Credits Service
// Manages pay-as-you-go AI message credits

import { supabase } from '@/lib/supabase';

export interface CreditBalance {
  credits: number;
  expiresAt: Date | null;
  isExpired: boolean;
}

export interface CreditPack {
  id: string;
  name: string;
  price: number;
  credits: number;
  validityDays: number;
  popular?: boolean;
  description: string;
  costPerMessage: number;
}

export const CREDIT_PACKS: CreditPack[] = [
  {
    id: 'starter',
    name: 'Starter Pack',
    price: 2.00,
    credits: 50,
    validityDays: 30,
    description: 'Perfect for light AI users',
    costPerMessage: 0.04,
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    price: 5.00,
    credits: 150,
    validityDays: 60,
    popular: true,
    description: 'Best value for regular users',
    costPerMessage: 0.033,
  },
  {
    id: 'power',
    name: 'Power Pack',
    price: 10.00,
    credits: 500,
    validityDays: 90,
    description: 'For heavy AI users',
    costPerMessage: 0.02,
  },
];

export const creditsService = {
  /**
   * Get user's current credit balance
   */
  async getCreditBalance(userId: string): Promise<CreditBalance> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('ai_credits, credits_expire_at')
        .eq('id', userId)
        .single();

      if (error || !data) {
        return { credits: 0, expiresAt: null, isExpired: false };
      }

      const expiresAt = data.credits_expire_at ? new Date(data.credits_expire_at) : null;
      const isExpired = expiresAt ? expiresAt < new Date() : false;

      // If expired, return 0 credits
      return {
        credits: isExpired ? 0 : (data.ai_credits || 0),
        expiresAt,
        isExpired,
      };
    } catch (error) {
      console.error('Error getting credit balance:', error);
      return { credits: 0, expiresAt: null, isExpired: false };
    }
  },

  /**
   * Add credits to user account
   * Credits stack - new credits extend expiry date
   */
  async addCredits(
    userId: string,
    credits: number,
    validityDays: number,
    paymentId?: string
  ): Promise<{ success: boolean; error?: string; newBalance?: number; expiresAt?: Date }> {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('ai_credits, credits_expire_at')
        .eq('id', userId)
        .single();

      if (!user) {
        return { success: false, error: 'User not found' };
      }

      const now = new Date();
      const currentExpiry = user.credits_expire_at ? new Date(user.credits_expire_at) : null;
      
      // Calculate new expiry date
      let newExpiry: Date;
      if (currentExpiry && currentExpiry > now) {
        // Extend existing expiry by validity days
        newExpiry = new Date(currentExpiry);
        newExpiry.setDate(newExpiry.getDate() + validityDays);
      } else {
        // Start fresh expiry from now
        newExpiry = new Date(now);
        newExpiry.setDate(newExpiry.getDate() + validityDays);
      }

      // Add credits to existing balance (or reset if expired)
      const currentCredits = (currentExpiry && currentExpiry > now) ? (user.ai_credits || 0) : 0;
      const newBalance = currentCredits + credits;

      const { error } = await supabase
        .from('users')
        .update({
          ai_credits: newBalance,
          credits_expire_at: newExpiry.toISOString(),
        })
        .eq('id', userId);

      if (error) {
        console.error('Error adding credits:', error);
        return { success: false, error: 'Failed to add credits' };
      }

      console.log(`✅ Added ${credits} credits to user ${userId}. New balance: ${newBalance}, Expires: ${newExpiry.toISOString()}`);

      return { 
        success: true, 
        newBalance,
        expiresAt: newExpiry
      };
    } catch (error) {
      console.error('Error in addCredits:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Deduct one credit from user balance
   * Returns false if no credits available
   */
  async deductCredit(userId: string, authenticatedClient?: any): Promise<{ success: boolean; remaining?: number }> {
    try {
      const client = authenticatedClient || supabase;
      const balance = await this.getCreditBalance(userId);
      
      if (balance.isExpired || balance.credits <= 0) {
        return { success: false };
      }

      const { error } = await client
        .from('users')
        .update({ ai_credits: balance.credits - 1 })
        .eq('id', userId);

      if (error) {
        console.error('Error deducting credit:', error);
        return { success: false };
      }

      return { success: true, remaining: balance.credits - 1 };
    } catch (error) {
      console.error('Error in deductCredit:', error);
      return { success: false };
    }
  },

  /**
   * Record credit purchase in database
   */
  async recordPurchase(
    userId: string,
    packId: string,
    paymentId: string,
    paymentMethod: string,
    paymentGateway: string
  ): Promise<{ success: boolean; error?: string }> {
    const pack = CREDIT_PACKS.find(p => p.id === packId);
    if (!pack) {
      return { success: false, error: 'Invalid pack ID' };
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + pack.validityDays);

    try {
      const { error } = await supabase
        .from('credit_purchases')
        .insert({
          user_id: userId,
          pack_id: packId,
          amount_usd: pack.price,
          credits_purchased: pack.credits,
          validity_days: pack.validityDays,
          payment_method: paymentMethod,
          payment_id: paymentId,
          payment_gateway: paymentGateway,
          status: 'completed',
          expires_at: expiresAt.toISOString(),
        });

      if (error) {
        console.error('Error recording purchase:', error);
        return { success: false, error: 'Failed to record purchase' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in recordPurchase:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  },

  /**
   * Get user's purchase history
   */
  async getPurchaseHistory(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching purchase history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getPurchaseHistory:', error);
      return [];
    }
  },

  /**
   * Get credit pack by ID
   */
  getPackById(packId: string): CreditPack | undefined {
    return CREDIT_PACKS.find(p => p.id === packId);
  },

  /**
   * Calculate days until credits expire
   */
  getDaysUntilExpiry(expiresAt: Date | null): number {
    if (!expiresAt) return 0;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  },

  /**
   * Format expiry date for display
   */
  formatExpiryDate(expiresAt: Date | null): string {
    if (!expiresAt) return 'No expiry';
    const days = this.getDaysUntilExpiry(expiresAt);
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    if (days < 7) return `Expires in ${days} days`;
    return new Date(expiresAt).toLocaleDateString();
  },
};
