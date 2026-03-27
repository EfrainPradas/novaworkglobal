import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { MemberSession } from '../../types/home-dashboard'
import {
  getUpcomingMemberSessions,
  registerForSession,
  cancelSessionRegistration,
} from '../../services/home-dashboard/sessions.service'
import SessionCard from './SessionCard'
import LoadingCard from './states/LoadingCard'
import EmptyState from './states/EmptyState'
import ErrorState from './states/ErrorState'

interface MemberSessionsSectionProps {
  userId: string
}

export default function MemberSessionsSection({ userId }: MemberSessionsSectionProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getUpcomingMemberSessions({ userId, limit: 3 })
      setSessions(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { load() }, [load])

  const handleRegister = async (sessionId: string) => {
    setRegistering(sessionId)
    try {
      const result = await registerForSession(sessionId, userId)
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
    setRegistering(sessionId)
    try {
      const result = await cancelSessionRegistration(sessionId, userId)
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

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">{t('dashboard.sessions.title')}</h2>
        <button
          onClick={() => navigate('/dashboard/networking-sessions')}
          className="flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: '#1976D2' }}
        >
          {t('dashboard.cta.viewAll')}
          <ChevronRight size={13} />
        </button>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map(i => <LoadingCard key={i} lines={4} />)}
        </div>
      )}

      {!loading && error && (
        <ErrorState
          message={t('dashboard.sessions.error')}
          retryLabel={t('dashboard.cta.retry')}
          onRetry={load}
        />
      )}

      {!loading && !error && sessions.length === 0 && (
        <EmptyState message={t('dashboard.sessions.empty')} />
      )}

      {!loading && !error && sessions.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
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
  )
}
