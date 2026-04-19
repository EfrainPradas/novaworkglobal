import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es as esLocale, enUS as enLocale } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import {
  RefreshCw,
  BookmarkPlus,
  XCircle,
  Sparkles,
  ExternalLink,
  Building2,
  Briefcase,
  CheckCircle2,
  FileText,
  X,
  Loader2,
} from 'lucide-react'
import {
  listMatches,
  refreshMatches,
  updateStatus,
  getTailoredCv,
  regenerateTailoredCv,
  type SmartMatchBrief,
  type MatchStatus,
  type OpenRole,
  type DetectionEvidence,
  type CvVersion,
} from '../../services/smartMatches.service'
import { loadResumeData, type ResumeData } from '../../services/resumeLoader'
import ResumeDocument from '../../components/resume/ResumeDocument'
import { supabase } from '../../lib/supabase'

function titleCase(s: string): string {
  return s
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
}

function useDateLocale() {
  const { i18n } = useTranslation()
  return i18n.language?.startsWith('es') ? esLocale : enLocale
}

function useRelativeDate() {
  const locale = useDateLocale()
  const { t } = useTranslation()
  return (iso: string | null): string => {
    if (!iso) return t('common.recently', { defaultValue: 'recently' })
    try {
      return `${formatDistanceToNow(parseISO(iso), { locale })}`
    } catch {
      return t('common.recently', { defaultValue: 'recently' })
    }
  }
}

function OpenRolesSection({
  roles,
  domain,
  evidence,
}: {
  roles: OpenRole[] | undefined
  domain: string
  evidence: DetectionEvidence | null
}) {
  const { t } = useTranslation()
  const relativeDate = useRelativeDate()
  const list = (roles || []).slice(0, 5)
  const label = (
    <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-1.5 flex items-center gap-1.5">
      <Briefcase size={12} /> {t('smartMatches.card.openPositions')}
    </dt>
  )

  const signals = evidence?.signals_analyzed ?? null
  const relDate = relativeDate(evidence?.last_signal_at ?? null)

  if (list.length === 0) {
    return (
      <div className="md:col-span-2 mt-1">
        {label}
        <dd className="text-sm text-gray-600 space-y-2">
          <p className="italic leading-relaxed">{t('smartMatches.card.emptyRoles')}</p>
          {signals != null && (
            <p className="text-xs text-gray-500">
              {t('smartMatches.card.basedOnSignalsEmpty', { count: signals, date: relDate })}
            </p>
          )}
          <a
            href={`https://${domain}/careers`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 font-medium"
          >
            {t('smartMatches.card.visitCareerSite')} <ExternalLink size={12} />
          </a>
        </dd>
      </div>
    )
  }

  return (
    <div className="md:col-span-2 mt-1">
      {label}
      <ul className="space-y-1">
        {list.map((r, idx) => {
          const title = r.title || ''
          const area = r.functional_area ? titleCase(r.functional_area) : null
          const loc = r.location ? ` — ${r.location}` : ''
          return (
            <li key={idx} className="text-sm text-gray-800 flex items-start gap-2">
              <span className="text-gray-400 mt-0.5">•</span>
              <span className="flex-1">
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary-600 hover:text-primary-700 inline-flex items-center gap-1"
                  >
                    {title} <ExternalLink size={11} />
                  </a>
                ) : (
                  <span>{title}</span>
                )}
                {area && (
                  <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary-50 text-primary-700 uppercase tracking-wide">
                    {area}
                  </span>
                )}
                {loc && <span className="text-gray-500">{loc}</span>}
              </span>
            </li>
          )
        })}
      </ul>
      {signals != null && (
        <p className="text-xs text-gray-500 mt-2">
          {t('smartMatches.card.basedOnSignalsFooter', { count: signals, date: relDate })}
        </p>
      )}
    </div>
  )
}

const TAB_KEYS: MatchStatus[] = ['proposed', 'saved', 'dismissed']

function scoreColor(score: number | null | undefined): string {
  if (score == null) return 'bg-gray-100 text-gray-700 border-gray-200'
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200'
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200'
  return 'bg-slate-50 text-slate-600 border-slate-200'
}

/* ──────────────── Tailored resume drawer ──────────────── */

function normalize(text: string | null | undefined): string {
  return (text || '').toLowerCase().replace(/\s+/g, ' ').trim()
}

/**
 * Overlay the CvVersion tailoring onto the full ResumeData:
 *  - replace `summary` with the tailored profile summary
 *  - for each bullet whose `original_text` matches an existing accomplishment,
 *    swap `bullet_text` with the LLM-rewritten `tailored_text` (in situ)
 *
 * Unmatched tailored bullets stay in the DB row (for internal analysis) but
 * are not surfaced in the rendered CV.
 */
function applyTailoringToResume(resume: ResumeData, version: CvVersion): ResumeData {
  const bullets = version.bullets_tailored || []
  const byOriginal = new Map<string, string>()
  bullets.forEach((b) => {
    const key = normalize(b.original_text)
    if (key && b.tailored_text) byOriginal.set(key, b.tailored_text)
  })

  const workExperience = (resume.work_experience || []).map((exp: any) => {
    const accomplishments = (exp.accomplishments || []).map((acc: any) => {
      const tailored = byOriginal.get(normalize(acc.bullet_text))
      if (tailored) {
        return { ...acc, bullet_text: tailored, source: 'smart_match_tailored' }
      }
      return acc
    })
    return { ...exp, accomplishments }
  })

  return {
    ...resume,
    summary: version.profile_summary_tailored || resume.summary,
    work_experience: workExperience,
  }
}

function TailoredCvDrawer({
  brief,
  version,
  onClose,
  onRegenerate,
  regenerating,
}: {
  brief: SmartMatchBrief
  version: CvVersion
  onClose: () => void
  onRegenerate: () => void
  regenerating: boolean
}) {
  const { t, i18n } = useTranslation()
  const relativeDate = useRelativeDate()
  const [resumeData, setResumeData] = useState<ResumeData | null>(null)
  const [loadingResume, setLoadingResume] = useState(true)
  const presentLabel = i18n.language?.startsWith('es') ? 'Actual' : 'Present'

  useEffect(() => {
    let cancelled = false
    setLoadingResume(true)
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const uid = data.user?.id
        if (!uid) {
          if (!cancelled) {
            setResumeData(null)
            setLoadingResume(false)
          }
          return
        }
        return loadResumeData(uid).then((rd) => {
          if (!cancelled) {
            setResumeData(rd)
            setLoadingResume(false)
          }
        })
      })
      .catch(() => {
        if (!cancelled) {
          setResumeData(null)
          setLoadingResume(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [brief.id, version.id])

  const tailoredResumeData = resumeData ? applyTailoringToResume(resumeData, version) : null

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="absolute inset-0 bg-gray-900/40" onClick={onClose} />
      <aside className="relative ml-auto h-full w-full max-w-3xl bg-gray-50 shadow-2xl overflow-y-auto">
        <header className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4 z-10">
          <div>
            <h2 className="text-lg font-semibold text-navy flex items-center gap-2">
              <FileText size={18} className="text-primary-600" />
              {t('smartMatches.drawer.title')} — {brief.domain}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('smartMatches.drawer.generatedRelative', {
                relative: relativeDate(version.created_at),
                model: version.generation_model || 'n/a',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={regenerating}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw size={14} className={regenerating ? 'animate-spin' : ''} />
              {regenerating ? t('smartMatches.drawer.regenerating') : t('smartMatches.drawer.regenerate')}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-gray-100 text-gray-500"
              aria-label={t('smartMatches.drawer.close')}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Pain interpretation — LLM's thesis of attack (shown first for quick validation) */}
          {version.pain_interpretation && (
            <section className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 mb-3 flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-bold">
                !
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 mb-1">
                  {t('smartMatches.drawer.painInterpretation')}
                </p>
                <p className="text-sm text-amber-900 leading-relaxed">
                  {version.pain_interpretation}
                </p>
              </div>
            </section>
          )}

          {/* Gaps — proof points the LLM confessed were missing */}
          {version.gaps && (
            <section className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-2.5 mb-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800 mb-1">
                {t('smartMatches.drawer.gaps')}
              </p>
              <p className="text-sm text-rose-900 leading-relaxed">{version.gaps}</p>
            </section>
          )}

          {/* Context banner — positioning angle / what they seek / top role */}
          {(version.positioning_angle_used || version.what_they_seek_used || version.top_role_title_used) && (
            <section className="rounded-lg bg-primary-50 border border-primary-100 px-4 py-3 mb-4">
              {version.positioning_angle_used && (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 mb-1">
                    {t('smartMatches.drawer.positioningAngle')}
                  </p>
                  <p className="text-sm text-navy leading-relaxed">
                    {version.positioning_angle_used}
                  </p>
                </>
              )}
              {version.what_they_seek_used && (
                <p className="text-xs text-primary-700 mt-2">
                  <span className="font-semibold">{t('smartMatches.drawer.whatTheySeek')}</span>{' '}
                  <span className="text-gray-700">{version.what_they_seek_used}</span>
                </p>
              )}
              {version.top_role_title_used && (
                <p className="text-xs text-primary-700 mt-1">
                  <span className="font-semibold">{t('smartMatches.drawer.topRole')}</span>{' '}
                  <span className="text-gray-700">{version.top_role_title_used}</span>
                </p>
              )}
            </section>
          )}

          {/* Resume paper — full CV in final-preview format with tailored summary */}
          <div className="rounded-lg shadow-sm border border-gray-200 overflow-hidden bg-white">
            {loadingResume ? (
              <div className="flex items-center justify-center gap-2 py-16 text-gray-500">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-sm">{t('smartMatches.drawer.loadingResume', 'Loading resume…')}</span>
              </div>
            ) : tailoredResumeData ? (
              <ResumeDocument resumeData={tailoredResumeData} presentLabel={presentLabel} />
            ) : (
              <div className="p-8 text-center text-sm text-gray-500">
                {t('smartMatches.drawer.noResume', 'No resume found for this account yet.')}
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}

/* ──────────────── Match card ──────────────── */

function MatchCard({
  brief,
  cvVersion,
  onSave,
  onDismiss,
  onOpenCv,
  busy,
  cvLoading,
}: {
  brief: SmartMatchBrief
  cvVersion: CvVersion | null | undefined
  onSave: (id: string) => void
  onDismiss: (id: string) => void
  onOpenCv: (id: string) => void
  busy: boolean
  cvLoading: boolean
}) {
  const { t } = useTranslation()
  const s = brief.snapshot_neutral || ({} as SmartMatchBrief['snapshot_neutral'])
  const score = Math.round(brief.match_score ?? 0)
  const opportunityScore =
    s.opportunity_score != null ? Math.round(s.opportunity_score) : null
  const hasCv = !!cvVersion
  const showCvArea = brief.status === 'saved'

  return (
    <article className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm hover:shadow-md transition">
      <header className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center">
            <Building2 size={22} />
          </div>
          <div>
            <h3 className="font-semibold text-navy text-lg leading-tight">
              {brief.domain}
            </h3>
            {s.inferred_sector && (
              <p className="text-xs text-gray-500 mt-0.5">{s.inferred_sector}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {showCvArea && hasCv && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 size={12} /> {t('smartMatches.card.resumeTailored')}
            </span>
          )}
          <div className={`px-3 py-1 rounded-full text-sm font-semibold border ${scoreColor(score)}`}>
            {t('smartMatches.card.match')} {score}
          </div>
        </div>
      </header>

      {brief.match_rationale && (
        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
          {brief.match_rationale}
        </p>
      )}

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm mb-4">
        {s.match_insight && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-0.5">
              {t('smartMatches.card.matchInsight')}
            </dt>
            <dd className="text-gray-800">{s.match_insight}</dd>
          </div>
        )}
        {s.relevant_area && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-0.5">
              {t('smartMatches.card.relevantArea')}
            </dt>
            <dd className="text-gray-800">{s.relevant_area}</dd>
          </div>
        )}
        {s.what_they_seek && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-0.5">
              {t('smartMatches.card.whatTheySeek')}
            </dt>
            <dd className="text-gray-800">{s.what_they_seek}</dd>
          </div>
        )}
        {s.positioning_angle && (
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-gray-500 mb-0.5">
              {t('smartMatches.card.positioningAngle')}
            </dt>
            <dd className="text-gray-800">{s.positioning_angle}</dd>
          </div>
        )}
        <OpenRolesSection roles={s.open_roles} domain={brief.domain} evidence={s.detection_evidence} />
      </dl>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {opportunityScore != null && (
            <span>{t('smartMatches.card.opportunityScore')} <strong className="text-gray-700">{opportunityScore}</strong></span>
          )}
          <a
            href={`https://${brief.domain}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700"
          >
            {t('smartMatches.card.visitSite')} <ExternalLink size={12} />
          </a>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {showCvArea && hasCv && (
            <button
              onClick={() => onOpenCv(brief.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-primary-200 text-primary-700 text-sm font-medium hover:bg-primary-50"
            >
              <FileText size={14} /> {t('smartMatches.card.viewTailoredResume')}
            </button>
          )}
          {showCvArea && !hasCv && cvLoading && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500">
              <Loader2 size={14} className="animate-spin" /> {t('smartMatches.card.tailoringResume')}
            </span>
          )}
          {brief.status !== 'saved' && (
            <button
              disabled={busy}
              onClick={() => onSave(brief.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 disabled:opacity-50"
            >
              <BookmarkPlus size={14} /> {t('smartMatches.card.save')}
            </button>
          )}
          {brief.status !== 'dismissed' && (
            <button
              disabled={busy}
              onClick={() => onDismiss(brief.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              <XCircle size={14} /> {t('smartMatches.card.dismiss')}
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

/* ──────────────── Page ──────────────── */

export default function SmartMatches() {
  const { t } = useTranslation()
  const [tab, setTab] = useState<MatchStatus>('proposed')
  const [briefs, setBriefs] = useState<SmartMatchBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cvVersions, setCvVersions] = useState<Record<string, CvVersion | null>>({})
  const [cvLoadingId, setCvLoadingId] = useState<string | null>(null)
  const [drawerBriefId, setDrawerBriefId] = useState<string | null>(null)
  const [regenerating, setRegenerating] = useState(false)

  const load = useCallback(async (status: MatchStatus) => {
    setLoading(true)
    setError(null)
    try {
      const { briefs } = await listMatches(status)
      setBriefs(briefs)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load'
      setError(msg)
      setBriefs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(tab)
  }, [tab, load])

  useEffect(() => {
    if (tab !== 'saved' || briefs.length === 0) return
    const toFetch = briefs.filter((b) => !(b.id in cvVersions))
    if (toFetch.length === 0) return
    let cancelled = false
    Promise.all(
      toFetch.map(async (b) => {
        try {
          const { cv_version } = await getTailoredCv(b.id)
          return [b.id, cv_version] as const
        } catch {
          return [b.id, null] as const
        }
      }),
    ).then((entries) => {
      if (cancelled) return
      setCvVersions((prev) => {
        const next = { ...prev }
        for (const [id, ver] of entries) next[id] = ver
        return next
      })
    })
    return () => {
      cancelled = true
    }
  }, [tab, briefs, cvVersions])

  const handleRefresh = async () => {
    setRefreshing(true)
    setError(null)
    try {
      await refreshMatches()
      await load(tab)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Refresh failed')
    } finally {
      setRefreshing(false)
    }
  }

  const handleUpdate = async (id: string, status: MatchStatus) => {
    setUpdatingId(id)
    if (status === 'saved') setCvLoadingId(id)
    try {
      const resp = await updateStatus(id, status)
      if (status === 'saved' && resp.cv_version !== undefined) {
        setCvVersions((prev) => ({ ...prev, [id]: resp.cv_version || null }))
      }
      setBriefs((prev) => prev.filter((b) => b.id !== id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setUpdatingId(null)
      setCvLoadingId(null)
    }
  }

  const handleRegenerate = async (briefId: string) => {
    setRegenerating(true)
    try {
      const { cv_version } = await regenerateTailoredCv(briefId)
      setCvVersions((prev) => ({ ...prev, [briefId]: cv_version }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regenerate failed')
    } finally {
      setRegenerating(false)
    }
  }

  const counts = useMemo(() => ({ total: briefs.length }), [briefs])
  const drawerBrief = drawerBriefId ? briefs.find((b) => b.id === drawerBriefId) || null : null
  const drawerVersion = drawerBriefId ? cvVersions[drawerBriefId] || null : null

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <header className="mb-6">
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h1 className="text-2xl font-bold text-navy flex items-center gap-2">
              <Sparkles size={22} className="text-primary-600" />
              {t('smartMatches.title')}
            </h1>
            <p className="text-sm text-gray-600 mt-1">{t('smartMatches.subtitle')}</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary-600 text-white font-medium hover:bg-primary-700 disabled:opacity-50"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? t('smartMatches.refreshing') : t('smartMatches.refresh')}
          </button>
        </div>

        <nav className="flex gap-1 mt-4 border-b border-gray-200">
          {TAB_KEYS.map((key) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition ${
                tab === key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t(`smartMatches.tabs.${key}`)}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center text-gray-500">{t('smartMatches.loading')}</div>
      ) : counts.total === 0 ? (
        <div className="py-16 text-center border border-dashed border-gray-300 rounded-xl">
          <Sparkles size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 font-medium mb-1">{t('smartMatches.noMatchesTitle')}</p>
          <p className="text-sm text-gray-500 mb-4">
            {tab === 'proposed'
              ? t('smartMatches.noMatchesProposed')
              : t('smartMatches.noMatchesOther', { tab: t(`smartMatches.tabs.${tab}`) })}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {briefs.map((b) => (
            <MatchCard
              key={b.id}
              brief={b}
              cvVersion={cvVersions[b.id]}
              cvLoading={cvLoadingId === b.id}
              busy={updatingId === b.id}
              onSave={(id) => handleUpdate(id, 'saved')}
              onDismiss={(id) => handleUpdate(id, 'dismissed')}
              onOpenCv={(id) => setDrawerBriefId(id)}
            />
          ))}
        </div>
      )}

      {drawerBrief && drawerVersion && (
        <TailoredCvDrawer
          brief={drawerBrief}
          version={drawerVersion}
          onClose={() => setDrawerBriefId(null)}
          onRegenerate={() => handleRegenerate(drawerBrief.id)}
          regenerating={regenerating}
        />
      )}
    </div>
  )
}
