/**
 * Plan access helper — Ascendia feature gates
 *
 * Maps features to minimum plan tiers. Ready to wire into components
 * via useSubscription().tier or billing_access.membership_code.
 *
 * Plan hierarchy: core (1) < advance (2) < apex (3)
 *
 * Old NovaWork codes (esenciales/momentum/vanguard) are mapped
 * to their Ascendia equivalents so existing users keep access.
 */

// ── Plan tier levels ──────────────────────────────────────────
const TIER_LEVELS: Record<string, number> = {
  // Ascendia
  core: 1,
  advance: 2,
  apex: 3,
  // NovaWork (legacy — maps to Ascendia equivalent)
  esenciales: 1,
  essentials: 1,
  momentum: 2,
  vanguard: 3,
  executive: 3,
}

// ── Feature access map ────────────────────────────────────────
// Each feature maps to the minimum tier level required.
const FEATURE_TIERS: Record<Feature, number> = {
  canExportResume: 2,           // Advance+
  canUseSmartMatches: 2,       // Advance+
  canUseFullOpportunityHub: 2, // Advance+ (core gets preview only)
  canUseAdvancedInterviewPrep: 3, // Apex only
  canAccessCoaches: 3,         // Apex only
}

// ── Public types ──────────────────────────────────────────────
export type AscendiaTier = 'core' | 'advance' | 'apex'

export type Feature =
  | 'canExportResume'
  | 'canUseSmartMatches'
  | 'canUseFullOpportunityHub'
  | 'canUseAdvancedInterviewPrep'
  | 'canAccessCoaches'

// ── Public helpers ────────────────────────────────────────────

/** Resolve any plan code (Ascendia or NovaWork) to a numeric tier level. */
export function tierLevel(planCode: string | null | undefined): number {
  if (!planCode) return 0
  return TIER_LEVELS[planCode] ?? 0
}

/** Normalize any plan code to its Ascendia tier name, or null if unknown. */
export function toAscendiaTier(planCode: string | null | undefined): AscendiaTier | null {
  const level = tierLevel(planCode)
  if (level >= 3) return 'apex'
  if (level >= 2) return 'advance'
  if (level >= 1) return 'core'
  return null
}

/** Check whether the given plan can access a specific feature. */
export function canAccess(planCode: string | null | undefined, feature: Feature): boolean {
  return tierLevel(planCode) >= FEATURE_TIERS[feature]
}

/**
 * Build a full access map for a plan — useful for one-shot checks
 * without calling canAccess() for every feature.
 */
export function getAccessMap(planCode: string | null | undefined): Record<Feature, boolean> {
  const level = tierLevel(planCode)
  return {
    canExportResume: level >= FEATURE_TIERS.canExportResume,
    canUseSmartMatches: level >= FEATURE_TIERS.canUseSmartMatches,
    canUseFullOpportunityHub: level >= FEATURE_TIERS.canUseFullOpportunityHub,
    canUseAdvancedInterviewPrep: level >= FEATURE_TIERS.canUseAdvancedInterviewPrep,
    canAccessCoaches: level >= FEATURE_TIERS.canAccessCoaches,
  }
}

/** Human-readable labels for each tier (Ascendia names). */
export const TIER_LABELS: Record<string, string> = {
  core: 'Ascendia Core',
  advance: 'Ascendia Advance',
  apex: 'Ascendia Apex',
  // Legacy NovaWork labels — resolve to Ascendia equivalents
  esenciales: 'Ascendia Core',
  essentials: 'Ascendia Core',
  momentum: 'Ascendia Advance',
  vanguard: 'Ascendia Apex',
  executive: 'Ascendia Apex',
}