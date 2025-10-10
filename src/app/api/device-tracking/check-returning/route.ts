import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Missing fingerprint' },
        { status: 400 }
      );
    }

    // Check if device fingerprint exists using the database function
    const { data, error } = await supabase.rpc('check_returning_device', {
      p_fingerprint: fingerprint
    });

    if (error) {
      console.error('Error checking returning device:', error);
      return NextResponse.json(
        { error: 'Failed to check device' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      is_returning: data || false
    });

  } catch (error) {
    console.error('Check returning device error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}