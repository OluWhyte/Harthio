import { supabase } from '@/lib/supabase';

export interface PricingData {
  pro: {
    usd: string;
    ngn: string;
  };
  credits: Array<{
    id: string;
    name: string;
    credits: number;
    priceUSD: string;
    priceNGN: string;
    days: number;
  }>;
}

// Default pricing (fallback if database is not available)
const DEFAULT_PRICING: PricingData = {
  pro: {
    usd: '9.99',
    ngn: '15000'
  },
  credits: [
    { id: 'starter', name: 'Starter Pack', credits: 50, priceUSD: '2.00', priceNGN: '3000', days: 30 },
    { id: 'popular', name: 'Popular Pack', credits: 150, priceUSD: '5.00', priceNGN: '7500', days: 60 },
    { id: 'power', name: 'Power Pack', credits: 500, priceUSD: '10.00', priceNGN: '15000', days: 90 }
  ]
};

let cachedPricing: PricingData | null = null;
let lastFetch: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class PricingService {
  /**
   * Get current pricing from database or cache
   */
  static async getPricing(): Promise<PricingData> {
    // Return cached pricing if still valid
    if (cachedPricing && Date.now() - lastFetch < CACHE_DURATION) {
      return cachedPricing;
    }

    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('setting_value')
        .eq('setting_key', 'pricing')
        .single();

      if (error || !data) {
        console.warn('Pricing not found in database, using defaults');
        cachedPricing = DEFAULT_PRICING;
        lastFetch = Date.now();
        return DEFAULT_PRICING;
      }

      cachedPricing = data.setting_value as PricingData;
      lastFetch = Date.now();
      return cachedPricing;
    } catch (error) {
      console.error('Error fetching pricing:', error);
      return DEFAULT_PRICING;
    }
  }

  /**
   * Get Pro subscription price
   */
  static async getProPrice(currency: 'usd' | 'ngn' = 'usd'): Promise<string> {
    const pricing = await this.getPricing();
    return currency === 'usd' ? pricing.pro.usd : pricing.pro.ngn;
  }

  /**
   * Get credit packs
   */
  static async getCreditPacks() {
    const pricing = await this.getPricing();
    return pricing.credits;
  }

  /**
   * Get specific credit pack by ID
   */
  static async getCreditPack(packId: string) {
    const packs = await this.getCreditPacks();
    return packs.find(p => p.id === packId);
  }

  /**
   * Clear cache (useful after admin updates pricing)
   */
  static clearCache() {
    cachedPricing = null;
    lastFetch = 0;
  }

  /**
   * Detect user currency based on country
   */
  static detectCurrency(country?: string): 'usd' | 'ngn' {
    if (!country) return 'usd';
    const countryLower = country.toLowerCase();
    return countryLower === 'nigeria' || countryLower === 'ng' ? 'ngn' : 'usd';
  }

  /**
   * Format price with currency symbol
   */
  static formatPrice(price: string, currency: 'usd' | 'ngn'): string {
    const symbol = currency === 'usd' ? '$' : '₦';
    return `${symbol}${price}`;
  }
}
