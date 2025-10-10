import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId' },
        { status: 400 }
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

    return NextResponse.json(result);

  } catch (error) {
    console.error('User footprint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}