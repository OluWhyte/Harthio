// ============================================================================
// ADMIN SERVICE
// ============================================================================
// Comprehensive admin service for managing users, sessions, analytics, and more
// Provides full admin functionality with real data from the database

import { supabase } from '@/lib/supabase';
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
      return data?.role === 'admin' || data?.role === 'editor';
    } catch (error) {
      console.error('Error checking admin status:', error);
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
      return data?.role || null;
    } catch (error) {
      console.error('Error getting user role:', error);
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
          const ratingStats = await this.getUserRatingStats(user.id);
          return {
            ...user,
            topic_count: user.topic_count?.[0]?.count || 0,
            message_count: user.message_count?.[0]?.count || 0,
            rating_stats: ratingStats
          };
        })
      );

      return usersWithStats;
    } catch (error) {
      console.error('Error fetching users:', error);
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
        this.getUserTopicCount(userId),
        this.getUserMessageCount(userId),
        this.getUserRatingStats(userId)
      ]);

      return {
        ...user,
        topic_count: topicCount,
        message_count: messageCount,
        rating_stats: ratingStats
      };
    } catch (error) {
      console.error('Error fetching user:', error);
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
      return data || [];
    } catch (error) {
      console.error('Error searching users:', error);
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
      console.error('Error getting user topic count:', error);
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
      console.error('Error getting user message count:', error);
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

      const totals = data.reduce((acc, rating) => ({
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
      console.error('Error getting user rating stats:', error);
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

      // Get additional stats for each topic
      const topicsWithDetails = await Promise.all(
        data.map(async (topic) => {
          const [messageCount, participantCount] = await Promise.all([
            this.getTopicMessageCount(topic.id),
            topic.participants?.length || 0
          ]);

          return {
            ...topic,
            message_count: messageCount,
            participant_count: participantCount
          };
        })
      );

      return topicsWithDetails;
    } catch (error) {
      console.error('Error fetching topics:', error);
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
      console.error('Error getting topic message count:', error);
      return 0;
    }
  }

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
          const [messageCount, participantCount] = await Promise.all([
            this.getTopicMessageCount(topic.id),
            topic.participants?.length || 0
          ]);

          return {
            ...topic,
            message_count: messageCount,
            participant_count: participantCount
          };
        })
      );

      return topicsWithDetails;
    } catch (error) {
      console.error('Error fetching active topics:', error);
      throw error;
    }
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  static async getUserAnalytics(): Promise<UserAnalytics> {
    try {
      const [totalUsers, activeUsers, newUsersToday, topRatedUsers] = await Promise.all([
        this.getTotalUserCount(),
        this.getActiveUserCount(),
        this.getNewUsersTodayCount(),
        this.getTopRatedUsers(5)
      ]);

      // Calculate average rating across all users
      const { data: ratings } = await supabase
        .from('ratings')
        .select('politeness, relevance, problem_solved, communication, professionalism');

      let averageRating = 0;
      if (ratings && ratings.length > 0) {
        const totalRating = ratings.reduce((sum, rating) => {
          return sum + rating.politeness + rating.relevance + rating.problem_solved + 
                 rating.communication + rating.professionalism;
        }, 0);
        averageRating = totalRating / (ratings.length * 5);
      }

      return {
        total_users: totalUsers,
        active_users: activeUsers,
        new_users_today: newUsersToday,
        average_rating: averageRating,
        top_rated_users: topRatedUsers
      };
    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw error;
    }
  }

  static async getTopicAnalytics(): Promise<TopicAnalytics> {
    try {
      const [totalTopics, activeTopics, totalParticipants] = await Promise.all([
        this.getTotalTopicCount(),
        this.getActiveTopicCount(),
        this.getTotalParticipantCount()
      ]);

      // Get popular times (simplified - by hour of day)
      const { data: topics } = await supabase
        .from('topics')
        .select('start_time');

      const hourCounts = new Array(24).fill(0);
      topics?.forEach(topic => {
        const hour = new Date(topic.start_time).getHours();
        hourCounts[hour]++;
      });

      const popularTimes = hourCounts.map((count, hour) => ({ hour, count }));

      return {
        total_topics: totalTopics,
        active_topics: activeTopics,
        total_participants: totalParticipants,
        average_duration: 60, // TODO: Calculate actual average duration
        popular_times: popularTimes
      };
    } catch (error) {
      console.error('Error getting topic analytics:', error);
      throw error;
    }
  }

  static async getMessageAnalytics(): Promise<MessageAnalytics> {
    try {
      const [totalMessages, messagesToday, mostActiveTopics] = await Promise.all([
        this.getTotalMessageCount(),
        this.getMessagesTodayCount(),
        this.getMostActiveTopics(5)
      ]);

      const averageMessagesPerTopic = totalMessages > 0 && mostActiveTopics.length > 0 
        ? totalMessages / mostActiveTopics.length 
        : 0;

      return {
        total_messages: totalMessages,
        messages_today: messagesToday,
        average_messages_per_topic: averageMessagesPerTopic,
        most_active_topics: mostActiveTopics
      };
    } catch (error) {
      console.error('Error getting message analytics:', error);
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
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString());
    return count || 0;
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
    const users = await this.getAllUsers(limit * 2);
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
    
    return data?.reduce((total, topic) => total + (topic.participants?.length || 0), 0) || 0;
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
    const topics = await this.getAllTopics(limit * 2);
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
        .upsert({ user_id: userId, role });

      if (error) throw error;
    } catch (error) {
      console.error('Error granting admin role:', error);
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
      console.error('Error revoking admin role:', error);
      throw error;
    }
  }

  static async getAllAdmins(): Promise<(AdminRole & { user: User })[]> {
    try {
      const { data, error } = await supabase
        .from('admin_roles')
        .select(`
          *,
          user:users!admin_roles_user_id_fkey(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching admins:', error);
      throw error;
    }
  }
}