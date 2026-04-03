import { useTranslation } from 'react-i18next'
import { FileText, Briefcase, Users, Monitor, CheckCircle } from 'lucide-react'
import type { DashboardOverview } from '../../types/home-dashboard'
import LoadingCard from './states/LoadingCard'

interface ProgressSummaryProps {
  overview: DashboardOverview | null
  loading: boolean
  compact?: boolean
}

interface StatItemProps {
  icon: React.ReactNode
  label: string
  value: number | string
  iconBg: string
  iconColor: string
}

function StatItem({ icon, label, value, iconBg, iconColor }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span
        className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 36, height: 36, background: iconBg, color: iconColor }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 dark:text-gray-400 leading-tight">{label}</p>
        <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{value}</p>
      </div>
    </div>
  )
}

export default function ProgressSummary({ overview, loading, compact = false }: ProgressSummaryProps) {
  const { t } = useTranslation()

  if (loading) return <LoadingCard lines={5} className="mb-5" />

  const pct = overview?.profile_completion_percent ?? 0

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl border border-slate-100 dark:border-gray-700 p-5 ${compact ? '' : 'mb-5'}`}
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
    >
      <h2 className="text-sm font-semibold text-slate-700 dark:text-gray-200 mb-3">{t('dashboard.statsSection.title')}</h2>

      {/* Profile completion ring */}
      <div className="flex items-center gap-4 pb-3 mb-3 border-b border-slate-100 dark:border-gray-700">
        <svg width={56} height={56} className="flex-shrink-0">
          <circle cx={28} cy={28} r={22} fill="none" stroke="#E2E8F0" strokeWidth={5} />
          <circle
            cx={28} cy={28} r={22}
            fill="none"
            stroke="#1976D2"
            strokeWidth={5}
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 22}`}
            strokeDashoffset={`${2 * Math.PI * 22 * (1 - pct / 100)}`}
            transform="rotate(-90 28 28)"
            style={{ transition: 'stroke-dashoffset 0.7s ease' }}
          />
          <text x={28} y={33} textAnchor="middle" fontSize={13} fontWeight={700} fill="#1E293B">
            {pct}%
          </text>
        </svg>
        <div>
          <p className="text-xs text-slate-400 dark:text-gray-400">{t('dashboard.statsSection.profileCompletion')}</p>
          {pct === 100
            ? <div className="flex items-center gap-1 text-green-600 text-sm font-semibold mt-0.5"><CheckCircle size={14} /> Complete</div>
            : <p className="text-sm font-semibold text-slate-700 dark:text-gray-200 mt-0.5">{pct}% done</p>
          }
        </div>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-gray-700">
        <StatItem
          icon={<FileText size={16} />}
          label={t('dashboard.statsSection.resumeVersions')}
          value={overview?.resume_versions_count ?? 0}
          iconBg="#E3F2FD" iconColor="#1565C0"
        />
        <StatItem
          icon={<Briefcase size={16} />}
          label={t('dashboard.statsSection.applications')}
          value={overview?.applications_count ?? 0}
          iconBg="#FFF3E0" iconColor="#E65100"
        />
        <StatItem
          icon={<Users size={16} />}
          label={t('dashboard.statsSection.interviews')}
          value={overview?.interviews_count ?? 0}
          iconBg="#F3E5F5" iconColor="#7B1FA2"
        />
        <StatItem
          icon={<Monitor size={16} />}
          label={t('dashboard.statsSection.sessionsJoined')}
          value={overview?.sessions_joined_count ?? 0}
          iconBg="#E8F5E9" iconColor="#2E7D32"
        />
      </div>
    </div>
  )
}
