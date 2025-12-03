import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

/**
 * Paystack Payment Callback Handler
 * Handles redirect after payment completion
 * 
 * Callback URL: https://harthio.com/api/paystack/callback
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    if (!reference && !trxref) {
      return NextResponse.redirect(new URL('/me?payment=error', request.url));
    }

    const paymentReference = reference || trxref;

    // Verify payment with Paystack
    const verifyResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${paymentReference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const verifyData = await verifyResponse.json();

    if (!verifyData.status || verifyData.data.status !== 'success') {
      console.error('❌ [PAYSTACK] Payment verification failed:', verifyData);
      return NextResponse.redirect(new URL('/me?payment=failed', request.url));
    }

    const { data } = verifyData;
    console.log('✅ [PAYSTACK] Payment verified:', data.reference);

    // Record payment in database
    const { error } = await supabase.from('payments').insert({
      user_id: data.metadata?.user_id,
      amount_usd: data.amount / 100,
      currency: data.currency || 'NGN',
      status: 'succeeded',
      payment_gateway: 'paystack',
      payment_method: 'card',
      gateway_payment_id: data.reference,
      gateway_customer_id: data.customer?.customer_code,
      description: data.metadata?.description || 'Paystack payment',
      paid_at: new Date().toISOString(),
    });

    if (error) {
      console.error('❌ [PAYSTACK] Failed to record payment:', error);
      return NextResponse.redirect(new URL('/me?payment=error', request.url));
    }

    // Upgrade user tier if applicable
    if (data.metadata?.tier && data.metadata?.user_id) {
      await upgradeUserTier(data.metadata.user_id, data.metadata.tier);
    }

    console.log('✅ [PAYSTACK] Payment processed successfully');
    return NextResponse.redirect(new URL('/me?payment=success', request.url));
  } catch (error) {
    console.error('❌ [PAYSTACK] Callback error:', error);
    return NextResponse.redirect(new URL('/me?payment=error', request.url));
  }
}

/**
 * Upgrade user tier after successful payment
 */
async function upgradeUserTier(userId: string, tier: string) {
  const { error } = await supabase
    .from('users')
    .update({ subscription_tier: tier })
    .eq('id', userId);

  if (error) {
    console.error('❌ [PAYSTACK] Failed to upgrade user tier:', error);
    return;
  }

  console.log(`✅ [PAYSTACK] User ${userId} upgraded to ${tier}`);
}
