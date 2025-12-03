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
    const { error: paymentError } = await supabase.from('credit_purchases').insert({
      user_id: data.metadata?.user_id,
      credits_purchased: data.metadata?.credits || 0,
      amount_usd: data.amount / 100,
      currency: data.currency || 'NGN',
      status: 'completed',
      payment_gateway: 'paystack',
      gateway_payment_id: data.reference,
      gateway_customer_id: data.customer?.customer_code,
      pack_id: data.metadata?.pack_id,
      created_at: new Date().toISOString(),
    });

    if (paymentError) {
      console.error('❌ [PAYSTACK] Failed to record payment:', paymentError);
      return NextResponse.redirect(new URL('/me?payment=error', request.url));
    }

    // Add credits to user's balance
    if (data.metadata?.user_id && data.metadata?.credits) {
      const { error: creditsError } = await supabase.rpc('add_credits_to_user', {
        p_user_id: data.metadata.user_id,
        p_credits: data.metadata.credits,
        p_days: 30, // Default expiry
      });

      if (creditsError) {
        console.error('❌ [PAYSTACK] Failed to add credits:', creditsError);
      }
    }

    // Handle Pro subscription
    if (data.metadata?.tier === 'pro' && data.metadata?.user_id) {
      const plan = data.metadata?.plan || 'monthly';
      const daysToAdd = plan === 'yearly' ? 365 : 30;
      
      // Calculate subscription end date
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + daysToAdd);
      
      // Update user to Pro tier
      const { error: tierError } = await supabase
        .from('users')
        .update({
          subscription_tier: 'pro',
          subscription_end_date: endDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', data.metadata.user_id);
      
      if (tierError) {
        console.error('❌ [PAYSTACK] Failed to upgrade user tier:', tierError);
      } else {
        console.log(`✅ [PAYSTACK] User upgraded to Pro (${plan})`);
      }
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
