/**
 * LiveKit Token Generation API
 * Generates secure tokens for LiveKit room access
 */

import { NextRequest, NextResponse } from 'next/server';
import { AccessToken } from 'livekit-server-sdk';
import { createClient } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, participantName } = await request.json();

    if (!sessionId || !participantName) {
      return NextResponse.json(
        { error: 'Session ID and participant name are required' },
        { status: 400 }
      );
    }

    // Verify user authentication
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user has access to this session
    const { data: session, error: sessionError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is the creator or has been approved to join
    const isCreator = session.user_id === user.id;
    
    if (!isCreator) {
      // Check if user has been approved to join
      const { data: request } = await supabase
        .from('session_requests')
        .select('*')
        .eq('topic_id', sessionId)
        .eq('requester_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!request) {
        return NextResponse.json(
          { error: 'Access denied to this session' },
          { status: 403 }
        );
      }
    }

    // Generate LiveKit token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      console.error('LiveKit API credentials not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const token = new AccessToken(apiKey, apiSecret, {
      identity: user.id,
      name: participantName,
    });

    // Grant permissions for video calling
    token.addGrant({
      room: sessionId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = token.toJwt();

    // Get LiveKit server URL
    let serverUrl = process.env.LIVEKIT_SERVER_URL || process.env.NEXT_PUBLIC_LIVEKIT_SERVER_URL;

    // In development, provide a mock URL if not configured
    if (!serverUrl && process.env.NODE_ENV === 'development') {
      serverUrl = 'ws://localhost:7880'; // Mock URL for development
      console.log('🧪 Using mock LiveKit server URL for development');
    }

    if (!serverUrl) {
      console.error('LiveKit server URL not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      token: jwt,
      serverUrl,
      roomName: sessionId,
      participantName,
    });

  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}