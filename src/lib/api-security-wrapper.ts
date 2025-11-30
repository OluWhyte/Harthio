import { NextRequest, NextResponse } from 'next/server';
import { validateCSRFToken } from './csrf-middleware';
import { getSecurityHeaders } from './security-utils';

/**
 * Wrapper to add CSRF protection to API routes
 */
export function withCSRF(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Skip CSRF for safe methods
    if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
      return handler(req);
    }

    // Validate CSRF token for state-changing methods
    const csrfValid = validateCSRFToken(req);
    if (!csrfValid) {
      return NextResponse.json(
        { 
          error: 'CSRF validation failed',
          message: 'Security check failed. Please refresh the page and try again.'
        },
        { 
          status: 403,
          headers: getSecurityHeaders()
        }
      );
    }

    return handler(req);
  };
}

/**
 * Wrapper to add comprehensive security to API routes
 * Includes CSRF, security headers, and error handling
 */
export function withSecurity(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options: {
    requireCSRF?: boolean;
    requireAuth?: boolean;
  } = {}
) {
  return async (req: NextRequest) => {
    const { requireCSRF = true, requireAuth = false } = options;

    // CSRF protection for state-changing methods
    if (requireCSRF && req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const csrfValid = validateCSRFToken(req);
      if (!csrfValid) {
        return NextResponse.json(
          { error: 'CSRF validation failed' },
          { status: 403, headers: getSecurityHeaders() }
        );
      }
    }

    // Optional auth check
    if (requireAuth) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: getSecurityHeaders() }
        );
      }
    }

    try {
      const response = await handler(req);
      
      // Add security headers to response
      const headers = new Headers(response.headers);
      const securityHeaders = getSecurityHeaders();
      Object.entries(securityHeaders).forEach(([key, value]) => {
        headers.set(key, value);
      });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers
      });
    } catch (error) {
      console.error('API error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }
  };
}
