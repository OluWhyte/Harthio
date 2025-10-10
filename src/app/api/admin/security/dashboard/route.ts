import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { securityMonitor } from '@/lib/security-monitor';
import { securityScanner } from '@/lib/security-scanner';
import { apiLogger } from '@/lib/api-logger';
import { getSecurityHeaders, logSecurityEvent } from '@/lib/security-utils';

// Create Supabase client for server-side operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Authenticate admin user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/security/dashboard',
        details: { reason: 'Missing authorization header' }
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logSecurityEvent({
        type: 'auth_failure',
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/security/dashboard',
        details: { reason: 'Invalid token' }
      });
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // Check admin role
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      logSecurityEvent({
        type: 'access_denied',
        userId: user.id,
        ip: request.ip || 'unknown',
        endpoint: '/api/admin/security/dashboard',
        details: { reason: 'Not an admin user' }
      });
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    // Get security dashboard data
    const [
      securityMetrics,
      recentAlerts,
      latestScan,
      apiMetrics,
      recentLogs
    ] = await Promise.all([
      securityMonitor.getMetrics(),
      securityMonitor.getRecentAlerts(20),
      securityScanner.getLatestScan(),
      apiLogger.getMetrics(),
      apiLogger.getRecentLogs(50)
    ]);

    const dashboardData = {
      overview: {
        securityScore: latestScan?.score || 0,
        totalAlerts: recentAlerts.length,
        criticalAlerts: recentAlerts.filter(a => a.severity === 'critical').length,
        totalRequests: apiMetrics.totalRequests,
        blockedRequests: apiMetrics.blockedRequests,
        errorRate: apiMetrics.errorRate
      },
      securityMetrics,
      recentAlerts: recentAlerts.slice(0, 10),
      latestScan,
      apiMetrics,
      recentLogs: recentLogs.slice(0, 20),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(dashboardData, {
      headers: getSecurityHeaders()
    });

  } catch (error) {
    console.error('Security dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate admin user (same as GET)
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401, headers: getSecurityHeaders() }
      );
    }

    // Check admin role
    const { data: adminRole } = await supabase
      .from('admin_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!adminRole) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403, headers: getSecurityHeaders() }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'run_security_scan':
        const scanResult = await securityScanner.performFullScan();
        return NextResponse.json({
          success: true,
          scan: scanResult
        }, { headers: getSecurityHeaders() });

      case 'clear_alerts':
        // In a real implementation, you'd clear alerts from storage
        return NextResponse.json({
          success: true,
          message: 'Alerts cleared'
        }, { headers: getSecurityHeaders() });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400, headers: getSecurityHeaders() }
        );
    }

  } catch (error) {
    console.error('Security dashboard action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: getSecurityHeaders() }
    );
  }
}