/**
 * Supabase Database Types for User Progress Management
 * These types correspond to the database schema defined in database-schema.sql
 * Phase 2: User-Scoped Data Management
 */

import { User } from '@supabase/supabase-js';

// =============================================
// CORE TYPES
// =============================================

export type StepStatus = 'not_started' | 'in_progress' | 'started' | 'complete' | 'error';
export type UserProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';
export type MessageRole = 'user' | 'ai' | 'system';
export type MessageType = 'text' | 'audio' | 'action' | 'system';
export type DataType = 'text' | 'number' | 'boolean' | 'json' | 'array';
export type DataSource = 'user_input' | 'ai_analysis' | 'conversation' | 'system';
export type AnalysisType = 'evaluation' | 'data_collection' | 'sentiment' | 'completion';
export type Sentiment = 'positive' | 'negative' | 'neutral';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// =============================================
// DATABASE TABLE TYPES
// =============================================

/**
 * User profile information (extends Supabase auth.users)
 */
export interface UserProfile {
  id: string; // UUID matching auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Workflow definition structure
 */
export interface Workflow {
  id: string;
  title: string;
  description: string | null;
  version: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  workflow_data: WorkflowData; // JSONB field
  tags: string[];
  difficulty_level: DifficultyLevel | null;
  estimated_duration_minutes: number | null;
}

/**
 * Structure of the workflow_data JSONB field
 */
export interface WorkflowData {
  id: string;
  title: string;
  description?: string;
  sections: WorkflowSection[];
}

export interface WorkflowSection {
  id: string;
  title: string;
  order: number;
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  title: string;
  order: number;
  sectionId: string;
  agentId: string;
}

/**
 * Overall user progress through a workflow
 */
export interface UserProgress {
  id: string;
  user_id: string;
  workflow_id: string;
  session_id: string;
  current_step_id: string;
  status: UserProgressStatus;
  total_steps: number;
  completed_steps: number;
  percent_complete: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  time_spent_minutes: number;
  created_at: string;
  updated_at: string;
}

/**
 * Progress through individual workflow steps
 */
export interface StepProgress {
  id: string;
  user_id: string;
  user_progress_id: string;
  workflow_id: string;
  step_id: string;
  section_id: string | null;
  agent_id: string | null;
  status: StepStatus;
  attempt_count: number;
  conversation_id: string | null;
  conversation_status: string | null;
  success: boolean | null;
  started_at: string | null;
  completed_at: string | null;
  last_modified: string;
  user_inputs: Record<string, any>; // JSONB field
  created_at: string;
  updated_at: string;
}

/**
 * Data captured during workflow execution
 */
export interface CapturedData {
  id: string;
  user_id: string;
  step_progress_id: string;
  user_progress_id: string;
  label: string;
  data_collection_id: string | null;
  value: string;
  json_value: any | null; // JSONB field
  data_type: DataType;
  rationale: string | null;
  confidence_score: number | null;
  source: DataSource;
  json_schema: any | null; // JSONB field
  timestamp: string;
  created_at: string;
  updated_at: string;
}

/**
 * Individual conversation messages
 */
export interface ConversationMessage {
  id: string;
  user_id: string;
  step_progress_id: string;
  conversation_id: string;
  message_sequence: number;
  content: string;
  role: MessageRole;
  agent_id: string | null;
  message_type: MessageType;
  audio_duration_seconds: number | null;
  audio_transcript: string | null;
  audio_url: string | null;
  sentiment: Sentiment | null;
  intent: string | null;
  confidence_score: number | null;
  timestamp: string;
  created_at: string;
  updated_at: string;
}

/**
 * AI analysis results from conversations
 */
export interface ConversationAnalysis {
  id: string;
  user_id: string;
  step_progress_id: string;
  conversation_id: string;
  analysis_type: AnalysisType;
  call_successful: string | null;
  transcript_summary: string | null;
  evaluation_criteria_results: Record<string, EvaluationCriteriaResult>; // JSONB field
  data_collection_results: Record<string, DataCollectionResult>; // JSONB field
  analysis_confidence: number | null;
  processing_duration_ms: number | null;
  model_version: string | null;
  analyzed_at: string;
  created_at: string;
  updated_at: string;
}

/**
 * Structure for evaluation criteria results within analysis
 */
export interface EvaluationCriteriaResult {
  criteria_id: string;
  result: string;
  rationale: string;
}

/**
 * Structure for data collection results within analysis
 */
export interface DataCollectionResult {
  data_collection_id: string;
  value: string;
  json_schema: any;
  rationale: string;
}

// =============================================
// VIEW TYPES (for database views)
// =============================================

/**
 * User progress summary view with workflow and user info
 */
export interface UserProgressSummary {
  id: string;
  user_id: string;
  workflow_id: string;
  session_id: string;
  workflow_title: string;
  workflow_description: string | null;
  current_step_id: string;
  status: UserProgressStatus;
  total_steps: number;
  completed_steps: number;
  percent_complete: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  time_spent_minutes: number;
  user_name: string | null;
}

/**
 * Step progress detailed view with aggregated data
 */
export interface StepProgressDetailed {
  id: string;
  user_id: string;
  user_progress_id: string;
  workflow_id: string;
  step_id: string;
  section_id: string | null;
  agent_id: string | null;
  status: StepStatus;
  attempt_count: number;
  conversation_id: string | null;
  conversation_status: string | null;
  success: boolean | null;
  started_at: string | null;
  completed_at: string | null;
  last_modified: string;
  user_inputs: Record<string, any>;
  captured_data_count: number;
  message_count: number;
  transcript_summary: string | null;
  call_successful: string | null;
}

// =============================================
// API TYPES (for frontend/backend communication)
// =============================================

/**
 * Request types for creating/updating records
 */
export interface CreateUserProgressRequest {
  workflow_id: string;
  session_id: string;
  current_step_id: string;
  total_steps: number;
}

export interface UpdateUserProgressRequest {
  current_step_id?: string;
  status?: UserProgressStatus;
  time_spent_minutes?: number;
}

export interface CreateStepProgressRequest {
  user_progress_id: string;
  workflow_id: string;
  step_id: string;
  section_id?: string;
  agent_id?: string;
  conversation_id?: string;
}

export interface UpdateStepProgressRequest {
  status?: StepStatus;
  conversation_id?: string;
  conversation_status?: string;
  success?: boolean;
  user_inputs?: Record<string, any>;
  attempt_count?: number;
}

export interface CreateCapturedDataRequest {
  step_progress_id: string;
  user_progress_id: string;
  label: string;
  value: string;
  data_collection_id?: string;
  json_value?: any;
  data_type?: DataType;
  rationale?: string;
  confidence_score?: number;
  source?: DataSource;
  json_schema?: any;
}

export interface CreateConversationMessageRequest {
  step_progress_id: string;
  conversation_id: string;
  message_sequence: number;
  content: string;
  role: MessageRole;
  agent_id?: string;
  message_type?: MessageType;
  audio_duration_seconds?: number;
  audio_transcript?: string;
  audio_url?: string;
}

export interface CreateConversationAnalysisRequest {
  step_progress_id: string;
  conversation_id: string;
  analysis_type: AnalysisType;
  call_successful?: string;
  transcript_summary?: string;
  evaluation_criteria_results?: Record<string, EvaluationCriteriaResult>;
  data_collection_results?: Record<string, DataCollectionResult>;
  analysis_confidence?: number;
  processing_duration_ms?: number;
  model_version?: string;
}

// =============================================
// QUERY TYPES (for API responses)
// =============================================

/**
 * Query options for fetching user progress
 */
export interface UserProgressQuery {
  workflow_id?: string;
  status?: UserProgressStatus;
  limit?: number;
  offset?: number;
  order_by?: 'created_at' | 'updated_at' | 'last_activity_at';
  order_direction?: 'asc' | 'desc';
}

/**
 * Query options for fetching step progress
 */
export interface StepProgressQuery {
  user_progress_id?: string;
  workflow_id?: string;
  step_id?: string;
  status?: StepStatus;
  conversation_id?: string;
  limit?: number;
  offset?: number;
}

/**
 * Query options for fetching captured data
 */
export interface CapturedDataQuery {
  step_progress_id?: string;
  user_progress_id?: string;
  label?: string;
  data_collection_id?: string;
  data_type?: DataType;
  source?: DataSource;
  limit?: number;
  offset?: number;
}

/**
 * Query options for fetching conversation messages
 */
export interface ConversationMessagesQuery {
  conversation_id?: string;
  step_progress_id?: string;
  role?: MessageRole;
  message_type?: MessageType;
  limit?: number;
  offset?: number;
}

// =============================================
// UTILITY TYPES
// =============================================

/**
 * Complete user session data (aggregated from multiple tables)
 */
export interface UserSession {
  userProgress: UserProgress;
  stepProgress: StepProgress[];
  capturedData: CapturedData[];
  messages: ConversationMessage[];
  analysis: ConversationAnalysis[];
  workflow: Workflow;
  userProfile: UserProfile;
}

/**
 * Progress statistics for dashboard/reporting
 */
export interface ProgressStats {
  total_sessions: number;
  completed_sessions: number;
  active_sessions: number;
  abandoned_sessions: number;
  average_completion_time: number;
  average_completion_percentage: number;
  most_common_exit_step: string | null;
  total_captured_data_points: number;
}

/**
 * Type for Supabase table names (for type-safe queries)
 */
export type TableName = 
  | 'user_profiles'
  | 'workflows'
  | 'user_progress'
  | 'step_progress'
  | 'captured_data'
  | 'conversation_messages'
  | 'conversation_analysis';

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  count?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  count: number;
  per_page: number;
  current_page: number;
  total_pages: number;
  has_next_page: boolean;
  has_previous_page: boolean;
}

/**
 * Paginated API response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
  error: string | null;
}

// =============================================
// LEGACY COMPATIBILITY TYPES
// =============================================
// These maintain compatibility with existing code while migrating to Supabase

/**
 * Legacy Message type for backward compatibility
 */
export interface Message {
  id: string;
  content: string;
  role: 'user' | 'ai';
  timestamp: Date;
}

/**
 * Legacy Analysis type for backward compatibility
 */
export interface Analysis {
  evaluation_criteria_results: Record<string, EvaluationCriteriaResult>;
  data_collection_results: Record<string, DataCollectionResult>;
  call_successful: string;
  transcript_summary: string;
}

/**
 * Convert database types to legacy types for backward compatibility
 */
export const convertToLegacyMessage = (dbMessage: ConversationMessage): Message => ({
  id: dbMessage.id,
  content: dbMessage.content,
  role: dbMessage.role === 'ai' ? 'ai' : 'user',
  timestamp: new Date(dbMessage.timestamp),
});

export const convertToLegacyAnalysis = (dbAnalysis: ConversationAnalysis): Analysis => ({
  evaluation_criteria_results: dbAnalysis.evaluation_criteria_results,
  data_collection_results: dbAnalysis.data_collection_results,
  call_successful: dbAnalysis.call_successful || '',
  transcript_summary: dbAnalysis.transcript_summary || '',
});
