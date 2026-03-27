import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  FileText, Monitor, BookOpen, Briefcase, Users, UserCircle, Star, CheckCircle, Activity,
} from 'lucide-react'
import type { ActivityLogEntry } from '../../types/home-dashboard'
import { getRecentActivity } from '../../services/home-dashboard/activity.service'
import LoadingCard from './states/LoadingCard'
import EmptyState from './states/EmptyState'
import ErrorState from './states/ErrorState'

interface RecentActivityProps {
  userId: string
}

function activityIcon(type: string): React.ReactNode {
  const map: Record<string, React.ReactNode> = {
    resume_updated:       <FileText size={14} />,
    session_joined:       <Monitor size={14} />,
    session_cancelled:    <Monitor size={14} />,
    resource_viewed:      <BookOpen size={14} />,
    application_tracked:  <Briefcase size={14} />,
    interview_scheduled:  <Users size={14} />,
    profile_updated:      <UserCircle size={14} />,
    car_story_added:      <Star size={14} />,
    onboarding_completed: <CheckCircle size={14} />,
  }
  return map[type] ?? <Activity size={14} />
}

function activityBg(type: string) {
  const map: Record<string, { bg: string; color: string }> = {
    resume_updated:       { bg: '#E3F2FD', color: '#1565C0' },
    session_joined:       { bg: '#E8F5E9', color: '#2E7D32' },
    session_cancelled:    { bg: '#FEF2F2', color: '#DC2626' },
    resource_viewed:      { bg: '#F3E5F5', color: '#6A1B9A' },
    application_tracked:  { bg: '#FFF3E0', color: '#E65100' },
    interview_scheduled:  { bg: '#F0F9FF', color: '#0284C7' },
    profile_updated:      { bg: '#EFF6FF', color: '#1976D2' },
    car_story_added:      { bg: '#FFFBEB', color: '#D97706' },
    onboarding_completed: { bg: '#F0FDF4', color: '#16A34A' },
  }
  return map[type] ?? { bg: '#F1F5F9', color: '#64748B' }
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function RecentActivity({ userId }: RecentActivityProps) {
  const { t } = useTranslation()
  const [entries, setEntries] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getRecentActivity(userId, 6)
      setEntries(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('dashboard.activity.title')}</h2>

      {loading && <LoadingCard lines={5} />}

      {!loading && error && (
        <ErrorState
          message={t('dashboard.activity.error')}
          retryLabel={t('dashboard.cta.retry')}
          onRetry={load}
        />
      )}

      {!loading && !error && entries.length === 0 && (
        <EmptyState message={t('dashboard.activity.empty')} />
      )}

      {!loading && !error && entries.length > 0 && (
        <div
          className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          {entries.map(entry => {
            const colors = activityBg(entry.action_type)
            const label =
              t(`dashboard.activity.${entry.action_type}` as any, entry.action_type) as string
            return (
              <div key={entry.id} className="flex items-center gap-3 px-4 py-3">
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-lg"
                  style={{ width: 32, height: 32, background: colors.bg, color: colors.color }}
                >
                  {activityIcon(entry.action_type)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-700 font-medium truncate">
                    {entry.description ?? label}
                  </p>
                </div>
                <span className="flex-shrink-0 text-xs text-slate-400">{timeAgo(entry.created_at)}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
