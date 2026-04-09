import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FileText, Briefcase, Users, Monitor, CheckCircle,
  UserCheck, FolderOpen, Calendar, Network, Search, Upload, ChevronRight
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getDashboardOverview } from '../../services/home-dashboard/dashboard.service'
import type { DashboardOverview } from '../../types/home-dashboard'
import { GuidedModeToggle, GuidedPathProgress } from '../guided-path'

interface DashboardRightPanelProps {
  userId: string | null
}

/* ─── Mini Calendar ───────────────────────────────────────── */
function MiniCalendar({ onNavigate }: { onNavigate: () => void }) {
  const { t } = useTranslation()
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const todayDate = today.getDate()
  const monthName = today.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)
  const DAY_HEADERS = [
    t('calendar.days.su', 'Su'),
    t('calendar.days.mo', 'Mo'),
    t('calendar.days.tu', 'Tu'),
    t('calendar.days.we', 'We'),
    t('calendar.days.th', 'Th'),
    t('calendar.days.fr', 'Fr'),
    t('calendar.days.sa', 'Sa'),
  ]

  return (
    <button
      onClick={onNavigate}
      className="w-full text-left rounded-2xl border border-slate-100 dark:border-gray-700 p-4 hover:border-blue-200 dark:hover:border-blue-700 transition-all bg-slate-50 dark:bg-gray-900"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 capitalize">{monthName}</p>
        <ChevronRight size={13} className="text-slate-300 dark:text-gray-500" />
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-300 dark:text-gray-500">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => (
          <div key={i} className="flex items-center justify-center h-5">
            {day !== null && (
              <span
                className="flex items-center justify-center rounded-full text-[10px] font-medium"
                style={{
                  width: 20, height: 20,
                  background: day === todayDate ? '#1976D2' : 'transparent',
                  color: day === todayDate ? '#fff' : day < todayDate ? '#CBD5E1' : '#334155',
                  fontWeight: day === todayDate ? 700 : 500,
                }}
              >
                {day}
              </span>
            )}
          </div>
        ))}
      </div>
    </button>
  )
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

/* ─── Quick Action Row ────────────────────────────────────── */
function ActionRow({ icon, label, onClick, iconBg, iconColor }: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  iconBg: string
  iconColor: string
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors group text-left"
    >
      <span className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 32, height: 32, background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-slate-700 dark:text-gray-200 group-hover:text-slate-900 dark:group-hover:text-white truncate">{label}</span>
      <ChevronRight size={13} className="flex-shrink-0 text-slate-300 dark:text-gray-500 group-hover:text-blue-500 transition-colors" />
    </button>
  )
}

/* ─── Main Component ──────────────────────────────────────── */
export default function DashboardRightPanel({ userId }: DashboardRightPanelProps) {
  const navigate = useNavigate()
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
      <div className="rounded-2xl border border-slate-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-3">
          {t('dashboard.statsSection.title', 'Your Progress')}
        </p>

        {/* Profile Completion Ring */}
        <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100 dark:border-gray-700">
          {loading ? (
            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-gray-700 animate-pulse flex-shrink-0" />
          ) : (
            <svg width={52} height={52} className="flex-shrink-0">
              <circle cx={26} cy={26} r={20} fill="none" stroke="#E2E8F0" strokeWidth={5} />
              <circle
                cx={26} cy={26} r={20}
                fill="none" stroke="#1976D2" strokeWidth={5} strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 20}`}
                strokeDashoffset={`${2 * Math.PI * 20 * (1 - pct / 100)}`}
                transform="rotate(-90 26 26)"
                style={{ transition: 'stroke-dashoffset 0.7s ease' }}
              />
              <text x={26} y={31} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1E293B">{pct}%</text>
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
              value={overview?.resume_versions_count ?? 0} iconBg="#eef6fc" iconColor="#1F5BAA" />
            <StatRow icon={<Briefcase size={15} />} label={t('dashboard.statsSection.applications', 'Applications')}
              value={overview?.applications_count ?? 0} iconBg="#eef6fc" iconColor="#1F5BAA" />
            <StatRow icon={<Users size={15} />} label={t('dashboard.statsSection.interviews', 'Interviews')}
              value={overview?.interviews_count ?? 0} iconBg="#eef6fc" iconColor="#1F5BAA" />
            <StatRow icon={<Monitor size={15} />} label={t('dashboard.statsSection.sessionsJoined', 'Sessions Joined')}
              value={overview?.sessions_joined_count ?? 0} iconBg="#eef6fc" iconColor="#1F5BAA" />
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl border border-slate-100 dark:border-gray-700 p-4 bg-white dark:bg-gray-800" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500 mb-2">
          {t('dashboard.quickActionsPanel.title', 'Quick Actions')}
        </p>
        <div className="flex flex-col">
          <ActionRow icon={<UserCheck size={15} />} label={t('dashboard.quickActionsPanel.myCoaches', 'My Coaches / Book Session')}
            onClick={() => navigate('/dashboard/coaching')} iconBg="#eef6fc" iconColor="#1F5BAA" />
          <ActionRow icon={<Upload size={15} />} label={t('dashboard.quickActionsPanel.uploadResume', 'Upload Resume')}
            onClick={() => navigate('/dashboard/resume-builder')} iconBg="#eef6fc" iconColor="#1F5BAA" />
          <ActionRow icon={<Search size={15} />} label={t('dashboard.quickActionsPanel.analyzeJD', 'Analyze Job Description')}
            onClick={() => navigate('/dashboard/resume-builder/jd-analyzer')} iconBg="#eef6fc" iconColor="#1F5BAA" />
          <ActionRow icon={<Network size={15} />} label={t('dashboard.quickActionsPanel.joinNetworking', 'Join Networking')}
            onClick={() => navigate('/dashboard/networking-sessions')} iconBg="#eef6fc" iconColor="#1F5BAA" />
          <ActionRow icon={<Calendar size={15} />} label={t('dashboard.quickActionsPanel.viewCalendar', 'View Member Calendar')}
            onClick={() => navigate('/dashboard/member-calendar')} iconBg="#eef6fc" iconColor="#1F5BAA" />
          <ActionRow icon={<FolderOpen size={15} />} label={t('dashboard.quickActionsPanel.sharedResources', 'Shared Resources')}
            onClick={() => navigate('/shared-resources')} iconBg="#eef6fc" iconColor="#1F5BAA" />
        </div>
      </div>

    </div>
  )
}
