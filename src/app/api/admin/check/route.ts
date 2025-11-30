import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent } from '@/lib/security-utils';
import { moderateRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    // Rate limiting
    const rateLimitResult = moderateRateLimit(request);
    if (rateLimitResult) {
      logSecurityEvent({
        type: 'rate_limit',
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/check',
        details: { reason: 'Rate limit exceeded' }
      });
      return rateLimitResult;
    }

    // SECURITY FIX: Authenticate the request first
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/check',
        details: { reason: 'Missing or invalid authorization header' }
      });
      return NextResponse.json(
        { isAdmin: false, error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify service key is configured
    if (!supabaseServiceKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY');
      return NextResponse.json(
        { isAdmin: false, error: 'Server configuration error' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    // Use Service Role client to verify the token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[Admin Check] Verifying token...', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      tokenLength: token?.length
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('[Admin Check] Verification result:', {
      hasUser: !!user,
      hasError: !!authError,
      errorMessage: authError?.message,
      userId: user?.id
    });

    if (authError || !user) {
      console.error('[Admin Check] Auth failed:', authError);
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/check',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { isAdmin: false, error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // SECURITY FIX: Only allow checking own admin status
    const requestedUserId = request.nextUrl.searchParams.get('userId');

    if (requestedUserId && requestedUserId !== user.id) {
      logSecurityEvent({
        type: 'suspicious_activity',
        userId: user.id,
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/check',
        details: {
          reason: 'Attempted to check admin status of different user',
          requestedUserId,
          authenticatedUserId: user.id
        }
      });
      return NextResponse.json(
        { isAdmin: false, error: 'Forbidden: Can only check own admin status' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Use authenticated user's ID
    const userId = user.id;

    const { data, error } = await supabase
      .from('admin_roles')
      .select('id, is_active, role, permissions')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned - not an admin
        return NextResponse.json(
          { isAdmin: false },
          { headers: getSecurityHeaders() }
        );
      }
      console.error('Admin check error:', error);
      return NextResponse.json(
        { isAdmin: false, error: 'Database error' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      role: data.role,
      permissions: data.permissions || []
    }, {
      headers: getSecurityHeaders()
    });
  } catch (error) {
    console.error('Admin check exception:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}