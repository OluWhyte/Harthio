import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { DeviceInfo, LocationInfo } from '@/lib/database-types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, ip_address, user_agent, device_info, location_info } = body;

    // Validate required fields
    if (!user_id || !ip_address || !device_info) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, ip_address, device_info' },
        { status: 400 }
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
    });

  } catch (error) {
    console.error('Session tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
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