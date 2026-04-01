// ============================================================================
// Smart Guided Path — Type Definitions
// Backend-driven guided experience for resume-building platform
// ============================================================================

// ---------- Enums ----------

export type GuidedPathStatus =
  | 'not_started'
  | 'in_progress'
  | 'paused'
  | 'completed'
  | 'abandoned'

export type GuidedStepStatus =
  | 'not_started'
  | 'available'
  | 'in_progress'
  | 'completed'
  | 'skipped'
  | 'blocked'

export type GuidedInputMethod =
  | 'resume_import'
  | 'manual_experience_entry'
  | 'not_selected'

export type GuidedTriggerSource =
  | 'system'
  | 'user_action'
  | 'admin'
  | 'api'

export type GuidedEventType =
  | 'guided_mode_enabled'
  | 'guided_mode_disabled'
  | 'guided_path_started'
  | 'guided_path_paused'
  | 'guided_path_resumed'
  | 'guided_path_completed'
  | 'guided_path_abandoned'
  | 'step_unlocked'
  | 'step_viewed'
  | 'step_started'
  | 'step_saved'
  | 'step_completed'
  | 'step_skipped'
  | 'step_reopened'
  | 'step_blocked'
  | 'auto_routed_to_next_step'
  | 'manual_navigation_override'
  | 'input_method_selected'
  | 'completion_check_passed'
  | 'completion_check_failed'
  | 'branching_decision'

// ---------- Step Keys ----------

export const GUIDED_STEP_KEYS = [
  'profile_basic_info',
  'resume_experience_capture',
  'experience_foundation',
  'accomplishment_bank',
  'car_stories',
  'professional_positioning',
  'guided_path_complete',
] as const

export type GuidedStepKey = typeof GUIDED_STEP_KEYS[number]

// ---------- Completion Rules ----------

export interface CompletionRuleTableCheck {
  type: 'table_check'
  table: string
  required_fields: string[]
  match_column: string
}

export interface CompletionRuleMinCount {
  type: 'min_count'
  table: string
  min: number
  match_column: string
  join_through?: string
  extra_filter?: { field: string; equals?: string; not_equals?: string }
}

export interface CompletionRuleFieldCheck {
  type: 'field_check'
  table: string
  field: string
  equals?: string
  not_equals?: string
  match_column: string
}

export interface CompletionRuleCompound {
  type: 'compound'
  rules: CompletionRule[]
}

export interface CompletionRuleConditional {
  type: 'conditional'
  conditions: Array<{
    when?: string
    default?: boolean
    rule: CompletionRule
  }>
}

export interface CompletionRuleAlwaysComplete {
  type: 'always_complete'
}

export type CompletionRule =
  | CompletionRuleTableCheck
  | CompletionRuleMinCount
  | CompletionRuleFieldCheck
  | CompletionRuleCompound
  | CompletionRuleConditional
  | CompletionRuleAlwaysComplete

// ---------- Database Entities ----------

export interface GuidedPathDefinition {
  id: string
  path_key: string
  display_name: string
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface GuidedPathVersion {
  id: string
  path_definition_id: string
  version_number: number
  version_label?: string
  is_current: boolean
  config?: Record<string, unknown>
  published_at?: string
  created_at: string
}

export interface GuidedStepDefinition {
  id: string
  path_version_id: string
  step_key: GuidedStepKey
  display_name: string
  description?: string
  step_order: number
  route_path?: string
  is_branching_point: boolean
  branch_options?: BranchOption[]
  parent_step_key?: string
  completion_rule: CompletionRule
  is_required: boolean
  is_terminal: boolean
  depends_on_steps: string[]
  created_at: string
}

export interface BranchOption {
  key: string
  label: string
  route?: string
}

export interface GuidedPathRun {
  id: string
  user_id: string
  path_version_id: string
  status: GuidedPathStatus
  guidance_enabled: boolean
  input_method: GuidedInputMethod
  last_completed_step_key?: string
  current_recommended_step_key?: string
  current_actual_step_key?: string
  started_at?: string
  paused_at?: string
  resumed_at?: string
  completed_at?: string
  abandoned_at?: string
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GuidedStepState {
  id: string
  run_id: string
  step_definition_id: string
  user_id: string
  status: GuidedStepStatus
  completion_data?: Record<string, unknown>
  completion_pct: number
  first_viewed_at?: string
  started_at?: string
  completed_at?: string
  skipped_at?: string
  view_count: number
  save_count: number
  metadata?: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface GuidedStepTransition {
  id: string
  run_id: string
  step_state_id: string
  user_id: string
  from_status?: GuidedStepStatus
  to_status: GuidedStepStatus
  triggered_by: GuidedTriggerSource
  reason?: string
  metadata?: Record<string, unknown>
  created_at: string
}

export interface GuidedPathEvent {
  id: string
  user_id: string
  session_id?: string
  run_id?: string
  event_type: GuidedEventType
  path_version_id?: string
  step_key?: string
  step_name?: string
  source_page?: string
  target_page?: string
  completion_status?: string
  input_method?: GuidedInputMethod
  triggered_by: GuidedTriggerSource
  event_timestamp: string
  duration_ms?: number
  metadata?: Record<string, unknown>
  created_at: string
}

// ---------- Composite / API Response Types ----------

export interface GuidedStepWithState {
  step_key: GuidedStepKey
  display_name: string
  step_order: number
  route_path?: string
  is_branching_point: boolean
  branch_options?: BranchOption[]
  is_required: boolean
  is_terminal: boolean
  depends_on_steps: string[]
  state: {
    status: GuidedStepStatus
    completion_pct: number
    first_viewed_at?: string
    started_at?: string
    completed_at?: string
    skipped_at?: string
    view_count: number
    save_count: number
  }
}

export interface GuidedPathFullState {
  has_active_run: boolean
  run: GuidedPathRun | null
  steps: GuidedStepWithState[]
}

export interface NextStepRecommendation {
  step_key: GuidedStepKey
  display_name: string
  route_path: string
  reason: 'next_in_sequence' | 'incomplete_prior' | 'first_step' | 'path_complete'
  is_path_complete: boolean
  step_statuses: Record<GuidedStepKey, GuidedStepStatus>
}

export interface StepCompletionResult {
  step_key: GuidedStepKey
  is_complete: boolean
  completion_pct: number
  missing_fields?: string[]
  details?: Record<string, unknown>
}

// ---------- API Request Types ----------

export interface EnableGuidedModeRequest {
  user_id: string
}

export interface LogEventRequest {
  event_type: GuidedEventType
  session_id?: string
  run_id?: string
  step_key?: string
  step_name?: string
  source_page?: string
  target_page?: string
  completion_status?: string
  input_method?: GuidedInputMethod
  triggered_by?: GuidedTriggerSource
  duration_ms?: number
  metadata?: Record<string, unknown>
}

export interface SelectInputMethodRequest {
  run_id: string
  input_method: 'resume_import' | 'manual_experience_entry'
}

export interface SaveStepProgressRequest {
  run_id: string
  step_key: GuidedStepKey
  completion_pct?: number
  metadata?: Record<string, unknown>
}
