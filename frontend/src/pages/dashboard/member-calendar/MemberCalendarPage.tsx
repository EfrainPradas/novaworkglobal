import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, List } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import MemberCalendarView from '../../../components/home-dashboard/MemberCalendarView'
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

type TabKey = 'coaching' | 'sessions'

export default function MemberCalendarPage() {
  const { t } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('coaching')

  // ── Group sessions (available to register) ──────────────────────────────────
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(false)
  const [errorSessions, setErrorSessions] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const loadGroupSessions = useCallback(async (uid: string) => {
    setLoadingSessions(true)
    setErrorSessions(false)
    try {
      const data = await getUpcomingMemberSessions({ userId: uid, limit: 30 })
      setSessions(data)
    } catch {
      setErrorSessions(true)
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    if (userId && tab === 'sessions') loadGroupSessions(userId)
  }, [userId, tab, loadGroupSessions])

  const handleRegister = async (sessionId: string) => {
    if (!userId) return
    setRegistering(sessionId)
    try {
      const result = await registerForSession(sessionId, userId)
      if (result.success) {
        setSessions(prev =>
          prev.map(s =>
            s.id === sessionId
              ? { ...s, user_registration: 'registered', seats_left: Math.max(0, (s.seats_left ?? 1) - 1) }
              : s
          )
        )
      }
    } finally {
      setRegistering(null)
    }
  }

  const handleCancel = async (sessionId: string) => {
    if (!userId) return
    setRegistering(sessionId)
    try {
      const result = await cancelSessionRegistration(sessionId, userId)
      if (result.success) {
        setSessions(prev =>
          prev.map(s =>
            s.id === sessionId
              ? { ...s, user_registration: 'cancelled', seats_left: (s.seats_left ?? 0) + 1 }
              : s
          )
        )
      }
    } finally {
      setRegistering(null)
    }
  }

  return (
    <div className="px-5 py-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Page header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-800">Member Calendar</h2>
        <p className="text-sm text-slate-500 mt-0.5">Your coaching appointments and upcoming community sessions</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab('coaching')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'coaching' ? 'text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
          style={tab === 'coaching' ? { background: '#1976D2' } : {}}
        >
          <CalendarDays size={15} />
          My Coaching Sessions
        </button>
        <button
          onClick={() => setTab('sessions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === 'sessions' ? 'text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300'}`}
          style={tab === 'sessions' ? { background: '#1976D2' } : {}}
        >
          <List size={15} />
          Available Sessions
        </button>
      </div>

      {/* ── Tab: Coaching Calendar ── */}
      {tab === 'coaching' && (
        userId
          ? <MemberCalendarView userId={userId} />
          : <div className="py-10 text-center text-slate-400 text-sm animate-pulse">Loading…</div>
      )}

      {/* ── Tab: Group Sessions (register) ── */}
      {tab === 'sessions' && (
        <div>
          {loadingSessions && (
            <div className="space-y-3">
              {[0, 1, 2].map(i => <LoadingCard key={i} lines={4} />)}
            </div>
          )}
          {!loadingSessions && errorSessions && (
            <ErrorState
              message={t('dashboard.sessions.error')}
              retryLabel={t('dashboard.cta.retry')}
              onRetry={() => userId && loadGroupSessions(userId)}
            />
          )}
          {!loadingSessions && !errorSessions && sessions.length === 0 && (
            <EmptyState message={t('dashboard.sessions.empty')} />
          )}
          {!loadingSessions && !errorSessions && sessions.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map(session => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onRegister={handleRegister}
                  onCancel={handleCancel}
                  registering={registering === session.id}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
