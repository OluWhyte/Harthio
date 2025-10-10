import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, logSecurityEvent, detectSuspiciousActivity } from '@/lib/security-utils';

// Simple in-memory rate limiting (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30; // 30 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const key = `ip_api:${ip}`;
  
  const current = rateLimitMap.get(key);
  
  if (!current || now > current.resetTime) {
    // Reset or initialize
    rateLimitMap.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  current.count++;
  return true;
}

export async function GET(request: NextRequest) {
  // Get the client IP address
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  let ip = '127.0.0.1'; // Default fallback
  
  if (forwarded) {
    ip = forwarded.split(',')[0].trim();
  } else if (realIp) {
    ip = realIp;
  }
  
  // Apply rate limiting
  if (!checkRateLimit(ip)) {
    logSecurityEvent({
      type: 'rate_limit',
      ip,
      endpoint: '/api/ip',
      details: { reason: 'IP API rate limit exceeded' }
    });
    
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { 
        status: 429,
        headers: {
          ...getSecurityHeaders(),
          'Retry-After': '60'
        }
      }
    );
  }
  
  // Check for suspicious activity
  const isSuspicious = detectSuspiciousActivity({
    ip,
    userAgent: request.headers.get('user-agent') || undefined,
    headers: Object.fromEntries(request.headers.entries())
  });
  
  if (isSuspicious) {
    logSecurityEvent({
      type: 'suspicious_activity',
      ip,
      userAgent: request.headers.get('user-agent') || undefined,
      endpoint: '/api/ip',
      details: { reason: 'Suspicious user agent or missing headers' }
    });
    
    // Still return the IP but log the suspicious activity
  }
  
  return NextResponse.json(
    { ip },
    { headers: getSecurityHeaders() }
  );
}