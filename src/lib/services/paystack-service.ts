/**
 * Paystack Payment Service
 * Handles payment initialization and verification
 */

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

export interface PaystackInitializeParams {
  email: string;
  amount: number; // in kobo (NGN) or cents (USD)
  currency?: 'NGN' | 'USD';
  reference?: string;
  callback_url?: string;
  metadata?: {
    user_id?: string;
    pack_id?: string;
    tier?: string;
    description?: string;
    [key: string]: any;
  };
}

export interface PaystackInitializeResponse {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export const paystackService = {
  /**
   * Initialize a payment transaction (client-side)
   */
  async initializeTransaction(params: PaystackInitializeParams): Promise<PaystackInitializeResponse> {
    try {
      // Call our API route which will handle server-side initialization
      const response = await fetch('/api/paystack/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Paystack] Initialize error:', error);
      return {
        status: false,
        message: 'Failed to initialize payment',
      };
    }
  },

  /**
   * Verify a transaction
   */
  async verifyTransaction(reference: string): Promise<any> {
    try {
      const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Paystack] Verify error:', error);
      return {
        status: false,
        message: 'Failed to verify payment',
      };
    }
  },

  /**
   * Convert amount to kobo/cents
   */
  toKobo(amount: number): number {
    return Math.round(amount * 100);
  },

  /**
   * Convert kobo/cents to amount
   */
  fromKobo(kobo: number): number {
    return kobo / 100;
  },

  /**
   * Open Paystack popup (client-side only)
   */
  openPaymentPopup(params: PaystackInitializeParams, onSuccess: (reference: string) => void, onClose: () => void) {
    if (typeof window === 'undefined') return;

    // @ts-ignore - PaystackPop is loaded via script
    const handler = window.PaystackPop?.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: params.email,
      amount: Math.round(params.amount),
      currency: params.currency || 'NGN',
      ref: params.reference || `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      callback: (response: any) => {
        onSuccess(response.reference);
      },
      onClose: () => {
        onClose();
      },
      metadata: params.metadata,
    });

    handler?.openIframe();
  },
};

// Extend Window interface for PaystackPop
declare global {
  interface Window {
    PaystackPop?: any;
  }
}
