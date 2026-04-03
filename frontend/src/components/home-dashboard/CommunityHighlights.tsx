import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Users } from 'lucide-react'
import type { CommunityGroup, TierLevel } from '../../types/home-dashboard'
import { getCommunityHighlights } from '../../services/home-dashboard/community.service'
import LoadingCard from './states/LoadingCard'
import EmptyState from './states/EmptyState'
import ErrorState from './states/ErrorState'

interface CommunityHighlightsProps {
  userLevel: TierLevel
}

export default function CommunityHighlights({ userLevel }: CommunityHighlightsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [groups, setGroups] = useState<CommunityGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getCommunityHighlights(userLevel, 4)
      setGroups(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [userLevel])

  useEffect(() => { load() }, [load])

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200">{t('dashboard.community.title')}</h2>
        <button
          onClick={() => navigate('/dashboard/community')}
          className="flex items-center gap-1 text-xs font-medium hover:underline"
          style={{ color: '#1976D2' }}
        >
          {t('dashboard.cta.viewAll')}
          <ChevronRight size={13} />
        </button>
      </div>

      {loading && (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map(i => <LoadingCard key={i} lines={2} />)}
        </div>
      )}

      {!loading && error && (
        <ErrorState
          message={t('dashboard.community.error')}
          retryLabel={t('dashboard.cta.retry')}
          onRetry={load}
        />
      )}

      {!loading && !error && groups.length === 0 && (
        <EmptyState message={t('dashboard.community.empty')} />
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(group => (
            <div
              key={group.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-4 flex items-start gap-3 transition-all hover:shadow-md cursor-pointer"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              onClick={() => navigate('/dashboard/community')}
            >
              {/* Icon */}
              <span
                className="flex-shrink-0 flex items-center justify-center rounded-xl text-sm"
                style={{
                  width: 40, height: 40,
                  background: group.color ? `${group.color}18` : '#EFF6FF',
                  color: group.color ?? '#1976D2',
                }}
              >
                <Users size={18} />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{group.name}</p>
                  {group.is_featured && (
                    <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold" style={{ fontSize: 10 }}>
                      ★
                    </span>
                  )}
                </div>
                {group.description && (
                  <p className="text-xs text-slate-400 dark:text-gray-400 mt-0.5 line-clamp-2">{group.description}</p>
                )}
                <p className="text-xs text-slate-400 dark:text-gray-400 mt-1">
                  {t('dashboard.community.members', {
                    count: group.member_count,
                    defaultValue: `${group.member_count} members`,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
