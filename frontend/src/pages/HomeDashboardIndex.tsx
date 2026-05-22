import { useEffect, useMemo, useRef } from 'react'
import { useOutletContext, useSearchParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Target, FileText, Briefcase, MessageCircle, ArrowRight, ArrowUpRight,
  ChevronLeft, ChevronRight, Sparkles,
} from 'lucide-react'
import { SmartGuideWelcome } from '../components/guided-path'
import GuidedPathProgress from '../components/guided-path/GuidedPathProgress'
import { useGuidedPath } from '../contexts/GuidedPathContext'
import { STEP_DISPLAY_CONFIG, STEP_ROUTE_MAP } from '../constants/guidedPath'
import type { GuidedStepKey } from '../types/guidedPath'
import type { DashboardOverview, TierLevel } from '../types/home-dashboard'

interface DashboardOutletContext {
  user: any
  userProfile: any
  userName: string | null
  userLevel: TierLevel
  overview: DashboardOverview | null
  overviewLoading: boolean
}

type ProgramKey = 'careerVision' | 'resumeBuilder' | 'jobSearch' | 'interviewMastery'

type ProgramCard = {
  key: ProgramKey
  route: string
  Icon: typeof Target
  cta: string
  description: string
}

const PROGRAMS: ProgramCard[] = [
  { key: 'careerVision', route: '/dashboard/career-vision', Icon: Target, cta: 'dashboard.ascendia.clarify',
    description: 'dashboard.ascendia.careerVisionDesc' },
  { key: 'resumeBuilder', route: '/dashboard/resume-builder', Icon: FileText, cta: 'dashboard.ascendia.build',
    description: 'dashboard.ascendia.resumeBuilderDesc' },
  { key: 'jobSearch', route: '/dashboard/job-search-hub', Icon: Briefcase, cta: 'dashboard.ascendia.explore',
    description: 'dashboard.ascendia.jobSearchDesc' },
  { key: 'interviewMastery', route: '/dashboard/interview', Icon: MessageCircle, cta: 'dashboard.ascendia.prepare',
    description: 'dashboard.ascendia.interviewMasteryDesc' },
]

function buildMonthGrid(d: Date) {
  const year = d.getFullYear()
  const month = d.getMonth()
  const first = new Date(year, month, 1)
  const startWeekday = first.getDay() // 0 Sun … 6 Sat
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev = new Date(year, month, 0).getDate()
  const cells: { day: number; muted: boolean; current: boolean }[] = []
  for (let i = startWeekday - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, muted: true, current: false })
  for (let i = 1; i <= daysInMonth; i++) cells.push({ day: i, muted: false, current: i === d.getDate() })
  const trailing = (7 - (cells.length % 7)) % 7
  for (let i = 1; i <= trailing; i++) cells.push({ day: i, muted: true, current: false })
  return cells
}

export default function HomeDashboardIndex() {
  const context = useOutletContext<DashboardOutletContext>()
  const { user, overview, overviewLoading } = context
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { enable, state, isLoading: guidedLoading, isGuidedMode, nextStep, isPathComplete } = useGuidedPath()
  const welcomeProcessedRef = useRef(false)

  // Post-payment auto-enable Smart Guide (preserved from previous version)
  useEffect(() => {
    if (welcomeProcessedRef.current) return
    if (searchParams.get('welcome') !== 'true') return
    if (!user?.id) return
    if (guidedLoading) return

    welcomeProcessedRef.current = true

    // Only auto-enable when the user has NEVER had a run. If a run exists
    // (even with guidance_enabled=false), the user has previously engaged
    // with Smart Guide and may have explicitly turned it off — respect that.
    if (!state?.has_active_run) {
      enable().catch(err => console.warn('[post-pay] Auto-enable Smart Guide failed:', err))
    }

    window.history.replaceState({}, '', '/dashboard')
  }, [searchParams, user?.id, enable, state, guidedLoading])

  // Continue Program — recommended next step from guided path
  const continueStep = useMemo(() => {
    if (!isGuidedMode || isPathComplete || !nextStep?.step_key) return null
    const stepKey = nextStep.step_key as GuidedStepKey
    const config = STEP_DISPLAY_CONFIG[stepKey]
    const route = STEP_ROUTE_MAP[stepKey] || nextStep.route_path
    return { config, route, displayName: nextStep.display_name }
  }, [isGuidedMode, isPathComplete, nextStep])

  const handleContinueProgram = () => {
    if (isPathComplete) {
      navigate('/dashboard/resume/final-preview')
      return
    }
    if (continueStep) {
      navigate(continueStep.route)
      return
    }
    // Guided mode is off — respect the user's choice and navigate to the
    // resume builder hub instead of silently re-enabling the guide.
    navigate('/dashboard/resume-builder')
  }

  // Calendar (current month)
  const today = new Date()
  const monthGrid = useMemo(() => buildMonthGrid(today), [today.getMonth(), today.getFullYear()])
  const monthLabel = today.toLocaleString(undefined, { month: 'long', year: 'numeric' })

  const profilePct = overview?.profile_completion_percent ?? 0

  return (
    <div
      className="px-6 pt-4 pb-6"
      style={{ color: 'var(--ascendia-text)' }}
    >
      <SmartGuideWelcome userId={user?.id} />

      {/* Two-column grid: main cards (fluid) + side cards (330) */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'minmax(0, 1fr) 330px', alignItems: 'start' }}>
        {/* ─── LEFT COLUMN ─────────────────────────────────────────── */}
        <div className="grid" style={{ gap: 4 }}>
          {/* Continue Program */}
          <section
            className="card-base cursor-pointer transition-shadow hover:shadow-md"
            onClick={handleContinueProgram}
            style={{
              background: 'var(--ascendia-surface)',
              border: '1px solid var(--ascendia-border)',
              borderRadius: 'var(--ascendia-radius-lg)',
              boxShadow: 'var(--ascendia-shadow-md)',
              padding: 14,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                className="grid place-items-center mb-2"
                style={{
                  width: 36, height: 36,
                  borderRadius: 'var(--ascendia-radius-md)',
                  background: 'var(--ascendia-primary)',
                  color: 'var(--ascendia-primary-foreground)',
                }}
              >
                <ArrowUpRight size={18} strokeWidth={2.2} />
              </div>
              <h3 className="text-lg font-bold tracking-tight mb-1">{t('dashboard.ascendia.continueProgram')}</h3>
              <p className="text-[15px] leading-relaxed" style={{ color: 'var(--ascendia-text-muted)' }}>
                {isPathComplete
                  ? t('dashboard.ascendia.continueProgramComplete')
                  : continueStep
                    ? (continueStep.config?.description || t('dashboard.ascendia.continueProgramNext', { step: continueStep.config?.title || continueStep.displayName }))
                    : t('dashboard.ascendia.continueProgramFallback')}
              </p>
            </div>
            <div
              className="mt-2 text-xs font-extrabold tracking-widest uppercase"
              style={{ color: 'var(--ascendia-primary)' }}
            >
              {isPathComplete
                ? t('dashboard.cta.viewResume')
                : continueStep
                  ? t('dashboard.cta.continue')
                  : t('dashboard.cta.startCta')} ›
            </div>
          </section>

          {/* 2 × 2 Program grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {PROGRAMS.map(({ key, route, Icon, cta, description }) => (
              <article
                key={key}
                onClick={() => navigate(route)}
                className="cursor-pointer transition-shadow hover:shadow-md"
                style={{
                  background: 'var(--ascendia-surface)',
                  border: '1px solid var(--ascendia-border)',
                  borderRadius: 'var(--ascendia-radius-lg)',
                  boxShadow: 'var(--ascendia-shadow-md)',
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div
                    className="grid place-items-center mb-2"
                    style={{
                      width: 36, height: 36,
                      borderRadius: 'var(--ascendia-radius-md)',
                      background: 'var(--ascendia-accent)',
                      color: 'var(--ascendia-primary)',
                    }}
                  >
                    <Icon size={22} />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight mb-1">
                    {t(`learningModules.${key}`)}
                  </h3>
                  <p className="text-[15px] leading-relaxed max-w-sm" style={{ color: 'var(--ascendia-text-muted)' }}>
                    {t(description)}
                  </p>
                </div>
                <div
                  className="mt-2 text-xs font-extrabold tracking-widest uppercase"
                  style={{ color: 'var(--ascendia-primary)' }}
                >
                  {t(cta)} ›
                </div>
              </article>
            ))}
          </section>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────────────────── */}
        <aside className="grid gap-5">
          {/* Smart Guide journey — only when guided mode is active */}
          {isGuidedMode && (
            <section
              style={{
                background: 'var(--ascendia-surface)',
                border: '1px solid var(--ascendia-border)',
                borderRadius: 'var(--ascendia-radius-lg)',
                boxShadow: 'var(--ascendia-shadow-md)',
                padding: '20px 22px 18px',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: 'var(--ascendia-primary)' }} />
                <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--ascendia-text)' }}>
                  {t('dashboard.smartGuide')}
                </h2>
              </div>
              <GuidedPathProgress compact />
            </section>
          )}

          {/* Progress card */}
          <section
            style={{
              background: 'var(--ascendia-surface)',
              border: '1px solid var(--ascendia-border)',
              borderRadius: 'var(--ascendia-radius-lg)',
              boxShadow: 'var(--ascendia-shadow-md)',
              padding: 26,
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.ascendia.progress')}</h2>
              <span
                className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest"
                style={{
                  background: 'var(--ascendia-accent)',
                  color: 'var(--ascendia-primary)',
                  borderRadius: 'var(--ascendia-radius-md)',
                }}
              >
                {profilePct >= 100 ? t('dashboard.statsSection.allSet') : t('dashboard.statsSection.inProgress')}
              </span>
            </div>

            <div className="grid place-items-center my-4">
              <div
                className="relative grid place-items-center"
                style={{
                  width: 138, height: 138, borderRadius: '50%',
                  background: `conic-gradient(var(--ascendia-secondary) ${profilePct * 3.6}deg, var(--ascendia-border-soft) 0)`,
                }}
              >
                <div
                  style={{
                    position: 'absolute', inset: 8, borderRadius: '50%',
                    background: 'var(--ascendia-surface)',
                    border: '2px solid var(--ascendia-text)',
                  }}
                />
                <div className="relative z-10 text-center">
                  <strong className="block text-3xl font-extrabold tracking-tight">
                    {overviewLoading ? '…' : `${profilePct}%`}
                  </strong>
                  <span className="block text-[10px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ascendia-text-muted)' }}>
                    {t('dashboard.ascendia.complete')}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-[15px] font-extrabold mb-5">{t('dashboard.ascendia.profileCompletion')}</div>
            <div className="h-px mb-2" style={{ background: 'var(--ascendia-border)' }} />

            <Stat icon="▤" label={t('dashboard.statsSection.resumeVersions')} value={overview?.resume_versions_count ?? 0} />
            <Stat icon="▷" label={t('dashboard.statsSection.applications')} value={overview?.applications_count ?? 0} />
            <Stat icon="▱" label={t('dashboard.statsSection.interviews')} value={overview?.interviews_count ?? 0} />
            <Stat icon="▣" label={t('dashboard.statsSection.sessionsJoined')} value={overview?.sessions_joined_count ?? 0} />
          </section>

          {/* Calendar card */}
          <section
            style={{
              background: 'var(--ascendia-surface)',
              border: '1px solid var(--ascendia-border)',
              borderRadius: 'var(--ascendia-radius-lg)',
              boxShadow: 'var(--ascendia-shadow-md)',
              padding: '24px 26px 22px',
            }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-2xl font-bold tracking-tight capitalize">{monthLabel}</h2>
              <div className="flex gap-4" style={{ color: 'var(--ascendia-text)' }}>
                <ChevronLeft size={20} />
                <ChevronRight size={20} />
              </div>
            </div>
            <div className="grid grid-cols-7 text-center mb-6" style={{ rowGap: 13, columnGap: 10 }}>
              {[0,1,2,3,4,5,6].map(i => (
                <div key={i} className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--ascendia-text-muted)' }}>{t(`dashboard.ascendia.calendarDay${i}`)}</div>
              ))}
              {monthGrid.map((c, i) => (
                <div
                  key={i}
                  className="grid place-items-center text-[13px] font-semibold"
                  style={{
                    height: 26,
                    borderRadius: 'var(--ascendia-radius-md)',
                    color: c.current
                      ? 'var(--ascendia-primary-foreground)'
                      : c.muted ? '#B9C1BD' : 'var(--ascendia-text)',
                    background: c.current ? 'var(--ascendia-primary)' : 'transparent',
                    fontWeight: c.current ? 800 : 600,
                    boxShadow: c.current ? '0 10px 20px rgba(14,75,43,0.22)' : 'none',
                  }}
                >
                  {c.day}
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/dashboard/sessions')}
              className="w-full text-xs font-black uppercase tracking-widest transition-colors"
              style={{
                height: 44,
                background: 'var(--ascendia-surface)',
                color: 'var(--ascendia-primary)',
                border: '1px solid var(--ascendia-primary)',
                borderRadius: 'var(--ascendia-radius-md)',
              }}
            >
              {t('dashboard.cta.viewSchedule')}
            </button>
          </section>
        </aside>
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number }) {
  return (
    <div
      className="grid items-center text-sm"
      style={{
        gridTemplateColumns: '24px 1fr auto',
        gap: 10,
        minHeight: 38,
        color: 'var(--ascendia-text)',
      }}
    >
      <span className="text-base" style={{ color: 'var(--ascendia-text-muted)' }}>{icon}</span>
      <span>{label}</span>
      <strong className="text-[15px]" style={{ color: 'var(--ascendia-text)' }}>{value}</strong>
    </div>
  )
}