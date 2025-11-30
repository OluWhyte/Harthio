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
        endpoint: '/api/admin/details',
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
        endpoint: '/api/admin/details',
        details: { reason: 'Missing or invalid authorization header' }
      });
      return NextResponse.json(
        { isAdmin: false, error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];

    // Use Service Role client to verify the token
    // This is more reliable than creating a separate anon client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/details',
        details: {
          reason: 'Invalid token',
          error: authError?.message || 'No user found'
        }
      });
      return NextResponse.json(
        { isAdmin: false, error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const requestedUserId = request.nextUrl.searchParams.get('userId');

    if (!requestedUserId) {
      return NextResponse.json(
        { isAdmin: false, error: 'No user ID provided' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // SECURITY FIX: Only allow checking own details
    if (requestedUserId !== user.id) {
      logSecurityEvent({
        type: 'suspicious_activity',
        userId: user.id,
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/details',
        details: {
          reason: 'Attempted to access admin details of different user',
          requestedUserId,
          authenticatedUserId: user.id
        }
      });
      return NextResponse.json(
        { isAdmin: false, error: 'Forbidden: Can only access own details' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Check if user is admin
    const { data: adminRole, error: roleError } = await supabase
      .from('admin_roles')
      .select('id, is_active, role, permissions')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (roleError) {
      if (roleError.code === 'PGRST116') {
        // No rows returned - not an admin
        return NextResponse.json(
          { isAdmin: false, error: 'User is not an admin' },
          { headers: getSecurityHeaders() }
        );
      }
      console.error('Admin role check error:', roleError);
      return NextResponse.json(
        { isAdmin: false, error: roleError.message },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    // Get user details
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('email, display_name, first_name, last_name')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('User data error:', userError);
      return NextResponse.json(
        { isAdmin: false, error: 'Failed to get user data' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    const displayName = userData.display_name ||
      (userData.first_name && userData.last_name ? `${userData.first_name} ${userData.last_name}` : null) ||
      userData.email?.split('@')[0];

    return NextResponse.json({
      isAdmin: true,
      role: adminRole.role,
      permissions: adminRole.permissions || [],
      display_name: displayName,
      email: userData.email
    }, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    console.error('Admin details exception:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}