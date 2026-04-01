/**
 * Smart Guided Path — Frontend Service Layer
 *
 * Communicates with the backend /api/guided-path/* endpoints.
 * Follows existing service patterns (supabase client + backend API calls).
 */

import { supabase } from '../lib/supabase'
import type {
  GuidedPathFullState,
  NextStepRecommendation,
  StepCompletionResult,
  GuidedStepKey,
  GuidedEventType,
  GuidedInputMethod,
  GuidedTriggerSource,
} from '../types/guidedPath'

const API_BASE = import.meta.env.VITE_API_URL || ''

// ---------- Helpers ----------

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) throw new Error('Not authenticated')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

function getSessionId(): string {
  return localStorage.getItem('rb_session_id') || ''
}

async function apiPost<T = unknown>(path: string, body: Record<string, unknown> = {}): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/api/guided-path${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...body, session_id: getSessionId() }),
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json.data ?? json
}

async function apiGet<T = unknown>(path: string): Promise<T> {
  const headers = await getAuthHeaders()
  const res = await fetch(`${API_BASE}/api/guided-path${path}`, {
    method: 'GET',
    headers,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json.data ?? json
}

// ---------- Path Lifecycle ----------

export async function enableGuidedMode(): Promise<{ run_id: string; status: string; already_existed: boolean }> {
  return apiPost('/enable')
}

export async function disableGuidedMode(): Promise<void> {
  await apiPost('/disable')
}

export async function pauseGuidedPath(): Promise<void> {
  await apiPost('/pause')
}

export async function resumeGuidedPath(): Promise<NextStepRecommendation> {
  return apiPost('/resume')
}

// ---------- State & Navigation ----------

export async function getGuidedPathState(): Promise<GuidedPathFullState> {
  return apiGet('/state')
}

export async function getNextRecommendedStep(): Promise<NextStepRecommendation & { has_active_run: boolean }> {
  return apiGet('/next-step')
}

export async function selectInputMethod(inputMethod: 'resume_import' | 'manual_experience_entry'): Promise<void> {
  await apiPost('/select-input-method', { input_method: inputMethod })
}

// ---------- Step Operations ----------

export async function markStepViewed(stepKey: GuidedStepKey, sourcePage?: string): Promise<void> {
  await apiPost('/step/view', { step_key: stepKey, source_page: sourcePage })
}

export async function saveStepProgress(
  stepKey: GuidedStepKey,
  metadata?: Record<string, unknown>
): Promise<{
  step_complete: boolean
  completion_pct: number
  next_step: GuidedStepKey | null
  next_step_route: string | null
  is_path_complete: boolean
}> {
  return apiPost('/step/save', { step_key: stepKey, metadata })
}

export async function completeStep(
  stepKey: GuidedStepKey,
  force?: boolean
): Promise<{
  next_step: GuidedStepKey | null
  next_step_route: string | null
  is_path_complete: boolean
}> {
  return apiPost('/step/complete', { step_key: stepKey, force })
}

export async function skipStep(stepKey: GuidedStepKey, reason?: string): Promise<{
  next_step: GuidedStepKey | null
  next_step_route: string | null
}> {
  return apiPost('/step/skip', { step_key: stepKey, reason })
}

export async function reopenStep(stepKey: GuidedStepKey): Promise<void> {
  await apiPost('/step/reopen', { step_key: stepKey })
}

// ---------- Navigation Override ----------

export async function handleManualNavigationOverride(
  stepKey: GuidedStepKey | null,
  sourcePage: string,
  targetPage: string
): Promise<void> {
  await apiPost('/navigate', {
    step_key: stepKey,
    source_page: sourcePage,
    target_page: targetPage,
  })
}

// ---------- Completion Check ----------

export async function checkStepCompletion(stepKey: GuidedStepKey): Promise<StepCompletionResult> {
  return apiGet(`/check-step/${stepKey}`)
}

// ---------- Event Logging ----------

export async function logGuidedEvent(params: {
  event_type: GuidedEventType
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
}): Promise<void> {
  // Fire and forget — don't block the UI
  apiPost('/event', params).catch(e => {
    console.warn('[GuidedPath] Event logging failed:', e.message)
  })
}
