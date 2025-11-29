/**
 * API Route to Generate CSRF Token
 * 
 * This endpoint generates a CSRF token for the authenticated user.
 * The token should be included in the X-CSRF-Token header for all
 * state-changing requests (POST, PUT, PATCH, DELETE).
 * 
 * Usage:
 *   GET /api/csrf-token
 *   Authorization: Bearer <jwt-token>
 *   
 *   Response: { token: "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateCSRFToken } from '@/lib/csrf-middleware';
import { getSecurityHeaders, logSecurityEvent } from '@/lib/security-utils';

export async function GET(request: NextRequest) {
    try {
        // Authenticate the request
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            logSecurityEvent({
                type: 'auth_failure',
                ip: request.ip || 'unknown',
                endpoint: '/api/csrf-token',
                details: { reason: 'Missing or invalid authorization header' }
            });
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401, headers: getSecurityHeaders() }
            );
        }

        const token = authHeader.split(' ')[1];

        // Verify the JWT token
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                global: {
                    headers: {
                        Authorization: authHeader
                    }
                }
            }
        );

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
            logSecurityEvent({
                type: 'auth_failure',
                ip: request.ip || 'unknown',
                endpoint: '/api/csrf-token',
                details: { reason: 'Invalid token', error: authError?.message }
            });
            return NextResponse.json(
                { error: 'Invalid authentication token' },
                { status: 401, headers: getSecurityHeaders() }
            );
        }

        // Generate CSRF token for the user
        const csrfToken = generateCSRFToken(user.id);

        return NextResponse.json(
            { token: csrfToken },
            { headers: getSecurityHeaders() }
        );
    } catch (error) {
        console.error('CSRF token generation error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: getSecurityHeaders() }
        );
    }
}
