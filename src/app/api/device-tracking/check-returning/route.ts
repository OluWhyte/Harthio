import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent, sanitizeError } from '@/lib/security-utils';
import { lenientRateLimit } from '@/lib/rate-limit';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = lenientRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/device-tracking/check-returning',
        details: { reason: 'Missing or invalid authorization header' }
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/device-tracking/check-returning',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const body = await request.json();
    const { fingerprint } = body;

    if (!fingerprint) {
      return NextResponse.json(
        { error: 'Missing fingerprint' },
        { status: 400, headers: getSecurityHeaders() }
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
    }, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/device-tracking/check-returning',
      details: { 
        error: sanitized.message,
        reason: 'Check returning device failed'
      }
    });
    
    console.error('Check returning device error:', error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}