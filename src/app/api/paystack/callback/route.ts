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
    // Get the correct base URL from headers
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const searchParams = request.nextUrl.searchParams;
    const reference = searchParams.get('reference');
    const trxref = searchParams.get('trxref');

    if (!reference && !trxref) {
      return NextResponse.redirect(new URL('/me?payment=error', baseUrl));
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
      return NextResponse.redirect(new URL('/me?payment=failed', baseUrl));
    }

    const { data } = verifyData;
    console.log('✅ [PAYSTACK] Payment verified:', data.reference);

    // Handle credit purchase using atomic function
    if (data.metadata?.credits && data.metadata?.user_id) {
      const { data: result, error } = await supabase.rpc('add_credits_to_user', {
        p_user_id: data.metadata.user_id,
        p_credits: data.metadata.credits,
        p_amount_usd: data.amount / 100,
        p_pack_id: data.metadata.pack_id || 'unknown',
        p_payment_gateway: 'paystack',
        p_gateway_payment_id: data.reference,
        p_currency: data.currency || 'NGN',
        p_gateway_customer_id: data.customer?.customer_code || null,
      });

      if (error || !result?.success) {
        console.error('❌ [PAYSTACK] Failed to add credits:', error || result?.error);
        return NextResponse.redirect(new URL('/me?payment=error', baseUrl));
      }

      console.log(`✅ [PAYSTACK] Added ${result.credits_added} credits (new balance: ${result.new_balance})`);
    }

    // Handle Pro subscription using atomic function
    if (data.metadata?.tier === 'pro' && data.metadata?.user_id) {
      const plan = data.metadata.plan || 'monthly';
      
      const { data: result, error } = await supabase.rpc('upgrade_user_to_pro', {
        p_user_id: data.metadata.user_id,
        p_plan: plan,
        p_amount_usd: data.amount / 100,
        p_payment_gateway: 'paystack',
        p_gateway_payment_id: data.reference,
        p_currency: data.currency || 'NGN',
        p_gateway_customer_id: data.customer?.customer_code || null,
      });

      if (error || !result?.success) {
        console.error('❌ [PAYSTACK] Failed to upgrade to Pro:', error || result?.error);
        return NextResponse.redirect(new URL('/me?payment=error', baseUrl));
      }

      console.log(`✅ [PAYSTACK] User upgraded to Pro (${plan}, expires: ${result.subscription_end_date})`);
    }

    console.log('✅ [PAYSTACK] Payment processed successfully');
    return NextResponse.redirect(new URL('/me?payment=success', baseUrl));
  } catch (error) {
    console.error('❌ [PAYSTACK] Callback error:', error);
    // Get base URL again in catch block
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    return NextResponse.redirect(new URL('/me?payment=error', baseUrl));
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
