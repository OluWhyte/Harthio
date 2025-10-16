/**
 * Enhanced WebRTC Manager with Google Meet/Zoom-like features
 * Includes adaptive bitrate, connection quality monitoring, and fallback mechanisms
 */

import { supabase } from './supabase';

export type ConnectionState = 
  | "initializing" 
  | "connecting" 
  | "connected" 
  | "reconnecting" 
  | "failed" 
  | "ende