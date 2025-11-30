import { supabase } from '@/lib/supabase';

export interface UserReport {
  id: string;
  reporter_user_id: string;
  reported_user_id: string;
  reported_content_id?: string;
  report_type: string;
  description: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  resolution_notes?: string;
  created_at: string;
  reporter: {
    email: string;
    display_name?: string;
  };
  reported_user: {
    email: string;
    display_name?: string;
  };
}

export interface ContentFlag {
  id: string;
  content_type: string;
  content_id: string;
  flag_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  flagged_by?: string;
  status: 'active' | 'resolved' | 'dismissed';
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ModerationStats {
  pendingReports: number;
  activeFlags: number;
  reportsToday: number;
  flagsToday: number;
  totalReports: number;
  totalFlags: number;
  avgResolutionTime: number; // in hours
}

export interface CreateReportParams {
  reporterUserId: string;
  reportedUserId: string;
  reportedContentId?: string;
  reportType: string;
  description: string;
}

export interface ResolveReportParams {
  reportId: string;
  adminUserId: string;
  status: 'resolved' | 'dismissed';
  resolutionNotes: string;
}

export interface CreateFlagParams {
  contentType: string;
  contentId: string;
  flagType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reason: string;
  flaggedBy?: string;
}

export class ModerationService {
  /**
   * Get all user reports with pagination
   */
  static async getReports(
    limit = 50, 
    offset = 0, 
    status?: string
  ): Promise<{ reports: UserReport[]; total: number }> {
    let query = supabase
      .from('user_reports')
      .select(`
        *,
        reporter:users!user_reports_reporter_user_id_fkey(email, display_name),
        reported_user:users!user_reports_reported_user_id_fkey(email, display_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return {
      reports: (data || []) as any[],
      total: count || 0
    };
  }

  /**
   * Get content flags with pagination
   */
  static async getFlags(
    limit = 50, 
    offset = 0, 
    status?: string
  ): Promise<{ flags: ContentFlag[]; total: number }> {
    let query = supabase
      .from('content_flags')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query.range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Failed to fetch flags: ${error.message}`);
    }

    return {
      flags: (data || []) as any[],
      total: count || 0
    };
  }

  /**
   * Get moderation statistics
   */
  static async getStats(): Promise<ModerationStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      { count: pendingReports },
      { count: activeFlags },
      { count: reportsToday },
      { count: flagsToday },
      { count: totalReports },
      { count: totalFlags }
    ] = await Promise.all([
      supabase.from('user_reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('content_flags').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('user_reports').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('content_flags').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('user_reports').select('*', { count: 'exact', head: true }),
      supabase.from('content_flags').select('*', { count: 'exact', head: true })
    ]);

    // Calculate average resolution time (simplified)
    const { data: resolvedReports } = await supabase
      .from('user_reports')
      .select('created_at, reviewed_at')
      .not('reviewed_at', 'is', null)
      .limit(100);

    let avgResolutionTime = 0;
    if (resolvedReports && resolvedReports.length > 0) {
      const totalTime = resolvedReports.reduce((sum, report) => {
        const created = new Date(report.created_at || Date.now());
        const resolved = new Date(report.reviewed_at!);
        return sum + (resolved.getTime() - created.getTime());
      }, 0);
      avgResolutionTime = totalTime / resolvedReports.length / (1000 * 60 * 60); // Convert to hours
    }

    return {
      pendingReports: pendingReports || 0,
      activeFlags: activeFlags || 0,
      reportsToday: reportsToday || 0,
      flagsToday: flagsToday || 0,
      totalReports: totalReports || 0,
      totalFlags: totalFlags || 0,
      avgResolutionTime: Math.round(avgResolutionTime * 10) / 10
    };
  }

  /**
   * Create a new user report
   */
  static async createReport(params: CreateReportParams): Promise<string> {
    const { data, error } = await supabase
      .from('user_reports')
      .insert({
        reporter_user_id: params.reporterUserId,
        reported_user_id: params.reportedUserId,
        reported_content_id: params.reportedContentId,
        report_type: params.reportType,
        description: params.description,
        status: 'pending'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create report: ${error.message}`);
    }

    // Create admin notification
    await this.createNotification({
      type: 'user_report',
      title: 'New User Report',
      message: `New ${params.reportType} report submitted`,
      severity: 'warning',
      targetUrl: `/admin-v2/moderation?tab=reports&id=${data.id}`
    });

    return data.id;
  }

  /**
   * Resolve a user report
   */
  static async resolveReport(params: ResolveReportParams): Promise<void> {
    const { error } = await supabase
      .from('user_reports')
      .update({
        status: params.status,
        reviewed_by: params.adminUserId,
        reviewed_at: new Date().toISOString(),
        resolution_notes: params.resolutionNotes
      })
      .eq('id', params.reportId);

    if (error) {
      throw new Error(`Failed to resolve report: ${error.message}`);
    }

    // Log admin action
    await this.logAdminAction({
      adminUserId: params.adminUserId,
      actionType: 'report_resolved',
      targetType: 'report',
      targetId: params.reportId,
      details: {
        status: params.status,
        resolution_notes: params.resolutionNotes
      }
    });
  }

  /**
   * Create a content flag
   */
  static async createFlag(params: CreateFlagParams): Promise<string> {
    const { data, error } = await supabase
      .from('content_flags')
      .insert({
        content_type: params.contentType,
        content_id: params.contentId,
        flag_type: params.flagType,
        severity: params.severity,
        reason: params.reason,
        flagged_by: params.flaggedBy,
        status: 'active'
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to create flag: ${error.message}`);
    }

    // Create admin notification for high/critical severity
    if (params.severity === 'high' || params.severity === 'critical') {
      await this.createNotification({
        type: 'content_flag',
        title: `${params.severity.toUpperCase()} Content Flag`,
        message: `${params.contentType} flagged: ${params.reason}`,
        severity: params.severity === 'critical' ? 'critical' : 'warning',
        targetUrl: `/admin-v2/moderation?tab=flags&id=${data.id}`
      });
    }

    return data.id;
  }

  /**
   * Resolve a content flag
   */
  static async resolveFlag(
    flagId: string, 
    adminUserId: string, 
    status: 'resolved' | 'dismissed'
  ): Promise<void> {
    const { error } = await supabase
      .from('content_flags')
      .update({
        status,
        resolved_by: adminUserId,
        resolved_at: new Date().toISOString()
      })
      .eq('id', flagId);

    if (error) {
      throw new Error(`Failed to resolve flag: ${error.message}`);
    }

    // Log admin action
    await this.logAdminAction({
      adminUserId,
      actionType: 'flag_resolved',
      targetType: 'flag',
      targetId: flagId,
      details: { status }
    });
  }

  /**
   * Get reports for a specific user
   */
  static async getUserReports(userId: string): Promise<UserReport[]> {
    const { data, error } = await supabase
      .from('user_reports')
      .select(`
        *,
        reporter:users!user_reports_reporter_user_id_fkey(email, display_name),
        reported_user:users!user_reports_reported_user_id_fkey(email, display_name)
      `)
      .or(`reporter_user_id.eq.${userId},reported_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch user reports: ${error.message}`);
    }

    return (data || []) as any[];
  }

  /**
   * Auto-flag content based on AI detection
   */
  static async autoFlagContent(
    contentType: string,
    contentId: string,
    reason: string,
    confidence: number
  ): Promise<void> {
    const severity = confidence > 0.9 ? 'critical' : confidence > 0.7 ? 'high' : 'medium';

    await this.createFlag({
      contentType,
      contentId,
      flagType: 'ai_detected',
      severity,
      reason: `AI Detection: ${reason} (confidence: ${Math.round(confidence * 100)}%)`,
      flaggedBy: undefined // System flagged
    });
  }

  /**
   * Get moderation queue (pending items)
   */
  static async getModerationQueue(): Promise<{
    pendingReports: UserReport[];
    activeFlags: ContentFlag[];
  }> {
    const [reportsResult, flagsResult] = await Promise.all([
      this.getReports(20, 0, 'pending'),
      this.getFlags(20, 0, 'active')
    ]);

    return {
      pendingReports: reportsResult.reports,
      activeFlags: flagsResult.flags
    };
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