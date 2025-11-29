/**
 * CSRF Protection Middleware
 * 
 * Implements Cross-Site Request Forgery protection using the double-submit cookie pattern.
 * This prevents attackers from making unauthorized requests on behalf of authenticated users.
 * 
 * How it works:
 * 1. Server generates a random CSRF token and stores it in a cookie
 * 2. Client includes this token in request headers for state-changing operations
 * 3. Server validates that the header token matches the cookie token
 * 
 * Usage:
 *   import { validateCSRFToken, generateCSRFToken } from '@/lib/csrf-middleware';
 *   
 *   // In API route:
 *   const csrfValid = await validateCSRFToken(request);
 *   if (!csrfValid) {
 *     return NextResponse.json({ error: 'CSRF token invalid' }, { status: 403 });
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { logSecurityEvent } from './security-utils';
import crypto from 'crypto';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

interface CSRFTokenData {
    token: string;
    expiresAt: number;
}

// In-memory store for CSRF tokens (should be Redis in production)
const tokenStore = new Map<string, CSRFTokenData>();

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(): string {
    return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('base64url');
}

/**
 * Generate a new CSRF token for a user session
 * 
 * @param userId - The authenticated user's ID
 * @returns The generated CSRF token
 */
export function generateCSRFToken(userId: string): string {
    const token = generateSecureToken();
    const expiresAt = Date.now() + TOKEN_EXPIRY_MS;

    tokenStore.set(userId, { token, expiresAt });

    // Clean up expired tokens periodically
    cleanupExpiredTokens();

    return token;
}

/**
 * Validate CSRF token from request
 * 
 * @param request - The Next.js request object
 * @param userId - The authenticated user's ID
 * @returns true if token is valid, false otherwise
 */
export function validateCSRFToken(request: NextRequest, userId: string): boolean {
    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);

    if (!headerToken) {
        logSecurityEvent({
            type: 'suspicious_activity',
            userId,
            ip: request.ip || 'unknown',
            endpoint: request.nextUrl.pathname,
            details: { reason: 'Missing CSRF token in header' }
        });
        return false;
    }

    // Get stored token for user
    const storedData = tokenStore.get(userId);

    if (!storedData) {
        logSecurityEvent({
            type: 'suspicious_activity',
            userId,
            ip: request.ip || 'unknown',
            endpoint: request.nextUrl.pathname,
            details: { reason: 'No CSRF token found for user' }
        });
        return false;
    }

    // Check if token has expired
    if (Date.now() > storedData.expiresAt) {
        tokenStore.delete(userId);
        logSecurityEvent({
            type: 'suspicious_activity',
            userId,
            ip: request.ip || 'unknown',
            endpoint: request.nextUrl.pathname,
            details: { reason: 'CSRF token expired' }
        });
        return false;
    }

    // Validate token matches
    if (headerToken !== storedData.token) {
        logSecurityEvent({
            type: 'suspicious_activity',
            userId,
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
 * 
 * @param request - The Next.js request object
 * @param userId - The authenticated user's ID
 * @returns NextResponse with error if CSRF validation fails, null if valid
 */
export function csrfProtection(request: NextRequest, userId: string): NextResponse | null {
    // Only check CSRF for state-changing methods
    const method = request.method;
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
        return null; // No CSRF check needed for safe methods
    }

    const isValid = validateCSRFToken(request, userId);

    if (!isValid) {
        logSecurityEvent({
            type: 'suspicious_activity',
            userId,
            ip: request.ip || 'unknown',
            endpoint: request.nextUrl.pathname,
            details: {
                reason: 'CSRF validation failed',
                method: request.method
            }
        });

        return NextResponse.json(
            {
                error: 'CSRF token validation failed',
                message: 'This request appears to be a Cross-Site Request Forgery attack. Please refresh the page and try again.'
            },
            { status: 403 }
        );
    }

    return null; // Validation passed
}

/**
 * Clean up expired CSRF tokens from memory
 */
function cleanupExpiredTokens(): void {
    const now = Date.now();
    for (const [userId, data] of tokenStore.entries()) {
        if (now > data.expiresAt) {
            tokenStore.delete(userId);
        }
    }
}

/**
 * Get CSRF token for a user (for client-side use)
 * 
 * @param userId - The authenticated user's ID
 * @returns The CSRF token or null if not found
 */
export function getCSRFToken(userId: string): string | null {
    const data = tokenStore.get(userId);
    if (!data || Date.now() > data.expiresAt) {
        return null;
    }
    return data.token;
}

/**
 * Revoke CSRF token for a user (e.g., on logout)
 * 
 * @param userId - The authenticated user's ID
 */
export function revokeCSRFToken(userId: string): void {
    tokenStore.delete(userId);
}

// Run cleanup every 5 minutes
setInterval(cleanupExpiredTokens, 5 * 60 * 1000);
