/**
 * Health Check API Route
 * Used for connection testing in pre-call setup
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const timestamp = Date.now();
    
    return NextResponse.json({
      status: 'ok',
      timestamp,
      message: 'Service is healthy'
    }, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'error',
      message: 'Service unavailable'
    }, {
      status: 500
    });
  }
}

export async function HEAD(request: NextRequest) {
  // Support HEAD requests for faster connectivity tests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
}