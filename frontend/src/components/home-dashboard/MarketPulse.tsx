import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Lightbulb, BarChart2, ExternalLink, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface NewsItem {
  tag: 'trend' | 'strategy' | 'data' | 'insight'
  title: string
  excerpt: string
  url: string | null
  source?: string | null
}

const TAG_STYLES: Record<NewsItem['tag'], { bg: string; color: string; label: string; Icon: React.ComponentType<{ size?: number }> }> = {
  trend:    { bg: '#EFF6FF', color: '#1976D2', label: 'TREND',    Icon: TrendingUp },
  strategy: { bg: '#F0FDF4', color: '#16A34A', label: 'STRATEGY', Icon: Lightbulb },
  data:     { bg: '#FFF7ED', color: '#C2410C', label: 'DATA',     Icon: BarChart2 },
  insight:  { bg: '#F5F3FF', color: '#7C3AED', label: 'INSIGHT',  Icon: TrendingDown },
}

export default function MarketPulse() {
  const { t } = useTranslation()
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<string>('fallback')

  const fetchNews = async () => {
    setLoading(true)
    try {
      const apiBase = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiBase}/api/market-news`)
      const json = await res.json()
      setItems(json.items ?? [])
      setSource(json.source ?? 'fallback')
    } catch {
      // silently keep empty — fallback already handled by backend
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchNews() }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-xs font-bold tracking-widest" style={{ color: '#1976D2' }}>
              MARKET PULSE
            </p>
            {source === 'newsapi' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: '#F0FDF4', color: '#16A34A' }}>
                LIVE
              </span>
            )}
          </div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white leading-snug">
            {t('dashboard.marketPulse.title')}
          </h2>
        </div>
        <button
          onClick={fetchNews}
          className="p-1.5 rounded-lg text-slate-300 dark:text-gray-500 hover:text-slate-500 dark:hover:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* News items */}
      <div className="flex flex-col gap-3 flex-1">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-7 h-7 rounded-lg flex-shrink-0 mt-0.5 bg-slate-100 dark:bg-gray-700" />
              <div className="flex-1 space-y-1.5">
                <div className="h-2.5 rounded bg-slate-100 dark:bg-gray-700" style={{ width: '60%' }} />
                <div className="h-3 rounded bg-slate-100 dark:bg-gray-700" />
                <div className="h-2.5 rounded bg-slate-100 dark:bg-gray-700" style={{ width: '80%' }} />
              </div>
            </div>
          ))
        ) : (
          items.slice(0, 3).map((item, i) => {
            const { bg, color, label, Icon } = TAG_STYLES[item.tag] ?? TAG_STYLES.insight
            const Wrapper = item.url ? 'a' : 'div'
            const wrapperProps = item.url
              ? { href: item.url, target: '_blank', rel: 'noopener noreferrer' }
              : {}

            return (
              <Wrapper
                key={i}
                {...wrapperProps}
                className="flex gap-3 items-start group cursor-pointer rounded-xl p-2 -mx-2 transition-colors hover:bg-slate-50 dark:hover:bg-gray-700 no-underline"
              >
                <span
                  className="flex-shrink-0 flex items-center justify-center rounded-lg mt-0.5"
                  style={{ width: 30, height: 30, background: bg, color }}
                >
                  <Icon size={14} />
                </span>
                <div className="min-w-0">
                  <span
                    className="inline-block text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded-md mb-1"
                    style={{ background: bg, color }}
                  >
                    {label}
                  </span>
                  <p className="text-sm font-semibold text-slate-700 dark:text-gray-200 leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-gray-400 leading-relaxed mt-0.5 line-clamp-2">
                    {item.excerpt}
                  </p>
                  {item.source && (
                    <p className="text-[10px] text-slate-300 dark:text-gray-500 mt-0.5">{item.source}</p>
                  )}
                </div>
              </Wrapper>
            )
          })
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-gray-700 flex items-center justify-between">
        <button className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
          <ExternalLink size={12} />
          {t('dashboard.marketPulse.viewMore')}
        </button>
        {source === 'fallback' && (
          <span className="text-[10px] text-slate-300 dark:text-gray-500">Add NEWS_API_KEY for live news</span>
        )}
      </div>
    </div>
  )
}
