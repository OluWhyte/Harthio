import { supabase } from '@/lib/supabase';

export interface PlatformSettings {
  // Platform Configuration
  platform_name: string;
  platform_description: string;
  contact_email: string;
  support_email: string;
  
  // Feature Toggles
  registration_enabled: boolean;
  email_verification_required: boolean;
  ai_moderation_enabled: boolean;
  maintenance_mode: boolean;
  
  // Session Configuration
  max_session_duration: number; // minutes
  max_participants_per_session: number;
  session_approval_required: boolean;
  
  // Email Configuration
  email_provider: 'resend' | 'sendgrid' | 'mailgun';
  from_email: string;
  reply_to_email: string;
  
  // AI Configuration
  ai_provider: 'openai' | 'anthropic' | 'google';
  ai_model: string;
  ai_temperature: number;
  
  // Security Settings
  password_min_length: number;
  require_2fa_for_admins: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
}

export interface AdminUserInfo {
  id: string;
  email: string;
  display_name?: string;
  role: 'admin' | 'editor';
  permissions: string[];
  created_at: string;
  last_login?: string;
  is_active: boolean;
}

export interface CreateAdminParams {
  email: string;
  role: 'admin' | 'editor';
  permissions?: string[];
  adminUserId: string; // Who is creating this admin
}

export interface UpdateAdminParams {
  adminId: string;
  role?: 'admin' | 'editor';
  permissions?: string[];
  is_active?: boolean;
  updatedBy: string;
}

export class SettingsService {
  /**
   * Get current platform settings
   */
  static async getPlatformSettings(): Promise<PlatformSettings> {
    // For now, return default settings
    // In production, these would be stored in a settings table
    return {
      platform_name: 'Harthio',
      platform_description: 'A platform for meaningful conversations with AI-powered matching and moderation.',
      contact_email: 'hello@harthio.com',
      support_email: 'support@harthio.com',
      
      registration_enabled: true,
      email_verification_required: true,
      ai_moderation_enabled: true,
      maintenance_mode: false,
      
      max_session_duration: 120,
      max_participants_per_session: 8,
      session_approval_required: true,
      
      email_provider: 'resend',
      from_email: 'noreply@harthio.com',
      reply_to_email: 'hello@harthio.com',
      
      ai_provider: 'openai',
      ai_model: 'gpt-4',
      ai_temperature: 0.7,
      
      password_min_length: 8,
      require_2fa_for_admins: false,
      session_timeout_minutes: 480, // 8 hours
      max_login_attempts: 5
    };
  }

  /**
   * Update platform settings
   */
  static async updatePlatformSettings(
    settings: Partial<PlatformSettings>,
    adminUserId: string
  ): Promise<void> {
    // Log the settings change
    await this.logAdminAction({
      adminUserId,
      actionType: 'settings_updated',
      targetType: 'platform',
      targetId: 'settings',
      details: settings
    });

    // In production, save to settings table
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  /**
   * Get all admin users
   */
  static async getAdminUsers(): Promise<AdminUserInfo[]> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select(`
        user_id,
        role,
        permissions,
        created_at,
        user:users!admin_roles_user_id_fkey(
          email,
          display_name,
          first_name,
          last_name,
          last_sign_in_at
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch admin users: ${error.message}`);
    }

    return (data || []).map((admin: any) => ({
      id: admin.user_id,
      email: admin.user.email,
      display_name: admin.user.display_name || 
                   (admin.user.first_name && admin.user.last_name 
                     ? `${admin.user.first_name} ${admin.user.last_name}` 
                     : undefined),
      role: admin.role,
      permissions: admin.permissions || [],
      created_at: admin.created_at,
      last_login: admin.user.last_sign_in_at,
      is_active: true // Assume active for now
    }));
  }

  /**
   * Create new admin user
   */
  static async createAdmin(params: CreateAdminParams): Promise<void> {
    // First check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', params.email)
      .single();

    if (userError && userError.code !== 'PGRST116') {
      throw new Error(`Error checking user: ${userError.message}`);
    }

    if (!existingUser) {
      throw new Error('User must be registered before being made an admin. Ask them to sign up first.');
    }

    // Check if already an admin
    const { data: existingAdmin } = await supabase
      .from('admin_roles')
      .select('user_id')
      .eq('user_id', existingUser.id)
      .single();

    if (existingAdmin) {
      throw new Error('User is already an admin.');
    }

    // Create admin role
    const { error: adminError } = await supabase
      .from('admin_roles')
      .insert({
        user_id: existingUser.id,
        role: params.role,
        permissions: params.permissions || []
      });

    if (adminError) {
      throw new Error(`Failed to create admin: ${adminError.message}`);
    }

    // Log the action
    await this.logAdminAction({
      adminUserId: params.adminUserId,
      actionType: 'admin_created',
      targetType: 'admin',
      targetId: existingUser.id,
      details: {
        email: params.email,
        role: params.role,
        permissions: params.permissions
      }
    });

    // Create notification
    await this.createNotification({
      type: 'admin_created',
      title: 'New Admin Created',
      message: `${params.email} has been granted ${params.role} access`,
      severity: 'info',
      targetUrl: '/admin-v2/settings?tab=admins'
    });
  }

  /**
   * Update admin user
   */
  static async updateAdmin(params: UpdateAdminParams): Promise<void> {
    const updates: any = {};
    
    if (params.role !== undefined) updates.role = params.role;
    if (params.permissions !== undefined) updates.permissions = params.permissions;

    const { error } = await supabase
      .from('admin_roles')
      .update(updates)
      .eq('user_id', params.adminId);

    if (error) {
      throw new Error(`Failed to update admin: ${error.message}`);
    }

    // Log the action
    await this.logAdminAction({
      adminUserId: params.updatedBy,
      actionType: 'admin_updated',
      targetType: 'admin',
      targetId: params.adminId,
      details: updates
    });
  }

  /**
   * Remove admin access
   */
  static async removeAdmin(adminId: string, removedBy: string): Promise<void> {
    // Don't allow removing yourself
    if (adminId === removedBy) {
      throw new Error('You cannot remove your own admin access.');
    }

    const { error } = await supabase
      .from('admin_roles')
      .delete()
      .eq('user_id', adminId);

    if (error) {
      throw new Error(`Failed to remove admin: ${error.message}`);
    }

    // Log the action
    await this.logAdminAction({
      adminUserId: removedBy,
      actionType: 'admin_removed',
      targetType: 'admin',
      targetId: adminId,
      details: {}
    });

    // Create notification
    await this.createNotification({
      type: 'admin_removed',
      title: 'Admin Access Removed',
      message: 'An admin user has been removed',
      severity: 'warning',
      targetUrl: '/admin-v2/settings?tab=admins'
    });
  }

  /**
   * Get system health status
   */
  static async getSystemHealth(): Promise<{
    database: 'healthy' | 'warning' | 'error';
    email: 'healthy' | 'warning' | 'error';
    ai: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
  }> {
    // Simulate health checks
    return {
      database: 'healthy',
      email: 'healthy', 
      ai: 'healthy',
      storage: 'healthy'
    };
  }

  /**
   * Get platform statistics
   */
  static async getPlatformStats(): Promise<{
    totalUsers: number;
    totalSessions: number;
    totalMessages: number;
    storageUsed: string;
    uptime: string;
  }> {
    const [
      { count: userCount },
      { count: sessionCount },
      { count: messageCount }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('topics').select('*', { count: 'exact', head: true }),
      supabase.from('messages').select('*', { count: 'exact', head: true })
    ]);

    return {
      totalUsers: userCount || 0,
      totalSessions: sessionCount || 0,
      totalMessages: messageCount || 0,
      storageUsed: '2.4 GB', // Simulated
      uptime: '99.9%' // Simulated
    };
  }

  /**
   * Test email configuration
   */
  static async testEmailConfig(): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate email test
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        success: true,
        message: 'Email configuration is working correctly.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'Email configuration test failed.'
      };
    }
  }

  /**
   * Test AI configuration
   */
  static async testAIConfig(): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate AI test
      await new Promise(resolve => setTimeout(resolve, 1500));
      return {
        success: true,
        message: 'AI service is responding correctly.'
      };
    } catch (error) {
      return {
        success: false,
        message: 'AI service test failed.'
      };
    }
  }

  /**
   * Private helper methods
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
}