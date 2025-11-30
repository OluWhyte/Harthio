import { createClient } from '@supabase/supabase-js';

// Define security event types
export type SecurityEventType =
  | 'auth_failure'
  | 'access_denied'
  | 'rate_limit'
  | 'suspicious_activity'
  | 'validation_error'
  | 'brute_force_attempt'
  | 'coordinated_attack'
  | 'api_error'
  | 'security_scan'
  | 'contact_form';

// Define security event interface
export interface SecurityEvent {
  type: SecurityEventType;
  userId?: string;
  ip?: string;
  endpoint?: string;
  details?: Record<string, any>;
  timestamp?: string;
}

// Define security alert interface
export interface SecurityAlert {
  id: string;
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

// Define security metrics interface
export interface SecurityMetrics {
  totalEvents: number;
  eventsByType: Record<string, number>;
  eventsBySeverity: Record<string, number>;
  recentEvents: SecurityEvent[];
  alertsTriggered: number;
  topIPs: { ip: string; count: number }[];
  topEndpoints: { endpoint: string; count: number }[];
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private alerts: SecurityAlert[] = [];
  private readonly maxEvents = 1000;
  private readonly maxAlerts = 100;

  constructor() {
    // Initialize with some dummy data if needed, or load from DB
  }

  /**
   * Record a security event
   */
  async recordEvent(event: SecurityEvent): Promise<void> {
    // Add timestamp if missing
    if (!event.timestamp) {
      event.timestamp = new Date().toISOString();
    }

    // Add to local memory buffer
    this.events.push(event);

    // Trim events array if too large
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log to console
    console.warn(`[SECURITY EVENT] ${event.type}:`, event.details);

    // Analyze for alerts
    await this.analyzeEvent(event);
  }

  /**
   * Analyze event for potential security threats
   */
  private async analyzeEvent(event: SecurityEvent): Promise<void> {
    // Check for brute force attempts (multiple auth failures from same IP)
    if (event.type === 'auth_failure' && event.ip) {
      const recentFailures = this.events.filter(e =>
        e.type === 'auth_failure' &&
        e.ip === event.ip &&
        new Date(e.timestamp || '').getTime() > Date.now() - 15 * 60 * 1000 // 15 minutes
      );

      if (recentFailures.length >= 5) {
        this.triggerAlert({
          type: 'brute_force_attempt',
          severity: 'high',
          message: `High frequency of auth_failure events detected from IP ${event.ip}`,
          metadata: {
            ip: event.ip,
            count: recentFailures.length,
            timeWindow: '15m'
          }
        });
      }
    }

    // Check for rate limit abuse
    if (event.type === 'rate_limit' && event.ip) {
      const recentRateLimits = this.events.filter(e =>
        e.type === 'rate_limit' &&
        e.ip === event.ip &&
        new Date(e.timestamp || '').getTime() > Date.now() - 60 * 60 * 1000 // 1 hour
      );

      if (recentRateLimits.length >= 10) {
        this.triggerAlert({
          type: 'suspicious_activity',
          severity: 'medium',
          message: `Persistent rate limit violations from IP ${event.ip}`,
          metadata: {
            ip: event.ip,
            count: recentRateLimits.length,
            timeWindow: '1h'
          }
        });
      }
    }

    // Suspicious activity from same IP across multiple endpoints
    if (event.type === 'suspicious_activity' && event.ip) {
      const recentSuspicious = this.events.filter(e =>
        e.type === 'suspicious_activity' &&
        e.ip === event.ip &&
        new Date(e.timestamp || '').getTime() > Date.now() - 10 * 60 * 1000 // 10 minutes
      );

      const uniqueEndpoints = new Set(recentSuspicious.map(e => e.endpoint));
      if (uniqueEndpoints.size >= 3) {
        this.triggerAlert({
          type: 'coordinated_attack',
          severity: 'high',
          message: `Coordinated suspicious activity from IP ${event.ip}`,
          metadata: {
            ip: event.ip,
            endpointsTargeted: Array.from(uniqueEndpoints),
            activityCount: recentSuspicious.length
          }
        });
      }
    }
  }

  /**
   * Trigger a security alert
   */
  private triggerAlert(alertData: Omit<SecurityAlert, 'id' | 'timestamp'>): void {
    const alert: SecurityAlert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      ...alertData
    };

    this.alerts.push(alert);

    // Trim alerts array if too large
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(-this.maxAlerts);
    }

    // Log the alert
    console.error('[SECURITY ALERT]', JSON.stringify(alert, null, 2));

    // In production, send to monitoring service
    this.sendToMonitoringService(alert);

    // Send immediate notifications for critical alerts
    if (alert.severity === 'critical' || alert.severity === 'high') {
      this.sendImmediateNotification(alert);
    }
  }

  /**
   * Get severity level for event type
   */
  private getSeverityForEventType(eventType: string): SecurityAlert['severity'] {
    const severityMap: Record<string, SecurityAlert['severity']> = {
      'auth_failure': 'medium',
      'access_denied': 'medium',
      'rate_limit': 'low',
      'suspicious_activity': 'high',
      'validation_error': 'low'
    };

    return severityMap[eventType] || 'medium';
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send alert to monitoring service (placeholder for production integration)
   */
  private async sendToMonitoringService(alert: SecurityAlert): Promise<void> {
    // In production, integrate with services like:
    // - Sentry
    // - DataDog
    // - New Relic
    // - Custom webhook

    if (process.env.NODE_ENV === 'production') {
      try {
        // Example: Send to webhook
        if (process.env.SECURITY_WEBHOOK_URL) {
          await fetch(process.env.SECURITY_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(alert)
          });
        }

        // Example: Send to Sentry (if configured)
        if (typeof window !== 'undefined' && (window as any).Sentry) {
          (window as any).Sentry.captureException(new Error(alert.message), {
            tags: {
              security_alert: true,
              severity: alert.severity,
              alert_type: alert.type
            },
            extra: alert.metadata
          });
        }
      } catch (error) {
        console.error('Failed to send security alert to monitoring service:', error);
      }
    }
  }

  /**
   * Send immediate notification for critical alerts
   */
  private async sendImmediateNotification(alert: SecurityAlert): Promise<void> {
    // Security alert recipients
    const alertRecipients = [
      'peterlimited2000@gmail.com',
      'seyi@harthio.com'
    ];

    // Send email to each recipient
    for (const recipient of alertRecipients) {
      try {
        const emailSubject = `🚨 ${alert.severity.toUpperCase()} Security Alert: ${alert.type}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: ${alert.severity === 'critical' ? '#dc2626' : '#f59e0b'}; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🚨 ${alert.severity.toUpperCase()} Security Alert</h1>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: ${alert.severity === 'critical' ? '#dc2626' : '#f59e0b'}; margin-top: 0;">${alert.message}</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold; width: 150px;">Alert ID:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-family: monospace; font-size: 12px;">${alert.id}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">Alert Type:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">${alert.type}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">Severity:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">
                    <span style="background-color: ${alert.severity === 'critical' ? '#dc2626' : alert.severity === 'high' ? '#f59e0b' : '#10b981'}; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                      ${alert.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">Timestamp:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">${alert.timestamp}</td>
                </tr>
              </table>
              
              <div style="background-color: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Alert Details:</h3>
                <pre style="margin: 0; color: #6b7280; white-space: pre-wrap; font-size: 12px; background-color: #f9fafb; padding: 10px; border-radius: 4px; overflow-x: auto;">${JSON.stringify(alert.metadata, null, 2)}</pre>
              </div>
              
              <div style="background-color: ${alert.severity === 'critical' ? '#fef2f2' : '#fef3c7'}; border-left: 4px solid ${alert.severity === 'critical' ? '#dc2626' : '#f59e0b'}; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: ${alert.severity === 'critical' ? '#991b1b' : '#92400e'};">
                  <strong>⚠️ ${alert.severity === 'critical' ? 'IMMEDIATE ACTION REQUIRED' : 'Action Required'}:</strong> Please review this security alert and take appropriate action.
                </p>
              </div>
              
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px;">
                <p>This is an automated security alert from Harthio</p>
                <p>Dashboard: <a href="https://harthio.com/admin/testing?tab=security" style="color: #2563eb;">View Security Dashboard</a></p>
              </div>
            </div>
          </div>
        `;

        const emailText = `
🚨 ${alert.severity.toUpperCase()} SECURITY ALERT

${alert.message}

Alert ID: ${alert.id}
Alert Type: ${alert.type}
Severity: ${alert.severity.toUpperCase()}
Timestamp: ${alert.timestamp}

Alert Details:
${JSON.stringify(alert.metadata, null, 2)}

⚠️ ${alert.severity === 'critical' ? 'IMMEDIATE ACTION REQUIRED' : 'Action Required'}: Please review this security alert and take appropriate action.

Dashboard: https://harthio.com/admin/testing?tab=security

---
This is an automated security alert from Harthio
        `;

        // Send email via API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-system-key': process.env.SUPABASE_SERVICE_ROLE_KEY || '',
          },
          body: JSON.stringify({
            to: recipient,
            subject: emailSubject,
            html: emailHtml,
            text: emailText
          })
        });

        if (response.ok) {
          console.log(`✅ Security alert email sent to ${recipient}`);
        } else {
          console.error(`❌ Failed to send security alert to ${recipient}:`, await response.text());
        }
      } catch (error) {
        console.error(`❌ Error sending security alert to ${recipient}:`, error);
      }
    }
  }

  /**
   * Get security metrics
   */
  getMetrics(): SecurityMetrics {
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;

    const recentEvents = this.events.filter(e =>
      new Date(e.timestamp || '').getTime() > last24Hours
    );

    // Count events by type
    const eventsByType = recentEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Count events by severity (estimated)
    const eventsBySeverity = recentEvents.reduce((acc, event) => {
      const severity = this.getSeverityForEventType(event.type);
      acc[severity] = (acc[severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Top IPs
    const ipCounts = recentEvents.reduce((acc, event) => {
      if (event.ip) {
        acc[event.ip] = (acc[event.ip] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }));

    // Top endpoints
    const endpointCounts = recentEvents.reduce((acc, event) => {
      if (event.endpoint) {
        acc[event.endpoint] = (acc[event.endpoint] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const topEndpoints = Object.entries(endpointCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      recentEvents: recentEvents.slice(-20), // Last 20 events
      alertsTriggered: this.alerts.filter(a =>
        new Date(a.timestamp).getTime() > last24Hours
      ).length,
      topIPs,
      topEndpoints
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 50): SecurityAlert[] {
    return this.alerts.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Clear old events and alerts (cleanup)
   */
  cleanup(): void {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 days

    this.events = this.events.filter(e =>
      new Date(e.timestamp || '').getTime() > cutoff
    );

    this.alerts = this.alerts.filter(a =>
      new Date(a.timestamp).getTime() > cutoff
    );
  }
}

// Export singleton instance
export const securityMonitor = new SecurityMonitor();

// Cleanup old data every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    securityMonitor.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}