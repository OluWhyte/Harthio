// AI Personalization Service
// Manages user preferences and learning for personalized AI responses

import { supabase } from '@/lib/supabase';

export interface UserPreferences {
  id: string;
  user_id: string;
  preferred_tone: 'casual' | 'supportive' | 'direct' | 'empathetic';
  preferred_response_length: 'brief' | 'medium' | 'detailed';
  effective_techniques: string[];
  trigger_topics: string[];
  prefers_questions: boolean;
  prefers_direct_advice: boolean;
  check_in_frequency: 'daily' | 'weekly' | 'as_needed';
  positive_response_patterns: any[];
  negative_response_patterns: any[];
  created_at: string;
  updated_at: string;
}

export class AIPersonalizationService {
  /**
   * Get user preferences (creates default if doesn't exist)
   */
  static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
    try {
      if (!supabase) return null;

      // Try to get existing preferences
      const { data, error } = await supabase
        .from('ai_user_preferences' as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // No preferences found, create default
        const { data: newPrefs, error: insertError } = await supabase
          .from('ai_user_preferences' as any)
          .insert({ user_id: userId })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating preferences:', insertError);
          return null;
        }

        return newPrefs as any;
      }

      if (error) {
        console.error('Error fetching preferences:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Error in getUserPreferences:', error);
      return null;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string,
    updates: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<boolean> {
    try {
      if (!supabase) return false;

      const { error } = await supabase
        .from('ai_user_preferences' as any)
        .update(updates as any)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating preferences:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return false;
    }
  }

  /**
   * Record that a technique was effective for this user
   */
  static async recordEffectiveTechnique(userId: string, technique: string): Promise<void> {
    try {
      if (!supabase) return;

      const prefs = await this.getUserPreferences(userId);
      if (!prefs) return;

      const techniques = prefs.effective_techniques || [];
      if (!techniques.includes(technique)) {
        techniques.push(technique);
        await this.updatePreferences(userId, { effective_techniques: techniques });
      }
    } catch (error) {
      console.error('Error recording effective technique:', error);
    }
  }

  /**
   * Record a trigger topic for this user
   */
  static async recordTriggerTopic(userId: string, topic: string): Promise<void> {
    try {
      if (!supabase) return;

      const prefs = await this.getUserPreferences(userId);
      if (!prefs) return;

      const topics = prefs.trigger_topics || [];
      if (!topics.includes(topic)) {
        topics.push(topic);
        await this.updatePreferences(userId, { trigger_topics: topics });
      }
    } catch (error) {
      console.error('Error recording trigger topic:', error);
    }
  }

  /**
   * Learn from user feedback
   */
  static async learnFromFeedback(
    userId: string,
    messageContent: string,
    isPositive: boolean
  ): Promise<void> {
    try {
      if (!supabase) return;

      const prefs = await this.getUserPreferences(userId);
      if (!prefs) return;

      // Extract patterns from the message
      const patterns = this.extractPatterns(messageContent);

      if (isPositive) {
        const positive = prefs.positive_response_patterns || [];
        positive.push({ patterns, timestamp: new Date().toISOString() });
        await this.updatePreferences(userId, { 
          positive_response_patterns: positive.slice(-20) // Keep last 20
        });
      } else {
        const negative = prefs.negative_response_patterns || [];
        negative.push({ patterns, timestamp: new Date().toISOString() });
        await this.updatePreferences(userId, { 
          negative_response_patterns: negative.slice(-20) // Keep last 20
        });
      }
    } catch (error) {
      console.error('Error learning from feedback:', error);
    }
  }

  /**
   * Extract patterns from message for learning
   */
  private static extractPatterns(message: string): any {
    const lowerMessage = message.toLowerCase();
    
    return {
      length: message.length,
      hasQuestion: message.includes('?'),
      hasEmoji: /[\u{1F300}-\u{1F9FF}]/u.test(message),
      tone: this.detectTone(lowerMessage),
      startsWithQuestion: lowerMessage.trim().startsWith('what') || 
                         lowerMessage.trim().startsWith('how') ||
                         lowerMessage.trim().startsWith('why'),
    };
  }

  /**
   * Detect tone of message
   */
  private static detectTone(message: string): string {
    if (message.includes('damn') || message.includes('hell')) return 'casual';
    if (message.includes('understand') || message.includes('hear you')) return 'empathetic';
    if (message.includes('try') || message.includes('let\'s')) return 'supportive';
    return 'direct';
  }

  /**
   * Generate personalization prompt based on user preferences
   */
  static async getPersonalizationPrompt(userId: string): Promise<string> {
    try {
      const prefs = await this.getUserPreferences(userId);
      if (!prefs) return '';

      let prompt = '\nPERSONALIZATION:\n';

      // Tone preference
      prompt += `Tone: ${prefs.preferred_tone}\n`;

      // Response length
      const lengthMap = {
        brief: '1-2 sentences',
        medium: '2-3 sentences',
        detailed: '3-5 sentences'
      };
      prompt += `Length: ${lengthMap[prefs.preferred_response_length]}\n`;

      // Effective techniques
      if (prefs.effective_techniques.length > 0) {
        prompt += `Effective for user: ${prefs.effective_techniques.join(', ')}\n`;
      }

      // Trigger topics
      if (prefs.trigger_topics.length > 0) {
        prompt += `Handle carefully: ${prefs.trigger_topics.join(', ')}\n`;
      }

      // Conversation style
      if (prefs.prefers_direct_advice) {
        prompt += 'User prefers: Direct advice over exploration\n';
      } else if (prefs.prefers_questions) {
        prompt += 'User prefers: Questions to explore feelings\n';
      }

      return prompt;
    } catch (error) {
      console.error('Error generating personalization prompt:', error);
      return '';
    }
  }
}
