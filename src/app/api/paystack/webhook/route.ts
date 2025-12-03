import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

/**
 * Paystack Webhook Handler
 * Handles payment notifications from Paystack
 * 
 * Webhook URL: https://harthio.com/api/paystack/webhook
 */
export async function POST(request: NextRequest) {
  try {
    // Verify Paystack signature
    const signature = request.headers.get('x-paystack-signature');
    const body = await request.text();

    if (!signature) {
      console.error('❌ [PAYSTACK] No signature provided');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    // Verify signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex');

    if (hash !== signature) {
      console.error('❌ [PAYSTACK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Parse event
    const event = JSON.parse(body);
    console.log('📧 [PAYSTACK] Webhook received:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleSuccessfulPayment(event.data);
        break;

      case 'subscription.create':
        await handleSubscriptionCreated(event.data);
        break;

      case 'subscription.disable':
        await handleSubscriptionCancelled(event.data);
        break;

      default:
        console.log(`⚠️ [PAYSTACK] Unhandled event: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('❌ [PAYSTACK] Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(data: any) {
  console.log('✅ [PAYSTACK] Payment successful:', data.reference);

  const { reference, amount, customer, metadata } = data;

  // Check if this is a credit purchase or subscription
  if (metadata?.credits) {
    // Handle credit purchase
    await handleCreditPurchase(data);
  } else if (metadata?.tier === 'pro') {
    // Handle Pro subscription
    await handleProSubscription(data);
  } else {
    // Generic payment record
    const { error } = await supabaseAdmin.from('payments').insert({
      user_id: metadata?.user_id,
      amount_usd: amount / 100,
      currency: data.currency || 'NGN',
      status: 'succeeded',
      payment_gateway: 'paystack',
      payment_method: 'card',
      gateway_payment_id: reference,
      gateway_customer_id: customer.customer_code,
      description: metadata?.description || 'Paystack payment',
      paid_at: new Date().toISOString()
    });

    if (error) {
      console.error('❌ [PAYSTACK] Failed to record payment:', error);
    }
  }

  console.log('✅ [PAYSTACK] Payment processed successfully');
}

/**
 * Handle credit purchase using atomic function
 */
async function handleCreditPurchase(data: any) {
  const { reference, amount, customer, metadata } = data;
  
  const { data: result, error } = await supabaseAdmin.rpc('add_credits_to_user', {
    p_user_id: metadata.user_id,
    p_credits: metadata.credits,
    p_amount_usd: amount / 100,
    p_pack_id: metadata.pack_id || 'unknown',
    p_payment_gateway: 'paystack',
    p_gateway_payment_id: reference,
    p_currency: data.currency || 'NGN',
    p_gateway_customer_id: customer?.customer_code || null,
  });

  if (error || !result?.success) {
    console.error('❌ [PAYSTACK] Failed to add credits:', error || result?.error);
    return;
  }

  console.log(`✅ [PAYSTACK] Added ${result.credits_added} credits (new balance: ${result.new_balance})`);
}

/**
 * Handle Pro subscription using atomic function
 */
async function handleProSubscription(data: any) {
  const { reference, amount, customer, metadata } = data;
  const plan = metadata.plan || 'monthly';
  
  const { data: result, error } = await supabaseAdmin.rpc('upgrade_user_to_pro', {
    p_user_id: metadata.user_id,
    p_plan: plan,
    p_amount_usd: amount / 100,
    p_payment_gateway: 'paystack',
    p_gateway_payment_id: reference,
    p_currency: data.currency || 'NGN',
    p_gateway_customer_id: customer?.customer_code || null,
  });

  if (error || !result?.success) {
    console.error('❌ [PAYSTACK] Failed to upgrade to Pro:', error || result?.error);
    return;
  }

  console.log(`✅ [PAYSTACK] User upgraded to Pro (${plan}, expires: ${result.subscription_end_date})`);
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(data: any) {
  console.log('✅ [PAYSTACK] Subscription created:', data.subscription_code);

  const { subscription_code, customer, plan, status } = data;

  // Record subscription in database
  const { error } = await supabaseAdmin.from('subscriptions').insert({
    user_id: customer.metadata?.user_id,
    plan: plan.interval || 'monthly',
    status: status === 'active' ? 'active' : 'trialing',
    start_date: new Date().toISOString(),
    end_date: new Date(data.next_payment_date).toISOString(),
    payment_gateway: 'paystack',
    gateway_subscription_id: subscription_code,
    gateway_customer_id: customer.customer_code,
    amount_usd: (plan.amount / 100) * 0.0025, // Convert NGN to USD (approximate)
    currency: 'USD'
  });

  if (error) {
    console.error('❌ [PAYSTACK] Failed to record subscription:', error);
    return;
  }

  console.log('✅ [PAYSTACK] Subscription recorded successfully');
}

/**
 * Handle subscription cancelled
 */
async function handleSubscriptionCancelled(data: any) {
  console.log('⚠️ [PAYSTACK] Subscription cancelled:', data.subscription_code);

  // Update subscription status
  const { error } = await supabaseAdmin
    .from('subscriptions')
    .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
    .eq('gateway_subscription_id', data.subscription_code);

  if (error) {
    console.error('❌ [PAYSTACK] Failed to update subscription:', error);
    return;
  }

  console.log('✅ [PAYSTACK] Subscription cancelled successfully');
}

/**
 * Upgrade user tier after successful payment
 */
async function upgradeUserTier(userId: string, tier: string) {
  const { error } = await supabaseAdmin
    .from('users')
    .update({ subscription_tier: tier })
    .eq('id', userId);

  if (error) {
    console.error('❌ [PAYSTACK] Failed to upgrade user tier:', error);
    return;
  }

  console.log(`✅ [PAYSTACK] User ${userId} upgraded to ${tier}`);
}
