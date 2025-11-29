import { supabase } from '@/lib/supabase';

export interface ChatHistoryMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  cbt_flow?: string | null;
  is_crisis?: boolean;
}

export const aiChatHistoryService = {
  /**
   * Save a message to chat history
   */
  async saveMessage(
    userId: string,
    role: 'user' | 'assistant',
    content: string,
    metadata?: {
      cbtFlow?: string;
      isCrisis?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .insert({
          user_id: userId,
          role,
          content,
          cbt_flow: metadata?.cbtFlow || null,
          is_crisis: metadata?.isCrisis || false,
        });

      if (error) {
        console.error('Error saving chat message:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in saveMessage:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get chat history for a user (last 50 messages)
   */
  async getChatHistory(userId: string): Promise<ChatHistoryMessage[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .limit(50); // Last 50 messages for context

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getChatHistory:', error);
      return [];
    }
  },

  /**
   * Clear all chat history for a user
   */
  async clearHistory(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('ai_chat_history')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error clearing chat history:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error in clearHistory:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get recent context for AI (last 15 messages)
   */
  async getRecentContext(userId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('role, content')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(15);

      if (error || !data) {
        return [];
      }

      // Reverse to get chronological order
      return data.reverse().map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      }));
    } catch (error) {
      console.error('Error in getRecentContext:', error);
      return [];
    }
  },

  /**
   * Generate a memory summary for AI context
   * Includes key events with dates for temporal awareness
   */
  async getMemorySummary(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('ai_chat_history')
        .select('role, content, created_at, cbt_flow, is_crisis')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100); // Look at last 100 messages for patterns

      if (error || !data || data.length === 0) {
        return '';
      }

      const memories: string[] = [];
      const now = new Date();

      // Helper to format relative dates
      const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'today';
        if (diffDays === 1) return 'yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        
        // Format as "November 14th"
        const month = date.toLocaleDateString('en-US', { month: 'long' });
        const day = date.getDate();
        const suffix = day === 1 || day === 21 || day === 31 ? 'st' : 
                      day === 2 || day === 22 ? 'nd' : 
                      day === 3 || day === 23 ? 'rd' : 'th';
        return `${month} ${day}${suffix}`;
      };

      // Track incomplete actions (user started but didn't finish)
      const incompleteActions: { action: string; date: string; context: string }[] = [];
      
      // Track completed actions
      const completedActions: { action: string; date: string }[] = [];
      
      // Track crisis moments
      const crisisMoments: { date: string; context: string }[] = [];
      
      // Track CBT tool usage
      const cbtUsage: { tool: string; date: string }[] = [];

      // Analyze messages for patterns
      for (let i = 0; i < data.length; i++) {
        const msg = data[i];
        const content = msg.content.toLowerCase();
        const date = formatDate(msg.created_at);

        // Crisis detection
        if (msg.is_crisis) {
          crisisMoments.push({ date, context: msg.content.substring(0, 100) });
        }

        // CBT tool usage
        if (msg.cbt_flow) {
          cbtUsage.push({ tool: msg.cbt_flow, date });
        }

        // Tracker creation attempts
        if (content.includes('tracker') && content.includes('set up')) {
          const nextMsg = data[i - 1]; // Check if they completed it
          if (!nextMsg || !nextMsg.content.toLowerCase().includes('tracker is now live')) {
            incompleteActions.push({
              action: 'tracker setup',
              date,
              context: msg.content.substring(0, 100)
            });
          } else {
            completedActions.push({ action: 'created a tracker', date });
          }
        }

        // Other incomplete actions (user asked but didn't follow through)
        if (msg.role === 'user' && i > 0) {
          const prevMsg = data[i - 1];
          if (prevMsg.role === 'assistant' && 
              (content.includes('help') || content.includes('want to') || content.includes('need'))) {
            const nextMsg = data[i - 2];
            if (!nextMsg || nextMsg.role !== 'user') {
              // User asked for help but didn't respond
              incompleteActions.push({
                action: 'conversation',
                date,
                context: msg.content.substring(0, 80)
              });
            }
          }
        }
      }

      // Build memory summary
      if (incompleteActions.length > 0) {
        const recent = incompleteActions[0];
        memories.push(`INCOMPLETE: User tried to ${recent.action} ${recent.date} but didn't finish. Context: "${recent.context}"`);
      }

      if (completedActions.length > 0) {
        const recent = completedActions.slice(0, 3);
        memories.push(`COMPLETED: ${recent.map(a => `${a.action} ${a.date}`).join(', ')}`);
      }

      if (crisisMoments.length > 0) {
        const recent = crisisMoments[0];
        memories.push(`CRISIS: User had a difficult moment ${recent.date}`);
      }

      if (cbtUsage.length > 0) {
        const tools = [...new Set(cbtUsage.slice(0, 3).map(c => c.tool))];
        memories.push(`CBT TOOLS USED: ${tools.join(', ')}`);
      }

      return memories.length > 0 
        ? `\n\n**MEMORY CONTEXT:**\n${memories.join('\n')}\n`
        : '';

    } catch (error) {
      console.error('Error in getMemorySummary:', error);
      return '';
    }
  },
};
