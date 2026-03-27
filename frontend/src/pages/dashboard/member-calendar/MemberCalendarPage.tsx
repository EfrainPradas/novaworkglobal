import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Calendar, Clock, Users } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import UserMenu from '../../../components/common/UserMenu'
import NotificationBell from '../../../components/common/NotificationBell'
import SessionCard from '../../../components/home-dashboard/SessionCard'
import LoadingCard from '../../../components/home-dashboard/states/LoadingCard'
import EmptyState from '../../../components/home-dashboard/states/EmptyState'
import ErrorState from '../../../components/home-dashboard/states/ErrorState'
import {
  getUpcomingMemberSessions,
  registerForSession,
  cancelSessionRegistration,
} from '../../../services/home-dashboard/sessions.service'
import type { MemberSession } from '../../../types/home-dashboard'

function groupByWeek(sessions: MemberSession[]): Record<string, MemberSession[]> {
  const groups: Record<string, MemberSession[]> = {}
  for (const s of sessions) {
    const d = new Date(s.scheduled_at)
    const weekStart = new Date(d)
    weekStart.setDate(d.getDate() - d.getDay())
    const key = weekStart.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return groups
}

export default function MemberCalendarPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  const load = useCallback(async (userId: string) => {
    setLoading(true)
    setError(false)
    try {
      const data = await getUpcomingMemberSessions({ userId, limit: 30 })
      setSessions(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    async function boot() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/signin'); return }
      setUser(user)
      const { data: profileData } = await supabase
        .from('user_profiles').select('full_name').eq('user_id', user.id).maybeSingle()
      setUserProfile(profileData)
      await load(user.id)
    }
    boot()
  }, [navigate, load])

  const handleRegister = async (sessionId: string) => {
    if (!user) return
    setRegistering(sessionId)
    try {
      const result = await registerForSession(sessionId, user.id)
      if (result.success) {
        setSessions(prev =>
          prev.map(s =>
            s.id === sessionId
              ? { ...s, user_registration: 'registered', seats_left: Math.max(0, s.seats_left - 1) }
              : s
          )
        )
      }
    } finally {
      setRegistering(null)
    }
  }

  const handleCancel = async (sessionId: string) => {
    if (!user) return
    setRegistering(sessionId)
    try {
      const result = await cancelSessionRegistration(sessionId, user.id)
      if (result.success) {
        setSessions(prev =>
          prev.map(s =>
            s.id === sessionId
              ? { ...s, user_registration: 'cancelled', seats_left: s.seats_left + 1 }
              : s
          )
        )
      }
    } finally {
      setRegistering(null)
    }
  }

  const grouped = groupByWeek(sessions)

  return (
    <div
      className="min-h-screen"
      style={{ background: '#F0F3F8', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft size={16} />
            {t('sidebarOverview.dashboard')}
          </button>
          <span className="text-slate-300">/</span>
          <h1 className="text-sm font-semibold text-slate-800">
            {t('sidebarCommunity.memberCalendar')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {user && <NotificationBell userId={user.id} />}
          <UserMenu user={user} userProfile={userProfile} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* View toggle */}
        <div className="flex gap-2 mb-5">
          {(['list', 'calendar'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${viewMode === mode ? 'text-white' : 'bg-white text-slate-500 border border-slate-200'}`}
              style={viewMode === mode ? { background: '#1976D2' } : {}}
            >
              {mode === 'list' ? 'List View' : 'Timeline'}
            </button>
          ))}
        </div>

        {loading && (
          <div className="space-y-3">
            {[0,1,2].map(i => <LoadingCard key={i} lines={4} />)}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            message={t('dashboard.sessions.error')}
            retryLabel={t('dashboard.cta.retry')}
            onRetry={() => user && load(user.id)}
          />
        )}

        {!loading && !error && sessions.length === 0 && (
          <EmptyState message={t('dashboard.sessions.empty')} />
        )}

        {!loading && !error && sessions.length > 0 && (
          viewMode === 'list' ? (
            /* List grouped by week */
            <div className="space-y-6">
              {Object.entries(grouped).map(([weekLabel, weekSessions]) => (
                <div key={weekLabel}>
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar size={14} className="text-slate-400" />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Week of {weekLabel}
                    </h2>
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {weekSessions.map(session => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        onRegister={handleRegister}
                        onCancel={handleCancel}
                        registering={registering === session.id}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Timeline list */
            <div
              className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
            >
              {sessions.map(session => (
                <div key={session.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Date block */}
                  <div className="flex-shrink-0 flex flex-col items-center justify-center rounded-xl p-2" style={{ width: 52, background: '#EFF6FF' }}>
                    <span className="text-xs font-bold text-blue-700 uppercase">
                      {new Date(session.scheduled_at).toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                    <span className="text-xl font-extrabold text-blue-800 leading-none">
                      {new Date(session.scheduled_at).getDate()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{session.title}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users size={11} />
                        {session.seats_left} seats
                      </span>
                    </div>
                  </div>

                  {/* Quick register */}
                  {session.user_registration === 'registered' ? (
                    <span className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-50 text-green-700">
                      {t('dashboard.sessions.registered')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleRegister(session.id)}
                      disabled={session.seats_left === 0 || registering === session.id}
                      className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 disabled:opacity-40"
                      style={{ background: '#1976D2' }}
                    >
                      {t('dashboard.sessions.register')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  )
}
