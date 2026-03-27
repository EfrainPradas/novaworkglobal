import { supabase } from '../../lib/supabase'
import type { DashboardOverview } from '../../types/home-dashboard'

export interface CareerStats extends DashboardOverview {
  modulesCompleted: number
  totalModules: number
  resumeScore: number
}

export async function getDashboardOverview(userId: string): Promise<DashboardOverview> {
  // Try RPC first; fall back to direct queries if schema cache is stale
  const { data, error } = await supabase.rpc('get_dashboard_overview', { p_user_id: userId })

  if (!error && data) {
    return {
      applications_count: data.applications_count ?? 0,
      interviews_count: data.interviews_count ?? 0,
      resume_versions_count: data.resume_versions_count ?? 0,
      resume_downloads_count: data.resume_downloads_count ?? 0,
      sessions_joined_count: data.sessions_joined_count ?? 0,
      profile_completion_percent: data.profile_completion_percent ?? 0,
    }
  }

  // Fallback: direct table queries
  const [
    { count: applications_count },
    { count: interviews_count },
    { count: resume_versions_count },
    { count: resume_downloads_count },
    { count: sessions_joined_count },
    { count: par_count },
    { count: work_exp_count },
    { data: resumeRow },
  ] = await Promise.all([
    supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('interviews').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'downloaded'),
    supabase.from('session_registrations').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'registered'),
    supabase.from('par_stories').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('work_experience').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('user_resumes').select('profile_summary').eq('user_id', userId).limit(1).maybeSingle(),
  ])

  const hasProfile = !!(resumeRow?.profile_summary)
  const profile_completion_percent = Math.min(100,
    (hasProfile ? 25 : 0) +
    Math.min(25, (work_exp_count ?? 0) * 8) +
    Math.min(25, (par_count ?? 0) * 5) +
    ((resume_versions_count ?? 0) > 0 ? 25 : 0)
  )

  return {
    applications_count: applications_count ?? 0,
    interviews_count: interviews_count ?? 0,
    resume_versions_count: resume_versions_count ?? 0,
    resume_downloads_count: resume_downloads_count ?? 0,
    sessions_joined_count: sessions_joined_count ?? 0,
    profile_completion_percent,
  }
}

export async function getUserName(userId: string): Promise<string | null> {
  try {
    const { data: profileData } = await supabase
      .from('user_profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle()

    if (profileData?.full_name) return profileData.full_name

    const { data: resumeData } = await supabase
      .from('user_resumes')
      .select('full_name')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    return resumeData?.full_name ?? null
  } catch {
    return null
  }
}

export async function getUserTier(userId: string): Promise<'essentials' | 'momentum' | 'executive'> {
  try {
    const { data } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', userId)
      .single()

    if (!data?.subscription_tier) return 'essentials'

    const t = data.subscription_tier
    if (t === 'basic') return 'essentials'
    if (t === 'pro') return 'momentum'
    if (t === 'executive') return 'executive'
    return 'essentials'
  } catch {
    return 'essentials'
  }
}
