/**
 * Services Barrel Export
 * 
 * Central export point for all service modules.
 * Import services from here for cleaner imports.
 * 
 * @example
 * ```typescript
 * // New way (recommended)
 * import { ratingService, realtimeService } from '@/lib/services';
 * 
 * // Old way (still works)
 * import { ratingService } from '@/lib/supabase-services';
 * ```
 */

// Export individual services
export { ratingService } from './rating.service';
export { realtimeService, type RealtimeChannel } from './realtime.service';

// Re-export types for convenience
export type {
  Rating,
  RatingInsert,
  RatingValue,
  ApiResponse,
  SubscriptionCallback,
  Topic,
  User,
} from '../database-types';

// TODO: Add more services as they are extracted
// export { topicService } from './topic.service';
// export { messageService } from './message.service';
// export { userService } from './user.service';
