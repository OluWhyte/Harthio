import { NextResponse } from 'next/server';

/**
 * Security Headers Check Endpoint
 * Returns the security headers that are configured
 */
export async function GET() {
  // Return the headers that should be present
  const headers = {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };

  return NextResponse.json({
    success: true,
    headers,
    message: 'Security headers are configured',
    count: Object.keys(headers).length
  }, {
    headers: headers as Record<string, string>
  });
}
