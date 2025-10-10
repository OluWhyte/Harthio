import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent, sanitizeError } from '@/lib/security-utils';
import { moderateRateLimit } from '@/lib/rate-limit';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = moderateRateLimit(request);
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
        endpoint: '/api/device-tracking/activity',
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
        endpoint: '/api/device-tracking/activity',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Update session activity using the database function
    const { error } = await supabase.rpc('update_session_activity', {
      p_session_id: session_id
    });

    if (error) {
      console.error('Error updating session activity:', error);
      return NextResponse.json(
        { error: 'Failed to update session activity' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true },
      { headers: getSecurityHeaders() }
    );

  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/device-tracking/activity',
      details: { 
        error: sanitized.message,
        reason: 'Activity update failed'
      }
    });
    
    console.error('Activity update error:', error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}