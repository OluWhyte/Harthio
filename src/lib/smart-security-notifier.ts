// ============================================================================
// SMART SECURITY NOTIFICATION SYSTEM
// ============================================================================
// Prevents security logging spam by sending notifications once per incident
// Integrates with admin dashboard for security awareness
// ============================================================================

import { supabaseAny as supabase } from './supabase';

export interface SecurityIncident {
  id: string;
  type: 'auth_failure' | 'suspicious_activity' | 'rate_limit' | 'access_denied' | 'validation_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  ip: string;
  endpoint: string;
  user_id?: string;
  details: Record<string, any>;
  first_occurrence: string;
  last_occurrence: string;
  occurrence_count: number;
  status: 'active' | 'resolved' | 'ignored';
  created_at: string;
  updated_at: string;
}

class SmartSecurityNotifier {
  private incidents: Map<string, SecurityIncident> = new Map();
  private notificationCooldowns: Map<string, number> = new Map();
  private readonly COOLDOWN_PERIODS = {
    auth_failure: 5 * 60 * 1000,      // 5 minutes
    suspicious_activity: 10 * 60 * 1000, // 10 minutes
    rate_limit: 2 * 60 * 1000,        // 2 minutes
    access_denied: 5 * 60 * 1000,     // 5 minutes
    validation_error: 15 * 60 * 1000, // 15 minutes
  };

  /**
   * Record a security event and handle smart notifications
   */
  async recordSecurityEvent(event: {
    type: SecurityIncident['type'];
    ip: string;
    endpoint: string;
    user_id?: string;
    details: Record<string, any>;
  }): Promise<void> {
    // Skip in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && process.env.ENABLE_SECURITY_LOGS !== 'true') {
      return;
    }

    const incidentKey = this.generateIncidentKey(event);
    const now = Date.now();
    const cooldownPeriod = this.COOLDOWN_PERIODS[event.type];

    // Check if we're in cooldown period for this incident type
    const lastNotification = this.notificationCooldowns.get(incidentKey);
    if (lastNotification && (now - lastNotification) < cooldownPeriod) {
      // Update occurrence count but don't send notification
      await this.updateIncidentCount(incidentKey);
      return;
    }

    // Create or update incident
    const incident = await this.createOrUpdateIncident(event, incidentKey);
    
    // Send notification (once per cooldown period)
    await this.sendNotification(incident);
    
    // Update cooldown
    this.notificationCooldowns.set(incidentKey, now);

    // Store in admin notifications
    await this.storeAdminNotification(incident);
  }

  /**
   * Generate unique key for incident grouping
   */
  private generateIncidentKey(event: {
    type: string;
    ip: string;
    endpoint: string;
    user_id?: string;
  }): string {
    // Group similar incidents together
    return `${event.type}_${event.ip}_${event.endpoint}`;
  }

  /**
   * Create or update security incident
   */
  private async createOrUpdateIncident(
    event: {
      type: SecurityIncident['type'];
      ip: string;
      endpoint: string;
      user_id?: string;
      details: Record<string, any>;
    },
    incidentKey: string
  ): Promise<SecurityIncident> {
    const now = new Date().toISOString();
    
    let incident = this.incidents.get(incidentKey);
    
    if (incident) {
      // Update existing incident
      incident.last_occurrence = now;
      incident.occurrence_count += 1;
      incident.details = { ...incident.details, ...event.details };
      incident.updated_at = now;
    } else {
      // Create new incident
      incident = {
        id: this.generateIncidentId(),
        type: event.type,
        severity: this.getSeverityForType(event.type),
        ip: event.ip,
        endpoint: event.endpoint,
        user_id: event.user_id,
        details: event.details,
        first_occurrence: now,
        last_occurrence: now,
        occurrence_count: 1,
        status: 'active',
        created_at: now,
        updated_at: now,
      };
    }

    this.incidents.set(incidentKey, incident);
    return incident;
  }

  /**
   * Update incident occurrence count without notification
   */
  private async updateIncidentCount(incidentKey: string): Promise<void> {
    const incident = this.incidents.get(incidentKey);
    if (incident) {
      incident.occurrence_count += 1;
      incident.last_occurrence = new Date().toISOString();
      incident.updated_at = new Date().toISOString();
    }
  }

  /**
   * Send smart notification (console + external services)
   */
  private async sendNotification(incident: SecurityIncident): Promise<void> {
    const message = this.formatNotificationMessage(incident);

    // Console notification (reduced frequency)
    if (incident.severity === 'critical' || incident.severity === 'high') {
      console.warn(`🚨 [SECURITY] ${message}`);
    } else if (process.env.NODE_ENV === 'production') {
      console.log(`🔒 [SECURITY] ${message}`);
    }

    // Send to external monitoring services in production
    if (process.env.NODE_ENV === 'production') {
      await this.sendToExternalServices(incident);
    }
  }

  /**
   * Store notification in admin dashboard
   */
  private async storeAdminNotification(incident: SecurityIncident): Promise<void> {
    try {
      const notification = {
        title: `Security Alert: ${incident.type}`,
        message: this.formatNotificationMessage(incident),
        type: 'security_alert' as const,
        metadata: {
          incident_id: incident.id,
          severity: incident.severity,
          ip: incident.ip,
          endpoint: incident.endpoint,
          occurrence_count: incident.occurrence_count,
        },
      };

      // Store in database for admin dashboard
      await supabase.from('admin_notifications').insert({
        title: notification.title,
        message: notification.message,
        type: notification.type,
        severity: incident.severity,
        metadata: notification.metadata,
        created_at: new Date().toISOString(),
      });

    } catch (error) {
      console.error('Failed to store admin notification:', error);
    }
  }

  /**
   * Format notification message
   */
  private formatNotificationMessage(incident: SecurityIncident): string {
    const count = incident.occurrence_count > 1 ? ` (${incident.occurrence_count}x)` : '';
    return `${incident.type} from ${incident.ip} on ${incident.endpoint}${count}`;
  }

  /**
   * Get severity level for incident type
   */
  private getSeverityForType(type: SecurityIncident['type']): SecurityIncident['severity'] {
    const severityMap: Record<SecurityIncident['type'], SecurityIncident['severity']> = {
      auth_failure: 'medium',
      suspicious_activity: 'high',
      rate_limit: 'low',
      access_denied: 'medium',
      validation_error: 'low',
    };
    return severityMap[type] || 'medium';
  }

  /**
   * Generate unique incident ID
   */
  private generateIncidentId(): string {
    return `incident_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Send to external monitoring services
   */
  private async sendToExternalServices(incident: SecurityIncident): Promise<void> {
    try {
      // Send to webhook if configured
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(incident),
        });
      }

      // Send email for critical incidents
      if (incident.severity === 'critical' && process.env.SECURITY_ALERT_EMAIL) {
        await this.sendEmailAlert(incident);
      }

    } catch (error) {
      console.error('Failed to send to external services:', error);
    }
  }

  /**
   * Send email alert for critical incidents
   */
  private async sendEmailAlert(incident: SecurityIncident): Promise<void> {
    try {
      // Get CSRF token
      const { getCSRFHeaders } = await import('@/lib/csrf-utils');
      const csrfHeaders = await getCSRFHeaders();

      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...csrfHeaders,
        },
        body: JSON.stringify({
          to: process.env.SECURITY_ALERT_EMAIL,
          subject: `🚨 Critical Security Alert: ${incident.type}`,
          html: `
            <h2>Critical Security Incident</h2>
            <p><strong>Type:</strong> ${incident.type}</p>
            <p><strong>Severity:</strong> ${incident.severity}</p>
            <p><strong>IP Address:</strong> ${incident.ip}</p>
            <p><strong>Endpoint:</strong> ${incident.endpoint}</p>
            <p><strong>Occurrences:</strong> ${incident.occurrence_count}</p>
            <p><strong>First Seen:</strong> ${incident.first_occurrence}</p>
            <p><strong>Last Seen:</strong> ${incident.last_occurrence}</p>
            <h3>Details:</h3>
            <pre>${JSON.stringify(incident.details, null, 2)}</pre>
          `,
        }),
      });
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  /**
   * Get recent incidents for admin dashboard
   */
  getRecentIncidents(limit: number = 50): SecurityIncident[] {
    return Array.from(this.incidents.values())
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, limit);
  }

  /**
   * Get incident statistics
   */
  getIncidentStats(): {
    total: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    active: number;
  } {
    const incidents = Array.from(this.incidents.values());
    
    return {
      total: incidents.length,
      by_type: incidents.reduce((acc, inc) => {
        acc[inc.type] = (acc[inc.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      by_severity: incidents.reduce((acc, inc) => {
        acc[inc.severity] = (acc[inc.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      active: incidents.filter(inc => inc.status === 'active').length,
    };
  }

  /**
   * Cleanup old incidents
   */
  cleanup(): void {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000; // 24 hours
    
    for (const [key, incident] of this.incidents.entries()) {
      if (new Date(incident.updated_at).getTime() < cutoff) {
        this.incidents.delete(key);
      }
    }

    // Cleanup cooldowns
    for (const [key, timestamp] of this.notificationCooldowns.entries()) {
      if (timestamp < cutoff) {
        this.notificationCooldowns.delete(key);
      }
    }
  }
}

// Export singleton instance
export const smartSecurityNotifier = new SmartSecurityNotifier();

// Cleanup old data every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    smartSecurityNotifier.cleanup();
  }, 60 * 60 * 1000); // 1 hour
}