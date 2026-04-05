/**
 * Career Intelligence Feed — Frontend Service
 * Calls the backend API for curation operations.
 */

import { supabase } from '../lib/supabase'
import type { CurationEntry, CurationStatus, FeedStats, PersonalizedFeedItem, FeedCategory, FeedItemType, UserFeedPreferences } from '../types/career-feed'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

async function authHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('No active session')
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  }
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = await authHeaders()
  const res = await fetch(`${API_BASE_URL}/api/career-feed${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> ?? {}) },
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json.error || 'Request failed')
  return json.data
}

// ─── Personalized feed (user-facing) ────────────────────────

export async function getPersonalizedFeed(
  category?: FeedCategory,
  itemType?: FeedItemType,
  limit = 20,
  offset = 0
): Promise<PersonalizedFeedItem[]> {
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (itemType) params.set('item_type', itemType)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return apiFetch<PersonalizedFeedItem[]>(`?${params}`)
}

// ─── User preferences ───────────────────────────────────────

export async function getUserFeedPreferences(): Promise<UserFeedPreferences | null> {
  return apiFetch<UserFeedPreferences | null>('/preferences')
}

export async function saveUserFeedPreferences(prefs: {
  targetRoles?: string[]
  targetIndustries?: string[]
  targetGeographies?: string[]
  careerGoal?: string | null
  notificationEnabled?: boolean
}): Promise<UserFeedPreferences> {
  return apiFetch<UserFeedPreferences>('/preferences', {
    method: 'PUT',
    body: JSON.stringify(prefs),
  })
}

// ─��─ Access check ───────────────────────────────────────────

export async function checkCuratorAccess(): Promise<boolean> {
  try {
    const result = await apiFetch<{ isCurator: boolean }>('/curation/access')
    return result?.isCurator ?? false
  } catch {
    return false
  }
}

// ─── AI generation ──────────────────────────────────────────

export async function aiGenerateField(
  field: 'novawork_take' | 'action_hint' | 'curator_notes',
  item: {
    title: string
    summary?: string | null
    category?: string | null
    sourceSlug?: string
    targetRoles?: string[]
    targetIndustries?: string[]
    targetGeographies?: string[]
    careerGoals?: string[]
  }
): Promise<string> {
  const result = await apiFetch<{ field: string; text: string }>('/curation/ai-generate', {
    method: 'POST',
    body: JSON.stringify({ ...item, field }),
  })
  return result?.text ?? ''
}

// ─── Curation queue ─────────────────────────────────────────

export async function getCurationQueue(
  status?: CurationStatus,
  limit = 50,
  offset = 0
): Promise<CurationEntry[]> {
  const params = new URLSearchParams()
  if (status) params.set('status', status)
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return apiFetch<CurationEntry[]>(`/curation/queue?${params}`)
}

// ─── Curation actions ───────────────────────────────────────

export async function curateFeedItem(
  itemId: string,
  payload: {
    status: CurationStatus
    curatorNotes?: string
    novaworkTake?: string
    actionHint?: string
    isFeatured?: boolean
  }
): Promise<CurationEntry> {
  return apiFetch<CurationEntry>(`/curation/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function publishFeedItem(itemId: string): Promise<CurationEntry> {
  return apiFetch<CurationEntry>(`/curation/${itemId}/publish`, {
    method: 'POST',
  })
}

export async function toggleFeatured(itemId: string, isFeatured: boolean): Promise<CurationEntry> {
  return apiFetch<CurationEntry>(`/curation/${itemId}/featured`, {
    method: 'PUT',
    body: JSON.stringify({ isFeatured }),
  })
}

// ─── Stats ──────────────────────────────────────────────────

export async function getFeedStats(): Promise<FeedStats> {
  return apiFetch<FeedStats>('/curation/stats')
}
