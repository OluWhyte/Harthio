import { supabase } from '@/lib/supabase';

export interface AdminNotification {
  id: string;
  notification_type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  target_url?: string;
  read_by: string[]; // Array of admin user IDs who have read this
  created_at: string;
  expires_at?: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  critical: number;
  warning: number;
  info: number;
}

export class NotificationService {
  /**
   * Get notifications for admin user
   */
  static async getNotifications(
    adminUserId: string,
    limit = 50,
    offset = 0,
    unreadOnly = false
  ): Promise<{ notifications: AdminNotification[]; total: number }> {
    let query = supabase
      .from('admin_notifications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Filter for unexpired notifications
    const now = new Date().toISOString();
    query = query.or(`expires_at.is.null,expires_at.gt.${now}`);

    if (unreadOnly) {
      // Filter for notifications not read by this admin
      query = query.not('read_by', 'cs', `["${adminUserId}"]`);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    return {
      notifications: data || [],
      total: count || 0
    };
  }

  /**
   * Get notification statistics for admin user
   */
  static async getNotificationStats(adminUserId: string): Promise<NotificationStats> {
    const now = new Date().toISOString();

    const [
      { count: total },
      { count: unread },
      { count: critical },
      { count: warning },
      { count: info }
    ] = await Promise.all([
      // Total active notifications
      supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .or(`expires_at.is.null,expires_at.gt.${now}`),
      
      // Unread notifications for this admin
      supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .not('read_by', 'cs', `["${adminUserId}"]`),
      
      // Critical notifications
      supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'critical')
        .or(`expires_at.is.null,expires_at.gt.${now}`),
      
      // Warning notifications
      supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'warning')
        .or(`expires_at.is.null,expires_at.gt.${now}`),
      
      // Info notifications
      supabase
        .from('admin_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('severity', 'info')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
    ]);

    return {
      total: total || 0,
      unread: unread || 0,
      critical: critical || 0,
      warning: warning || 0,
      info: info || 0
    };
  }

  /**
   * Mark notification as read by admin user
   */
  static async markAsRead(notificationId: string, adminUserId: string): Promise<void> {
    // Get current notification
    const { data: notification, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('read_by')
      .eq('id', notificationId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch notification: ${fetchError.message}`);
    }

    const readBy = notification.read_by || [];
    
    // Add admin user ID if not already present
    if (!readBy.includes(adminUserId)) {
      readBy.push(adminUserId);

      const { error: updateError } = await supabase
        .from('admin_notifications')
        .update({ read_by: readBy })
        .eq('id', notificationId);

      if (updateError) {
        throw new Error(`Failed to mark notification as read: ${updateError.message}`);
      }
    }
  }

  /**
   * Mark all notifications as read for admin user
   */
  static async markAllAsRead(adminUserId: string): Promise<void> {
    // Get all unread notifications for this admin
    const { data: notifications, error: fetchError } = await supabase
      .from('admin_notifications')
      .select('id, read_by')
      .not('read_by', 'cs', `["${adminUserId}"]`)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

    if (fetchError) {
      throw new Error(`Failed to fetch notifications: ${fetchError.message}`);
    }

    if (!notifications || notifications.length === 0) {
      return; // No unread notifications
    }

    // Update each notification to include this admin in read_by
    const updates = notifications.map(notification => {
      const readBy = notification.read_by || [];
      if (!readBy.includes(adminUserId)) {
        readBy.push(adminUserId);
      }
      return {
        id: notification.id,
        read_by: readBy
      };
    });

    // Batch update notifications
    for (const update of updates) {
      await supabase
        .from('admin_notifications')
        .update({ read_by: update.read_by })
        .eq('id', update.id);
    }
  }

  /**
   * Delete notification (admin only)
   */
  static async deleteNotification(notificationId: string, adminUserId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    // Log the action
    await this.logAdminAction({
      adminUserId,
      actionType: 'notification_deleted',
      targetType: 'notification',
      targetId: notificationId,
      details: {}
    });
  }

  /**
   * Create a new admin notification
   */
  static async createNotification(params: {
    type: string;
    title: string;
    message: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    targetUrl?: string;
    expiresAt?: Date;
  }): Promise<string> {
    const { data, error } = await supabase.rpc('create_admin_notification', {
      p_notification_type: params.type,
      p_title: params.title,
      p_message: params.message,
      p_severity: params.severity,
      p_target_url: params.targetUrl,
      p_expires_at: params.expiresAt?.toISOString()
    });

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data;
  }

  /**
   * Get recent activity notifications
   */
  static async getRecentActivity(limit = 20): Promise<AdminNotification[]> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent activity: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(
    adminUserId: string,
    onNotification: (notification: AdminNotification) => void
  ) {
    const channel = supabase
      .channel('admin_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'admin_notifications'
        },
        (payload) => {
          const notification = payload.new as AdminNotification;
          // Only notify if this admin hasn't read it yet
          if (!notification.read_by.includes(adminUserId)) {
            onNotification(notification);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    const now = new Date().toISOString();
    
    const { count, error } = await supabase
      .from('admin_notifications')
      .delete({ count: 'exact' })
      .not('expires_at', 'is', null)
      .lt('expires_at', now);

    if (error) {
      throw new Error(`Failed to cleanup notifications: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get notification by ID
   */
  static async getNotificationById(notificationId: string): Promise<AdminNotification | null> {
    const { data, error } = await supabase
      .from('admin_notifications')
      .select('*')
      .eq('id', notificationId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch notification: ${error.message}`);
    }

    return data;
  }

  /**
   * Private helper method for logging admin actions
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
}

// Export singleton instance
export const notificationService = new NotificationService();

/**
 * Create a test notification for development
 */
export const createTestNotification = async (type: 'info' | 'warning' | 'error' | 'critical' = 'info') => {
  const messages = {
    info: { title: 'System Update', message: 'Platform maintenance scheduled for tonight' },
    warning: { title: 'High Traffic Alert', message: 'Server load is above normal levels' },
    error: { title: 'Database Error', message: 'Connection timeout detected on primary database' },
    critical: { title: 'Security Alert', message: 'Suspicious activity detected - immediate attention required' }
  };

  return NotificationService.createNotification({
    type: 'system_alert',
    title: messages[type].title,
    message: messages[type].message,
    severity: type,
    targetUrl: '/admin-v2/notifications'
  });
};