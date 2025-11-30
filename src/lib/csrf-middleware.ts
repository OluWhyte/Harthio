/**
 * CSRF Protection Middleware
 * 
 * Implements Cross-Site Request Forgery protection using the Double-Submit Cookie pattern.
 * This is a stateless approach suitable for serverless environments (Next.js).
 * 
 * How it works:
 * 1. Server generates a random CSRF token
 * 2. Server sets this token in a 'csrf-token' cookie (httpOnly=false so JS can read it if needed, or httpOnly=true and provide an endpoint to get it)
 * 3. Client reads the token (from cookie or endpoint) and sends it in 'x-csrf-token' header
 * 4. Server validates that the cookie value matches the header value
 */

import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from './security-utils';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
export const CSRF_COOKIE_NAME = 'csrf-token';
export const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a cryptographically secure random token
 */
export function generateCSRFToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Validate CSRF token from request
 * 
 * @param request - The Next.js request object
 * @returns true if token is valid, false otherwise
 */
export function validateCSRFToken(request: NextRequest): boolean {
    // 1. Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    // 2. Get token from cookie
    const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;

    // Check if either is missing
    if (!headerToken || !cookieToken) {
        logSecurityEvent({
            type: 'suspicious_activity',
            ip: request.ip || 'unknown',
            endpoint: request.nextUrl.pathname,
            details: {
                reason: 'Missing CSRF token',
                missingHeader: !headerToken,
                missingCookie: !cookieToken
            }
        });
        return false;
    }

    // 3. Validate they match
    // Use timingSafeEqual to prevent timing attacks
    const headerBuffer = Buffer.from(headerToken);
    const cookieBuffer = Buffer.from(cookieToken);

    if (headerBuffer.length !== cookieBuffer.length || !crypto.timingSafeEqual(headerBuffer, cookieBuffer)) {
        logSecurityEvent({
            type: 'suspicious_activity',
            ip: request.ip || 'unknown',
            endpoint: request.nextUrl.pathname,
            details: { reason: 'CSRF token mismatch' }
        });
        return false;
    }

    return true;
}

/**
 * Middleware to protect routes from CSRF attacks
 */
export function csrfProtection(request: NextRequest): NextResponse | null {
    // Only check CSRF for state-changing methods
    const method = request.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return null; // No CSRF check needed for safe methods
    }

    const isValid = validateCSRFToken(request);

    if (!isValid) {
        return NextResponse.json(
            {
                error: 'CSRF token validation failed',
                message: 'Security check failed. Please refresh the page and try again.'
            },
            { status: 403 }
        );
    }

    return null; // Validation passed
}

