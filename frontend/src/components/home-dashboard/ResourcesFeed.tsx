import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, FileText, Video, BookOpen, Wrench, ExternalLink } from 'lucide-react'
import type { DashboardResource, ResourceType, TierLevel } from '../../types/home-dashboard'
import { getRecommendedResources } from '../../services/home-dashboard/resources.service'
import LoadingCard from './states/LoadingCard'
import EmptyState from './states/EmptyState'
import ErrorState from './states/ErrorState'

interface ResourcesFeedProps {
  userLevel: TierLevel
}

const RESOURCE_ICONS: Record<ResourceType, { icon: React.ReactNode; bg: string; color: string }> = {
  article: { icon: <BookOpen size={16} />, bg: '#E8F5E9', color: '#2E7D32' },
  video:   { icon: <Video size={16} />,    bg: '#F3E5F5', color: '#6A1B9A' },
  pdf:     { icon: <FileText size={16} />, bg: '#E3F2FD', color: '#1565C0' },
  tool:    { icon: <Wrench size={16} />,   bg: '#FFF3E0', color: '#E65100' },
}

export default function ResourcesFeed({ userLevel }: ResourcesFeedProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [resources, setResources] = useState<DashboardResource[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const data = await getRecommendedResources(userLevel, 6)
      setResources(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [userLevel])

  useEffect(() => { load() }, [load])

  const handleOpen = (resource: DashboardResource) => {
    if (resource.url) {
      if (resource.url.startsWith('/')) {
        window.open(resource.url, '_blank')
      } else {
        window.open(resource.url, '_blank', 'noopener,noreferrer')
      }
    }
  }

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-700">{t('dashboard.resources.title')}</h2>
        <button
          onClick={() => navigate('/shared-resources')}
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
          message={t('dashboard.resources.error')}
          retryLabel={t('dashboard.cta.retry')}
          onRetry={load}
        />
      )}

      {!loading && !error && resources.length === 0 && (
        <EmptyState message={t('dashboard.resources.empty')} />
      )}

      {!loading && !error && resources.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {resources.map(resource => {
            const meta = RESOURCE_ICONS[resource.resource_type] ?? RESOURCE_ICONS.article
            return (
              <button
                key={resource.id}
                onClick={() => handleOpen(resource)}
                disabled={!resource.url}
                className="group bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-3 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-60 disabled:cursor-default"
                style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-xl mt-0.5"
                  style={{ width: 36, height: 36, background: meta.bg, color: meta.color }}
                >
                  {meta.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug flex-1">{resource.title}</p>
                    {resource.url && (
                      <ExternalLink size={13} className="flex-shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors" />
                    )}
                  </div>
                  {resource.description && (
                    <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{resource.description}</p>
                  )}
                  <span
                    className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: meta.bg, color: meta.color, fontSize: 10 }}
                  >
                    {t(`dashboard.resources.${resource.resource_type}` as any, resource.resource_type)}
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
