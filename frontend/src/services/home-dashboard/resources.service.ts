import { supabase } from '../../lib/supabase'
import type { DashboardResource, TierLevel } from '../../types/home-dashboard'

const TIER_ORDER: Record<TierLevel, number> = {
  essentials: 1,
  momentum: 2,
  executive: 3,
}

export async function getRecommendedResources(
  membershipLevel: TierLevel,
  limit = 6
): Promise<DashboardResource[]> {
  const allowedLevels = Object.entries(TIER_ORDER)
    .filter(([, order]) => order <= TIER_ORDER[membershipLevel])
    .map(([level]) => level)

  const { data, error } = await supabase
    .from('dashboard_resources')
    .select('*')
    .in('membership_level', allowedLevels)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[resources.service] getRecommendedResources error:', error)
    throw new Error(error.message)
  }

  return (data as DashboardResource[]) ?? []
}

export async function getFeaturedResources(membershipLevel: TierLevel): Promise<DashboardResource[]> {
  const allowedLevels = Object.entries(TIER_ORDER)
    .filter(([, order]) => order <= TIER_ORDER[membershipLevel])
    .map(([level]) => level)

  const { data, error } = await supabase
    .from('dashboard_resources')
    .select('*')
    .in('membership_level', allowedLevels)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(4)

  if (error) {
    console.error('[resources.service] getFeaturedResources error:', error)
    throw new Error(error.message)
  }

  return (data as DashboardResource[]) ?? []
}
