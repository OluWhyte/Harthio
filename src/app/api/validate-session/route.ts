import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent, sanitizeError } from '@/lib/security-utils';
import { moderateRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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
        endpoint: '/api/validate-session',
        details: { reason: 'Missing or invalid authorization header' }
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];
    
    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify the JWT token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/validate-session',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const { sessionId, userId } = await request.json();

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400, headers: getSecurityHeaders() }
      );
    }

    // Validate that the authenticated user matches the userId in the request
    if (user.id !== userId) {
      logSecurityEvent({
        type: 'suspicious_activity',
        userId: user.id,
        ip: request.ip || 'unknown',
        endpoint: '/api/validate-session',
        details: { reason: 'User ID mismatch', requestedUserId: userId }
      });
      return NextResponse.json(
        { error: 'Forbidden: User ID mismatch' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Create Supabase client with service role key for admin access
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the session exists and user has access
    const { data: session, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or a participant
    const isAuthor = session.author_id === userId;
    const isParticipant = session.participants?.includes(userId);

    if (!isAuthor && !isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      valid: true,
      session: {
        id: session.id,
        title: session.title,
        description: session.description,
        start_time: session.start_time,
        end_time: session.end_time,
        author_id: session.author_id,
        participants: session.participants
      }
    }, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/validate-session',
      details: { 
        error: sanitized.message,
        reason: 'Session validation failed'
      }
    });
    
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: sanitized.message },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}