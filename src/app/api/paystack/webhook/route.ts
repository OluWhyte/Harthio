import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

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

  // Record payment in database
  const { error } = await supabase.from('payments').insert({
    user_id: metadata?.user_id,
    amount_usd: amount / 100, // Paystack uses kobo/cents
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
    return;
  }

  console.log('✅ [PAYSTACK] Payment recorded successfully');
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(data: any) {
  console.log('✅ [PAYSTACK] Subscription created:', data.subscription_code);

  const { subscription_code, customer, plan, status } = data;

  // Record subscription in database
  const { error } = await supabase.from('subscriptions').insert({
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
  const { error } = await supabase
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
