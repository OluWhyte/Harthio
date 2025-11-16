import { supabase } from './supabase';

export type MoodType = 'struggling' | 'okay' | 'good' | 'great';

export interface DailyCheckIn {
  id: string;
  user_id: string;
  mood: MoodType;
  note?: string;
  created_at: string;
}

export const checkinService = {
  // Get today's check-in for user
  async getTodayCheckIn(userId: string): Promise<DailyCheckIn | null> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching today check-in:', error);
      return null;
    }

    return data;
  },

  // Create or update today's check-in
  async saveCheckIn(userId: string, mood: MoodType, note?: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if check-in exists for today
      const existing = await this.getTodayCheckIn(userId);

      if (existing) {
        // Update existing check-in
        const { error } = await (supabase
          .from('daily_checkins') as any)
          .update({ mood, note, created_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new check-in
        const { error } = await (supabase
          .from('daily_checkins') as any)
          .insert({ user_id: userId, mood, note });

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('Error saving check-in:', error);
      return { success: false, error: error.message };
    }
  },

  // Get check-in history for user
  async getCheckInHistory(userId: string, limit: number = 30): Promise<DailyCheckIn[]> {
    const { data, error } = await supabase
      .from('daily_checkins')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching check-in history:', error);
      return [];
    }

    return data || [];
  },

  // Get check-in streak (consecutive days)
  async getCheckInStreak(userId: string): Promise<number> {
    const history = await this.getCheckInHistory(userId, 365);
    
    if (history.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < history.length; i++) {
      const checkInDate = new Date(history[i].created_at);
      checkInDate.setHours(0, 0, 0, 0);
      
      const expectedDate = new Date(today);
      expectedDate.setDate(today.getDate() - i);
      expectedDate.setHours(0, 0, 0, 0);

      if (checkInDate.getTime() === expectedDate.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },
};
