import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Newspaper, CheckCircle2, XCircle, Send, Star, StarOff,
  ExternalLink, Filter, BarChart3, Clock, Eye, Pencil, Loader2
} from 'lucide-react'
import LoadingCard from '../../../components/home-dashboard/states/LoadingCard'
import EmptyState from '../../../components/home-dashboard/states/EmptyState'
import ErrorState from '../../../components/home-dashboard/states/ErrorState'
import {
  getCurationQueue,
  curateFeedItem,
  publishFeedItem,
  toggleFeatured,
  getFeedStats,
  aiGenerateField,
} from '../../../services/careerFeed.service'
import type { CurationEntry, CurationStatus, FeedStats } from '../../../types/career-feed'

// ─── Constants ──────────────────────────────────────────────

const STATUS_FILTERS: Array<CurationStatus | 'all'> = ['all', 'pending', 'approved', 'published', 'rejected']

const STATUS_COLORS: Record<CurationStatus, { bg: string; text: string }> = {
  pending:   { bg: '#FFF8E1', text: '#F57F17' },
  approved:  { bg: '#E8F5E9', text: '#2E7D32' },
  published: { bg: '#E3F2FD', text: '#1565C0' },
  rejected:  { bg: '#FFEBEE', text: '#C62828' },
  archived:  { bg: '#F5F5F5', text: '#757575' },
}

const ITEM_TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  article: { bg: '#E3F2FD', text: '#1565C0' },
  signal:  { bg: '#FFF3E0', text: '#E65100' },
  insight: { bg: '#F3E5F5', text: '#7B1FA2' },
  report:  { bg: '#E0F2F1', text: '#00695C' },
  trend:   { bg: '#FCE4EC', text: '#AD1457' },
}

// ─── Main Component ─────────────────────────────────────────

export default function CurationPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [items, setItems] = useState<CurationEntry[]>([])
  const [stats, setStats] = useState<FeedStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [activeFilter, setActiveFilter] = useState<CurationStatus | 'all'>('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [savingItem, setSavingItem] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  // ─── Data loading ───────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const statusFilter = activeFilter === 'all' ? undefined : activeFilter
      const [queueData, statsData] = await Promise.all([
        getCurationQueue(statusFilter, 100),
        getFeedStats(),
      ])
      setItems(queueData)
      setStats(statsData)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [activeFilter])

  useEffect(() => { loadData() }, [loadData])

  // ─── Actions ────────────────────────────────────────────

  const handleCurate = async (
    itemId: string,
    status: CurationStatus,
    fields?: { novaworkTake?: string; actionHint?: string; curatorNotes?: string; isFeatured?: boolean }
  ) => {
    setSavingItem(itemId)
    try {
      await curateFeedItem(itemId, { status, ...fields })
      setSaveSuccess(itemId)
      setTimeout(() => setSaveSuccess(null), 2000)
      await loadData()
    } catch (err) {
      console.error('[CurationPage] curate error:', err)
    } finally {
      setSavingItem(null)
    }
  }

  const handlePublish = async (itemId: string) => {
    setSavingItem(itemId)
    try {
      await publishFeedItem(itemId)
      setSaveSuccess(itemId)
      setTimeout(() => setSaveSuccess(null), 2000)
      await loadData()
    } catch (err) {
      console.error('[CurationPage] publish error:', err)
    } finally {
      setSavingItem(null)
    }
  }

  const handleToggleFeatured = async (itemId: string, current: boolean) => {
    setSavingItem(itemId)
    try {
      await toggleFeatured(itemId, !current)
      await loadData()
    } catch (err) {
      console.error('[CurationPage] toggleFeatured error:', err)
    } finally {
      setSavingItem(null)
    }
  }

  // ─── Render ─────────────────────────────────────────────

  const tf = (key: string) => t(`dashboard.careerFeed.${key}`)

  return (
    <div className="min-h-screen" style={{ background: '#F0F3F8', fontFamily: "'DM Sans', sans-serif" }}>
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
        <h1 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
          <Newspaper size={16} />
          {tf('curation')}
        </h1>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        {/* Header + Stats */}
        <div>
          <h2 className="text-xl font-bold text-slate-800">{tf('curation')}</h2>
          <p className="text-sm text-slate-400 mt-1">{tf('curationDesc')}</p>
        </div>

        {stats && <StatsBar stats={stats} tf={tf} />}

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={14} className="text-slate-400" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
              style={{
                background: activeFilter === f ? '#1976D2' : '#fff',
                color: activeFilter === f ? '#fff' : '#64748B',
                border: activeFilter === f ? 'none' : '1px solid #E2E8F0',
              }}
            >
              {tf(f === 'all' ? 'filterAll' : `filter${f.charAt(0).toUpperCase() + f.slice(1)}`)}
              {stats && f !== 'all' && (
                <span className="ml-1 opacity-70">
                  ({stats[f as keyof FeedStats] ?? 0})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid gap-4">
            {[0, 1, 2, 3].map((i) => <LoadingCard key={i} lines={4} />)}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <ErrorState
            message={tf('errorLoading')}
            retryLabel={t('dashboard.cta.retry')}
            onRetry={loadData}
          />
        )}

        {/* Empty */}
        {!loading && !error && items.length === 0 && (
          <EmptyState
            message={tf('emptyQueue')}
            icon={<Newspaper size={32} />}
          />
        )}

        {/* Queue list */}
        {!loading && !error && items.length > 0 && (
          <div className="space-y-3">
            {items.map((entry) => (
              <CurationCard
                key={entry.id}
                entry={entry}
                expanded={expandedItem === entry.item_id}
                onToggleExpand={() => setExpandedItem(expandedItem === entry.item_id ? null : entry.item_id)}
                onCurate={handleCurate}
                onPublish={handlePublish}
                onToggleFeatured={handleToggleFeatured}
                saving={savingItem === entry.item_id}
                saveSuccess={saveSuccess === entry.item_id}
                tf={tf}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Stats Bar ──────────────────────────────────────────────

function StatsBar({ stats, tf }: { stats: FeedStats; tf: (k: string) => string }) {
  const items = [
    { label: tf('stats.total'),     value: stats.total_items, color: '#475569' },
    { label: tf('stats.pending'),   value: stats.pending,     color: '#F57F17' },
    { label: tf('stats.approved'),  value: stats.approved,    color: '#2E7D32' },
    { label: tf('stats.published'), value: stats.published,   color: '#1565C0' },
    { label: tf('stats.rejected'),  value: stats.rejected,    color: '#C62828' },
    { label: tf('stats.featured'),  value: stats.featured,    color: '#7B1FA2' },
    { label: tf('stats.sources'),   value: stats.sources_active, color: '#00695C' },
  ]
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {items.map((s) => (
        <div
          key={s.label}
          className="bg-white rounded-xl border border-slate-100 p-3 text-center"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
        >
          <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
          <div className="text-[10px] font-medium text-slate-400 mt-0.5 uppercase tracking-wide">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

// ─── Curation Card ──────────────────────────────────────────

interface CurationCardProps {
  entry: CurationEntry
  expanded: boolean
  onToggleExpand: () => void
  onCurate: (itemId: string, status: CurationStatus, fields?: Record<string, unknown>) => void
  onPublish: (itemId: string) => void
  onToggleFeatured: (itemId: string, current: boolean) => void
  saving: boolean
  saveSuccess: boolean
  tf: (k: string) => string
}

function CurationCard({ entry, expanded, onToggleExpand, onCurate, onPublish, onToggleFeatured, saving, saveSuccess, tf }: CurationCardProps) {
  const item = entry.career_feed_items
  const source = item?.career_feed_sources
  const statusColor = STATUS_COLORS[entry.status] ?? STATUS_COLORS.pending
  const typeColor = ITEM_TYPE_COLORS[item?.item_type] ?? ITEM_TYPE_COLORS.article

  // Local form state for editing
  const [novaworkTake, setNovaworkTake] = useState(entry.novawork_take ?? '')
  const [actionHint, setActionHint] = useState(entry.action_hint ?? '')
  const [curatorNotes, setCuratorNotes] = useState(entry.curator_notes ?? '')
  const [aiLoading, setAiLoading] = useState<string | null>(null)

  // Sync local state when entry changes
  useEffect(() => {
    setNovaworkTake(entry.novawork_take ?? '')
    setActionHint(entry.action_hint ?? '')
    setCuratorNotes(entry.curator_notes ?? '')
  }, [entry.novawork_take, entry.action_hint, entry.curator_notes])

  const handleSave = (status: CurationStatus) => {
    onCurate(entry.item_id, status, {
      novaworkTake: novaworkTake || undefined,
      actionHint: actionHint || undefined,
      curatorNotes: curatorNotes || undefined,
    })
  }

  const handleAiGenerate = async (field: 'novawork_take' | 'action_hint' | 'curator_notes') => {
    setAiLoading(field)
    try {
      const text = await aiGenerateField(field, {
        title: item?.title ?? '',
        summary: item?.summary,
        category: item?.category,
        sourceSlug: source?.slug,
        targetRoles: item?.target_roles,
        targetIndustries: item?.target_industries,
        targetGeographies: item?.target_geographies,
        careerGoals: item?.career_goals,
      })
      if (field === 'novawork_take') setNovaworkTake(text)
      else if (field === 'action_hint') setActionHint(text)
      else setCuratorNotes(text)
    } catch (err) {
      console.error('[CurationCard] AI generate error:', err)
    } finally {
      setAiLoading(null)
    }
  }

  return (
    <div
      className="bg-white rounded-2xl border border-slate-100 transition-all hover:shadow-md overflow-hidden"
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      {/* Compact row */}
      <button
        onClick={onToggleExpand}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-50/50 transition-colors"
      >
        {/* Status badge */}
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
          style={{ background: statusColor.bg, color: statusColor.text }}
        >
          {tf(`status${entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}`)}
        </span>

        {/* Type badge */}
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: typeColor.bg, color: typeColor.text }}
        >
          {tf(`itemTypes.${item?.item_type ?? 'article'}`)}
        </span>

        {/* Featured star */}
        {entry.is_featured && (
          <Star size={14} className="shrink-0 text-amber-500 fill-amber-500" />
        )}

        {/* Title + source */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-800 truncate">{item?.title}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] text-slate-400">{source?.name}</span>
            {item?.category && (
              <>
                <span className="text-slate-200">|</span>
                <span className="text-[11px] text-slate-400">
                  {tf(`categories.${item.category}`)}
                </span>
              </>
            )}
            {item?.published_at && (
              <>
                <span className="text-slate-200">|</span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(item.published_at).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Relevance */}
        {item?.relevance_score > 0 && (
          <div className="shrink-0 text-right">
            <div className="text-xs font-bold text-slate-600">{item.relevance_score}</div>
            <div className="text-[9px] text-slate-300 uppercase">{tf('relevance')}</div>
          </div>
        )}

        <Eye size={16} className="shrink-0 text-slate-300" />
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3 space-y-4">
          {/* Summary */}
          {item?.summary && (
            <p className="text-sm text-slate-600 leading-relaxed">{item.summary}</p>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item?.target_roles?.map((r: string) => (
              <span key={r} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-600">{r.replace(/_/g, ' ')}</span>
            ))}
            {item?.target_industries?.map((i: string) => (
              <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-50 text-green-600">{i.replace(/_/g, ' ')}</span>
            ))}
            {item?.target_geographies?.map((g: string) => (
              <span key={g} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600">{g}</span>
            ))}
            {item?.career_goals?.map((cg: string) => (
              <span key={cg} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-600">{cg}</span>
            ))}
          </div>

          {/* External link */}
          {item?.content_url && (
            <a
              href={item.content_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
            >
              {tf('source')} <ExternalLink size={12} />
            </a>
          )}

          {/* NovaWork Take */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {tf('novaworkTake')}
              </label>
              <button
                onClick={() => handleAiGenerate('novawork_take')}
                disabled={aiLoading !== null}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all hover:bg-blue-50 disabled:opacity-40"
                style={{ color: '#1976D2' }}
                title={tf('aiGenerate')}
              >
                {aiLoading === 'novawork_take' ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                AI
              </button>
            </div>
            <textarea
              value={novaworkTake}
              onChange={(e) => setNovaworkTake(e.target.value)}
              placeholder={tf('novaworkTakePlaceholder')}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
            />
          </div>

          {/* Action Hint */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {tf('actionHint')}
              </label>
              <button
                onClick={() => handleAiGenerate('action_hint')}
                disabled={aiLoading !== null}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all hover:bg-green-50 disabled:opacity-40"
                style={{ color: '#2E7D32' }}
                title={tf('aiGenerate')}
              >
                {aiLoading === 'action_hint' ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                AI
              </button>
            </div>
            <textarea
              value={actionHint}
              onChange={(e) => setActionHint(e.target.value)}
              placeholder={tf('actionHintPlaceholder')}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-all resize-none"
            />
          </div>

          {/* Curator Notes */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                {tf('curatorNotes')}
              </label>
              <button
                onClick={() => handleAiGenerate('curator_notes')}
                disabled={aiLoading !== null}
                className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-all hover:bg-slate-50 disabled:opacity-40"
                style={{ color: '#64748B' }}
                title={tf('aiGenerate')}
              >
                {aiLoading === 'curator_notes' ? <Loader2 size={11} className="animate-spin" /> : <Pencil size={11} />}
                AI
              </button>
            </div>
            <textarea
              value={curatorNotes}
              onChange={(e) => setCuratorNotes(e.target.value)}
              placeholder={tf('curatorNotesPlaceholder')}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-green-200 focus:border-green-400 transition-all resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            {/* Approve */}
            {(entry.status === 'pending' || entry.status === 'rejected') && (
              <button
                onClick={() => handleSave('approved')}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: '#2E7D32' }}
              >
                <CheckCircle2 size={14} />
                {tf('approve')}
              </button>
            )}

            {/* Reject */}
            {entry.status !== 'rejected' && entry.status !== 'published' && (
              <button
                onClick={() => {
                  if (confirm(tf('confirmReject'))) handleSave('rejected')
                }}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: '#C62828' }}
              >
                <XCircle size={14} />
                {tf('reject')}
              </button>
            )}

            {/* Publish */}
            {(entry.status === 'approved') && (
              <button
                onClick={() => onPublish(entry.item_id)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: '#1565C0' }}
              >
                <Send size={14} />
                {tf('publish')}
              </button>
            )}

            {/* Save changes (for approved/published items) */}
            {(entry.status === 'approved' || entry.status === 'published') && (
              <button
                onClick={() => handleSave(entry.status)}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 border border-slate-200 text-slate-600 bg-white"
              >
                <BarChart3 size={14} />
                {saving ? tf('saving') : saveSuccess ? tf('saved') : tf('saveChanges')}
              </button>
            )}

            {/* Featured toggle */}
            {(entry.status === 'approved' || entry.status === 'published') && (
              <button
                onClick={() => onToggleFeatured(entry.item_id, entry.is_featured)}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 border text-slate-600 bg-white"
                style={{ borderColor: entry.is_featured ? '#F59E0B' : '#E2E8F0' }}
              >
                {entry.is_featured
                  ? <><StarOff size={14} className="text-amber-500" /> {tf('removeFeatured')}</>
                  : <><Star size={14} className="text-slate-400" /> {tf('markFeatured')}</>
                }
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
