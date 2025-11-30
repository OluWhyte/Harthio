/**
 * Database Security Logger
 * 
 * Persists security events to Supabase database for long-term storage and analysis.
 * This module is imported by security-utils.ts to add database persistence.
 */

import { SecurityEvent } from './security-utils';

/**
 * Persist security event to database
 */
export async function persistSecurityLog(event: SecurityEvent): Promise<void> {
    try {
        // Only persist on server-side
        if (typeof window !== 'undefined') {
            return;
        }

        // Dynamic import to avoid issues during build
        const { createClient } = await import('@supabase/supabase-js');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            // Silently skip if not configured
            return;
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Map severity based on event type
        const severity = getSeverityForEventType(event.type);

        // Insert into security_logs table (matching existing schema)
        const { error } = await supabase
            .from('security_logs')
            .insert({
                event_type: event.type,
                user_id: event.userId || null,
                ip_address: event.ip || null,
                user_agent: event.userAgent || null,
                // Convert details to string for TEXT column (existing schema)
                details: typeof event.details === 'object'
                    ? JSON.stringify(event.details)
                    : (event.details || '{}'),
                severity: severity
                // Don't set created_at - let database default handle it
            });

        if (error) {
            console.error('❌ Failed to persist security log:', error.message);
        } else if (process.env.NODE_ENV === 'development') {
            console.log('✅ Security log persisted to database');
        }
    } catch (error) {
        // Silent fail - don't break the application if logging fails
        if (process.env.NODE_ENV === 'development') {
            console.error('❌ Error persisting security log:', error);
        }
    }
}

/**
 * Determine severity based on event type
 */
function getSeverityForEventType(type: SecurityEvent['type']): 'low' | 'medium' | 'high' | 'critical' {
    switch (type) {
        case 'auth_failure':
            return 'medium';
        case 'access_denied':
            return 'medium';
        case 'rate_limit':
            return 'low';
        case 'suspicious_activity':
            return 'high';
        case 'validation_error':
            return 'low';
        case 'api_error':
            return 'medium';
        case 'security_scan':
            return 'high';
        case 'contact_form':
            return 'low';
        default:
            return 'medium';
    }
}

/**
 * Query security logs from database
 */
export async function querySecurityLogs(filters: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    eventType?: SecurityEvent['type'];
    userId?: string;
    ipAddress?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
}) {
    try {
        const { createClient } = await import('@supabase/supabase-js');

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseServiceKey) {
            throw new Error('Supabase not configured');
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        let query = supabase
            .from('security_logs')
            .select('*')
            .order('created_at', { ascending: false });

        if (filters.severity) {
            query = query.eq('severity', filters.severity);
        }

        if (filters.eventType) {
            query = query.eq('event_type', filters.eventType);
        }

        if (filters.userId) {
            query = query.eq('user_id', filters.userId);
        }

        if (filters.ipAddress) {
            query = query.eq('ip_address', filters.ipAddress);
        }

        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }

        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        query = query.limit(filters.limit || 100);

        const { data, error } = await query;

        if (error) {
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Error querying security logs:', error);
        throw error;
    }
}
