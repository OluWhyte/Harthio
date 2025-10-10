import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { DeviceInfo, LocationInfo } from '@/lib/database-types';
import { getSecurityHeaders, logSecurityEvent, sanitizeError } from '@/lib/security-utils';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    // Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/device-tracking/session',
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
        endpoint: '/api/device-tracking/session',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const body = await request.json();
    const { user_id, ip_address, user_agent, device_info, location_info } = body;

    // Validate that the authenticated user matches the user_id in the request
    if (user.id !== user_id) {
      logSecurityEvent({
        type: 'suspicious_activity',
        userId: user.id,
        ip: request.ip || 'unknown',
        endpoint: '/api/device-tracking/session',
        details: { reason: 'User ID mismatch', requestedUserId: user_id }
      });
      return NextResponse.json(
        { error: 'Forbidden: User ID mismatch' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Validate required fields
    if (!user_id || !ip_address || !device_info) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, ip_address, device_info' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint(device_info, user_agent);

    // Create session using the database function
    const { data, error } = await supabase.rpc('create_user_session', {
      p_user_id: user_id,
      p_ip_address: ip_address,
      p_user_agent: user_agent || null,
      p_device_info: device_info,
      p_location_info: location_info || null,
      p_device_fingerprint: deviceFingerprint
    });

    if (error) {
      console.error('Error creating user session:', error);
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session_id: data,
      device_fingerprint: deviceFingerprint
    }, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/device-tracking/session',
      details: { 
        error: sanitized.message,
        reason: 'Device tracking session creation failed'
      }
    });
    
    console.error('Session tracking error:', error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

function generateDeviceFingerprint(deviceInfo: DeviceInfo, userAgent?: string): string {
  const fingerprint = [
    deviceInfo.browser + deviceInfo.browser_version,
    deviceInfo.os + deviceInfo.os_version,
    deviceInfo.device_type,
    deviceInfo.screen_resolution,
    deviceInfo.timezone,
    deviceInfo.language,
    userAgent?.slice(0, 50) || ''
  ].join('|');

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  
  return Math.abs(hash).toString(36);
}