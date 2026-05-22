import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FileText, Briefcase, Users, Monitor, CheckCircle } from 'lucide-react'
import { getDashboardOverview } from '../../services/home-dashboard/dashboard.service'
import type { DashboardOverview } from '../../types/home-dashboard'
import { GuidedModeToggle, GuidedPathProgress } from '../guided-path'

interface DashboardRightPanelProps {
  userId: string | null
}

/* ─── Stat Row ────────────────────────────────────────────── */
function StatRow({ icon, label, value, iconBg, iconColor }: {
  icon: React.ReactNode
  label: string
  value: number | string
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 dark:border-gray-700 last:border-0">
      <span className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 34, height: 34, background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 dark:text-gray-400 leading-tight truncate">{label}</p>
      </div>
      <p className="text-base font-bold text-slate-800 dark:text-white flex-shrink-0">{value}</p>
    </div>
  )
}

/* ─── Main Component ──────────────────────────────────────── */
export default function DashboardRightPanel({ userId }: DashboardRightPanelProps) {
  const { t } = useTranslation()
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    getDashboardOverview(userId).then(data => {
      setOverview(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [userId])

  const pct = overview?.profile_completion_percent ?? 0

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">

      {/* ── Smart Guide Toggle ── */}
      <GuidedModeToggle />

      {/* ── Guided Path Progress (compact journey map) ── */}
      <GuidedPathProgress compact />

      {/* ── Your Progress ── */}
      <div className="p-4" style={{
        borderRadius: 'var(--ascendia-radius-lg)',
        border: '1px solid var(--ascendia-border)',
        background: 'var(--ascendia-surface)',
        boxShadow: 'var(--ascendia-shadow-md)',
      }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">
          {t('dashboard.statsSection.title', 'Your Progress')}
        </p>

        {/* Profile Completion Ring */}
        <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100 dark:border-gray-700">
          {loading ? (
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          ) : (
            <svg width={52} height={52} className="flex-shrink-0">
              <circle cx={26} cy={26} r={20} fill="none" stroke="var(--ascendia-border)" strokeWidth={5} />
              <circle
                cx={26} cy={26} r={20}
                fill="none" stroke="var(--ascendia-primary)" strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                transform="rotate(-90 26 26)"
                style={{ transition: 'stroke-dashoffset 0.7s ease' }}
              />
              <text x={26} y={31} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--ascendia-text)">{pct}%</text>
            </svg>
          )}
          <div>
            <p className="text-xs text-slate-400 dark:text-gray-400">{t('dashboard.statsSection.profileCompletion', 'Profile Completion')}</p>
            {!loading && pct === 100
              ? <div className="flex items-center gap-1 text-green-600 text-sm font-semibold mt-0.5"><CheckCircle size={13} /> {t('dashboard.statsSection.complete', 'Complete')}</div>
              : <p className="text-sm font-semibold text-slate-700 dark:text-gray-200 mt-0.5">{loading ? '...' : t('dashboard.statsSection.pctDone', '{{pct}}% done', { pct })}</p>
            }
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg bg-slate-100 dark:bg-gray-700 animate-pulse" />)}
          </div>
        ) : (
          <div>
            <StatRow icon={<FileText size={15} />} label={t('dashboard.statsSection.resumeVersions', 'Resume Versions')}
              value={overview?.resume_versions_count ?? 0} iconBg="var(--ascendia-accent)" iconColor="var(--ascendia-primary)" />
            <StatRow icon={<Briefcase size={15} />} label={t('dashboard.statsSection.applications', 'Applications')}
              value={overview?.applications_count ?? 0} iconBg="var(--ascendia-accent)" iconColor="var(--ascendia-primary)" />
            <StatRow icon={<Users size={15} />} label={t('dashboard.statsSection.interviews', 'Interviews')}
              value={overview?.interviews_count ?? 0} iconBg="var(--ascendia-accent)" iconColor="var(--ascendia-primary)" />
            <StatRow icon={<Monitor size={15} />} label={t('dashboard.statsSection.sessionsJoined', 'Sessions Joined')}
              value={overview?.sessions_joined_count ?? 0} iconBg="var(--ascendia-accent)" iconColor="var(--ascendia-primary)" />
          </div>
        )}
      </div>

      {/* Quick Actions moved to the left sidebar */}

    </div>
  )
}
