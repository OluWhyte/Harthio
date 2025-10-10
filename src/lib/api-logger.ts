/**
 * API Request Logging System
 * Comprehensive logging for API requests, responses, and security events
 */

import { NextRequest, NextResponse } from 'next/server';
import { securityMonitor } from './security-monitor';
import { securityScanner } from './security-scanner';

export interface APILogEntry {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  endpoint: string;
  ip: string;
  userAgent: string;
  userId?: string;
  statusCode?: number;
  responseTime?: number;
  requestSize?: number;
  responseSize?: number;
  headers: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  error?: string;
  securityScan?: {
    riskScore: number;
    issues: number;
    blocked: boolean;
  };
  metadata?: Record<string, any>;
}

export interface APIMetrics {
  totalRequests: number;
  requestsByMethod: Record<string, number>;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
  topIPs: Array<{ ip: string; count: number }>;
  topUserAgents: Array<{ userAgent: string; count: number }>;
  securityEvents: number;
  blockedRequests: number;
}

class APILogger {
  private logs: APILogEntry[] = [];
  private readonly maxLogs = 10000; // Keep last 10k requests in memory
  private readonly sensitiveHeaders = [
    'authorization',
    'cookie',
    'x-api-key',
    'x-auth-token'
  ];
  private readonly sensitiveFields = [
    'password',
    'token',
    'secret',
    'key',
    'auth'
  ];

  /**
   * Log an API request
   */
  async logRequest(
    request: NextRequest,
    response?: NextResponse,
    startTime?: number,
    error?: Error,
    userId?: string
  ): Promise<APILogEntry> {
    const timestamp = new Date().toISOString();
    const endTime = Date.now();
    const responseTime = startTime ? endTime - startTime : undefined;

    // Extract request information
    const url = new URL(request.url);
    const endpoint = this.extractEndpoint(url.pathname);
    const ip = this.extractIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Perform security scan
    const securityScan = securityScanner.scanRequest(request);

    // Create log entry
    const logEntry: APILogEntry = {
      id: this.generateLogId(),
      timestamp,
      method: request.method,
      url: request.url,
      endpoint,
      ip,
      userAgent,
      userId,
      statusCode: response?.status,
      responseTime,
      requestSize: await this.getRequestSize(request),
      responseSize: response ? await this.getResponseSize(response) : undefined,
      headers: this.sanitizeHeaders(Object.fromEntries(request.headers.entries())),
      query: Object.fromEntries(url.searchParams.entries()),
      body: await this.sanitizeBody(request),
      error: error?.message,
      securityScan: {
        riskScore: securityScan.riskScore,
        issues: securityScan.issues.length,
        blocked: !securityScan.isSecure
      },
      metadata: {
        referer: request.headers.get('referer'),
        origin: request.headers.get('origin'),
        acceptLanguage: request.headers.get('accept-language'),
        acceptEncoding: request.headers.get('accept-encoding')
      }
    };

    // Add to logs
    this.logs.push(logEntry);
    
    // Trim logs if too many
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log security events if needed
    if (securityScan.riskScore > 70) {
      securityMonitor.recordEvent({
        type: 'suspicious_activity',
        ip,
        userAgent,
        endpoint,
        userId,
        details: {
          riskScore: securityScan.riskScore,
          issues: securityScan.issues,
          url: request.url
        }
      });
    }

    // Log errors
    if (error) {
      securityMonitor.recordEvent({
        type: 'api_error',
        ip,
        userAgent,
        endpoint,
        userId,
        details: {
          error: error.message,
          statusCode: response?.status,
          method: request.method
        }
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      this.logToConsole(logEntry);
    }

    // Send to external logging service in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToLoggingService(logEntry);
    }

    return logEntry;
  }

  /**
   * Create a request logging middleware
   */
  createMiddleware() {
    return async (request: NextRequest, handler: () => Promise<NextResponse>) => {
      const startTime = Date.now();
      let response: NextResponse;
      let error: Error | undefined;

      try {
        response = await handler();
      } catch (err) {
        error = err instanceof Error ? err : new Error(String(err));
        response = NextResponse.json(
          { error: 'Internal Server Error' },
          { status: 500 }
        );
      }

      // Log the request
      await this.logRequest(request, response, startTime, error);

      return response;
    };
  }

  /**
   * Extract endpoint pattern from pathname
   */
  private extractEndpoint(pathname: string): string {
    // Convert dynamic routes to patterns
    return pathname
      .replace(/\/\d+/g, '/[id]') // Replace numeric IDs
      .replace(/\/[a-f0-9-]{36}/g, '/[uuid]') // Replace UUIDs
      .replace(/\/[a-zA-Z0-9-_]+$/g, '/[slug]'); // Replace slugs at end
  }

  /**
   * Extract client IP address
   */
  private extractIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    } else if (realIp) {
      return realIp;
    }
    
    return request.ip || '127.0.0.1';
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
    const sanitized = { ...headers };
    
    this.sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = this.maskSensitiveValue(sanitized[header]);
      }
    });

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private async sanitizeBody(request: NextRequest): Promise<any> {
    try {
      // Only log body for POST, PUT, PATCH requests
      if (!['POST', 'PUT', 'PATCH'].includes(request.method)) {
        return undefined;
      }

      const contentType = request.headers.get('content-type') || '';
      
      if (contentType.includes('application/json')) {
        const body = await request.json();
        return this.sanitizeObject(body);
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const formData = await request.formData();
        const body: Record<string, any> = {};
        
        formData.forEach((value, key) => {
          body[key] = this.isSensitiveField(key) ? this.maskSensitiveValue(String(value)) : value;
        });
        
        return body;
      }
      
      return undefined;
    } catch (error) {
      return { error: 'Failed to parse body' };
    }
  }

  /**
   * Sanitize object to remove sensitive fields
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    
    Object.keys(obj).forEach(key => {
      if (this.isSensitiveField(key)) {
        sanitized[key] = this.maskSensitiveValue(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    });

    return sanitized;
  }

  /**
   * Check if field name is sensitive
   */
  private isSensitiveField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();
    return this.sensitiveFields.some(sensitive => lowerField.includes(sensitive));
  }

  /**
   * Mask sensitive values
   */
  private maskSensitiveValue(value: any): string {
    if (typeof value !== 'string') {
      return '[REDACTED]';
    }
    
    if (value.length <= 4) {
      return '[REDACTED]';
    }
    
    return value.substring(0, 4) + '*'.repeat(Math.min(value.length - 4, 20));
  }

  /**
   * Get request size
   */
  private async getRequestSize(request: NextRequest): Promise<number> {
    try {
      const contentLength = request.headers.get('content-length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      // Estimate size if content-length not available
      const body = await request.text();
      return new Blob([body]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get response size
   */
  private async getResponseSize(response: NextResponse): Promise<number> {
    try {
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      // Estimate size if content-length not available
      const text = await response.text();
      return new Blob([text]).size;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Log to console (development)
   */
  private logToConsole(logEntry: APILogEntry): void {
    const { method, endpoint, statusCode, responseTime, securityScan } = logEntry;
    
    let color = '\x1b[32m'; // Green
    if (statusCode && statusCode >= 400) color = '\x1b[31m'; // Red
    else if (statusCode && statusCode >= 300) color = '\x1b[33m'; // Yellow
    
    const securityFlag = securityScan.riskScore > 50 ? ' 🚨' : '';
    
    console.log(
      `${color}[API]${securityFlag} ${method} ${endpoint} - ${statusCode} (${responseTime}ms)\x1b[0m`
    );
    
    if (securityScan.issues > 0) {
      console.warn(`  Security issues: ${securityScan.issues}, Risk score: ${securityScan.riskScore}`);
    }
  }

  /**
   * Send to external logging service
   */
  private async sendToLoggingService(logEntry: APILogEntry): Promise<void> {
    try {
      // In production, send to logging services like:
      // - Elasticsearch
      // - Splunk
      // - DataDog
      // - New Relic
      // - Custom logging endpoint

      if (process.env.LOGGING_ENDPOINT) {
        await fetch(process.env.LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.LOGGING_API_KEY}`
          },
          body: JSON.stringify(logEntry)
        });
      }

      // Example: Send to webhook
      if (process.env.LOGGING_WEBHOOK_URL) {
        await fetch(process.env.LOGGING_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            service: 'harthio-api',
            level: logEntry.error ? 'error' : 'info',
            message: `${logEntry.method} ${logEntry.endpoint}`,
            data: logEntry
          })
        });
      }
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  /**
   * Generate unique log ID
   */
  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get API metrics
   */
  getMetrics(timeRange: number = 24 * 60 * 60 * 1000): APIMetrics {
    const cutoff = Date.now() - timeRange;
    const recentLogs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );

    // Calculate metrics
    const requestsByMethod = recentLogs.reduce((acc, log) => {
      acc[log.method] = (acc[log.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByEndpoint = recentLogs.reduce((acc, log) => {
      acc[log.endpoint] = (acc[log.endpoint] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const requestsByStatus = recentLogs.reduce((acc, log) => {
      if (log.statusCode) {
        const statusRange = `${Math.floor(log.statusCode / 100)}xx`;
        acc[statusRange] = (acc[statusRange] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const responseTimes = recentLogs
      .filter(log => log.responseTime !== undefined)
      .map(log => log.responseTime!);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;

    const errorCount = recentLogs.filter(log => log.error || (log.statusCode && log.statusCode >= 400)).length;
    const errorRate = recentLogs.length > 0 ? (errorCount / recentLogs.length) * 100 : 0;

    // Top IPs
    const ipCounts = recentLogs.reduce((acc, log) => {
      acc[log.ip] = (acc[log.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Top User Agents
    const uaCounts = recentLogs.reduce((acc, log) => {
      const ua = log.userAgent.substring(0, 100); // Truncate for grouping
      acc[ua] = (acc[ua] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topUserAgents = Object.entries(uaCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userAgent, count]) => ({ userAgent, count }));

    const securityEvents = recentLogs.filter(log => log.securityScan.riskScore > 50).length;
    const blockedRequests = recentLogs.filter(log => log.securityScan.blocked).length;

    return {
      totalRequests: recentLogs.length,
      requestsByMethod,
      requestsByEndpoint,
      requestsByStatus,
      averageResponseTime: Math.round(averageResponseTime),
      errorRate: Math.round(errorRate * 100) / 100,
      topIPs,
      topUserAgents,
      securityEvents,
      blockedRequests
    };
  }

  /**
   * Get recent logs
   */
  getRecentLogs(limit: number = 100): APILogEntry[] {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Search logs
   */
  searchLogs(query: {
    method?: string;
    endpoint?: string;
    ip?: string;
    userId?: string;
    statusCode?: number;
    timeRange?: number;
  }): APILogEntry[] {
    let filteredLogs = this.logs;

    if (query.timeRange) {
      const cutoff = Date.now() - query.timeRange;
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp).getTime() > cutoff
      );
    }

    if (query.method) {
      filteredLogs = filteredLogs.filter(log => log.method === query.method);
    }

    if (query.endpoint) {
      filteredLogs = filteredLogs.filter(log => log.endpoint.includes(query.endpoint));
    }

    if (query.ip) {
      filteredLogs = filteredLogs.filter(log => log.ip === query.ip);
    }

    if (query.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === query.userId);
    }

    if (query.statusCode) {
      filteredLogs = filteredLogs.filter(log => log.statusCode === query.statusCode);
    }

    return filteredLogs.reverse(); // Most recent first
  }

  /**
   * Clear old logs
   */
  cleanup(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days
    this.logs = this.logs.filter(log => 
      new Date(log.timestamp).getTime() > cutoff
    );
  }
}

// Export singleton instance
export const apiLogger = new APILogger();

// Cleanup old logs every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    apiLogger.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}