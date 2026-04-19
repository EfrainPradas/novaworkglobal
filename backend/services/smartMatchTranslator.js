/**
 * Translates raw company intelligence payloads into neutral,
 * user-facing vocabulary. Strips every internal-only field.
 *
 * This module is the only seam where raw vendor terms are allowed.
 * Everything downstream (DB columns, API responses, UI) must use
 * the neutral names below.
 */

export function translateSnapshot(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    company_id: raw.company_id ?? null,
    domain: raw.domain ?? null,
    opportunity_score: numberOrNull(raw.friction_score),
    match_insight: raw.main_pain ?? null,
    relevant_area: raw.where_pain_lives ?? null,
    what_they_seek: raw.what_the_company_needs ?? null,
    positioning_angle: raw.best_attack_angle ?? null,
    inferred_sector: raw.inferred_sector ?? null,
    refreshed_at: raw.refreshed_at ?? null,
    open_roles: normalizeOpenRoles(raw.open_roles),
    detection_evidence: normalizeDetectionEvidence(raw.detection_evidence),
  }
}

function normalizeDetectionEvidence(ev) {
  if (!ev || typeof ev !== 'object') return null
  return {
    signals_analyzed:
      typeof ev.signals_analyzed === 'number' ? ev.signals_analyzed : null,
    roles_tracked:
      typeof ev.roles_tracked === 'number' ? ev.roles_tracked : null,
    last_signal_at: ev.last_signal_at ?? null,
  }
}

function normalizeOpenRoles(roles) {
  if (!Array.isArray(roles)) return []
  return roles.slice(0, 5).map((r) => ({
    title: r?.title ?? null,
    url: r?.url ?? null,
    functional_area: r?.functional_area ?? null,
    location: r?.location ?? null,
  }))
}

export function translateMatchResult(raw) {
  if (!raw || typeof raw !== 'object') return null

  return {
    company_id: raw.company_id ?? null,
    domain: raw.domain ?? null,
    match_score: numberOrNull(raw.fit_score),
    match_rationale: raw.rationale ?? null,
    snapshot_neutral: translateSnapshot(raw.snapshot),
  }
}

function numberOrNull(v) {
  if (v === null || v === undefined) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
