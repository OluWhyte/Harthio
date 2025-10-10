import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent, sanitizeError } from '@/lib/security-utils';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/device-tracking/footprint/[userId]',
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
        endpoint: '/api/device-tracking/footprint/[userId]',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Check if user is admin or accessing their own data
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const isAdmin = !!adminRole;
    const isOwnData = user.id === userId;

    if (!isAdmin && !isOwnData) {
      logSecurityEvent({
        type: 'access_denied',
        userId: user.id,
        ip: request.ip || 'unknown',
        endpoint: '/api/device-tracking/footprint/[userId]',
        details: { reason: 'Attempting to access other user data', requestedUserId: userId }
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Get user footprint from the view
    const { data: footprint, error: footprintError } = await supabase
      .from('user_footprints')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (footprintError && footprintError.code !== 'PGRST116') {
      console.error('Error fetching user footprint:', footprintError);
      return NextResponse.json(
        { error: 'Failed to fetch user footprint' },
        { status: 500 }
      );
    }

    // Get recent sessions
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (sessionsError) {
      console.error('Error fetching recent sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch recent sessions' },
        { status: 500 }
      );
    }

    // Get unique devices
    const { data: uniqueDevices, error: devicesError } = await supabase
      .from('user_sessions')
      .select('device_info, device_fingerprint, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (devicesError) {
      console.error('Error fetching unique devices:', devicesError);
      return NextResponse.json(
        { error: 'Failed to fetch unique devices' },
        { status: 500 }
      );
    }

    // Process unique devices
    const deviceMap = new Map();
    uniqueDevices?.forEach(session => {
      if (session.device_fingerprint && !deviceMap.has(session.device_fingerprint)) {
        deviceMap.set(session.device_fingerprint, {
          ...session.device_info,
          first_seen: session.created_at,
          fingerprint: session.device_fingerprint
        });
      }
    });

    const result = {
      footprint: footprint || {
        user_id: userId,
        total_sessions: 0,
        unique_devices: 0,
        unique_ip_addresses: 0,
        unique_countries: 0,
        engagement_level: 'Low'
      },
      recent_sessions: recentSessions || [],
      unique_devices: Array.from(deviceMap.values()),
      session_count: recentSessions?.length || 0
    };

    return NextResponse.json(result, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/device-tracking/footprint/[userId]',
      details: { 
        error: sanitized.message,
        reason: 'User footprint fetch failed'
      }
    });
    
    console.error('User footprint error:', error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}