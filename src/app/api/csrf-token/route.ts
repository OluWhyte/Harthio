/**
 * API Route to Generate CSRF Token
 * 
 * This endpoint generates a CSRF token and sets it as a cookie.
 * The token is also returned in the response body so the client can
 * include it in the X-CSRF-Token header.
 * 
 * Usage:
 *   GET /api/csrf-token
 *   
 *   Response: { token: "..." }
 *   Cookie: csrf-token=...
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateCSRFToken, CSRF_COOKIE_NAME } from '@/lib/csrf-middleware';
import { getSecurityHeaders } from '@/lib/security-utils';

export async function GET(request: NextRequest) {
    try {
        // Generate new stateless token
        const csrfToken = generateCSRFToken();

        // Create response with token
        const response = NextResponse.json(
            { token: csrfToken },
            { headers: getSecurityHeaders() }
        );

        // Set cookie
        response.cookies.set({
            name: CSRF_COOKIE_NAME,
            value: csrfToken,
            httpOnly: false, // Allow JS to read it if needed, though we return it in body too
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 // 1 hour
        });

        return response;
    } catch (error) {
        console.error('CSRF token generation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: getSecurityHeaders() }
        );
    }
}
