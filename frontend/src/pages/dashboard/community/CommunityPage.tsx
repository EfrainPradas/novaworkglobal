import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Users, Star } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import LoadingCard from '../../../components/home-dashboard/states/LoadingCard'
import EmptyState from '../../../components/home-dashboard/states/EmptyState'
import ErrorState from '../../../components/home-dashboard/states/ErrorState'
import { getCommunityHighlights } from '../../../services/home-dashboard/community.service'
import { getUserTier } from '../../../services/home-dashboard/dashboard.service'
import type { CommunityGroup, TierLevel } from '../../../types/home-dashboard'

export default function CommunityPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [userLevel, setUserLevel] = useState<TierLevel>('essentials')
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async (level: TierLevel) => {
    setLoading(true)
    setError(false)
    try {
      const data = await getCommunityHighlights(level, 20)
      setGroups(data)
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
      await load(tier)
    }
    boot()
  }, [navigate, load])

  return (
    <div
      className="min-h-screen"
      style={{ background: '#F0F3F8', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-slate-100 bg-white">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={16} />
          {t('sidebarOverview.dashboard')}
        </button>
        <span className="text-slate-300">/</span>
        <h1 className="text-sm font-semibold text-slate-800">
          {t('sidebarCommunity.community')}
        </h1>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-800">{t('dashboard.community.title')}</h2>
          <p className="text-sm text-slate-400 mt-1">
            Connect with fellow NovaWork members on shared career goals and topics.
          </p>
        </div>

        {loading && (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0,1,2,3,4,5].map(i => <LoadingCard key={i} lines={3} />)}
          </div>
        )}

        {!loading && error && (
          <ErrorState
            message={t('dashboard.community.error')}
            retryLabel={t('dashboard.cta.retry')}
            onRetry={() => load(userLevel)}
          />
        )}

        {!loading && !error && groups.length === 0 && (
          <EmptyState message={t('dashboard.community.empty')} />
        )}

        {!loading && !error && groups.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {groups.map(group => (
              <div
                key={group.id}
                className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col gap-3 transition-all hover:shadow-md"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 flex items-center justify-center rounded-xl"
                    style={{
                      width: 44, height: 44,
                      background: group.color ? `${group.color}18` : '#EFF6FF',
                      color: group.color ?? '#1976D2',
                    }}
                  >
                    <Users size={20} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-800">{group.name}</h3>
                      {group.is_featured && (
                        <Star size={13} className="flex-shrink-0 text-amber-400 fill-amber-400" />
                      )}
                    </div>
                    {group.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{group.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Users size={11} />
                      {t('dashboard.community.members', {
                        count: group.member_count,
                        defaultValue: `${group.member_count} members`,
                      })}
                    </p>
                  </div>
                </div>

                <button
                  className="w-full py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-95 text-white"
                  style={{ background: '#1976D2' }}
                >
                  {t('dashboard.community.joinGroup')}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
