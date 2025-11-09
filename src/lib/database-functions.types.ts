/**
 * Type definitions for custom database functions
 * These functions are created by our SQL scripts but not recognized by Supabase's auto-generated types
 */

// Extend Supabase client to include our custom functions
declare module '@supabase/supabase-js' {
  interface SupabaseClient {
    rpc<T = any>(
      fn: string,
      args?: Record<string, any>,
      options?: { head?: boolean; count?: 'exact' | 'planned' | 'estimated' }
    ): Promise<{ data: T | null; error: any }>;
  }
}

// Custom function parameter types
export interface SelectSessionProviderParams {
  p_session_id: string;
  p_user_id: string;
  p_provider: string;
  p_room_id: string;
}

export interface SelectSessionProviderResult {
  success: boolean;
  provider: string;
  room_id: string;
  selected_by: string;
  is_new_selection: boolean;
  reason: string;
  error?: string;
}

export interface CoordinateProviderRecoveryParams {
  p_session_id: string;
  p_failed_provider: string;
  p_initiated_by: string;
}

export interface CoordinateProviderRecoveryResult {
  success: boolean;
  failed_provider: string;
  new_provider: string;
  room_id: string;
  affected_users: string[];
  initiated_by: string;
  recovery_reason: string;
  error?: string;
}

export interface UpdateUserSessionStateParams {
  p_session_id: string;
  p_user_id: string;
  p_user_name: string;
  p_connection_state: string;
  p_current_provider: string;
  p_device_info?: Record<string, any>;
}

export interface UpdateUserSessionStateResult {
  success: boolean;
  session_id: string;
  user_id: string;
  connection_state: string;
  current_provider: string;
  error?: string;
}

export interface UpdateSessionHealthParams {
  p_session_id: string;
  p_user_id: string;
  p_status: string;
  p_quality_metrics?: Record<string, any>;
}

export interface UpdateSessionHealthResult {
  success: boolean;
  health_id: string;
  connection_status: string;
  last_ping: string;
  error?: string;
}

export interface HeartbeatPingParams {
  p_session_id: string;
  p_user_id: string;
}

export interface HeartbeatPingResult {
  success: boolean;
  ping_time: string;
}

export interface InitiateAdvancedRecoveryParams {
  p_session_id: string;
  p_recovery_type: string;
  p_initiated_by: string;
  p_trigger_reason: string;
  p_target_provider?: string;
}

export interface InitiateAdvancedRecoveryResult {
  success: boolean;
  recovery_id: string;
  recovery_type: string;
  session_id: string;
  initiated_by: string;
  trigger_reason: string;
  started_at: string;
  error?: string;
}

export interface CompleteRecoveryParams {
  p_recovery_id: string;
  p_success: boolean;
  p_error_message?: string;
}

export interface CompleteRecoveryResult {
  success: boolean;
  recovery_id: string;
  recovery_success: boolean;
  duration_ms: number;
  quality_improvement: number;
  error?: string;
}

export interface ValidateStateTransitionParams {
  p_session_id: string;
  p_user_id: string;
  p_from_state: string;
  p_to_state: string;
}

export interface ValidateStateTransitionResult {
  valid: boolean;
  from_state: string;
  to_state: string;
  reason: string;
  allowed_states?: string[];
}

// Helper type for RPC calls
export type DatabaseFunction<TParams = any, TResult = any> = (
  params: TParams
) => Promise<{ data: TResult | null; error: any }>;

// Type-safe RPC wrapper
export interface CustomDatabaseFunctions {
  select_session_provider: DatabaseFunction<SelectSessionProviderParams, SelectSessionProviderResult>;
  coordinate_provider_recovery: DatabaseFunction<CoordinateProviderRecoveryParams, CoordinateProviderRecoveryResult>;
  update_user_session_state: DatabaseFunction<UpdateUserSessionStateParams, UpdateUserSessionStateResult>;
  get_session_coordination_info: DatabaseFunction<{ p_session_id: string }, any>;
  update_session_health: DatabaseFunction<UpdateSessionHealthParams, UpdateSessionHealthResult>;
  heartbeat_ping: DatabaseFunction<HeartbeatPingParams, HeartbeatPingResult>;
  initiate_advanced_recovery: DatabaseFunction<InitiateAdvancedRecoveryParams, InitiateAdvancedRecoveryResult>;
  complete_recovery: DatabaseFunction<CompleteRecoveryParams, CompleteRecoveryResult>;
  validate_session_state_transition: DatabaseFunction<ValidateStateTransitionParams, ValidateStateTransitionResult>;
  analyze_recovery_patterns: DatabaseFunction<{ p_session_id?: string }, any>;
  predict_recovery_need: DatabaseFunction<{ p_session_id: string }, any>;
  get_session_health_overview: DatabaseFunction<{ p_session_id: string }, any>;
  detect_stale_connections: DatabaseFunction<{ p_session_id: string }, any>;
  recommend_quality_recovery: DatabaseFunction<{ p_session_id: string }, any>;
  get_session_health_alerts: DatabaseFunction<{ p_session_id: string }, any>;
}