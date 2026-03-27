import { supabase } from '../../lib/supabase'
import type { CommunityGroup, TierLevel } from '../../types/home-dashboard'

const TIER_ORDER: Record<TierLevel, number> = {
  essentials: 1,
  momentum: 2,
  executive: 3,
}

export async function getCommunityHighlights(
  membershipLevel: TierLevel,
  limit = 4
): Promise<CommunityGroup[]> {
  const allowedLevels = Object.entries(TIER_ORDER)
    .filter(([, order]) => order <= TIER_ORDER[membershipLevel])
    .map(([level]) => level)

  const { data, error } = await supabase
    .from('community_groups')
    .select('*')
    .in('membership_level', allowedLevels)
    .order('is_featured', { ascending: false })
    .order('member_count', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[community.service] getCommunityHighlights error:', error)
    throw new Error(error.message)
  }

  return (data as CommunityGroup[]) ?? []
}
