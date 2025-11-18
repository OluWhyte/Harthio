/**
 * OWASP Security Service
 * Implements OWASP Top 10 security best practices
 * 
 * Features:
 * - Input validation and sanitization
 * - XSS prevention
 * - CSRF protection
 * - Rate limiting
 * - Security logging
 * - SQL injection prevention
 */

import { supabaseClient } from '../supabase';

// ============================================================================
// A03: INJECTION PREVENTION
// ============================================================================

/**
 * Sanitize user input to prevent XSS attacks
 * OWASP: A03:2021 – Injection
 */
export class InputSanitizer {
  /**
   * Remove potentially dangerous HTML/JavaScript
   */
  static sanitizeHTML(input: string): string {
    if (!input) return '';
    
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * General input sanitization (alias for sanitizeHTML)
   */
  static sanitizeInput(input: string): string {
    return this.sanitizeHTML(input);
  }

  /**
   * Sanitize for SQL (though Supabase handles this)
   */
  static sanitizeSQL(input: string): string {
    if (!input) return '';
    
    // Remove SQL keywords and special characters
    let sanitized = input
      .replace(/['";\\]/g, '')  // Remove quotes and backslashes
      .replace(/--/g, '')        // Remove SQL comments
      .replace(/\/\*/g, '')      // Remove block comment start
      .replace(/\*\//g, '')      // Remove block comment end
      .replace(/;/g, '')         // Remove semicolons
      .trim();
    
    // Remove dangerous SQL keywords (case-insensitive)
    const dangerousKeywords = [
      'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE', 'INSERT', 
      'UPDATE', 'EXEC', 'EXECUTE', 'SCRIPT', 'UNION', 'SELECT'
    ];
    
    dangerousKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized.trim();
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sanitize filename to prevent path traversal
   */
  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.\./g, '')
      .substring(0, 255);
  }
}

// ============================================================================
// A01: BROKEN ACCESS CONTROL
// ============================================================================

/**
 * Access Control Service
 * OWASP: A01:2021 – Broken Access Control
 */
export class AccessControl {
  /**
   * Check if user owns a resource
   */
  static async verifyOwnership(
    userId: string,
    resourceType: 'session' | 'message' | 'profile',
    resourceId: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'session':
          const { data: session } = await supabaseClient
            .from('topics')
            .select('author_id, participants')
            .eq('id', resourceId)
            .single();
          
          if (!session) return false;
          
          return session.author_id === userId || 
                 (session.participants && session.participants.includes(userId));

        case 'message':
          const { data: message } = await supabaseClient
            .from('messages')
            .select('user_id')
            .eq('id', resourceId)
            .single();
          
          return message?.user_id === userId;

        case 'profile':
          return resourceId === userId;

        default:
          return false;
      }
    } catch (error) {
      console.error('Access control check failed:', error);
      return false;
    }
  }

  /**
   * Check if user is admin
   */
  static async isAdmin(userId: string): Promise<boolean> {
    try {
      const { data } = await supabaseClient
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      return !!data;
    } catch {
      return false;
    }
  }
}

// ============================================================================
// A07: AUTHENTICATION FAILURES
// ============================================================================

/**
 * Rate Limiter
 * OWASP: A07:2021 – Identification and Authentication Failures
 */
export class RateLimiter {
  private static attempts: Map<string, { count: number; resetAt: number }> = new Map();

  /**
   * Check if action is rate limited
   */
  static isRateLimited(
    identifier: string,
    maxAttempts: number = 5,
    windowMs: number = 15 * 60 * 1000 // 15 minutes
  ): boolean {
    const now = Date.now();
    const record = this.attempts.get(identifier);

    if (!record || now > record.resetAt) {
      // Reset or create new record
      this.attempts.set(identifier, {
        count: 1,
        resetAt: now + windowMs
      });
      return false;
    }

    if (record.count >= maxAttempts) {
      return true; // Rate limited
    }

    // Increment count
    record.count++;
    return false;
  }

  /**
   * Reset rate limit for identifier
   */
  static reset(identifier: string): void {
    this.attempts.delete(identifier);
  }

  /**
   * Get remaining attempts
   */
  static getRemainingAttempts(
    identifier: string,
    maxAttempts: number = 5
  ): number {
    const record = this.attempts.get(identifier);
    if (!record || Date.now() > record.resetAt) {
      return maxAttempts;
    }
    return Math.max(0, maxAttempts - record.count);
  }
}

// ============================================================================
// A09: SECURITY LOGGING AND MONITORING
// ============================================================================

/**
 * Security Logger
 * OWASP: A09:2021 – Security Logging and Monitoring Failures
 */
export class SecurityLogger {
  /**
   * Log security event
   */
  static async logSecurityEvent(event: {
    type: 'auth_failure' | 'access_denied' | 'rate_limit' | 'suspicious_activity' | 'data_breach_attempt';
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<void> {
    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.warn('🔒 Security Event:', event);
      }

      // Log to database
      await supabaseClient
        .from('security_logs')
        .insert({
          event_type: event.type,
          user_id: event.userId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          details: event.details,
          severity: event.severity,
          created_at: new Date().toISOString()
        });

      // Alert on critical events
      if (event.severity === 'critical') {
        await this.sendSecurityAlert(event);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  /**
   * Send security alert (email, Slack, etc.)
   */
  private static async sendSecurityAlert(event: any): Promise<void> {
    console.error('🚨 CRITICAL SECURITY EVENT:', event);
    
    // Security alert recipients
    const alertRecipients = [
      'peterlimited2000@gmail.com',
      'seyi@harthio.com'
    ];
    
    // Send email to each recipient
    for (const recipient of alertRecipients) {
      try {
        const emailSubject = `🚨 CRITICAL Security Alert: ${event.type}`;
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc2626; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🚨 Critical Security Alert</h1>
            </div>
            
            <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
              <h2 style="color: #dc2626; margin-top: 0;">Security Event Detected</h2>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold; width: 150px;">Event Type:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">${event.type}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">Severity:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">
                    <span style="background-color: #dc2626; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;">
                      ${event.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">Timestamp:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">${new Date().toISOString()}</td>
                </tr>
                ${event.userId ? `
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">User ID:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">${event.userId}</td>
                </tr>
                ` : ''}
                ${event.ipAddress ? `
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">IP Address:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb;">${event.ipAddress}</td>
                </tr>
                ` : ''}
                ${event.userAgent ? `
                <tr>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-weight: bold;">User Agent:</td>
                  <td style="padding: 10px; background-color: white; border: 1px solid #e5e7eb; font-size: 12px;">${event.userAgent}</td>
                </tr>
                ` : ''}
              </table>
              
              <div style="background-color: white; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Details:</h3>
                <p style="margin: 0; color: #6b7280; white-space: pre-wrap;">${event.details}</p>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
                <p style="margin: 0; color: #92400e;">
                  <strong>⚠️ Action Required:</strong> Please review this security event immediately and take appropriate action.
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
🚨 CRITICAL SECURITY ALERT

Event Type: ${event.type}
Severity: ${event.severity.toUpperCase()}
Timestamp: ${new Date().toISOString()}
${event.userId ? `User ID: ${event.userId}` : ''}
${event.ipAddress ? `IP Address: ${event.ipAddress}` : ''}
${event.userAgent ? `User Agent: ${event.userAgent}` : ''}

Details:
${event.details}

⚠️ Action Required: Please review this security event immediately and take appropriate action.

Dashboard: https://harthio.com/admin/testing?tab=security

---
This is an automated security alert from Harthio
        `;
        
        // Send email via API
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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
}

// ============================================================================
// A05: SECURITY MISCONFIGURATION
// ============================================================================

/**
 * Security Configuration Validator
 * OWASP: A05:2021 – Security Misconfiguration
 */
export class SecurityConfig {
  /**
   * Validate environment configuration
   */
  static validateConfig(): {
    isSecure: boolean;
    warnings: string[];
  } {
    const warnings: string[] = [];

    // Check for secure environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      warnings.push('Missing SUPABASE_URL');
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      warnings.push('Missing SUPABASE_ANON_KEY');
    }

    // Check for HTTPS in production
    if (process.env.NODE_ENV === 'production') {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (appUrl && !appUrl.startsWith('https://')) {
        warnings.push('Production URL should use HTTPS');
      }
    }

    // Check for secure session configuration
    if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
      warnings.push('Missing NEXTAUTH_SECRET in production');
    }

    return {
      isSecure: warnings.length === 0,
      warnings
    };
  }

  /**
   * Get security headers for API responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache'
    };
  }
}

// ============================================================================
// CSRF PROTECTION
// ============================================================================

/**
 * CSRF Token Manager
 * OWASP: Cross-Site Request Forgery Prevention
 */
export class CSRFProtection {
  private static tokens: Map<string, { token: string; expiresAt: number }> = new Map();

  /**
   * Generate CSRF token
   */
  static generateToken(userId: string): string {
    const token = this.randomString(32);
    const expiresAt = Date.now() + (60 * 60 * 1000); // 1 hour

    this.tokens.set(userId, { token, expiresAt });
    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(userId: string, token: string): boolean {
    const record = this.tokens.get(userId);
    
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.tokens.delete(userId);
      return false;
    }

    return record.token === token;
  }

  /**
   * Generate random string
   */
  private static randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const OWASPSecurity = {
  InputSanitizer,
  AccessControl,
  RateLimiter,
  SecurityLogger,
  SecurityConfig,
  CSRFProtection
};
