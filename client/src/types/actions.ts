// types/actions.ts

export interface QuickSignAction {
  action: 'files_uploaded' | 'process_started' | 'process_completed' | 'process_error' | 'results_downloaded';
  file_count?: number;
  total_size?: number;
  file_names?: string[];
  success_count?: number;
  error_count?: number;
  processing_time_ms?: number;
  error_message?: string;
  details?: any; // Additional details in JSON format
  timestamp: string;
}

export interface SimpleSignAction {
  action: 'file_selected' | 'signing_started' | 'signing_success' | 'signing_error' | 'signed_file_downloaded';
  file_name?: string;
  file_size?: number;
  processing_time_ms?: number;
  error_message?: string;
  details?: any; // Additional details in JSON format
  timestamp: string;
}

export interface ValidationAction {
  action: 'file_selected' | 'validation_started' | 'validation_success' | 'validation_error' | 'report_downloaded';
  file_name?: string;
  file_size?: number;
  processing_time_ms?: number;
  error_message?: string;
  details?: any; // Additional details in JSON format
  timestamp: string;
}

export type UserAction = 
  | { type: 'quicksign'; data: QuickSignAction }
  | { type: 'simplesign'; data: SimpleSignAction }
  | { type: 'validation'; data: ValidationAction };

// Database table schemas for Supabase
export interface QuickSignActionRecord extends QuickSignAction {
  id?: string;
  user_id?: string;
  created_at?: string;
}

export interface SimpleSignActionRecord extends SimpleSignAction {
  id?: string;
  user_id?: string;
  created_at?: string;
}

export interface ValidationActionRecord extends ValidationAction {
  id?: string;
  user_id?: string;
  created_at?: string;
}

// Summary interfaces for analytics
export interface QuickSignSummary {
  date: string;
  total_actions: number;
  unique_users: number;
  total_files_processed: number;
  avg_processing_time_ms: number;
  total_successful_files: number;
  total_failed_files: number;
}

export interface SimpleSignSummary {
  date: string;
  total_actions: number;
  unique_users: number;
  successful_signings: number;
  failed_signings: number;
  avg_processing_time_ms: number;
  avg_file_size_bytes: number;
}

export interface ValidationSummary {
  date: string;
  total_actions: number;
  unique_users: number;
  successful_validations: number;
  failed_validations: number;
  avg_processing_time_ms: number;
  avg_file_size_bytes: number;
}

export interface UserActivitySummary {
  total_quicksign_sessions: number;
  total_files_signed: number;
  total_simplesign_operations: number;
  total_validation_operations: number;
  last_activity: string;
  avg_processing_time_ms: number;
}

export interface SystemAnalytics {
  quicksign: QuickSignSummary[];
  simplesign: SimpleSignSummary[];
  validation: ValidationSummary[];
}