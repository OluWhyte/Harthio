/**
 * TURN Credentials API Endpoint
 * Securely generates time-limited TURN credentials on the backend
 * 
 * This endpoint:
 * 1. Uses the secret API key stored securely on the server
 * 2. Fetches fresh, time-limited credentials from TURN providers
 * 3. Returns them to the client just before establishing WebRTC connection
 * 
 * Security: The secret keys never leave the server
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSecurityHeaders, logSecurityEvent } from '@/lib/security-utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { moderateRateLimit } from '@/lib/rate-limit';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

interface TURNCredentials {
  urls: string | string[];
  username: string;
  credential: string;
}

interface TURNResponse {
  iceServers: TURNCredentials[];
  expiresAt: number; // Timestamp when credentials expire
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500, headers: getSecurityHeaders() }
      );
    }

    // Rate limiting
    const rateLimitResult = moderateRateLimit(request);
    if (rateLimitResult) {
      logSecurityEvent({
        type: 'rate_limit',
        ip: request.ip || 'unknown',
        endpoint: '/api/turn/credentials',
        details: { reason: 'Rate limit exceeded' }
      });
      return rateLimitResult;
    }

    // SECURITY: Authenticate the request
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/turn/credentials',
        details: { reason: 'Missing or invalid authorization header' }
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];

    // Verify the JWT token
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/turn/credentials',
        details: { reason: 'Invalid token', error: authError?.message }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const iceServers: TURNCredentials[] = [];
    const now = Date.now();

    // 1. Metered.ca - Primary TURN service (dynamic credentials)
    const meteredDomain = process.env.NEXT_PUBLIC_METERED_DOMAIN;
    const meteredApiKey = process.env.METERED_API_KEY || process.env.NEXT_PUBLIC_METERED_API_KEY;

    if (meteredDomain && meteredApiKey) {
      try {
        console.log('🔄 Fetching Metered.ca TURN credentials...');
        const meteredUrl = `https://${meteredDomain}/api/v1/turn/credentials?apiKey=${meteredApiKey}`;

        const response = await fetch(meteredUrl, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
          const meteredServers = await response.json();
          if (Array.isArray(meteredServers) && meteredServers.length > 0) {
            iceServers.push(...meteredServers);
            console.log(`✅ Metered.ca: ${meteredServers.length} servers`);
          }
        } else {
          console.warn(`⚠️ Metered.ca API error: ${response.status}`);
        }
      } catch (error) {
        console.error('❌ Metered.ca fetch failed:', error);
      }
    }

    // 2. ExpressTURN - Secondary TURN service (if configured)
    const expressTurnSecret = process.env.EXPRESSTURN_SECRET_KEY;
    const expressTurnUrl = process.env.EXPRESSTURN_SERVER_URL;

    if (expressTurnSecret && expressTurnUrl) {
      try {
        console.log('🔄 Generating ExpressTURN credentials...');
        // ExpressTURN uses HMAC-based authentication
        // Generate time-limited username and credential
        const ttl = 24 * 3600; // 24 hours
        const timestamp = Math.floor(now / 1000) + ttl;
        const username = `${timestamp}:harthio`;

        // Generate HMAC credential using the secret
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha1', expressTurnSecret);
        hmac.update(username);
        const credential = hmac.digest('base64');

        iceServers.push({
          urls: [
            `turn:${expressTurnUrl}:3478`,
            `turn:${expressTurnUrl}:3478?transport=tcp`,
            `turns:${expressTurnUrl}:5349`,
            `turns:${expressTurnUrl}:5349?transport=tcp`
          ],
          username,
          credential
        });

        console.log('✅ ExpressTURN credentials generated');
      } catch (error) {
        console.error('❌ ExpressTURN generation failed:', error);
      }
    }

    // 3. Free public TURN servers (fallback)
    iceServers.push(
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443?transport=tcp',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    );

    // Calculate expiry (12 hours from now, or when credentials expire)
    const expiresAt = now + (12 * 60 * 60 * 1000);

    const response: TURNResponse = {
      iceServers,
      expiresAt
    };

    console.log(`📡 Returning ${iceServers.length} TURN servers to client`);

    return NextResponse.json(response, {
      headers: {
        ...getSecurityHeaders(),
        'Cache-Control': 'private, max-age=43200' // Cache for 12 hours
      }
    });

  } catch (error) {
    console.error('❌ TURN credentials API error:', error);

    // Return minimal fallback configuration
    return NextResponse.json({
      iceServers: [
        {
          urls: 'turn:openrelay.metered.ca:80',
          username: 'openrelayproject',
          credential: 'openrelayproject'
        }
      ],
      expiresAt: Date.now() + (1 * 60 * 60 * 1000) // 1 hour
    }, {
      status: 200,
      headers: getSecurityHeaders()
    }); // Still return 200 with fallback
  }
}
