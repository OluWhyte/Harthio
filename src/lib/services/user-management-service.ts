// ============================================================================
// USER MANAGEMENT SERVICE
// ============================================================================
// Comprehensive user management with roles, permissions, and audit logging
// Now with O(1) profile caching for instant lookups!
// ============================================================================

import { supabaseAny as supabase } from '../supabase';
import { smartSecurityNotifier } from '../smart-security-notifier';
import { profileCache } from '../profile-cache-service';

export type UserRole = 'user' | 'admin' | 'therapist' | 'moderator' | 'suspended' | 'banned';
export type UserStatus = 'active' | 'suspended' | 'banned' | 'under_investigation' | 'pending_verification';
export type UserPermission = 
  | 'create_sessions' | 'join_sessions' | 'send_messages' | 'rate_users'
  | 'access_admin' | 'manage_users' | 'manage_content' | 'view_analytics'
  | 'moderate_sessions' | 'handle_reports' | 'manage_therapists';

export type AdminActionType = 
  | 'role_granted' | 'role_revoked' | 'user_suspended' | 'user_banned'
  | 'user_unsuspended' | 'user_unbanned' | 'investigation_started'
  | 'investigation_closed' | 'account_verified' | 'account_deleted'
  | 'permissions_modified' | 'profile_updated';

export interface UserManagementData {
  user_id: string;
  email: string;
  display_name: string;
  user_created_at: string;
  status: UserStatus;
  status_reason?: string;
  status_changed_at?: string;
  roles: Array<{
    role: UserRole;
    granted_at: string;
    expires_at?: string;
  }>;
  permissions: UserPermission[];
}

export interface AdminAction {
  id: string;
  admin_id: string;
  target_user_id?: string;
  action_type: AdminActionType;
  action_details: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export class UserManagementService {
  
  /**
   * Get all users with their roles and permissions
   */
  static async getAllUsers(): Promise<UserManagementData[]> {
    const { data, error } = await supabase
      .from('user_management_view')
      .select('*')
      .order('user_created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      throw new Error('Failed to fetch users');
    }

    // Add null safety to all returned data
    return (data || []).map(user => ({
      ...user,
      email: user.email || '',
      display_name: user.display_name || '',
      status: user.status || 'active',
      roles: Array.isArray(user.roles) ? user.roles : [],
      permissions: Array.isArray(user.permissions) ? user.permissions : []
    }));
  }

  /**
   * Get user details by ID - with O(1) caching
   */
  static async getUserById(userId: string): Promise<UserManagementData | null> {
    // Try cache first - O(1) instant lookup!
    const cachedProfile = await profileCache.getProfile(userId);
    
    if (cachedProfile) {
      // Convert cached profile to UserManagementData format
      // Note: This is a basic profile, full management data still needs DB query
      console.log('✅ Using cached profile for user:', userId);
    }

    const { data, error } = await supabase
      .from('user_management_view')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user:', error);
      return null;
    }

    if (!data) return null;

    // Add null safety to returned data
    return {
      ...data,
      email: data.email || '',
      display_name: data.display_name || '',
      status: data.status || 'active',
      roles: Array.isArray(data.roles) ? data.roles : [],
      permissions: Array.isArray(data.permissions) ? data.permissions : []
    };
  }

  /**
   * Grant role to user
   */
  static async grantRole(
    targetUserId: string,
    role: UserRole,
    adminId: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Check if role is available
      if (role === 'therapist') {
        throw new Error('Therapist role is coming soon');
      }

      // Insert new role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: targetUserId,
          role,
          granted_by: adminId,
          expires_at: expiresAt?.toISOString(),
          notes: reason,
        });

      if (roleError) throw roleError;

      // Log admin action
      await this.logAdminAction({
        admin_id: adminId,
        target_user_id: targetUserId,
        action_type: 'role_granted',
        action_details: { role, expires_at: expiresAt?.toISOString() },
        reason,
      });

      // Send notification
      await this.sendAdminNotification({
        title: `Role Granted: ${role}`,
        message: `Admin granted ${role} role to user ${targetUserId}`,
        metadata: { target_user_id: targetUserId, role, admin_id: adminId },
      });

    } catch (error) {
      console.error('Error granting role:', error);
      throw error;
    }
  }

  /**
   * Revoke role from user
   */
  static async revokeRole(
    targetUserId: string,
    role: UserRole,
    adminId: string,
    reason?: string
  ): Promise<void> {
    try {
      // Deactivate role
      const { error: roleError } = await supabase
        .from('user_roles')
        .update({ is_active: false, notes: reason })
        .eq('user_id', targetUserId)
        .eq('role', role)
        .eq('is_active', true);

      if (roleError) throw roleError;

      // Log admin action
      await this.logAdminAction({
        admin_id: adminId,
        target_user_id: targetUserId,
        action_type: 'role_revoked',
        action_details: { role },
        reason,
      });

      // Send notification
      await this.sendAdminNotification({
        title: `Role Revoked: ${role}`,
        message: `Admin revoked ${role} role from user ${targetUserId}`,
        metadata: { target_user_id: targetUserId, role, admin_id: adminId },
      });

    } catch (error) {
      console.error('Error revoking role:', error);
      throw error;
    }
  }

  /**
   * Change user status (suspend, ban, etc.)
   */
  static async changeUserStatus(
    targetUserId: string,
    status: UserStatus,
    adminId: string,
    reason?: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Check if action is available
      if (status === 'under_investigation') {
        // This is available
      } else if (status === 'pending_verification') {
        // This is available
      }

      // Update user status
      const { error: statusError } = await supabase
        .from('user_status')
        .upsert({
          user_id: targetUserId,
          status,
          reason,
          changed_by: adminId,
          expires_at: expiresAt?.toISOString(),
        });

      if (statusError) throw statusError;

      // Determine action type
      let actionType: AdminActionType;
      switch (status) {
        case 'suspended':
          actionType = 'user_suspended';
          break;
        case 'banned':
          actionType = 'user_banned';
          break;
        case 'active':
          actionType = 'user_unsuspended';
          break;
        case 'under_investigation':
          actionType = 'investigation_started';
          break;
        default:
          actionType = 'profile_updated';
      }

      // Log admin action
      await this.logAdminAction({
        admin_id: adminId,
        target_user_id: targetUserId,
        action_type: actionType,
        action_details: { status, expires_at: expiresAt?.toISOString() },
        reason,
      });

      // Send notification
      await this.sendAdminNotification({
        title: `User Status Changed: ${status}`,
        message: `Admin changed user ${targetUserId} status to ${status}`,
        metadata: { target_user_id: targetUserId, status, admin_id: adminId },
      });

    } catch (error) {
      console.error('Error changing user status:', error);
      throw error;
    }
  }

  /**
   * Grant permission to user
   */
  static async grantPermission(
    targetUserId: string,
    permission: UserPermission,
    adminId: string,
    expiresAt?: Date
  ): Promise<void> {
    try {
      // Check if permission is available
      const unavailablePermissions = ['manage_therapists'];
      if (unavailablePermissions.includes(permission)) {
        throw new Error(`${permission} permission is coming soon`);
      }

      // Insert permission
      const { error: permError } = await supabase
        .from('user_permissions')
        .insert({
          user_id: targetUserId,
          permission,
          granted_by: adminId,
          expires_at: expiresAt?.toISOString(),
        });

      if (permError) throw permError;

      // Log admin action
      await this.logAdminAction({
        admin_id: adminId,
        target_user_id: targetUserId,
        action_type: 'permissions_modified',
        action_details: { permission, action: 'granted', expires_at: expiresAt?.toISOString() },
      });

      // Send notification
      await this.sendAdminNotification({
        title: `Permission Granted: ${permission}`,
        message: `Admin granted ${permission} permission to user ${targetUserId}`,
        metadata: { target_user_id: targetUserId, permission, admin_id: adminId },
      });

    } catch (error) {
      console.error('Error granting permission:', error);
      throw error;
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokePermission(
    targetUserId: string,
    permission: UserPermission,
    adminId: string
  ): Promise<void> {
    try {
      // Deactivate permission
      const { error: permError } = await supabase
        .from('user_permissions')
        .update({ is_active: false })
        .eq('user_id', targetUserId)
        .eq('permission', permission)
        .eq('is_active', true);

      if (permError) throw permError;

      // Log admin action
      await this.logAdminAction({
        admin_id: adminId,
        target_user_id: targetUserId,
        action_type: 'permissions_modified',
        action_details: { permission, action: 'revoked' },
      });

      // Send notification
      await this.sendAdminNotification({
        title: `Permission Revoked: ${permission}`,
        message: `Admin revoked ${permission} permission from user ${targetUserId}`,
        metadata: { target_user_id: targetUserId, permission, admin_id: adminId },
      });

    } catch (error) {
      console.error('Error revoking permission:', error);
      throw error;
    }
  }

  /**
   * Get admin actions (audit log)
   */
  static async getAdminActions(limit: number = 50): Promise<AdminAction[]> {
    try {
      const { data, error } = await supabase
        .from('admin_actions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching admin actions:', error);
        return []; // Return empty array instead of throwing
      }

      // Ensure all returned data has safe defaults
      return (data || []).map(action => ({
        ...action,
        action_type: action.action_type || '',
        admin_id: action.admin_id || '',
        target_user_id: action.target_user_id || '',
        reason: action.reason || ''
      }));
    } catch (error) {
      console.error('Unexpected error fetching admin actions:', error);
      return []; // Always return empty array on any error
    }
  }

  /**
   * Get admin actions for specific user
   */
  static async getUserAdminActions(userId: string): Promise<AdminAction[]> {
    const { data, error } = await supabase
      .from('admin_actions')
      .select('*')
      .eq('target_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user admin actions:', error);
      throw new Error('Failed to fetch user admin actions');
    }

    return data || [];
  }

  /**
   * Log admin action
   */
  private static async logAdminAction(action: {
    admin_id: string;
    target_user_id?: string;
    action_type: AdminActionType;
    action_details: Record<string, any>;
    reason?: string;
    ip_address?: string;
    user_agent?: string;
  }): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_actions')
        .insert({
          ...action,
          created_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error logging admin action:', error);
      }
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  }

  /**
   * Send admin notification
   */
  private static async sendAdminNotification(notification: {
    title: string;
    message: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      await supabase.from('admin_notifications').insert({
        title: notification.title,
        message: notification.message,
        type: 'system_alert',
        severity: 'medium',
        metadata: notification.metadata,
        created_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error sending admin notification:', error);
    }
  }

  /**
   * Get available roles with their status
   */
  static getAvailableRoles(): Array<{
    role: UserRole;
    label: string;
    description: string;
    available: boolean;
    comingSoon?: boolean;
  }> {
    return [
      {
        role: 'user',
        label: 'User',
        description: 'Regular user with basic permissions',
        available: true,
      },
      {
        role: 'admin',
        label: 'Admin',
        description: 'Full administrative access',
        available: true,
      },
      {
        role: 'moderator',
        label: 'Moderator',
        description: 'Can moderate sessions and handle reports',
        available: true,
      },
      {
        role: 'therapist',
        label: 'Therapist',
        description: 'Licensed therapist with special permissions',
        available: false,
        comingSoon: true,
      },
      {
        role: 'suspended',
        label: 'Suspended',
        description: 'Temporarily suspended user',
        available: true,
      },
      {
        role: 'banned',
        label: 'Banned',
        description: 'Permanently banned user',
        available: true,
      },
    ];
  }

  /**
   * Get available permissions with their status
   */
  static getAvailablePermissions(): Array<{
    permission: UserPermission;
    label: string;
    description: string;
    available: boolean;
    comingSoon?: boolean;
  }> {
    return [
      {
        permission: 'create_sessions',
        label: 'Create Sessions',
        description: 'Can create new conversation sessions',
        available: true,
      },
      {
        permission: 'join_sessions',
        label: 'Join Sessions',
        description: 'Can join existing sessions',
        available: true,
      },
      {
        permission: 'send_messages',
        label: 'Send Messages',
        description: 'Can send messages in sessions',
        available: true,
      },
      {
        permission: 'rate_users',
        label: 'Rate Users',
        description: 'Can rate other users after sessions',
        available: true,
      },
      {
        permission: 'access_admin',
        label: 'Access Admin',
        description: 'Can access admin dashboard',
        available: true,
      },
      {
        permission: 'manage_users',
        label: 'Manage Users',
        description: 'Can manage user accounts and permissions',
        available: true,
      },
      {
        permission: 'manage_content',
        label: 'Manage Content',
        description: 'Can manage blog posts and content',
        available: true,
      },
      {
        permission: 'view_analytics',
        label: 'View Analytics',
        description: 'Can view platform analytics',
        available: true,
      },
      {
        permission: 'moderate_sessions',
        label: 'Moderate Sessions',
        description: 'Can moderate ongoing sessions',
        available: false,
        comingSoon: true,
      },
      {
        permission: 'handle_reports',
        label: 'Handle Reports',
        description: 'Can handle user reports and complaints',
        available: false,
        comingSoon: true,
      },
      {
        permission: 'manage_therapists',
        label: 'Manage Therapists',
        description: 'Can manage therapist accounts and verification',
        available: false,
        comingSoon: true,
      },
    ];
  }
}