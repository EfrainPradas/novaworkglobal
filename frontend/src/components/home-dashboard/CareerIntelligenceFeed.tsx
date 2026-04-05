import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Newspaper, TrendingUp, Lightbulb, BarChart2, FileText, Activity,
  ExternalLink, Star, ChevronRight, ChevronDown, ChevronUp, Clock,
} from 'lucide-react'
import LoadingCard from './states/LoadingCard'
import EmptyState from './states/EmptyState'
import ErrorState from './states/ErrorState'
import { getPersonalizedFeed } from '../../services/careerFeed.service'
import type { PersonalizedFeedItem, FeedItemType, FeedCategory } from '../../types/career-feed'

// ─── Visual mapping ─────────────────────────────────────────

const TYPE_CONFIG: Record<FeedItemType, { icon: React.ReactNode; bg: string; color: string }> = {
  article: { icon: <Newspaper size={14} />,   bg: '#E3F2FD', color: '#1565C0' },
  signal:  { icon: <TrendingUp size={14} />,  bg: '#FFF3E0', color: '#E65100' },
  insight: { icon: <Lightbulb size={14} />,   bg: '#F3E5F5', color: '#7B1FA2' },
  report:  { icon: <FileText size={14} />,    bg: '#E0F2F1', color: '#00695C' },
  trend:   { icon: <Activity size={14} />,    bg: '#FCE4EC', color: '#AD1457' },
}

const CATEGORY_FILTERS: Array<FeedCategory | 'all'> = [
  'all', 'hiring_trends', 'skills_demand', 'ai_impact',
  'remote_work', 'salary', 'industry_shift', 'career_strategy',
  'economic_outlook', 'layoffs',
]

// ─── Main Component ─────────────────────────────────────────

interface CareerIntelligenceFeedProps {
  userId: string
}

export default function CareerIntelligenceFeed({ userId }: CareerIntelligenceFeedProps) {
  const { t } = useTranslation()
  const [items, setItems] = useState<PersonalizedFeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [categoryFilter, setCategoryFilter] = useState<FeedCategory | 'all'>('all')
  const [showAll, setShowAll] = useState(false)

  const tf = (key: string, opts?: Record<string, string>) => t(`dashboard.careerFeed.feed.${key}`, opts)
  const tc = (key: string) => t(`dashboard.careerFeed.categories.${key}`)
  const tt = (key: string) => t(`dashboard.careerFeed.itemTypes.${key}`)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const category = categoryFilter === 'all' ? undefined : categoryFilter
      const data = await getPersonalizedFeed(category, undefined, 20)
      setItems(data)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [categoryFilter])

  useEffect(() => { load() }, [load])

  const visibleItems = showAll ? items : items.slice(0, 4)

  return (
    <section className="mb-5">
      {/* Section header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{ width: 28, height: 28, background: '#E3F2FD', color: '#1565C0' }}
          >
            <BarChart2 size={15} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800">{tf('sectionTitle')}</h2>
            <p className="text-[11px] text-slate-400">{tf('sectionSubtitle')}</p>
          </div>
        </div>
      </div>

      {/* Category pills */}
      <div className="flex items-center gap-1.5 mt-3 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategoryFilter(cat); setShowAll(false) }}
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all whitespace-nowrap"
            style={{
              background: categoryFilter === cat ? '#1976D2' : '#fff',
              color: categoryFilter === cat ? '#fff' : '#64748B',
              border: categoryFilter === cat ? 'none' : '1px solid #E2E8F0',
            }}
          >
            {cat === 'all' ? tf('filterAll') : tc(cat)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <LoadingCard key={i} lines={3} />)}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <ErrorState
          message={tf('error')}
          retryLabel={t('dashboard.cta.retry')}
          onRetry={load}
        />
      )}

      {/* Empty */}
      {!loading && !error && items.length === 0 && (
        <EmptyState
          message={tf('empty')}
          icon={<Newspaper size={28} />}
        />
      )}

      {/* Feed items */}
      {!loading && !error && items.length > 0 && (
        <>
          <div className="space-y-3">
            {visibleItems.map((item) => (
              <FeedCard key={item.id} item={item} tf={tf} tt={tt} tc={tc} />
            ))}
          </div>

          {/* Show more / less */}
          {items.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all hover:bg-slate-50 text-slate-500"
            >
              {showAll ? (
                <><ChevronUp size={14} /> {t('common.backToDashboard')}</>
              ) : (
                <><ChevronDown size={14} /> {tf('viewAll')} ({items.length})</>
              )}
            </button>
          )}
        </>
      )}
    </section>
  )
}

// ─── Individual Feed Card ───────────────────────────────────

interface FeedCardProps {
  item: PersonalizedFeedItem
  tf: (key: string, opts?: Record<string, string>) => string
  tt: (key: string) => string
  tc: (key: string) => string
}

function FeedCard({ item, tf, tt, tc }: FeedCardProps) {
  const [expanded, setExpanded] = useState(false)
  const typeConfig = TYPE_CONFIG[item.item_type] ?? TYPE_CONFIG.article

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 overflow-hidden transition-all hover:shadow-md"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Card header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-slate-50/30 transition-colors"
      >
        {/* Type icon */}
        <span
          className="shrink-0 flex items-center justify-center rounded-xl mt-0.5"
          style={{ width: 34, height: 34, background: typeConfig.bg, color: typeConfig.color }}
        >
          {typeConfig.icon}
        </span>

        <div className="flex-1 min-w-0">
          {/* Badges row */}
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span
              className="px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider"
              style={{ background: typeConfig.bg, color: typeConfig.color }}
            >
              {tt(item.item_type)}
            </span>
            {item.category && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                {tc(item.category)}
              </span>
            )}
            {item.is_featured && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-600 flex items-center gap-0.5">
                <Star size={9} className="fill-amber-500" />
                {tf('featured')}
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-slate-800 leading-snug">{item.title}</h3>

          {/* Summary (always visible, 2-line clamp) */}
          {item.summary && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed line-clamp-2">{item.summary}</p>
          )}

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            <span>{item.source_name}</span>
            {item.published_at && (
              <span className="flex items-center gap-0.5">
                <Clock size={10} />
                {new Date(item.published_at).toLocaleDateString()}
              </span>
            )}
            {item.content_url ? (
              <a
                href={item.content_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-0.5 font-semibold text-blue-500 hover:text-blue-700 hover:underline transition-colors"
              >
                <ExternalLink size={10} />
                {tf('readMore')}
              </a>
            ) : (
              <span className="italic text-slate-300">{tf('novaworkExclusive')}</span>
            )}
          </div>
        </div>

        <ChevronRight
          size={16}
          className={`shrink-0 text-slate-300 mt-2 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
      </button>

      {/* Expanded content: NovaWork interpretation */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-50">
          {/* Why It Matters */}
          {item.novawork_take && (
            <div className="mt-3 rounded-xl p-3" style={{ background: '#F8FAFC' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 22, height: 22, background: '#E3F2FD', color: '#1565C0' }}
                >
                  <Lightbulb size={12} />
                </div>
                <span className="text-xs font-bold text-slate-700">{tf('whyItMatters')}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{item.novawork_take}</p>
            </div>
          )}

          {/* What To Do Next */}
          {item.action_hint && (
            <div className="rounded-xl p-3" style={{ background: '#F0FDF4' }}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{ width: 22, height: 22, background: '#DCFCE7', color: '#16A34A' }}
                >
                  <ChevronRight size={12} />
                </div>
                <span className="text-xs font-bold text-slate-700">{tf('whatToDoNext')}</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">{item.action_hint}</p>
            </div>
          )}

          {/* Read more link */}
          {item.content_url && (
            <a
              href={item.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline transition-colors"
              style={{ color: '#1976D2' }}
            >
              <ExternalLink size={12} />
              {tf('readMore')}
            </a>
          )}
        </div>
      )}
    </div>
  )
}
