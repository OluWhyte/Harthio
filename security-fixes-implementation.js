#!/usr/bin/env node

/**
 * Security Fixes Implementation Script
 * 
 * This script implements the critical security fixes identified in the penetration test.
 * Run this after reviewing the security report.
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 Implementing Security Fixes for Harthio...\n');

// 1. Create rate limiting middleware
const rateLimitMiddleware = `
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

export function rateLimit(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
}) {
  return (req: NextRequest) => {
    const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const windowStart = now - options.windowMs;
    
    // Clean old entries
    Object.keys(store).forEach(key => {
      if (store[key].resetTime < windowStart) {
        delete store[key];
      }
    });
    
    // Check current IP
    if (!store[ip]) {
      store[ip] = { count: 1, resetTime: now + options.windowMs };
      return null; // Allow request
    }
    
    if (store[ip].count >= options.maxRequests) {
      return NextResponse.json(
        { error: options.message || 'Too many requests' },
        { status: 429 }
      );
    }
    
    store[ip].count++;
    return null; // Allow request
  };
}

// Usage example:
// const limiter = rateLimit({ windowMs: 60000, maxRequests: 10 });
// const rateLimitResult = limiter(request);
// if (rateLimitResult) return rateLimitResult;
`;

// 2. Create session validation API
const sessionValidationAPI = `
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, userId } = await request.json();
    
    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID required' },
        { status: 400 }
      );
    }
    
    // Server-side validation
    const { data: topic, error } = await supabase
      .from('topics')
      .select('id, author_id, participants')
      .eq('id', sessionId)
      .single();
    
    if (error || !topic) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }
    
    const isAuthor = topic.author_id === userId;
    const isParticipant = topic.participants?.includes(userId) || false;
    
    if (!isAuthor && !isParticipant) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({ 
      valid: true,
      role: isAuthor ? 'author' : 'participant'
    });
    
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { error: 'Validation failed' },
      { status: 500 }
    );
  }
}
`;

// 3. Create security headers middleware
const securityHeaders = `
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  
  // CSP header
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' wss: https:",
    "media-src 'self'",
    "frame-src 'none'"
  ].join('; ');
  
  response.headers.set('Content-Security-Policy', csp);
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
`;

// 4. Create error sanitization utility
const errorSanitizer = `
/**
 * Production-safe error handling
 */

export interface SanitizedError {
  message: string;
  code?: string;
  details?: any;
}

export function sanitizeError(error: unknown, includeDetails = false): SanitizedError {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  if (error instanceof Error) {
    // In production, only return safe error messages
    if (!isDevelopment) {
      // Map of safe error messages
      const safeErrors: Record<string, string> = {
        'PGRST116': 'Resource not found',
        'PGRST301': 'Connection error',
        '42501': 'Access denied',
        '23505': 'Duplicate entry',
        '23503': 'Invalid reference'
      };
      
      // Check if it's a database error with a known code
      const dbErrorMatch = error.message.match(/code: (\\w+)/);
      if (dbErrorMatch && safeErrors[dbErrorMatch[1]]) {
        return {
          message: safeErrors[dbErrorMatch[1]],
          code: dbErrorMatch[1]
        };
      }
      
      // Generic safe message for production
      return {
        message: 'An error occurred. Please try again.',
        code: 'GENERIC_ERROR'
      };
    }
    
    // Development: return full error details
    return {
      message: error.message,
      details: includeDetails ? {
        stack: error.stack,
        name: error.name
      } : undefined
    };
  }
  
  return {
    message: 'Unknown error occurred',
    code: 'UNKNOWN_ERROR'
  };
}

export function logSecurityEvent(event: {
  type: 'auth_failure' | 'access_denied' | 'rate_limit' | 'suspicious_activity';
  userId?: string;
  ip?: string;
  userAgent?: string;
  details?: any;
}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'SECURITY',
    ...event
  };
  
  // In production, send to security monitoring service
  if (process.env.NODE_ENV === 'production') {
    // TODO: Integrate with security monitoring service
    console.error('[SECURITY]', JSON.stringify(logEntry));
  } else {
    console.warn('[SECURITY]', logEntry);
  }
}
`;

// Write the files
const files = [
  {
    path: 'src/lib/rate-limit.ts',
    content: rateLimitMiddleware,
    description: 'Rate limiting middleware'
  },
  {
    path: 'src/app/api/validate-session/route.ts',
    content: sessionValidationAPI,
    description: 'Server-side session validation API'
  },
  {
    path: 'middleware.ts',
    content: securityHeaders,
    description: 'Security headers middleware'
  },
  {
    path: 'src/lib/security-utils.ts',
    content: errorSanitizer,
    description: 'Error sanitization and security logging'
  }
];

console.log('Creating security implementation files...\n');

files.forEach(({ path: filePath, content, description }) => {
  try {
    // Create directory if it doesn't exist
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(filePath, content.trim());
    console.log(\`✅ Created: \${filePath} - \${description}\`);
  } catch (error) {
    console.error(\`❌ Failed to create \${filePath}:\`, error.message);
  }
});

console.log(\`
🔒 Security fixes implemented successfully!

Next steps:
1. Review the created files and customize as needed
2. Update your API routes to use rate limiting
3. Test the session validation endpoint
4. Deploy with security headers enabled
5. Monitor security logs

Files created:
- src/lib/rate-limit.ts
- src/app/api/validate-session/route.ts  
- middleware.ts
- src/lib/security-utils.ts

⚠️  Remember to:
- Update environment variables for production
- Configure monitoring and alerting
- Test all security features thoroughly
- Review and update security policies regularly
\`);
`;
</invoke>