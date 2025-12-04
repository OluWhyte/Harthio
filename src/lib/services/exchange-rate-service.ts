/**
 * Exchange Rate Service
 * Manages currency conversion rates for payment processing
 * Uses in-house rates based on pricing structure
 */

export type SupportedCurrency = 'USD' | 'NGN' | 'KES' | 'GHS' | 'ZAR';

/**
 * Exchange rates (amount of local currency per 1 USD)
 * Based on actual pricing: Pro Monthly = $9.99 USD = ₦15,000 NGN
 * Rate = 15,000 / 9.99 = ~1,501 NGN per USD
 */
export const EXCHANGE_RATES: Record<SupportedCurrency, number> = {
  USD: 1,        // Base currency
  NGN: 1501,     // Nigerian Naira (₦15,000 / $9.99)
  KES: 129,      // Kenyan Shilling (future)
  GHS: 12,       // Ghanaian Cedi (future)
  ZAR: 18,       // South African Rand (future)
};

/**
 * Currency symbols for display
 */
export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  USD: '$',
  NGN: '₦',
  KES: 'KSh',
  GHS: '₵',
  ZAR: 'R',
};

/**
 * Currency names for display
 */
export const CURRENCY_NAMES: Record<SupportedCurrency, string> = {
  USD: 'US Dollar',
  NGN: 'Nigerian Naira',
  KES: 'Kenyan Shilling',
  GHS: 'Ghanaian Cedi',
  ZAR: 'South African Rand',
};

export const exchangeRateService = {
  /**
   * Convert local currency amount to USD
   */
  toUSD(amount: number, currency: SupportedCurrency): number {
    if (currency === 'USD') return amount;
    
    const rate = EXCHANGE_RATES[currency];
    if (!rate) {
      console.error(`Unknown currency: ${currency}`);
      return amount; // Fallback to original amount
    }
    
    // Convert to USD: amount / rate
    const usdAmount = amount / rate;
    
    // Round to 2 decimal places
    return Math.round(usdAmount * 100) / 100;
  },

  /**
   * Convert USD amount to local currency
   */
  fromUSD(usdAmount: number, currency: SupportedCurrency): number {
    if (currency === 'USD') return usdAmount;
    
    const rate = EXCHANGE_RATES[currency];
    if (!rate) {
      console.error(`Unknown currency: ${currency}`);
      return usdAmount;
    }
    
    // Convert from USD: usdAmount * rate
    const localAmount = usdAmount * rate;
    
    // Round to 2 decimal places
    return Math.round(localAmount * 100) / 100;
  },

  /**
   * Get exchange rate for a currency
   */
  getRate(currency: SupportedCurrency): number {
    return EXCHANGE_RATES[currency] || 1;
  },

  /**
   * Format amount with currency symbol
   */
  format(amount: number, currency: SupportedCurrency): string {
    const symbol = CURRENCY_SYMBOLS[currency] || currency;
    
    // Format with commas and 2 decimal places
    const formatted = amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    
    return `${symbol}${formatted}`;
  },

  /**
   * Format amount showing both local and USD
   * Example: "₦15,000.00 ($9.99 USD)"
   */
  formatWithUSD(localAmount: number, currency: SupportedCurrency): string {
    if (currency === 'USD') {
      return this.format(localAmount, 'USD');
    }
    
    const usdAmount = this.toUSD(localAmount, currency);
    const localFormatted = this.format(localAmount, currency);
    const usdFormatted = this.format(usdAmount, 'USD');
    
    return `${localFormatted} (${usdFormatted} USD)`;
  },

  /**
   * Get all supported currencies
   */
  getSupportedCurrencies(): SupportedCurrency[] {
    return Object.keys(EXCHANGE_RATES) as SupportedCurrency[];
  },

  /**
   * Check if currency is supported
   */
  isSupported(currency: string): currency is SupportedCurrency {
    return currency in EXCHANGE_RATES;
  },

  /**
   * Get currency info for display
   */
  getCurrencyInfo(currency: SupportedCurrency) {
    return {
      code: currency,
      name: CURRENCY_NAMES[currency],
      symbol: CURRENCY_SYMBOLS[currency],
      rate: EXCHANGE_RATES[currency],
    };
  },
};
