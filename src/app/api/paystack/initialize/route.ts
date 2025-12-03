import { NextRequest, NextResponse } from 'next/server';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!;

/**
 * Paystack Payment Initialization
 * Server-side endpoint to initialize payments securely
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, amount, currency, metadata } = body;

    // Validate required fields
    if (!email || !amount) {
      return NextResponse.json(
        { status: false, message: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Generate unique reference
    const reference = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Get the base URL from headers (Vercel provides x-forwarded-host)
    const host = request.headers.get('x-forwarded-host') || request.headers.get('host') || request.nextUrl.host;
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const baseUrl = `${protocol}://${host}`;
    
    // Initialize payment with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount), // Ensure integer (kobo/cents)
        currency: currency || 'NGN',
        reference,
        callback_url: `${baseUrl}/api/paystack/callback`,
        metadata: metadata || {},
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [PAYSTACK] Initialization failed:', data);
      return NextResponse.json(
        { status: false, message: data.message || 'Payment initialization failed' },
        { status: response.status }
      );
    }

    console.log('✅ [PAYSTACK] Payment initialized:', reference);
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ [PAYSTACK] Initialize error:', error);
    return NextResponse.json(
      { status: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
}
