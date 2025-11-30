import { supabase } from '@/lib/supabase';

export interface SuspendUserParams {
  userId: string;
  reason: string;
  duration?: number; // days, if not provided = permanent
  adminUserId: string;
}

export interface UpgradeUserParams {
  userId: string;
  targetTier: 'pro' | 'free';
  adminUserId: string;
}

export interface SendAdminEmailParams {
  userId: string;
  subject: string;
  message: string;
  adminUserId: string;
}

export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  action_type: string;
  target_type: string;
  target_id: string;
  details: any;
  created_at: string;
  admin_user: {
    email: string;
    display_name: string;
  };
}

export class AdminUserService {
  /**
   * Suspend a user account
   */
  static async suspendUser(params: SuspendUserParams): Promise<void> {
    const { userId, reason, duration, adminUserId } = params;
    
    // Calculate expiration if duration provided
    const expiresAt = duration 
      ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString()
      : null;

    // Update user suspension status
    const { error: updateError } = await supabase
      .from('users')
      .update({
        suspension_status: 'suspended',
        suspension_reason: reason,
        suspended_by: adminUserId,
        suspended_at: new Date().toISOString(),
        suspension_expires_at: expiresAt
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to suspend user: ${updateError.message}`);
    }

    // Log the action
    await this.logAdminAction({
      adminUserId,
      actionType: 'user_suspend',
      targetType: 'user',
      targetId: userId,
      details: {
        reason,
        duration,
        expires_at: expiresAt
      }
    });

    // Create admin notification
    await this.createNotification({
      type: 'user_suspended',
      title: 'User Suspended',
      message: `User has been suspended for: ${reason}`,
      severity: 'warning',
      targetUrl: `/admin-v2/users?search=${userId}`
    });
  }

  /**
   * Unsuspend a user account
   */
  static async unsuspendUser(userId: string, adminUserId: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        suspension_status: 'active',
        suspension_reason: null,
        suspended_by: null,
        suspended_at: null,
        suspension_expires_at: null
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to unsuspend user: ${updateError.message}`);
    }

    await this.logAdminAction({
      adminUserId,
      actionType: 'user_unsuspend',
      targetType: 'user',
      targetId: userId,
      details: {}
    });
  }

  /**
   * Upgrade user tier
   */
  static async upgradeUser(params: UpgradeUserParams): Promise<void> {
    const { userId, targetTier, adminUserId } = params;

    const updates: any = {
      subscription_tier: targetTier
    };

    if (targetTier === 'pro') {
      updates.subscription_start_date = new Date().toISOString();
      // End any active trial
      updates.is_trial_active = false;
      updates.trial_end_date = null;
    }

    const { error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to upgrade user: ${updateError.message}`);
    }

    await this.logAdminAction({
      adminUserId,
      actionType: 'user_tier_change',
      targetType: 'user',
      targetId: userId,
      details: {
        new_tier: targetTier,
        previous_tier: targetTier === 'pro' ? 'free' : 'pro'
      }
    });

    await this.createNotification({
      type: 'user_upgraded',
      title: 'User Tier Updated',
      message: `User upgraded to ${targetTier} tier`,
      severity: 'info',
      targetUrl: `/admin-v2/users?search=${userId}`
    });
  }

  /**
   * Send email to user (placeholder for now)
   */
  static async sendAdminEmail(params: SendAdminEmailParams): Promise<void> {
    const { userId, subject, message, adminUserId } = params;

    // TODO: Implement actual email sending via Resend
    // For now, just log the action
    await this.logAdminAction({
      adminUserId,
      actionType: 'user_email_sent',
      targetType: 'user',
      targetId: userId,
      details: {
        subject,
        message: message.substring(0, 200) + (message.length > 200 ? '...' : '')
      }
    });

    await this.createNotification({
      type: 'email_sent',
      title: 'Admin Email Sent',
      message: `Email sent to user: ${subject}`,
      severity: 'info',
      targetUrl: `/admin-v2/users?search=${userId}`
    });

    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  /**
   * Ban user permanently
   */
  static async banUser(userId: string, reason: string, adminUserId: string): Promise<void> {
    const { error: updateError } = await supabase
      .from('users')
      .update({
        suspension_status: 'banned',
        suspension_reason: reason,
        suspended_by: adminUserId,
        suspended_at: new Date().toISOString(),
        suspension_expires_at: null // Permanent
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to ban user: ${updateError.message}`);
    }

    await this.logAdminAction({
      adminUserId,
      actionType: 'user_ban',
      targetType: 'user',
      targetId: userId,
      details: { reason }
    });

    await this.createNotification({
      type: 'user_banned',
      title: 'User Banned',
      message: `User permanently banned: ${reason}`,
      severity: 'error',
      targetUrl: `/admin-v2/users?search=${userId}`
    });
  }

  /**
   * Get audit log entries
   */
  static async getAuditLog(limit = 50, offset = 0): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin_user:users!admin_audit_log_admin_user_id_fkey(
          email,
          display_name
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch audit log: ${error.message}`);
    }

    return (data || []) as any[];
  }

  /**
   * Get audit log for specific user
   */
  static async getUserAuditLog(userId: string): Promise<AuditLogEntry[]> {
    const { data, error } = await supabase
      .from('admin_audit_log')
      .select(`
        *,
        admin_user:users!admin_audit_log_admin_user_id_fkey(
          email,
          display_name
        )
      `)
      .eq('target_id', userId)
      .eq('target_type', 'user')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch user audit log: ${error.message}`);
    }

    return (data || []) as any[];
  }

  /**
   * Log admin action
   */
  private static async logAdminAction(params: {
    adminUserId: string;
    actionType: string;
    targetType: string;
    targetId: string;
    details: any;
  }): Promise<void> {
    const { error } = await supabase.rpc('log_admin_action', {
      p_admin_user_id: params.adminUserId,
      p_action_type: params.actionType,
      p_target_type: params.targetType,
      p_target_id: params.targetId,
      p_details: params.details
    });

    if (error) {
      console.error('Failed to log admin action:', error);
    }
  }

  /**
   * Create admin notification
   */
  private static async createNotification(params: {
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    targetUrl?: string;
  }): Promise<void> {
    const { error } = await supabase.rpc('create_admin_notification', {
      p_notification_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_severity: params.severity,
      p_target_url: params.targetUrl
    });

    if (error) {
      console.error('Failed to create admin notification:', error);
    }
  }

  /**
   * Check if user is suspended
   */
  static async isUserSuspended(userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('users')
      .select('suspension_status, suspension_expires_at')
      .eq('id', userId)
      .single();

    if (error || !data) return false;

    if (data.suspension_status === 'banned') return true;
    if (data.suspension_status === 'suspended') {
      // Check if suspension has expired
      if (data.suspension_expires_at) {
        const expiresAt = new Date(data.suspension_expires_at);
        if (expiresAt < new Date()) {
          // Suspension expired, auto-unsuspend
          await this.unsuspendUser(userId, 'system');
          return false;
        }
      }
      return true;
    }

    return false;
  }
}