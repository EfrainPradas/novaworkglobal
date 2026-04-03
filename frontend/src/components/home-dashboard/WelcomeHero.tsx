import { useTranslation } from 'react-i18next'
import type { DashboardOverview } from '../../types/home-dashboard'
import MarketPulse from './MarketPulse'

interface WelcomeHeroProps {
  userName: string | null
  overview: DashboardOverview | null
  loading?: boolean
}

interface StatCardProps {
  label: string
  value: number | string
  sub: string
  subColor?: string
}

function StatCard({ label, value, sub, subColor = '#16A34A' }: StatCardProps) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <p className="text-xs text-slate-400 dark:text-gray-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
      <p className="text-xs font-semibold" style={{ color: subColor }}>{sub}</p>
    </div>
  )
}

export default function WelcomeHero({ userName, overview, loading = false }: WelcomeHeroProps) {
  const { t } = useTranslation()

  const firstName = userName?.split(' ')[0] ?? ''
  const pct = overview?.profile_completion_percent ?? 0
  const resumes = overview?.resume_versions_count ?? 0
  const downloads = overview?.resume_downloads_count ?? 0
  const apps = overview?.applications_count ?? 0
  const interviews = overview?.interviews_count ?? 0

  return (
    <div className="mb-5">
      {/* Date + Greeting */}
      <p className="text-xs text-slate-400 dark:text-gray-400 mb-0.5">
        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-4">
        {firstName
          ? t('dashboard.home.greeting', { name: firstName })
          : t('dashboard.home.title')}
      </h1>

      {/* Card: Market Pulse (left) + Stats (right) */}
      <div
        className="rounded-2xl p-6 flex flex-col lg:flex-row gap-6 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
      >
        {/* Left: Market Pulse news */}
        <div className="flex-1 min-w-0">
          <MarketPulse />
        </div>

        {/* Divider */}
        <div className="hidden lg:block w-px bg-slate-100 dark:bg-gray-700 flex-shrink-0" />

        {/* Right: 2×2 stats grid */}
        <div className="grid grid-cols-2 gap-3 lg:w-72 flex-shrink-0">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 animate-pulse bg-slate-50 dark:bg-gray-900 border border-slate-200 dark:border-gray-700"
                style={{ height: 88 }}
              />
            ))
          ) : (
            <>
              <StatCard
                label={t('dashboard.statsSection.profileCompletion')}
                value={`${pct}%`}
                sub={pct === 100 ? '✓ Complete' : `+${Math.min(pct, 12)}% this month`}
              />
              <StatCard
                label={t('dashboard.statsSection.resumeVersions')}
                value={resumes}
                sub={`${downloads} downloaded`}
              />
              <StatCard
                label={t('dashboard.statsSection.applications')}
                value={apps}
                sub={apps > 0 ? `${Math.min(apps, 7)} this week` : 'Get started'}
                subColor={apps > 0 ? '#16A34A' : '#94A3B8'}
              />
              <StatCard
                label={t('dashboard.statsSection.interviews')}
                value={interviews}
                sub={interviews > 0 ? `${Math.min(interviews, 2)} upcoming` : 'None yet'}
                subColor={interviews > 0 ? '#16A34A' : '#94A3B8'}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
