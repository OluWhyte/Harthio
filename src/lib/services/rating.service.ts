/**
 * Rating Service
 * 
 * Manages user ratings and feedback for sessions.
 * Handles rating submission, validation, and eligibility checks.
 */

import { supabase } from '../supabase';
import { logger } from '../logger';
import type {
  Rating,
  RatingInsert,
  RatingValue,
  ApiResponse,
} from '../database-types';

// Type-safe wrapper for Supabase operations
const typedSupabase = supabase as any;

/**
 * Service for managing user ratings and feedback
 */
export const ratingService = {
  /**
   * Submit a rating for a user after a session
   * 
   * @param ratingData - Rating data (excluding id and created_at)
   * @returns API response with rating data or error
   * 
   * @example
   * ```typescript
   * const result = await ratingService.submitRating({
   *   user_id: 'user-123',
   *   rater_id: 'rater-456',
   *   topic_id: 'topic-789',
   *   politeness: 5,
   *   relevance: 4,
   *   problem_solved: 5,
   *   communication: 5,
   *   professionalism: 4,
   *   comment: 'Great conversation!'
   * });
   * ```
   */
  async submitRating(
    ratingData: Omit<RatingInsert, 'id' | 'created_at'>
  ): Promise<ApiResponse<Rating>> {
    try {
      // Validate rating values (must be 1-5)
      const ratingValues: RatingValue[] = [
        ratingData.politeness,
        ratingData.relevance,
        ratingData.problem_solved,
        ratingData.communication,
        ratingData.professionalism,
      ];

      const invalidRatings = ratingValues.filter(
        (value) => value < 1 || value > 5
      );
      
      if (invalidRatings.length > 0) {
        throw new Error('All ratings must be between 1 and 5');
      }

      // Check if rating already exists
      const { data: existingRating } = await typedSupabase
        .from('ratings')
        .select('id')
        .eq('user_id', ratingData.user_id)
        .eq('rater_id', ratingData.rater_id)
        .eq('topic_id', ratingData.topic_id)
        .single();

      if (existingRating) {
        throw new Error('You have already rated this user for this session');
      }

      // Insert new rating
      const { data, error } = await typedSupabase
        .from('ratings')
        .insert(ratingData as any)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to submit rating: ${error.message}`);
      }

      return { data, error: null, success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error('Error submitting rating', error);
      return { data: null, error: errorMessage, success: false };
    }
  },

  /**
   * Get all ratings for a specific session/topic
   * 
   * @param topicId - The topic/session ID
   * @returns Array of ratings for the topic
   * 
   * @example
   * ```typescript
   * const ratings = await ratingService.getTopicRatings('topic-123');
   * console.log(`Found ${ratings.length} ratings`);
   * ```
   */
  async getTopicRatings(topicId: string): Promise<Rating[]> {
    const { data, error } = await typedSupabase
      .from('ratings')
      .select('*')
      .eq('topic_id', topicId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching topic ratings', error);
      throw new Error('Failed to fetch topic ratings');
    }

    return data || [];
  },

  /**
   * Check if a user can rate another user for a specific session
   * 
   * Validates:
   * - Both users participated in the session
   * - Rater is not rating themselves
   * - Rating doesn't already exist
   * 
   * @param raterId - ID of the user giving the rating
   * @param userId - ID of the user being rated
   * @param topicId - ID of the session/topic
   * @returns True if rating is allowed, false otherwise
   * 
   * @example
   * ```typescript
   * const canRate = await ratingService.canUserRate('rater-123', 'user-456', 'topic-789');
   * if (canRate) {
   *   // Show rating form
   * }
   * ```
   */
  async canUserRate(
    raterId: string,
    userId: string,
    topicId: string
  ): Promise<boolean> {
    try {
      // Check if both users participated in the topic
      const { data: topic, error: topicError } = await typedSupabase
        .from('topics')
        .select('participants, author_id')
        .eq('id', topicId)
        .single();

      if (topicError || !topic) {
        return false;
      }

      // Build list of all participants (author + participants array)
      const allParticipants = [
        (topic as any).author_id,
        ...((topic as any).participants || []),
      ];
      
      const raterParticipated = allParticipants.includes(raterId);
      const userParticipated = allParticipants.includes(userId);

      // Can't rate if either didn't participate, or if rating self
      if (!raterParticipated || !userParticipated || raterId === userId) {
        return false;
      }

      // Check if rating already exists
      const { data: existingRating } = await typedSupabase
        .from('ratings')
        .select('id')
        .eq('user_id', userId)
        .eq('rater_id', raterId)
        .eq('topic_id', topicId)
        .single();

      return !existingRating;
    } catch (error) {
      logger.error('Error checking rating eligibility', error);
      return false;
    }
  },
};
