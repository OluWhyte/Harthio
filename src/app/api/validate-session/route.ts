import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { moderateRateLimit } from '@/lib/rate-limit';
import { sanitizeError, logSecurityEvent, getSecurityHeaders, isValidUUID } from '@/lib/security-utils';

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResult = moderateRateLimit(request);
  if (rateLimitResult) {
    logSecurityEvent({
      type: 'rate_limit',
      ip: request.ip || 'unknown',
      endpoint: '/api/validate-session',
      details: { reason: 'Rate limit exceeded' }
    });
    return rateLimitResult;
  }

  try {
    const body = await request.json();
    const { sessionId, userId } = body;
    
    // Input validation
    if (!sessionId || !userId) {
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        endpoint: '/api/validate-session',
        details: { reason: 'Missing required fields' }
      });
      
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }

    // Validate UUID formats
    if (!isValidUUID(sessionId) || !isValidUUID(userId)) {
      logSecurityEvent({
        type: 'validation_error',
        ip: request.ip || 'unknown',
        userId,
        endpoint: '/api/validate-session',
        details: { reason: 'Invalid UUID format' }
      });
      
      return NextResponse.json(
        { error: 'Invalid session or user ID format' },
        { 
          status: 400,
          headers: getSecurityHeaders()
        }
      );
    }
    
    // Server-side validation with RLS protection
    const { data: topic, error } = await supabase
      .from('topics')
      .select('id, author_id, participants, title, start_time, end_time')
      .eq('id', sessionId)
      .single();
    
    if (error) {
      const sanitized = sanitizeError(error);
      
      logSecurityEvent({
        type: 'access_denied',
        ip: request.ip || 'unknown',
        userId,
        endpoint: '/api/validate-session',
        details: { 
          sessionId, 
          error: sanitized.code,
          reason: 'Database query failed'
        }
      });
      
      return NextResponse.json(
        { error: sanitized.message },
        { 
          status: error.code === 'PGRST116' ? 404 : 500,
          headers: getSecurityHeaders()
        }
      );
    }

    if (!topic) {
      logSecurityEvent({
        type: 'access_denied',
        ip: request.ip || 'unknown',
        userId,
        endpoint: '/api/validate-session',
        details: { sessionId, reason: 'Session not found' }
      });
      
      return NextResponse.json(
        { error: 'Session not found' },
        { 
          status: 404,
          headers: getSecurityHeaders()
        }
      );
    }
    
    // Check authorization
    const isAuthor = topic.author_id === userId;
    const isParticipant = topic.participants?.includes(userId) || false;
    
    if (!isAuthor && !isParticipant) {
      logSecurityEvent({
        type: 'access_denied',
        ip: request.ip || 'unknown',
        userId,
        endpoint: '/api/validate-session',
        details: { 
          sessionId, 
          authorId: topic.author_id,
          participants: topic.participants,
          reason: 'User not authorized for session'
        }
      });
      
      return NextResponse.json(
        { error: 'Access denied. You are not authorized to join this session.' },
        { 
          status: 403,
          headers: getSecurityHeaders()
        }
      );
    }

    // Check if session is still active
    const now = new Date();
    const endTime = new Date(topic.end_time);
    
    if (now > endTime) {
      return NextResponse.json(
        { error: 'This session has already ended.' },
        { 
          status: 410, // Gone
          headers: getSecurityHeaders()
        }
      );
    }

    // Check if session hasn't started yet (optional - you might want to allow early joining)
    const startTime = new Date(topic.start_time);
    const earlyJoinWindow = 15 * 60 * 1000; // 15 minutes before start
    
    if (now < new Date(startTime.getTime() - earlyJoinWindow)) {
      return NextResponse.json(
        { 
          error: 'This session has not started yet. You can join 15 minutes before the scheduled time.',
          canJoinAt: new Date(startTime.getTime() - earlyJoinWindow).toISOString()
        },
        { 
          status: 425, // Too Early
          headers: getSecurityHeaders()
        }
      );
    }
    
    // Success response
    return NextResponse.json(
      { 
        valid: true,
        role: isAuthor ? 'author' : 'participant',
        session: {
          id: topic.id,
          title: topic.title,
          startTime: topic.start_time,
          endTime: topic.end_time
        }
      },
      {
        headers: getSecurityHeaders()
      }
    );
    
  } catch (error) {
    const sanitized = sanitizeError(error);
    
    logSecurityEvent({
      type: 'suspicious_activity',
      ip: request.ip || 'unknown',
      endpoint: '/api/validate-session',
      details: { 
        error: sanitized.message,
        reason: 'Unexpected error in session validation'
      }
    });
    
    console.error('Session validation error:', error);
    
    return NextResponse.json(
      { error: sanitized.message },
      { 
        status: 500,
        headers: getSecurityHeaders()
      }
    );
  }
}