/**
 * Security Configuration
 * Centralized configuration for security monitoring and alerting
 */

export interface SecurityConfig {
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      auth_failure: { count: number; window: number };
      rate_limit: { count: number; window: number };
      suspicious_activity: { count: number; window: number };
      validation_error: { count: number; window: number };
    };
    retentionPeriod: number; // in milliseconds
    maxEvents: number;
    maxAlerts: number;
  };
  scanning: {
    enabled: boolean;
    autoScanInterval: number; // in milliseconds
    riskThresholds: {
      low: number;
      medium: number;
      high: number;
      critical: number;
    };
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    maxLogs: number;
    retentionPeriod: number;
    sensitiveFields: string[];
    sensitiveHeaders: string[];
  };
  notifications: {
    email: {
      enabled: boolean;
      recipients: string[];
      severityThreshold: 'low' | 'medium' | 'high' | 'critical';
    };
    webhook: {
      enabled: boolean;
      url?: string;
      headers?: Record<string, string>;
    };
    slack: {
      enabled: boolean;
      webhookUrl?: string;
      channel?: string;
    };
  };
  rateLimiting: {
    enabled: boolean;
    windows: {
      strict: { requests: number; window: number };
      moderate: { requests: number; window: number };
      lenient: { requests: number; window: number };
    };
  };
}

// Default security configuration
export const defaultSecurityConfig: SecurityConfig = {
  monitoring: {
    enabled: true,
    alertThresholds: {
      auth_failure: { count: 5, window: 15 * 60 * 1000 }, // 5 failures in 15 minutes
      rate_limit: { count: 10, window: 5 * 60 * 1000 }, // 10 rate limits in 5 minutes
      suspicious_activity: { count: 3, window: 10 * 60 * 1000 }, // 3 suspicious activities in 10 minutes
      validation_error: { count: 20, window: 5 * 60 * 1000 }, // 20 validation errors in 5 minutes
    },
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEvents: 1000,
    maxAlerts: 100,
  },
  scanning: {
    enabled: true,
    autoScanInterval: 6 * 60 * 60 * 1000, // 6 hours
    riskThresholds: {
      low: 25,
      medium: 50,
      high: 75,
      critical: 90,
    },
  },
  logging: {
    enabled: true,
    level: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    maxLogs: 10000,
    retentionPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days
    sensitiveFields: [
      'password',
      'token',
      'secret',
      'key',
      'auth',
      'credential',
      'private',
      'confidential'
    ],
    sensitiveHeaders: [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-access-token',
      'x-refresh-token'
    ],
  },
  notifications: {
    email: {
      enabled: process.env.NODE_ENV === 'production',
      recipients: process.env.SECURITY_ALERT_EMAIL ? [process.env.SECURITY_ALERT_EMAIL] : [],
      severityThreshold: 'high',
    },
    webhook: {
      enabled: !!process.env.SECURITY_WEBHOOK_URL,
      url: process.env.SECURITY_WEBHOOK_URL,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Harthio-Security-Monitor/1.0'
      },
    },
    slack: {
      enabled: !!process.env.SLACK_WEBHOOK_URL,
      webhookUrl: process.env.SLACK_WEBHOOK_URL,
      channel: process.env.SLACK_SECURITY_CHANNEL || '#security-alerts',
    },
  },
  rateLimiting: {
    enabled: true,
    windows: {
      strict: { requests: 5, window: 15 * 60 * 1000 }, // 5 requests per 15 minutes
      moderate: { requests: 10, window: 60 * 1000 }, // 10 requests per minute
      lenient: { requests: 30, window: 60 * 1000 }, // 30 requests per minute
    },
  },
};

// Environment-specific overrides
export function getSecurityConfig(): SecurityConfig {
  const config = { ...defaultSecurityConfig };

  // Production overrides
  if (process.env.NODE_ENV === 'production') {
    config.monitoring.enabled = true;
    config.scanning.enabled = true;
    config.logging.level = 'warn';
    config.notifications.email.enabled = true;
  }

  // Development overrides
  if (process.env.NODE_ENV === 'development') {
    config.monitoring.alertThresholds.auth_failure.count = 10; // More lenient in dev
    config.scanning.autoScanInterval = 24 * 60 * 60 * 1000; // Once per day in dev
    config.logging.level = 'debug';
    config.notifications.email.enabled = false;
  }

  // Test overrides
  if (process.env.NODE_ENV === 'test') {
    config.monitoring.enabled = false;
    config.scanning.enabled = false;
    config.logging.enabled = false;
    config.notifications.email.enabled = false;
    config.notifications.webhook.enabled = false;
    config.notifications.slack.enabled = false;
  }

  return config;
}

// Export the active configuration
export const securityConfig = getSecurityConfig();