import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent } from '@/lib/security-utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
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

    // Create Supabase client with user's token (NOT service role key)
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    });

    // Verify the JWT token and get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
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
    // If userId is provided in query, validate it matches authenticated user
    const requestedUserId = request.nextUrl.searchParams.get('userId');

    if (requestedUserId && requestedUserId !== user.id) {
      // Log suspicious activity - user trying to check someone else's admin status
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

    // Use authenticated user's ID (not query parameter)
    const userId = user.id;

    // Query admin_roles table using authenticated client (respects RLS)
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