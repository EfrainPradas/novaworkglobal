// ============================================================
// NovaWork Home Dashboard – TypeScript Types
// ============================================================

export type TierLevel = 'essentials' | 'momentum' | 'executive'
export type SessionStatus = 'active' | 'cancelled' | 'completed'
export type RegistrationStatus = 'registered' | 'cancelled' | 'waitlisted'
export type ResourceType = 'article' | 'video' | 'pdf' | 'tool'
export type SessionType = 'networking' | 'workshop' | 'q_and_a' | 'masterclass'
export type ActivityActionType =
  | 'resume_updated'
  | 'session_joined'
  | 'session_cancelled'
  | 'resource_viewed'
  | 'application_tracked'
  | 'interview_scheduled'
  | 'profile_updated'
  | 'car_story_added'
  | 'onboarding_completed'

// ── Dashboard overview aggregation ──────────────────────────

export interface DashboardOverview {
  applications_count: number
  interviews_count: number
  resume_versions_count: number
  resume_downloads_count: number
  sessions_joined_count: number
  profile_completion_percent: number
}

// ── Member Sessions ─────────────────────────────────────────

export interface MemberSession {
  id: string
  title: string
  description?: string | null
  host_name?: string | null
  session_type: SessionType
  membership_level: TierLevel
  topic?: string | null
  scheduled_at: string
  duration_minutes: number
  capacity: number
  meeting_url?: string | null
  status: SessionStatus
  seats_left: number
  user_registration?: RegistrationStatus | null
}

export interface RegisterSessionResult {
  success: boolean
  error?: 'session_not_found' | 'session_unavailable' | 'already_registered' | 'session_full' | string
  seats_left?: number
}

export interface CancelSessionResult {
  success: boolean
  error?: 'registration_not_found' | string
}

// ── Community Groups ────────────────────────────────────────

export interface CommunityGroup {
  id: string
  name: string
  description?: string | null
  icon?: string | null
  color?: string | null
  membership_level: TierLevel
  member_count: number
  is_featured: boolean
}

// ── Dashboard Resources ─────────────────────────────────────

export interface DashboardResource {
  id: string
  title: string
  description?: string | null
  resource_type: ResourceType
  url?: string | null
  membership_level: TierLevel
  topic?: string | null
  is_featured: boolean
}

// ── Activity Log ────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string
  action_type: ActivityActionType | string
  description?: string | null
  metadata?: Record<string, unknown> | null
  created_at: string
}

// ── Section state helpers ───────────────────────────────────

export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  data: T | null
  status: AsyncStatus
  error?: string | null
}
