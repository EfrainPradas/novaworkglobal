import { supabase } from '../../lib/supabase'
import type {
  MemberSession,
  TierLevel,
  RegisterSessionResult,
  CancelSessionResult,
} from '../../types/home-dashboard'

export interface GetSessionsParams {
  userId: string
  level?: TierLevel
  topic?: string
  limit?: number
}

export async function getUpcomingMemberSessions(
  params: GetSessionsParams
): Promise<MemberSession[]> {
  const { userId, level, topic, limit = 10 } = params

  const { data, error } = await supabase.rpc('get_upcoming_member_sessions', {
    p_user_id: userId,
    p_level: level ?? null,
    p_topic: topic ?? null,
    p_limit: limit,
  })

  if (error) {
    console.error('[sessions.service] getUpcomingMemberSessions error:', error)
    throw new Error(error.message)
  }

  return (data as MemberSession[]) ?? []
}

export async function registerForSession(
  sessionId: string,
  userId: string
): Promise<RegisterSessionResult> {
  const { data, error } = await supabase.rpc('register_for_member_session', {
    p_user_id: userId,
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[sessions.service] registerForSession error:', error)
    return { success: false, error: error.message }
  }

  return data as RegisterSessionResult
}

export async function cancelSessionRegistration(
  sessionId: string,
  userId: string
): Promise<CancelSessionResult> {
  const { data, error } = await supabase.rpc('cancel_member_session_registration', {
    p_user_id: userId,
    p_session_id: sessionId,
  })

  if (error) {
    console.error('[sessions.service] cancelSessionRegistration error:', error)
    return { success: false, error: error.message }
  }

  return data as CancelSessionResult
}

export async function getUserSessionRegistrations(userId: string) {
  const { data, error } = await supabase
    .from('session_registrations')
    .select('session_id, status')
    .eq('user_id', userId)
    .eq('status', 'registered')

  if (error) {
    console.error('[sessions.service] getUserSessionRegistrations error:', error)
    return []
  }

  return data ?? []
}
