import { supabase } from '../../lib/supabase'
import type { ActivityLogEntry } from '../../types/home-dashboard'

export async function getRecentActivity(userId: string, limit = 6): Promise<ActivityLogEntry[]> {
  const { data, error } = await supabase
    .from('dashboard_activity_log')
    .select('id, action_type, description, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[activity.service] getRecentActivity error:', error)
    throw new Error(error.message)
  }

  return (data as ActivityLogEntry[]) ?? []
}

export async function logActivity(
  userId: string,
  actionType: string,
  description?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('dashboard_activity_log').insert({
      user_id: userId,
      action_type: actionType,
      description: description ?? null,
      metadata: metadata ?? null,
    })
  } catch (err) {
    // Non-critical — do not throw, just log
    console.warn('[activity.service] logActivity failed silently:', err)
  }
}
