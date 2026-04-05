/**
 * Career Intelligence Feed — Service Layer
 *
 * Handles all database operations for the career feed domain:
 *   - Sources (registry of data providers)
 *   - Items (articles, signals, insights)
 *   - Curation (editorial review & approval)
 *   - User preferences (lightweight personalization)
 */

import { supabase, supabaseAdmin } from './supabase.js'

// ─── Sources ────────────────────────────────────────────────

export async function getActiveSources() {
  const { data, error } = await supabase
    .from('career_feed_sources')
    .select('id, slug, name, description, source_type, base_url, is_active, created_at')
    .eq('is_active', true)
    .order('name')
  if (error) throw error
  return data ?? []
}

// ─── Feed Items ─────────────────────────────────────────────

export async function getPersonalizedFeed(userId, { category, itemType, limit = 20, offset = 0 } = {}) {
  const { data, error } = await supabase.rpc('get_career_feed', {
    p_user_id: userId,
    p_category: category ?? null,
    p_item_type: itemType ?? null,
    p_limit: limit,
    p_offset: offset,
  })
  if (error) throw error
  return data ?? []
}

export async function getFeedItemById(itemId) {
  const { data, error } = await supabase
    .from('career_feed_items')
    .select(`
      *,
      career_feed_sources ( slug, name, source_type ),
      career_feed_curation ( status, novawork_take, action_hint, curated_at )
    `)
    .eq('id', itemId)
    .single()
  if (error) throw error
  return data
}

// ─── Curation ───────────────────────────────────────────────

export async function getCurationQueue({ status, limit = 50, offset = 0 } = {}) {
  const client = supabaseAdmin || supabase
  let query = client
    .from('career_feed_curation')
    .select(`
      *,
      career_feed_items ( id, title, summary, content_url, image_url, item_type, category, published_at, relevance_score,
        target_roles, target_industries, target_geographies, career_goals, metadata, source_id,
        career_feed_sources ( slug, name, source_type )
      )
    `)
    .order('created_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// Keep backward compat alias
export async function getPendingCuration(limit = 50) {
  return getCurationQueue({ status: 'pending', limit })
}

export async function curateFeedItem(itemId, { status, curatorNotes, novaworkTake, actionHint, isFeatured, curatedBy }) {
  const client = supabaseAdmin || supabase
  const updates = {
    status,
    curator_notes: curatorNotes ?? null,
    novawork_take: novaworkTake ?? null,
    action_hint: actionHint ?? null,
    curated_by: curatedBy ?? null,
    curated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
  if (isFeatured !== undefined) updates.is_featured = isFeatured
  if (status === 'published') updates.published_at = new Date().toISOString()

  const { data, error } = await client
    .from('career_feed_curation')
    .update(updates)
    .eq('item_id', itemId)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function publishFeedItem(itemId, curatedBy) {
  return curateFeedItem(itemId, { status: 'published', curatedBy })
}

export async function toggleFeatured(itemId, isFeatured) {
  const client = supabaseAdmin || supabase
  const { data, error } = await client
    .from('career_feed_curation')
    .update({ is_featured: isFeatured, updated_at: new Date().toISOString() })
    .eq('item_id', itemId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── User Preferences ──────────────────────────────────────

export async function getUserPreferences(userId) {
  const { data, error } = await supabase
    .from('career_feed_user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertUserPreferences(userId, prefs) {
  const { data, error } = await supabase
    .from('career_feed_user_preferences')
    .upsert({
      user_id: userId,
      target_roles: prefs.targetRoles ?? [],
      target_industries: prefs.targetIndustries ?? [],
      target_geographies: prefs.targetGeographies ?? [],
      career_goal: prefs.careerGoal ?? null,
      notification_enabled: prefs.notificationEnabled ?? true,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ─── Stats ──────────────────────────────────────────────────

export async function getFeedStats() {
  const { data, error } = await supabase.rpc('get_career_feed_stats')
  if (error) throw error
  return data
}

// ─── Ingestion helpers (used by future ingestion scripts) ───

export async function ingestFeedItem(item) {
  const client = supabaseAdmin || supabase

  // Insert item
  const { data: feedItem, error: itemError } = await client
    .from('career_feed_items')
    .upsert({
      source_id: item.sourceId,
      external_id: item.externalId,
      title: item.title,
      summary: item.summary ?? null,
      content_url: item.contentUrl ?? null,
      image_url: item.imageUrl ?? null,
      published_at: item.publishedAt ?? null,
      item_type: item.itemType ?? 'article',
      category: item.category ?? null,
      target_roles: item.targetRoles ?? [],
      target_industries: item.targetIndustries ?? [],
      target_geographies: item.targetGeographies ?? [],
      career_goals: item.careerGoals ?? [],
      relevance_score: item.relevanceScore ?? 0,
      metadata: item.metadata ?? {},
      updated_at: new Date().toISOString(),
    }, { onConflict: 'source_id,external_id' })
    .select()
    .single()
  if (itemError) throw itemError

  // Auto-create pending curation entry
  await client
    .from('career_feed_curation')
    .upsert({
      item_id: feedItem.id,
      status: 'pending',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'item_id' })

  return feedItem
}
