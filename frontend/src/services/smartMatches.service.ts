/**
 * Smart Matches — curated company briefs (pilot).
 *
 * Uses only neutral vocabulary: opportunity_score, match_insight,
 * relevant_area, what_they_seek, positioning_angle, match_score,
 * match_rationale. No raw vendor terms appear on this side of the wire.
 */

import { supabase } from '../lib/supabase'
import i18n from '../i18n/config'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

function currentLanguageCode(): string {
  const raw = (i18n.language || 'en').toString()
  return raw.split('-')[0].slice(0, 2).toLowerCase()
}

export type MatchStatus = 'proposed' | 'saved' | 'dismissed'

export interface OpenRole {
  title: string | null
  url: string | null
  functional_area: string | null
  location: string | null
}

export interface DetectionEvidence {
  signals_analyzed: number | null
  roles_tracked: number | null
  last_signal_at: string | null
}

export interface SnapshotNeutral {
  company_id: string | null
  domain: string | null
  opportunity_score: number | null
  match_insight: string | null
  relevant_area: string | null
  what_they_seek: string | null
  positioning_angle: string | null
  inferred_sector: string | null
  refreshed_at: string | null
  open_roles: OpenRole[]
  detection_evidence: DetectionEvidence | null
}

export interface SmartMatchBrief {
  id: string
  user_id: string
  company_id: string
  domain: string
  match_score: number
  match_rationale: string | null
  snapshot_neutral: SnapshotNeutral
  status: MatchStatus
  created_at: string
  updated_at: string
}

export interface TailoredBullet {
  original_index: number | null
  original_text: string | null
  tailored_text: string
  /** One-line rationale (≤10 words) explaining why this bullet attacks the diagnosed pain. */
  pain_hook?: string | null
}

export interface RejectedBullet {
  original_index: number
  reason: string
}

export interface CvVersion {
  id: string
  brief_id: string
  user_id: string
  master_resume_id: string | null
  profile_summary_tailored: string | null
  bullets_tailored: TailoredBullet[]
  /** LLM's one-sentence thesis (≤25 words) of how the diagnosed pain was interpreted. */
  pain_interpretation?: string | null
  /** Proof points missing from the bullet bank; null when the bank had enough material. */
  gaps?: string | null
  /** Bullets the LLM explicitly discarded with reasons. */
  rejected_bullets?: RejectedBullet[]
  positioning_angle_used: string | null
  what_they_seek_used: string | null
  top_role_title_used: string | null
  generation_model: string | null
  created_at: string
}

export interface CvError {
  code: string
  message: string
}

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE_URL}/api/smart-matches${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers as Record<string, string> ?? {}) },
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json?.error || `Request failed (${res.status})`)
  return json as T
}

export async function listMatches(status?: MatchStatus): Promise<{ count: number; briefs: SmartMatchBrief[] }> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : ''
  return req(`/${qs}`)
}

export async function refreshMatches(): Promise<{ count: number; briefs: SmartMatchBrief[] }> {
  return req('/refresh', { method: 'POST' })
}

export async function updateStatus(
  id: string,
  status: MatchStatus,
): Promise<{ brief: SmartMatchBrief; cv_version?: CvVersion | null; cv_error?: CvError | null }> {
  return req(`/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, language: currentLanguageCode() }),
  })
}

export async function getTailoredCv(id: string): Promise<{ cv_version: CvVersion | null }> {
  return req(`/${id}/cv`)
}

export async function regenerateTailoredCv(id: string): Promise<{ cv_version: CvVersion }> {
  return req(`/${id}/regenerate-cv`, {
    method: 'POST',
    body: JSON.stringify({ language: currentLanguageCode() }),
  })
}
