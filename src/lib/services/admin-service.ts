// ============================================================================
// ADMIN SERVICE
// ============================================================================
// Comprehensive admin service for managing users, sessions, analytics, and more
// Provides full admin functionality with real data from the database

import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { 
  DailyDataEntry, 
  SessionActivityEntry, 
  CategoryCount, 
  EngagementLevel,
  DatabaseUser,
  DatabaseTopic,
  DatabaseMessage,
  DatabaseRating,
  DatabaseDevice,
  DatabaseRow
} from './admin-service-types';
import type { 
  User, 
  Topic, 
  Message, 
  Rating, 
  BlogPost, 
  UserWithStats,
  TopicWithDetails,
  UserAnalytics,
  TopicAnalytics,
  MessageAnalytics,
  AdminRole,
  JoinRequest,
  SessionStatus,
  Notification,
  SessionPresence
} from '@/lib/database-types';

export class AdminService {

  // ============================================================================
  // AUTHENTICATION & PERMISSIONS
  // ============================================================================

  static async isUserAdmin(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) return false;
      return (data as any)?.role === 'admin' || (data as any)?.role === 'editor';
    } catch (error) {
      logger.error('Error checking admin status', error);
      return false;
    }
  }

  static async getUserRole(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return (data as any)?.role || null;
    } catch (error) {
      logger.error('Error getting user role', error);
      return null;
    }
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  static async getAllUsers(limit = 50, offset = 0): Promise<UserWithStats[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          topic_count:topics(count),
          message_count:messages(count)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get rating stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const ratingStats = await AdminService.getUserRatingStats((user as any).id);
          return {
            ...(user as any),
            topic_count: (user as any).topic_count?.[0]?.count || 0,
            message_count: (user as any).message_count?.[0]?.count || 0,
            rating_stats: ratingStats
          };
        })
      );

      return usersWithStats;
    } catch (error) {
      logger.error('Error fetching users', error);
      throw error;
    }
  }

  static async getUserById(userId: string): Promise<UserWithStats | null> {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;

      // Get additional stats
      const [topicCount, messageCount, ratingStats] = await Promise.all([
        AdminService.getUserTopicCount(userId),
        AdminService.getUserMessageCount(userId),
        AdminService.getUserRatingStats(userId)
      ]);

      return {
        ...(user as any),
        topic_count: topicCount,
        message_count: messageCount,
        rating_stats: ratingStats
      };
    } catch (error) {
      logger.error('Error fetching user', error);
      return null;
    }
  }

  static async searchUsers(query: string, limit = 20): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as any[];
    } catch (error) {
      logger.error('Error searching users', error);
      throw error;
    }
  }

  static async getUserTopicCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('topics')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting user topic count', error);
      return 0;
    }
  }

  static async getUserMessageCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting user message count', error);
      return 0;
    }
  }

  static async getUserRatingStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('politeness, relevance, problem_solved, communication, professionalism')
        .eq('user_id', userId);

      if (error) throw error;

      if (!data || data.length === 0) {
        return {
          user_id: userId,
          total_ratings: 0,
          average_politeness: 0,
          average_relevance: 0,
          average_problem_solved: 0,
          average_communication: 0,
          average_professionalism: 0,
          overall_average: 0
        };
      }

      const totals = data.reduce((acc: any, rating: any) => ({
        politeness: acc.politeness + rating.politeness,
        relevance: acc.relevance + rating.relevance,
        problem_solved: acc.problem_solved + rating.problem_solved,
        communication: acc.communication + rating.communication,
        professionalism: acc.professionalism + rating.professionalism
      }), { politeness: 0, relevance: 0, problem_solved: 0, communication: 0, professionalism: 0 });

      const count = data.length;
      const averages = {
        average_politeness: totals.politeness / count,
        average_relevance: totals.relevance / count,
        average_problem_solved: totals.problem_solved / count,
        average_communication: totals.communication / count,
        average_professionalism: totals.professionalism / count
      };

      const overall_average = Object.values(averages).reduce((sum, avg) => sum + avg, 0) / 5;

      return {
        user_id: userId,
        total_ratings: count,
        ...averages,
        overall_average
      };
    } catch (error) {
      logger.error('Error getting user rating stats', error);
      return null;
    }
  }

  // ============================================================================
  // SESSION/TOPIC MANAGEMENT
  // ============================================================================

  static async getAllTopics(limit = 50, offset = 0): Promise<TopicWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          author:users!topics_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get comprehensive session data for each topic
      const topicsWithDetails = await Promise.all(
        data.map(async (topic) => {
          const [messageCount, joinRequests, sessionPresence] = await Promise.all([
            AdminService.getTopicMessageCount((topic as any).id),
            AdminService.getTopicJoinRequests((topic as any).id),
            AdminService.getSessionPresence((topic as any).id)
          ]);

          const sessionStatus = AdminService.calculateSessionStatus(topic, joinRequests, sessionPresence);
          const actualDuration = AdminService.calculateActualDuration(topic, sessionPresence);

          return {
            ...(topic as any),
            message_count: messageCount,
            participant_count: (topic as any).participants?.length || 0,
            join_requests: joinRequests,
            session_presence: sessionPresence,
            session_status: sessionStatus.status,
            actual_duration: actualDuration,
            ended_early: actualDuration > 0 && actualDuration < AdminService.getScheduledDuration(topic),
            no_show: sessionStatus.status === 'ended_no_show'
          };
        })
      );

      return topicsWithDetails;
    } catch (error) {
      logger.error('Error fetching topics', error);
      throw error;
    }
  }

  // Get all topics including archived (for admin complete view)
  static async getAllTopicsIncludingArchived(limit = 100): Promise<TopicWithDetails[]> {
    try {
      // Query both tables in parallel
      const [activeTopics, archivedTopics] = await Promise.all([
        // Get active topics
        supabase
          .from('topics')
          .select(`
            *,
            author:users!topics_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
          `)
          .order('created_at', { ascending: false })
          .limit(limit),
        
        // Get archived topics
        supabase
          .from('topics_archive')
          .select(`
            *,
            author:users!topics_archive_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
          `)
          .order('archived_at', { ascending: false })
          .limit(limit)
      ]);

      if (activeTopics.error) {
        logger.error('Error fetching active topics', activeTopics.error);
      }
      
      if (archivedTopics.error) {
        // Silently ignore if topics_archive table doesn't exist or has schema issues
        // This is expected if the archive system hasn't been set up properly
        const isExpectedError = archivedTopics.error.message?.includes('does not exist') ||
                               archivedTopics.error.code === '42P01' ||
                               archivedTopics.error.code === 'PGRST200' ||
                               archivedTopics.error.message?.includes('Could not find a relationship');
        
        if (!isExpectedError) {
          logger.error('Error fetching archived topics', archivedTopics.error);
        }
      }

      // Combine both results
      const combined = [
        ...(activeTopics.data || []),
        ...(archivedTopics.data || [])
      ];

      // Get comprehensive session data for each topic
      const topicsWithDetails = await Promise.all(
        combined.map(async (topic) => {
          const [messageCount, joinRequests, sessionPresence] = await Promise.all([
            AdminService.getTopicMessageCount((topic as any).id),
            AdminService.getTopicJoinRequests((topic as any).id),
            AdminService.getSessionPresence((topic as any).id)
          ]);

          const sessionStatus = AdminService.calculateSessionStatus(topic, joinRequests, sessionPresence);
          const actualDuration = AdminService.calculateActualDuration(topic, sessionPresence);

          return {
            ...(topic as any),
            message_count: messageCount,
            participant_count: (topic as any).participants?.length || 0,
            join_requests: joinRequests,
            session_presence: sessionPresence,
            session_status: sessionStatus.status,
            actual_duration: actualDuration,
            ended_early: actualDuration > 0 && actualDuration < AdminService.getScheduledDuration(topic),
            no_show: sessionStatus.status === 'ended_no_show'
          };
        })
      );

      // Sort by most recent (created_at or archived_at)
      topicsWithDetails.sort((a, b) => {
        const aTime = new Date(a.archived_at || a.created_at).getTime();
        const bTime = new Date(b.archived_at || b.created_at).getTime();
        return bTime - aTime;
      });

      return topicsWithDetails;
    } catch (error) {
      logger.error('Error fetching all topics including archived', error);
      throw error;
    }
  }

  static async getTopicMessageCount(topicId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('topic_id', topicId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      logger.error('Error getting topic message count', error);
      return 0;
    }
  }

  static async getArchivedTopics(limit = 50, offset = 0): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('topics_archive')
        .select(`
          *,
          author:users!topics_archive_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
        `)
        .order('archived_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        // Return empty array if table doesn't exist or has schema issues
        if (error.message?.includes('does not exist') || 
            error.code === '42P01' || 
            error.code === 'PGRST200' ||
            error.message?.includes('Could not find a relationship')) {
          return [];
        }
        throw error;
      }

      return data?.map((topic: any) => ({
        ...topic,
        participant_count: topic.participants?.length || 0,
        is_archived: true
      })) || [];
    } catch (error: any) {
      // Silently return empty array if archive table doesn't exist or has schema issues
      if (error.message?.includes('does not exist') || 
          error.code === '42P01' || 
          error.code === 'PGRST200' ||
          error.message?.includes('Could not find a relationship')) {
        return [];
      }
      logger.error('Error fetching archived topics', error);
      return [];
    }
  }

  // Removed duplicate function - using the one above with TopicWithDetails return type

  static async getActiveTopics(): Promise<TopicWithDetails[]> {
    const now = new Date().toISOString();
    try {
      const { data, error } = await supabase
        .from('topics')
        .select(`
          *,
          author:users!topics_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
        `)
        .lte('start_time', now)
        .gte('end_time', now)
        .order('start_time', { ascending: true });

      if (error) throw error;

      const topicsWithDetails = await Promise.all(
        data.map(async (topic) => {
          const [messageCount, joinRequests, sessionPresence] = await Promise.all([
            AdminService.getTopicMessageCount((topic as any).id),
            AdminService.getTopicJoinRequests((topic as any).id),
            AdminService.getSessionPresence((topic as any).id)
          ]);

          const sessionStatus = AdminService.calculateSessionStatus(topic, joinRequests, sessionPresence);
          const actualDuration = AdminService.calculateActualDuration(topic, sessionPresence);

          return {
            ...(topic as any),
            message_count: messageCount,
            participant_count: (topic as any).participants?.length || 0,
            join_requests: joinRequests,
            session_presence: sessionPresence,
            session_status: sessionStatus.status,
            actual_duration: actualDuration,
            ended_early: actualDuration > 0 && actualDuration < AdminService.getScheduledDuration(topic),
            no_show: sessionStatus.status === 'ended_no_show'
          };
        })
      );

      return topicsWithDetails;
    } catch (error) {
      logger.error('Error fetching active topics', error);
      throw error;
    }
  }

  // Get join requests for a topic
  static async getTopicJoinRequests(topicId: string): Promise<JoinRequest[]> {
    try {
      const { data, error } = await supabase
        .from('join_requests')
        .select('*')
        .eq('topic_id', topicId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any[];
    } catch (error) {
      logger.error('Error fetching join requests', error);
      return [];
    }
  }

  // Get session presence data for a topic
  static async getSessionPresence(topicId: string): Promise<SessionPresence[]> {
    try {
      const { data, error } = await supabase
        .from('session_presence')
        .select('*')
        .eq('session_id', topicId)
        .order('joined_at', { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    } catch (error) {
      logger.error('Error fetching session presence', error);
      return [];
    }
  }

  // Calculate comprehensive session status
  static calculateSessionStatus(topic: any, joinRequests: JoinRequest[], sessionPresence: SessionPresence[]): { status: SessionStatus; description: string } {
    const now = new Date();
    const startTime = new Date(topic.start_time);
    const endTime = new Date(topic.end_time);
    
    const pendingRequests = joinRequests.filter(r => r.status === 'pending');
    const approvedRequests = joinRequests.filter(r => r.status === 'approved');
    const hasParticipants = topic.participants && topic.participants.length > 0;
    const activePresence = sessionPresence.filter(p => p.status === 'active');
    
    // Session has ended
    if (now > endTime) {
      if (sessionPresence.length === 0) {
        return { status: 'ended_no_show', description: 'Session ended with no participants' };
      }
      
      const sessionDuration = AdminService.getScheduledDuration(topic);
      const actualDuration = AdminService.calculateActualDuration(topic, sessionPresence);
      
      if (actualDuration < sessionDuration * 0.5) {
        return { status: 'ended_early', description: `Session ended early after ${actualDuration} minutes` };
      }
      
      return { status: 'ended_complete', description: 'Session completed successfully' };
    }
    
    // Session is currently active
    if (now >= startTime && now <= endTime) {
      if (activePresence.length > 0) {
        return { status: 'active', description: `${activePresence.length} participants active` };
      } else {
        return { status: 'waiting', description: 'Waiting for participants to join' };
      }
    }
    
    // Session is upcoming
    if (now < startTime) {
      const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (minutesUntilStart <= 30 && hasParticipants) {
        return { status: 'upcoming', description: `Starting in ${minutesUntilStart} minutes` };
      }
      
      if (hasParticipants || approvedRequests.length > 0) {
        return { status: 'approved', description: `${hasParticipants ? topic.participants.length : approvedRequests.length} participants approved` };
      }
      
      if (pendingRequests.length > 0) {
        return { status: 'has_requests', description: `${pendingRequests.length} pending requests` };
      }
      
      return { status: 'created', description: 'Waiting for join requests' };
    }
    
    return { status: 'created', description: 'Session created' };
  }

  // Calculate actual session duration based on presence data
  static calculateActualDuration(topic: any, sessionPresence: SessionPresence[]): number {
    if (sessionPresence.length === 0) return 0;
    
    const startTime = new Date(topic.start_time);
    const endTime = new Date(topic.end_time);
    const now = new Date();
    
    // Find the earliest join time and latest leave time
    const joinTimes = sessionPresence.map(p => new Date(p.joined_at));
    const leaveTimes = sessionPresence
      .filter(p => p.status === 'left')
      .map(p => new Date(p.last_seen));
    
    const earliestJoin = new Date(Math.min(...joinTimes.map(t => t.getTime())));
    const latestLeave = leaveTimes.length > 0 
      ? new Date(Math.max(...leaveTimes.map(t => t.getTime())))
      : (now > endTime ? endTime : now);
    
    // Calculate duration in minutes
    const durationMs = latestLeave.getTime() - earliestJoin.getTime();
    return Math.max(0, Math.floor(durationMs / (1000 * 60)));
  }

  // Get scheduled duration in minutes
  static getScheduledDuration(topic: any): number {
    const startTime = new Date(topic.start_time);
    const endTime = new Date(topic.end_time);
    const durationMs = endTime.getTime() - startTime.getTime();
    return Math.floor(durationMs / (1000 * 60));
  }

  // Get session status info with styling
  static getSessionStatusInfo(status: SessionStatus): { status: SessionStatus; color: string; description: string; priority: number } {
    const statusMap = {
      'created': { color: 'bg-gray-100 text-gray-800', description: 'Just created', priority: 1 },
      'has_requests': { color: 'bg-yellow-100 text-yellow-800', description: 'Has pending requests', priority: 2 },
      'approved': { color: 'bg-blue-100 text-blue-800', description: 'Participants approved', priority: 3 },
      'upcoming': { color: 'bg-indigo-100 text-indigo-800', description: 'Starting soon', priority: 4 },
      'waiting': { color: 'bg-orange-100 text-orange-800', description: 'Waiting for participants', priority: 5 },
      'active': { color: 'bg-green-100 text-green-800', description: 'Session active', priority: 6 },
      'ended_complete': { color: 'bg-emerald-100 text-emerald-800', description: 'Completed successfully', priority: 7 },
      'ended_early': { color: 'bg-amber-100 text-amber-800', description: 'Ended early', priority: 8 },
      'ended_no_show': { color: 'bg-red-100 text-red-800', description: 'No participants showed', priority: 9 },
      'cancelled': { color: 'bg-slate-100 text-slate-800', description: 'Cancelled', priority: 10 }
    };

    return {
      status,
      ...statusMap[status],
      priority: statusMap[status].priority
    };
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  static async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const [totalUsers, activeUsers, newUsersToday, topRatedUsers] = await Promise.all([
        AdminService.getTotalUserCount(),
        AdminService.getActiveUserCount(),
        AdminService.getNewUsersTodayCount(),
        AdminService.getTopRatedUsers(5)
      ]);

      // Calculate average rating across all users
      const { data: ratings } = await supabase
        .from('ratings')
        .select('politeness, relevance, problem_solved, communication, professionalism');

      let averageRating = 0;
      if (ratings && ratings.length > 0) {
        const totalRating = ratings.reduce((sum: any, rating: any) => {
          return sum + rating.politeness + rating.relevance + rating.problem_solved + 
                 rating.communication + rating.professionalism;
        }, 0);
        averageRating = totalRating / (ratings.length * 5);
      }

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        new_users_today: newUsersToday,
        user_growth_rate: 0, // TODO: Calculate actual growth rate
        average_rating: averageRating
      };
    } catch (error) {
      logger.error('Error getting user analytics', error);
      throw error;
    }
  }

  static async getTopicAnalytics(): Promise<TopicAnalytics> {
    try {
      const [totalTopics, activeTopics, totalParticipants] = await Promise.all([
        AdminService.getTotalTopicCount(),
        AdminService.getActiveTopicCount(),
        AdminService.getTotalParticipantCount()
      ]);

      // Get popular times (simplified - by hour of day)
      const { data: topics } = await supabase
        .from('topics')
        .select('start_time');

      const hourCounts = new Array(24).fill(0);
      topics?.forEach(topic => {
        const hour = new Date((topic as any).start_time).getHours();
        hourCounts[hour]++;
      });

      const popularTimes = hourCounts.map((count, hour) => ({ hour, count }));

      return {
        total_topics: totalTopics,
        active_topics: activeTopics,
        completed_topics: 0, // TODO: Calculate completed topics
        topic_completion_rate: 0, // TODO: Calculate completion rate
        total_participants: totalParticipants
      };
    } catch (error) {
      logger.error('Error getting topic analytics', error);
      throw error;
    }
  }

  static async getMessageAnalytics(): Promise<MessageAnalytics> {
    try {
      const [totalMessages, messagesToday, mostActiveTopics] = await Promise.all([
        AdminService.getTotalMessageCount(),
        AdminService.getMessagesTodayCount(),
        AdminService.getMostActiveTopics(5)
      ]);

      const averageMessagesPerTopic = totalMessages > 0 && mostActiveTopics.length > 0 
        ? totalMessages / mostActiveTopics.length 
        : 0;

      return {
        total_messages: totalMessages,
        messages_today: messagesToday,
        average_messages_per_topic: averageMessagesPerTopic,
        message_growth_rate: 0, // TODO: Calculate growth rate
        most_active_topics: mostActiveTopics.map(topic => ({
          topic_id: topic.id,
          message_count: topic.message_count || 0
        }))
      };
    } catch (error) {
      logger.error('Error getting message analytics', error);
      throw error;
    }
  }

  // Helper methods for analytics
  private static async getTotalUserCount(): Promise<number> {
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  private static async getActiveUserCount(): Promise<number> {
    // Active users are those with scheduled sessions (upcoming or recent)
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const { data: activeTopics } = await supabase
      .from('topics')
      .select('author_id, participants')
      .gte('start_time', thirtyDaysAgo.toISOString())
      .lte('start_time', thirtyDaysFromNow.toISOString());

    if (!activeTopics) return 0;

    const activeUserIds = new Set<string>();
    
    activeTopics.forEach(topic => {
      // Add topic author
      activeUserIds.add((topic as any).author_id);
      // Add participants
      if ((topic as any).participants && Array.isArray((topic as any).participants)) {
        (topic as any).participants.forEach(participantId => activeUserIds.add(participantId));
      }
    });

    return activeUserIds.size;
  }

  private static async getNewUsersTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    return count || 0;
  }

  private static async getTopRatedUsers(limit: number): Promise<UserWithStats[]> {
    // This is a simplified version - in production you'd want a more sophisticated query
    const users = await AdminService.getAllUsers(limit * 2);
    return users
      .filter(user => user.rating_stats && user.rating_stats.total_ratings > 0)
      .sort((a, b) => (b.rating_stats?.overall_average || 0) - (a.rating_stats?.overall_average || 0))
      .slice(0, limit);
  }

  private static async getTotalTopicCount(): Promise<number> {
    const { count } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  private static async getActiveTopicCount(): Promise<number> {
    const now = new Date().toISOString();
    const { count } = await supabase
      .from('topics')
      .select('*', { count: 'exact', head: true })
      .lte('start_time', now)
      .gte('end_time', now);
    return count || 0;
  }

  private static async getTotalParticipantCount(): Promise<number> {
    const { data } = await supabase
      .from('topics')
      .select('participants');
    
    return data?.reduce((total, topic) => total + ((topic as any).participants?.length || 0), 0) || 0;
  }

  private static async getTotalMessageCount(): Promise<number> {
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true });
    return count || 0;
  }

  private static async getMessagesTodayCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());
    return count || 0;
  }

  private static async getMostActiveTopics(limit: number): Promise<TopicWithDetails[]> {
    // Get topics with message counts
    const topics = await AdminService.getAllTopics(limit * 2);
    return topics
      .sort((a, b) => (b.message_count || 0) - (a.message_count || 0))
      .slice(0, limit);
  }

  // ============================================================================
  // ADMIN ROLE MANAGEMENT
  // ============================================================================

  static async grantAdminRole(userId: string, role: 'admin' | 'editor' = 'admin'): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .upsert({ user_id: userId, role } as any);

      if (error) throw error;
    } catch (error) {
      logger.error('Error granting admin role', error);
      throw error;
    }
  }

  static async revokeAdminRole(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('admin_roles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      logger.error('Error revoking admin role', error);
      throw error;
    }
  }

  static async getAllAdmins(): Promise<(AdminRole & { user: User })[]> {
    try {
      // First try with the foreign key relationship
      const { data, error } = await supabase
        .from('admin_roles')
        .select(`
          *,
          user:users(*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('Foreign key query failed, trying manual join', { error });
        
        // Fallback: Get admin roles and users separately
        const { data: adminRoles, error: adminError } = await supabase
          .from('admin_roles')
          .select('*')
          .order('created_at', { ascending: false });

        if (adminError) throw adminError;

        if (!adminRoles || adminRoles.length === 0) {
          return [];
        }

        // Get user data for each admin
        const userIds = adminRoles.map(admin => (admin as any).user_id);
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('*')
          .in('id', userIds);

        if (userError) throw userError;

        // Combine the data
        return adminRoles.map(admin => ({
          ...(admin as any),
          user: users?.find(user => (user as any).id === (admin as any).user_id) || null
        })).filter(admin => admin.user !== null);
      }

      return (data || []) as any[];
    } catch (error) {
      logger.error('Error fetching admins', error);
      // Return empty array instead of throwing to prevent page crashes
      return [];
    }
  }

  // ============================================================================
  // ENHANCED SEARCH FUNCTIONALITY
  // ============================================================================

  static async searchUsersAdvanced(query: string, limit = 50): Promise<UserWithStats[]> {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select(`
          *,
          topic_count:topics(count),
          message_count:messages(count)
        `)
        .or(`display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone_number.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get rating stats for each user
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const ratingStats = await AdminService.getUserRatingStats((user as any).id);
          return {
            ...(user as any),
            topic_count: (user as any).topic_count?.[0]?.count || 0,
            message_count: (user as any).message_count?.[0]?.count || 0,
            rating_stats: ratingStats
          };
        })
      );

      return usersWithStats;
    } catch (error) {
      logger.error('Error searching users', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS DATA FOR CHARTS
  // ============================================================================

  static async getUserGrowthData(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('users')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData: DailyDataEntry = {};
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = 0;
      }

      data?.forEach((user: DatabaseUser) => {
        const dateStr = user.created_at.split('T')[0];
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr]++;
        }
      });

      return Object.entries(dailyData).map(([date, count]) => ({
        date,
        users: count,
        cumulative: Object.entries(dailyData)
          .filter(([d]) => d <= date)
          .reduce((sum, [, c]) => sum + (c as number), 0)
      }));
    } catch (error) {
      logger.error('Error getting user growth data', error);
      return [];
    }
  }

  static async getSessionActivityData(days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('topics')
        .select('created_at, start_time, participants')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group by day
      const dailyData: SessionActivityEntry = {};
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        dailyData[dateStr] = { sessions: 0, participants: 0 };
      }

      data?.forEach((topic: any) => {
        const dateStr = topic.created_at.split('T')[0];
        if (dailyData[dateStr] !== undefined) {
          dailyData[dateStr].sessions++;
          dailyData[dateStr].participants += topic.participants?.length || 0;
        }
      });

      return Object.entries(dailyData).map(([date, data]) => ({
        date,
        sessions: data.sessions,
        participants: data.participants
      }));
    } catch (error) {
      logger.error('Error getting session activity data', error);
      return [];
    }
  }

  static async getEngagementMetricsData() {
    try {
      const users = await AdminService.getAllUsers(100);
      const engagementLevels = { High: 0, Medium: 0, Low: 0 };
      
      for (const user of users) {
        const metrics = await AdminService.getUserEngagementMetrics(user.id);
        if (metrics) {
          engagementLevels[metrics.engagement_level]++;
        }
      }

      return Object.entries(engagementLevels).map(([level, count]) => ({
        level,
        count,
        percentage: users.length > 0 ? Math.round((count / users.length) * 100) : 0
      }));
    } catch (error) {
      logger.error('Error getting engagement metrics data', error);
      return [];
    }
  }

  static async getTopicCategoriesData() {
    try {
      const { data, error } = await supabase
        .from('topics')
        .select('title, description');

      if (error) throw error;

      // Simple categorization based on keywords in title/description
      const categories = {
        'Tech & Programming': 0,
        'Career & Business': 0,
        'Health & Wellness': 0,
        'Education & Learning': 0,
        'Social & Networking': 0,
        'Other': 0
      };

      data?.forEach((topic: any) => {
        const text = `${topic.title || ''} ${topic.description || ''}`.toLowerCase();
        
        if (text.includes('tech') || text.includes('programming') || text.includes('code') || text.includes('software')) {
          categories['Tech & Programming']++;
        } else if (text.includes('career') || text.includes('business') || text.includes('job') || text.includes('work')) {
          categories['Career & Business']++;
        } else if (text.includes('health') || text.includes('wellness') || text.includes('fitness') || text.includes('mental')) {
          categories['Health & Wellness']++;
        } else if (text.includes('education') || text.includes('learning') || text.includes('study') || text.includes('school')) {
          categories['Education & Learning']++;
        } else if (text.includes('social') || text.includes('network') || text.includes('community') || text.includes('friends')) {
          categories['Social & Networking']++;
        } else {
          categories['Other']++;
        }
      });

      return Object.entries(categories).map(([category, count]) => ({
        category,
        count,
        percentage: data?.length > 0 ? Math.round((count / data.length) * 100) : 0
      }));
    } catch (error) {
      logger.error('Error getting topic categories data', error);
      return [];
    }
  }

  // ============================================================================
  // EXPORT FUNCTIONALITY
  // ============================================================================

  static async exportUserData(format: 'csv' | 'json' = 'csv') {
    try {
      const users = await AdminService.getAllUsers(1000); // Get more users for export
      
      if (format === 'csv') {
        const headers = [
          'ID', 'Email', 'Display Name', 'First Name', 'Last Name', 
          'Phone', 'Country', 'Created At', 'Topics Created', 'Messages Sent',
          'Average Rating', 'Total Ratings', 'Phone Verified'
        ];
        
        const csvData = users.map(user => [
          user.id,
          user.email,
          user.display_name || '',
          user.first_name || '',
          user.last_name || '',
          user.phone_number || '',
          user.country || '',
          user.created_at,
          user.topic_count || 0,
          user.message_count || 0,
          user.rating_stats?.overall_average?.toFixed(2) || '0.00',
          user.rating_stats?.total_ratings || 0,
          user.phone_verified ? 'Yes' : 'No'
        ]);

        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        return {
          content: csvContent,
          filename: `harthio-users-${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        return {
          content: JSON.stringify(users, null, 2),
          filename: `harthio-users-${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      }
    } catch (error) {
      logger.error('Error exporting user data', error);
      throw error;
    }
  }

  static async exportAnalyticsReport(format: 'csv' | 'json' = 'csv') {
    try {
      const [userAnalytics, topicAnalytics, messageAnalytics, userGrowth, sessionActivity] = await Promise.all([
        AdminService.getUserAnalytics(),
        AdminService.getTopicAnalytics(),
        AdminService.getMessageAnalytics(),
        AdminService.getUserGrowthData(30),
        AdminService.getSessionActivityData(30)
      ]);

      const report = {
        generated_at: new Date().toISOString(),
        summary: {
          total_users: userAnalytics.total_users,
          active_users: userAnalytics.active_users,
          total_sessions: topicAnalytics.total_topics,
          active_sessions: topicAnalytics.active_topics,
          total_messages: messageAnalytics.total_messages,
          average_rating: userAnalytics.average_rating
        },
        user_growth: userGrowth,
        session_activity: sessionActivity,
        detailed_analytics: {
          user_analytics: userAnalytics,
          topic_analytics: topicAnalytics,
          message_analytics: messageAnalytics
        }
      };

      if (format === 'csv') {
        // Create a simplified CSV version
        const headers = ['Metric', 'Value'];
        const csvData = [
          ['Total Users', userAnalytics.total_users],
          ['Active Users', userAnalytics.active_users],
          ['New Users Today', userAnalytics.new_users_today],
          ['Total Sessions', topicAnalytics.total_topics],
          ['Active Sessions', topicAnalytics.active_topics],
          ['Total Messages', messageAnalytics.total_messages],
          ['Messages Today', messageAnalytics.messages_today],
          ['Average Rating', userAnalytics.average_rating?.toFixed(2) || 'N/A']
        ];

        const csvContent = [headers, ...csvData]
          .map(row => row.map(field => `"${field}"`).join(','))
          .join('\n');

        return {
          content: csvContent,
          filename: `harthio-analytics-${new Date().toISOString().split('T')[0]}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        return {
          content: JSON.stringify(report, null, 2),
          filename: `harthio-analytics-${new Date().toISOString().split('T')[0]}.json`,
          mimeType: 'application/json'
        };
      }
    } catch (error) {
      logger.error('Error exporting analytics report', error);
      throw error;
    }
  }

  // Export session data
  static async exportSessionData(format: 'csv' | 'json' = 'csv') {
    try {
      const sessions = await AdminService.getAllTopics(1000);
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const headers = [
          'ID', 'Title', 'Description', 'Author', 'Start Time', 'End Time', 
          'Participants', 'Messages', 'Status', 'Created At'
        ];
        
        const rows = sessions.map(session => [
          session.id,
          `"${session.title.replace(/"/g, '""')}"`,
          `"${session.description.replace(/"/g, '""')}"`,
          session.author?.display_name || session.author?.email || 'Unknown',
          session.start_time,
          session.end_time,
          session.participant_count || 0,
          session.message_count || 0,
          AdminService.getSessionStatus(session.start_time, session.end_time),
          session.created_at
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        return {
          content: csvContent,
          filename: `harthio-sessions-${timestamp}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        const jsonContent = JSON.stringify(sessions, null, 2);
        return {
          content: jsonContent,
          filename: `harthio-sessions-${timestamp}.json`,
          mimeType: 'application/json'
        };
      }
    } catch (error) {
      logger.error('Error exporting session data', error);
      throw error;
    }
  }

  // Export device analytics data
  static async exportDeviceData(format: 'csv' | 'json' = 'csv') {
    try {
      const { data: deviceData, error } = await supabase
        .from('device_analytics')
        .select('*')
        .order('total_sessions', { ascending: false });

      if (error) throw error;

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const headers = [
          'Device Type', 'Browser', 'Operating System', 'Country', 
          'Unique Users', 'Total Sessions', 'Avg Session Duration', 
          'Sessions Last 7 Days', 'Sessions Last 30 Days'
        ];
        
        const rows = (deviceData || []).map(device => [
          (device as any).device_type || 'Unknown',
          (device as any).browser || 'Unknown',
          (device as any).operating_system || 'Unknown',
          (device as any).country || 'Unknown',
          (device as any).unique_users || 0,
          (device as any).total_sessions || 0,
          Math.round((device as any).avg_session_duration || 0),
          (device as any).sessions_last_7_days || 0,
          (device as any).sessions_last_30_days || 0
        ]);
        
        const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        
        return {
          content: csvContent,
          filename: `harthio-device-analytics-${timestamp}.csv`,
          mimeType: 'text/csv'
        };
      } else {
        const jsonContent = JSON.stringify(deviceData, null, 2);
        return {
          content: jsonContent,
          filename: `harthio-device-analytics-${timestamp}.json`,
          mimeType: 'application/json'
        };
      }
    } catch (error) {
      logger.error('Error exporting device data', error);
      throw error;
    }
  }

  // Helper function to get session status
  private static getSessionStatus(startTime: string, endTime: string): string {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (now < start) return 'upcoming';
    if (now >= start && now <= end) return 'active';
    return 'ended';
  }

  // Helper function to trigger download in browser
  static downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Get user engagement metrics
  static async getUserEngagementMetrics(userId: string): Promise<{ engagement_level: 'High' | 'Medium' | 'Low' } | null> {
    try {
      // Try to get from user_footprints view first
      const { data, error } = await supabase
        .from('user_footprints')
        .select('engagement_level')
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        return { engagement_level: (data as any).engagement_level };
      }

      // If view doesn't work, return a default engagement level
      logger.warn('user_footprints view not available, using default engagement level');
      return { engagement_level: 'Medium' };

    } catch (error) {
      logger.warn('Error fetching user engagement metrics', error);
      // Return a default engagement level as fallback
      return { engagement_level: 'Medium' };
    }
  }

  // ============================================================================
  // USER FOOTPRINT & DEVICE TRACKING
  // ============================================================================

  static async getUserFootprintDetailed(userId: string) {
    try {
      const [
        userProfile,
        sessionHistory,
        deviceHistory,
        locationHistory
      ] = await Promise.all([
        AdminService.getUserById(userId),
        AdminService.getUserSessionHistory(userId),
        AdminService.getUserDeviceHistory(userId),
        AdminService.getUserLocationHistory(userId)
      ]);

      // Calculate footprint metrics
      const uniqueDevices = AdminService.getUniqueDevices(deviceHistory);
      const uniqueLocations = AdminService.getUniqueLocations(locationHistory);
      const mostUsedDevice = AdminService.getMostUsedDevice(deviceHistory);
      const mostCommonLocation = AdminService.getMostCommonLocation(locationHistory);

      return {
        user_id: userId,
        profile: userProfile,
        total_sessions: sessionHistory.length,
        unique_devices: uniqueDevices.length,
        unique_locations: uniqueLocations.length,
        first_seen: sessionHistory.length > 0 ? sessionHistory[sessionHistory.length - 1].created_at : null,
        last_seen: sessionHistory.length > 0 ? sessionHistory[0].created_at : null,
        most_used_device: mostUsedDevice,
        most_common_location: mostCommonLocation,
        session_history: sessionHistory.slice(0, 20), // Last 20 sessions
        device_history: uniqueDevices,
        location_history: uniqueLocations
      };
    } catch (error) {
      logger.error('Error getting detailed user footprint', error);
      throw error;
    }
  }

  static async getUserSessionHistory(userId: string) {
    // For now, we'll simulate session history based on user activity
    // In production, you'd have a dedicated user_sessions table
    try {
      const [topics, messages, ratings] = await Promise.all([
        supabase.from('topics').select('created_at').eq('author_id', userId).order('created_at', { ascending: false }),
        supabase.from('messages').select('created_at').eq('sender_id', userId).order('created_at', { ascending: false }),
        supabase.from('ratings').select('created_at').eq('rater_id', userId).order('created_at', { ascending: false })
      ]);

      // Combine all activities to simulate sessions
      const activities = [
        ...(topics.data || []).map(t => ({ ...(t as any), type: 'topic' })),
        ...(messages.data || []).map(m => ({ ...(m as any), type: 'message' })),
        ...(ratings.data || []).map(r => ({ ...(r as any), type: 'rating' }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Simulate session data with device info
      return activities.map((activity, index) => ({
        id: `session-${index}`,
        user_id: userId,
        created_at: activity.created_at,
        device_info: this.generateMockDeviceInfo(),
        location_info: this.generateMockLocationInfo(),
        activity_type: activity.type
      }));
    } catch (error) {
      logger.error('Error getting user session history', error);
      return [];
    }
  }

  static async getUserDeviceHistory(userId: string) {
    // Simulate device history - in production, track actual device fingerprints
    const sessionHistory = await AdminService.getUserSessionHistory(userId);
    return sessionHistory.map(session => session.device_info);
  }

  static async getUserLocationHistory(userId: string) {
    // Simulate location history - in production, use IP geolocation
    const sessionHistory = await AdminService.getUserSessionHistory(userId);
    return sessionHistory.map(session => session.location_info).filter(Boolean);
  }

  private static generateMockDeviceInfo() {
    const browsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    const os = ['Windows', 'macOS', 'Linux', 'iOS', 'Android'];
    const deviceTypes = ['desktop', 'mobile', 'tablet'];
    
    const selectedBrowser = browsers[Math.floor(Math.random() * browsers.length)];
    const selectedOS = os[Math.floor(Math.random() * os.length)];
    const selectedDeviceType = deviceTypes[Math.floor(Math.random() * deviceTypes.length)];

    return {
      browser: selectedBrowser,
      browser_version: `${Math.floor(Math.random() * 20) + 90}.0`,
      os: selectedOS,
      os_version: selectedOS === 'Windows' ? '11' : selectedOS === 'macOS' ? '14.0' : '15.0',
      device_type: selectedDeviceType,
      screen_resolution: selectedDeviceType === 'mobile' ? '390x844' : '1920x1080',
      timezone: 'America/New_York',
      language: 'en-US'
    };
  }

  private static generateMockLocationInfo() {
    const locations = [
      { country: 'United States', country_code: 'US', city: 'New York', region: 'NY' },
      { country: 'Canada', country_code: 'CA', city: 'Toronto', region: 'ON' },
      { country: 'United Kingdom', country_code: 'GB', city: 'London', region: 'England' },
      { country: 'Germany', country_code: 'DE', city: 'Berlin', region: 'Berlin' },
      { country: 'Australia', country_code: 'AU', city: 'Sydney', region: 'NSW' }
    ];

    return locations[Math.floor(Math.random() * locations.length)];
  }

  private static getUniqueDevices(deviceHistory: any[]) {
    const unique = new Map();
    deviceHistory.forEach(device => {
      const key = `${device.browser}-${device.os}-${device.device_type}`;
      if (!unique.has(key)) {
        unique.set(key, device);
      }
    });
    return Array.from(unique.values());
  }

  private static getUniqueLocations(locationHistory: any[]) {
    const unique = new Map();
    locationHistory.forEach(location => {
      const key = `${location.country_code}-${location.city}`;
      if (!unique.has(key)) {
        unique.set(key, location);
      }
    });
    return Array.from(unique.values());
  }

  private static getMostUsedDevice(deviceHistory: any[]) {
    const deviceCounts = new Map();
    deviceHistory.forEach(device => {
      const key = `${device.browser} on ${device.os}`;
      deviceCounts.set(key, (deviceCounts.get(key) || 0) + 1);
    });

    let mostUsed = null;
    let maxCount = 0;
    for (const [key, count] of deviceCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = deviceHistory.find(d => `${d.browser} on ${d.os}` === key);
      }
    }

    return mostUsed || (deviceHistory.length > 0 ? deviceHistory[0] : null);
  }

  private static getMostCommonLocation(locationHistory: any[]) {
    const locationCounts = new Map();
    locationHistory.forEach(location => {
      const key = `${location.city}, ${location.country}`;
      locationCounts.set(key, (locationCounts.get(key) || 0) + 1);
    });

    let mostCommon = null;
    let maxCount = 0;
    for (const [key, count] of locationCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommon = locationHistory.find(l => `${l.city}, ${l.country}` === key);
      }
    }

    return mostCommon || (locationHistory.length > 0 ? locationHistory[0] : null);
  }

  // ============================================================================
  // FILTERED DATA RETRIEVAL
  // ============================================================================

  static async getFilteredUsers(filters: any, limit = 50, offset = 0): Promise<any[]> {
    try {
      let query = supabase
        .from('users')
        .select(`
          *,
          topic_count:topics(count),
          message_count:messages(count)
        `);

      // Apply filters
      if (filters.country) {
        query = query.eq('country', filters.country);
      }

      if (filters.phone_verified !== undefined) {
        query = query.eq('phone_verified', filters.phone_verified);
      }

      if (filters.date_from) {
        query = query.gte('created_at', filters.date_from);
      }

      if (filters.date_to) {
        query = query.lte('created_at', filters.date_to);
      }

      if (filters.search_query) {
        query = query.or(`display_name.ilike.%${filters.search_query}%,first_name.ilike.%${filters.search_query}%,last_name.ilike.%${filters.search_query}%,email.ilike.%${filters.search_query}%,phone_number.ilike.%${filters.search_query}%`);
      }

      const { data: users, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get rating stats and apply rating/engagement filters
      const usersWithStats = await Promise.all(
        users.map(async (user) => {
          const ratingStats = await AdminService.getUserRatingStats((user as any).id);
          const engagementMetrics = await AdminService.getUserEngagementMetrics((user as any).id);
          
          return {
            ...(user as any),
            topic_count: (user as any).topic_count?.[0]?.count || 0,
            message_count: (user as any).message_count?.[0]?.count || 0,
            rating_stats: ratingStats,
            engagement_metrics: engagementMetrics
          };
        })
      );

      // Apply post-processing filters
      let filteredUsers = usersWithStats;

      if (filters.min_rating) {
        filteredUsers = filteredUsers.filter(user => 
          user.rating_stats?.overall_average >= filters.min_rating
        );
      }

      if (filters.max_rating) {
        filteredUsers = filteredUsers.filter(user => 
          user.rating_stats?.overall_average <= filters.max_rating
        );
      }

      if (filters.engagement_level) {
        filteredUsers = filteredUsers.filter(user => 
          user.engagement_metrics?.engagement_level === filters.engagement_level
        );
      }

      if (filters.min_topics) {
        filteredUsers = filteredUsers.filter(user => 
          user.topic_count >= filters.min_topics
        );
      }

      if (filters.min_messages) {
        filteredUsers = filteredUsers.filter(user => 
          user.message_count >= filters.min_messages
        );
      }

      return filteredUsers;
    } catch (error) {
      logger.error('Error getting filtered users', error);
      throw error;
    }
  }

  static async getFilteredTopics(filters: any, limit = 50, offset = 0): Promise<any[]> {
    try {
      let query = supabase
        .from('topics')
        .select(`
          *,
          author:users!topics_author_id_fkey(id, display_name, first_name, last_name, avatar_url)
        `);

      // Apply filters
      if (filters.author_id) {
        query = query.eq('author_id', filters.author_id);
      }

      if (filters.start_date) {
        query = query.gte('start_time', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('start_time', filters.end_date);
      }

      if (filters.search_query) {
        query = query.or(`title.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Get additional stats and apply post-processing filters
      const topicsWithDetails = await Promise.all(
        (data as any[]).map(async (topic: any) => {
          const [messageCount, participantCount] = await Promise.all([
            AdminService.getTopicMessageCount(topic.id),
            (topic as any).participants?.length || 0
          ]);

          return {
            ...(topic as any),
            message_count: messageCount,
            participant_count: participantCount
          };
        })
      );

      let filteredTopics = topicsWithDetails;

      // Apply status filter
      if (filters.status) {
        const now = new Date();
        filteredTopics = filteredTopics.filter(topic => {
          const startTime = new Date(topic.start_time);
          const endTime = new Date(topic.end_time);
          
          switch (filters.status) {
            case 'upcoming':
              return startTime > now;
            case 'active':
              return startTime <= now && endTime >= now;
            case 'ended':
              return endTime < now;
            default:
              return true;
          }
        });
      }

      // Apply participant filters
      if (filters.min_participants) {
        filteredTopics = filteredTopics.filter(topic => 
          topic.participant_count >= filters.min_participants
        );
      }

      if (filters.max_participants) {
        filteredTopics = filteredTopics.filter(topic => 
          topic.participant_count <= filters.max_participants
        );
      }

      // Apply category filter (simple keyword matching)
      if (filters.category) {
        filteredTopics = filteredTopics.filter(topic => {
          const text = `${topic.title || ''} ${topic.description || ''}`.toLowerCase();
          const category = filters.category.toLowerCase();
          
          if (category.includes('tech')) {
            return text.includes('tech') || text.includes('programming') || text.includes('code');
          } else if (category.includes('career')) {
            return text.includes('career') || text.includes('business') || text.includes('job');
          } else if (category.includes('health')) {
            return text.includes('health') || text.includes('wellness') || text.includes('fitness');
          } else if (category.includes('education')) {
            return text.includes('education') || text.includes('learning') || text.includes('study');
          } else if (category.includes('social')) {
            return text.includes('social') || text.includes('network') || text.includes('community');
          }
          
          return true;
        });
      }

      return filteredTopics;
    } catch (error) {
      logger.error('Error getting filtered topics', error);
      throw error;
    }
  }

  static async getAnalyticsWithFilters(filters: any) {
    try {
      const dateFrom = filters.date_from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dateTo = filters.date_to || new Date().toISOString().split('T')[0];

      const [userGrowth, sessionActivity, engagementMetrics] = await Promise.all([
        AdminService.getUserGrowthDataFiltered(dateFrom, dateTo, filters),
        AdminService.getSessionActivityDataFiltered(dateFrom, dateTo, filters),
        this.getEngagementMetricsDataFiltered(filters)
      ]);

      return {
        userGrowth,
        sessionActivity,
        engagementMetrics,
        dateRange: { from: dateFrom, to: dateTo }
      };
    } catch (error) {
      logger.error('Error getting filtered analytics', error);
      throw error;
    }
  }

  private static async getUserGrowthDataFiltered(dateFrom: string, dateTo: string, filters: any) {
    // Implementation similar to getUserGrowthData but with filters
    return AdminService.getUserGrowthData(30); // Simplified for now
  }

  private static async getSessionActivityDataFiltered(dateFrom: string, dateTo: string, filters: any) {
    // Implementation similar to getSessionActivityData but with filters
    return AdminService.getSessionActivityData(30); // Simplified for now
  }

  private static async getEngagementMetricsDataFiltered(filters: any) {
    // Implementation similar to getEngagementMetricsData but with filters
    return this.getEngagementMetricsData(); // Simplified for now
  }
}
