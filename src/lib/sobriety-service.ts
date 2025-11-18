import { supabase } from './supabase';

export type TrackerType = 'alcohol' | 'smoking' | 'drugs' | 'gambling' | 'other';

export interface SobrietyTracker {
  id: string;
  user_id: string;
  tracker_type: TrackerType;
  tracker_name: string;
  start_date: string;
  is_active: boolean;
  notes?: string;
  
  // Visual Journey
  chosen_image?: 'bridge' | 'phoenix' | 'mountain';
  current_phase?: number;
  pieces_unlocked?: number;
  total_pieces?: number;
  days_per_piece?: number;
  
  // Relapse Tracking
  total_attempts?: number;
  previous_best_days?: number;
  total_sober_days?: number;
  
  created_at: string;
  updated_at: string;
}

export interface TimeBreakdown {
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number;
}

export const sobrietyService = {
  // Get all active trackers for user
  async getActiveTrackers(userId: string): Promise<SobrietyTracker[]> {
    const { data, error } = await (supabase
      .from('sobriety_trackers') as any)
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching trackers:', error);
      return [];
    }

    return data || [];
  },

  // Create a new tracker
  async createTracker(
    userId: string,
    trackerType: TrackerType,
    trackerName: string,
    startDate: Date,
    notes?: string
  ): Promise<{ success: boolean; error?: string; tracker?: SobrietyTracker }> {
    try {
      const { data, error } = await (supabase
        .from('sobriety_trackers') as any)
        .insert({
          user_id: userId,
          tracker_type: trackerType,
          tracker_name: trackerName,
          start_date: startDate.toISOString(),
          notes: notes || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, tracker: data };
    } catch (error: any) {
      console.error('Error creating tracker:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset a tracker (set new start date)
  async resetTracker(trackerId: string, newStartDate: Date): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase
        .from('sobriety_trackers') as any)
        .update({
          start_date: newStartDate.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', trackerId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error resetting tracker:', error);
      return { success: false, error: error.message };
    }
  },

  // Deactivate a tracker
  async deactivateTracker(trackerId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await (supabase
        .from('sobriety_trackers') as any)
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', trackerId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error deactivating tracker:', error);
      return { success: false, error: error.message };
    }
  },

  // Calculate time breakdown from start date
  calculateTimeBreakdown(startDate: string): TimeBreakdown {
    const start = new Date(startDate);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();

    // Calculate total days
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Calculate breakdown
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const months = Math.floor(days / 30);

    return {
      months,
      days: days % 30,
      hours: hours % 24,
      minutes: minutes % 60,
      seconds: seconds % 60,
      totalDays,
    };
  },

  // Format time breakdown to string
  formatTimeBreakdown(breakdown: TimeBreakdown): string {
    const parts: string[] = [];
    
    if (breakdown.months > 0) parts.push(`${breakdown.months}mo`);
    if (breakdown.days > 0) parts.push(`${breakdown.days}d`);
    if (breakdown.hours > 0) parts.push(`${breakdown.hours}h`);
    if (breakdown.minutes > 0) parts.push(`${breakdown.minutes}m`);
    parts.push(`${breakdown.seconds}s`);

    return parts.join(' ');
  },

  // Calculate visual journey progress
  calculateVisualProgress(tracker: SobrietyTracker): {
    piecesUnlocked: number;
    totalPieces: number;
    nextPieceIn: number;
    progressPercent: number;
    currentPhase: string;
  } {
    const breakdown = this.calculateTimeBreakdown(tracker.start_date);
    const daysSober = breakdown.totalDays;
    const daysPerPiece = tracker.days_per_piece || 3;
    const totalPieces = tracker.total_pieces || 30;
    
    // Calculate pieces unlocked
    const piecesUnlocked = Math.min(Math.floor(daysSober / daysPerPiece), totalPieces);
    
    // Calculate days until next piece
    const nextPieceIn = daysPerPiece - (daysSober % daysPerPiece);
    
    // Calculate progress percentage
    const progressPercent = Math.round((piecesUnlocked / totalPieces) * 100);
    
    // Determine current phase
    let currentPhase = 'bridge';
    if (daysSober >= 181) currentPhase = 'mountain';
    else if (daysSober >= 91) currentPhase = 'phoenix';
    
    return {
      piecesUnlocked,
      totalPieces,
      nextPieceIn,
      progressPercent,
      currentPhase,
    };
  },

  // Calculate relapse impact
  calculateRelapseLoss(currentPieces: number): {
    piecesLost: number;
    piecesRemaining: number;
    daysLost: number;
  } {
    let piecesLost = 0;
    
    if (currentPieces === 0) {
      piecesLost = 0;
    } else if (currentPieces <= 3) {
      piecesLost = currentPieces; // Lose all
    } else if (currentPieces <= 10) {
      piecesLost = 2;
    } else {
      piecesLost = 3;
    }
    
    const piecesRemaining = currentPieces - piecesLost;
    const daysLost = piecesLost * 3; // 3 days per piece
    
    return {
      piecesLost,
      piecesRemaining,
      daysLost,
    };
  },
};
