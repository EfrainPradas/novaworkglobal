import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Filter } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import SessionCard from '../../../components/home-dashboard/SessionCard'
import LoadingCard from '../../../components/home-dashboard/states/LoadingCard'
import EmptyState from '../../../components/home-dashboard/states/EmptyState'
import ErrorState from '../../../components/home-dashboard/states/ErrorState'
import {
  getUpcomingMemberSessions,
  registerForSession,
  cancelSessionRegistration,
} from '../../../services/home-dashboard/sessions.service'
import { getUserTier } from '../../../services/home-dashboard/dashboard.service'
import type { MemberSession, TierLevel } from '../../../types/home-dashboard'

const TOPICS = ['resume', 'interview', 'networking', 'career_pivot', 'leadership'] as const

export default function NetworkingSessionsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [userLevel, setUserLevel] = useState<TierLevel>('esenciales')
  const [sessions, setSessions] = useState<MemberSession[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [registering, setRegistering] = useState<string | null>(null)
  const [topicFilter, setTopicFilter] = useState<string | undefined>(undefined)

  const load = useCallback(async (userId: string, topic?: string) => {
    setLoading(true)
    setError(false)
    try {
      const data = await getUpcomingMemberSessions({ userId, topic, limit: 20 })
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
      const tier = await getUserTier(user.id)
      setUserLevel(tier)
      await load(user.id)
    }
    boot()
  }, [navigate, load])

  const handleTopicChange = (topic: string | undefined) => {
    setTopicFilter(topic)
    if (user) load(user.id, topic)
  }

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

  return (
    <div
      className="min-h-screen bg-[#F0F3F8] dark:bg-gray-900"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          {t('sidebarOverview.dashboard')}
        </button>
        <span className="text-slate-300 dark:text-gray-600">/</span>
        <h1 className="text-sm font-semibold text-slate-800 dark:text-white">
          {t('sidebarCommunity.networkingSessions')}
        </h1>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-6">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
            <Filter size={13} /> Topic
          </span>
          <button
            onClick={() => handleTopicChange(undefined)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${!topicFilter ? 'text-white' : 'bg-white dark:bg-gray-700 text-slate-500 dark:text-gray-300 border border-slate-200 dark:border-gray-600 hover:border-blue-300'}`}
            style={!topicFilter ? { background: '#1976D2' } : {}}
          >
            {t('common.all')}
          </button>
          {TOPICS.map(topic => (
            <button
              key={topic}
              onClick={() => handleTopicChange(topic)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all ${topicFilter === topic ? 'text-white' : 'bg-white dark:bg-gray-700 text-slate-500 dark:text-gray-300 border border-slate-200 dark:border-gray-600 hover:border-blue-300'}`}
              style={topicFilter === topic ? { background: '#1976D2' } : {}}
            >
              {topic.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Sessions grid */}
        {loading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2,3,4,5].map(i => <LoadingCard key={i} lines={4} />)}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            message={t('dashboard.sessions.error')}
            retryLabel={t('dashboard.cta.retry')}
            onRetry={() => user && load(user.id, topicFilter)}
          />
        )}

        {!loading && !error && sessions.length === 0 && (
          <EmptyState message={t('dashboard.sessions.empty')} />
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  )
}
