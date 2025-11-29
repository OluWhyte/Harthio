// AI Feedback Service
// Handles user feedback on AI responses (thumbs up/down)

import { supabase } from '@/lib/supabase';

export type FeedbackType = 'positive' | 'negative';
export type FeedbackReason = 'not_helpful' | 'incorrect' | 'misunderstood' | 'inappropriate' | 'other';

export interface AIFeedback {
  id: string;
  user_id: string;
  message_id: string;
  user_message: string;
  ai_response: string;
  feedback_type: FeedbackType;
  reason?: FeedbackReason;
  reason_details?: string;
  created_at: string;
}

export interface CreateFeedbackParams {
  userId: string;
  messageId: string;
  userMessage: string;
  aiResponse: string;
  feedbackType: FeedbackType;
  reason?: FeedbackReason;
  reasonDetails?: string;
}

export const aiFeedbackService = {
  /**
   * Submit feedback on an AI response
   */
  async submitFeedback(params: CreateFeedbackParams): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .insert({
          user_id: params.userId,
          message_id: params.messageId,
          user_message: params.userMessage,
          ai_response: params.aiResponse,
          feedback_type: params.feedbackType,
          reason: params.reason,
          reason_details: params.reasonDetails,
        })
        .select()
        .single();

      if (error) {
        console.error('Error submitting AI feedback:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting AI feedback:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's feedback history
   */
  async getUserFeedback(userId: string): Promise<AIFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user feedback:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user feedback:', error);
      return [];
    }
  },

  /**
   * Get feedback statistics for a user
   */
  async getFeedbackStats(userId: string): Promise<{
    total: number;
    positive: number;
    negative: number;
    satisfactionRate: number;
  }> {
    try {
      const feedback = await this.getUserFeedback(userId);
      
      const total = feedback.length;
      const positive = feedback.filter(f => f.feedback_type === 'positive').length;
      const negative = feedback.filter(f => f.feedback_type === 'negative').length;
      const satisfactionRate = total > 0 ? (positive / total) * 100 : 0;

      return {
        total,
        positive,
        negative,
        satisfactionRate: Math.round(satisfactionRate),
      };
    } catch (error) {
      console.error('Error calculating feedback stats:', error);
      return {
        total: 0,
        positive: 0,
        negative: 0,
        satisfactionRate: 0,
      };
    }
  },

  /**
   * Check if user has already given feedback for a message
   */
  async hasFeedback(userId: string, messageId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ai_feedback')
        .select('id')
        .eq('user_id', userId)
        .eq('message_id', messageId)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  },
};
