/**
 * API Security Middleware
 * OWASP-compliant security for API routes
 * 
 * Usage:
 * import { withSecurity } from '@/lib/security/api-security-middleware';
 * export const GET = withSecurity(async (req) => { ... });
 */

import { NextRequest, NextResponse } from 'next/server';
import { RateLimiter, SecurityLogger, SecurityConfig, InputSanitizer } from './owasp-security-service';

export interface SecurityOptions {
  rateLimit?: {
    maxAttempts: number;
    windowMs: number;
  };
  requireAuth?: boolean;
  allowedMethods?: string[];
  validateInput?: boolean;
}

/**
 * Security middleware wrapper for API routes
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: SecurityOptions = {}
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // 1. Add security headers
      const headers = SecurityConfig.getSecurityHeaders();

      // 2. Check allowed methods
      if (options.allowedMethods && !options.allowedMethods.includes(req.method)) {
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405, headers }
        );
      }

      // 3. Rate limiting
      if (options.rateLimit) {
        const identifier = getClientIdentifier(req);
        const isLimited = RateLimiter.isRateLimited(
          identifier,
          options.rateLimit.maxAttempts,
          options.rateLimit.windowMs
        );

        if (isLimited) {
          await SecurityLogger.logSecurityEvent({
            type: 'rate_limit',
            ipAddress: getClientIP(req),
            userAgent: req.headers.get('user-agent') || undefined,
            details: `Rate limit exceeded for ${req.url}`,
            severity: 'medium'
          });

          return NextResponse.json(
            { 
              error: 'Too many requests',
              retryAfter: options.rateLimit.windowMs / 1000
            },
            { 
              status: 429,
              headers: {
                ...headers,
                'Retry-After': String(options.rateLimit.windowMs / 1000)
              }
            }
          );
        }
      }

      // 4. Validate input (for POST/PUT/PATCH)
      if (options.validateInput && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
        try {
          const body = await req.json();
          
          // Check for suspicious patterns
          const bodyStr = JSON.stringify(body);
          if (containsSuspiciousPatterns(bodyStr)) {
            await SecurityLogger.logSecurityEvent({
              type: 'suspicious_activity',
              ipAddress: getClientIP(req),
              userAgent: req.headers.get('user-agent') || undefined,
              details: 'Suspicious input patterns detected',
              severity: 'high'
            });

            return NextResponse.json(
              { error: 'Invalid input detected' },
              { status: 400, headers }
            );
          }
        } catch (error) {
          // Invalid JSON
          return NextResponse.json(
            { error: 'Invalid JSON' },
            { status: 400, headers }
          );
        }
      }

      // 5. Execute handler
      const response = await handler(req);

      // 6. Add security headers to response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      return response;

    } catch (error) {
      console.error('Security middleware error:', error);
      
      await SecurityLogger.logSecurityEvent({
        type: 'suspicious_activity',
        ipAddress: getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined,
        details: `API error: ${error}`,
        severity: 'medium'
      });

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: SecurityConfig.getSecurityHeaders() }
      );
    }
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextRequest): string {
  // Use IP + User Agent for identification
  const ip = getClientIP(req);
  const userAgent = req.headers.get('user-agent') || 'unknown';
  return `${ip}-${userAgent}`;
}

/**
 * Get client IP address
 */
function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0] ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Check for suspicious patterns in input
 */
function containsSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // Event handlers like onclick=
    /eval\(/i,
    /expression\(/i,
    /vbscript:/i,
    /\.\.\//, // Path traversal
    /union.*select/i, // SQL injection
    /drop.*table/i, // SQL injection
    /insert.*into/i, // SQL injection
    /delete.*from/i, // SQL injection
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate authentication token
 */
export async function validateAuth(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  // TODO: Validate token with Supabase
  // For now, return token
  return token;
}
