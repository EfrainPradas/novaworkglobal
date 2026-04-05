/**
 * CareerIntelligenceCompact
 *
 * Compact version of the Career Intelligence Feed designed to replace
 * MarketPulse inside the WelcomeHero card. Same visual footprint,
 * now powered by curated feed data with NovaWork interpretation.
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp, Lightbulb, BarChart2, Newspaper, FileText, Activity,
  ExternalLink, RefreshCw, ChevronDown, ChevronUp, Star, Settings2,
} from 'lucide-react'
import FeedPreferencesModal from './FeedPreferencesModal'
import { getPersonalizedFeed } from '../../services/careerFeed.service'
import type { PersonalizedFeedItem, FeedItemType } from '../../types/career-feed'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TYPE_CONFIG: Record<FeedItemType, { Icon: any; bg: string; color: string; label: string }> = {
  signal:  { Icon: TrendingUp,  bg: '#FFF3E0', color: '#E65100', label: 'SIGNAL' },
  article: { Icon: Newspaper,   bg: '#E3F2FD', color: '#1565C0', label: 'ARTICLE' },
  insight: { Icon: Lightbulb,   bg: '#F3E5F5', color: '#7B1FA2', label: 'INSIGHT' },
  report:  { Icon: FileText,    bg: '#E0F2F1', color: '#00695C', label: 'REPORT' },
  trend:   { Icon: Activity,    bg: '#FCE4EC', color: '#AD1457', label: 'TREND' },
}

export default function CareerIntelligenceCompact() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [items, setItems] = useState<PersonalizedFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null)
  const [prefsOpen, setPrefsOpen] = useState(false)

  const tf = (key: string) => t(`dashboard.careerFeed.feed.${key}`)
  const tt = (key: string) => t(`dashboard.careerFeed.itemTypes.${key}`)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPersonalizedFeed(undefined, undefined, 5)
      setItems(data)
    } catch {
      // silent — fallback to empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold tracking-widest" style={{ color: '#1976D2' }}>
              {tf('sectionTitle').toUpperCase()}
            </p>
          </div>
          <h2 className="text-base font-bold text-slate-800 leading-snug">
            {tf('sectionSubtitle')}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPrefsOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
            title={tf('sectionTitle')}
          >
            <Settings2 size={13} />
          </button>
          <button
            onClick={load}
            className="p-1.5 rounded-lg text-slate-300 hover:text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Items */}
      <div className="flex flex-col gap-2.5 flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg flex-shrink-0 mt-0.5" style={{ background: '#F1F5F9' }} />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded" style={{ background: '#F1F5F9', width: '60%' }} />
                <div className="h-3 rounded" style={{ background: '#F1F5F9' }} />
                <div className="h-2.5 rounded" style={{ background: '#F1F5F9', width: '80%' }} />
              </div>
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">{tf('empty')}</p>
        ) : (
          items.slice(0, 3).map((item, i) => {
            const config = TYPE_CONFIG[item.item_type] ?? TYPE_CONFIG.article
            const { Icon, bg, color } = config
            const isExpanded = expandedIdx === i

            return (
              <div key={item.id}>
                <button
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                  className="w-full flex gap-3 items-start group rounded-xl p-2 -mx-2 transition-colors hover:bg-slate-50 text-left"
                >
                  <span
                    className="flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5"
                    style={{ width: 30, height: 30, background: bg, color }}
                  >
                    <Icon size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span
                        className="text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md"
                        style={{ background: bg, color }}
                      >
                        {tt(item.item_type).toUpperCase()}
                      </span>
                      {item.is_featured && (
                        <Star size={10} className="text-amber-500 fill-amber-500" />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-700 leading-snug group-hover:text-blue-700 transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-400 leading-relaxed mt-0.5 line-clamp-2">
                      {item.summary}
                    </p>
                    {item.source_name && (
                      <p className="text-[10px] text-slate-300 mt-0.5">{item.source_name}</p>
                    )}
                  </div>
                  {(item.novawork_take || item.action_hint) && (
                    <span className="shrink-0 mt-1 text-slate-300">
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  )}
                </button>

                {/* Expanded: NovaWork interpretation */}
                {isExpanded && (item.novawork_take || item.action_hint) && (
                  <div className="ml-10 mr-1 mb-1 space-y-2">
                    {item.novawork_take && (
                      <div className="rounded-lg px-3 py-2" style={{ background: '#F8FAFC' }}>
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                          <Lightbulb size={10} style={{ color: '#1565C0' }} />
                          {tf('whyItMatters')}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.novawork_take}</p>
                      </div>
                    )}
                    {item.action_hint && (
                      <div className="rounded-lg px-3 py-2" style={{ background: '#F0FDF4' }}>
                        <p className="text-[10px] font-bold text-slate-500 mb-0.5 flex items-center gap-1">
                          <TrendingUp size={10} style={{ color: '#16A34A' }} />
                          {tf('whatToDoNext')}
                        </p>
                        <p className="text-xs text-slate-600 leading-relaxed">{item.action_hint}</p>
                      </div>
                    )}
                    {item.content_url ? (
                      <a
                        href={item.content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:underline mt-1"
                      >
                        <ExternalLink size={10} />
                        {tf('readMore')}
                      </a>
                    ) : (
                      <p className="text-[10px] text-slate-300 italic mt-1">{tf('novaworkExclusive')}</p>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <button
          onClick={() => navigate('/dashboard/career-feed-curation')}
          className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
        >
          <ExternalLink size={12} />
          {tf('viewAll')}
        </button>
      </div>

      {/* Preferences modal */}
      <FeedPreferencesModal
        open={prefsOpen}
        onClose={() => setPrefsOpen(false)}
        onSaved={load}
      />
    </div>
  )
}
