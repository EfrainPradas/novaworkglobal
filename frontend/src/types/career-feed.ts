// ─── Career Intelligence Feed Types ─────────────────────────

export type FeedItemType = 'article' | 'signal' | 'insight' | 'report' | 'trend'

export type FeedCategory =
  | 'hiring_trends' | 'layoffs' | 'skills_demand'
  | 'salary' | 'remote_work' | 'industry_shift'
  | 'ai_impact' | 'economic_outlook' | 'career_strategy'
  | 'other'

export type CurationStatus = 'pending' | 'approved' | 'rejected' | 'archived' | 'published'

export type SourceType = 'quantitative' | 'news' | 'manual'

export interface FeedSource {
  slug: string
  name: string
  source_type: SourceType
}

export interface FeedItem {
  id: string
  title: string
  summary: string | null
  content_url: string | null
  image_url: string | null
  published_at: string | null
  item_type: FeedItemType
  category: FeedCategory | null
  relevance_score: number
  target_roles: string[]
  target_industries: string[]
  target_geographies: string[]
  career_goals: string[]
  metadata: Record<string, unknown>
  source_id: string
  career_feed_sources: FeedSource
}

export interface CurationEntry {
  id: string
  item_id: string
  status: CurationStatus
  curator_notes: string | null
  novawork_take: string | null
  action_hint: string | null
  is_featured: boolean
  curated_by: string | null
  curated_at: string | null
  published_at: string | null
  created_at: string
  updated_at: string
  career_feed_items: FeedItem
}

// Returned by the get_career_feed RPC (user-facing)
export interface PersonalizedFeedItem {
  id: string
  title: string
  summary: string | null
  content_url: string | null
  image_url: string | null
  published_at: string | null
  item_type: FeedItemType
  category: FeedCategory | null
  relevance_score: number
  source_name: string
  source_slug: string
  novawork_take: string | null
  action_hint: string | null
  target_roles: string[]
  target_industries: string[]
  target_geographies: string[]
  career_goals: string[]
  metadata: Record<string, unknown>
  is_featured: boolean
}

export type CareerGoal = 'transition' | 'reinvention' | 'alignment'

export interface UserFeedPreferences {
  id: string
  user_id: string
  target_roles: string[]
  target_industries: string[]
  target_geographies: string[]
  career_goal: CareerGoal | null
  notification_enabled: boolean
  created_at: string
  updated_at: string
}

export interface FeedStats {
  total_items: number
  pending: number
  approved: number
  published: number
  rejected: number
  featured: number
  sources_active: number
}
