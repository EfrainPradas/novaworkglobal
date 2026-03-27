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

interface DashboardRightPanelProps {
  userId: string | null
}

/* ─── Mini Calendar ───────────────────────────────────────── */
function MiniCalendar({ onNavigate }: { onNavigate: () => void }) {
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
  const DAY_HEADERS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

  return (
    <button
      onClick={onNavigate}
      className="w-full text-left rounded-2xl border border-slate-100 p-4 hover:border-blue-200 transition-all"
      style={{ background: '#FAFBFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-slate-600 capitalize">{monthName}</p>
        <ChevronRight size={13} className="text-slate-300" />
      </div>
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map(d => (
          <div key={d} className="text-center text-[9px] font-bold text-slate-300">{d}</div>
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
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 34, height: 34, background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 leading-tight truncate">{label}</p>
      </div>
      <p className="text-base font-bold text-slate-800 flex-shrink-0">{value}</p>
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
      className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-slate-50 transition-colors group text-left"
    >
      <span className="flex-shrink-0 flex items-center justify-center rounded-xl"
        style={{ width: 32, height: 32, background: iconBg, color: iconColor }}>
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-slate-700 group-hover:text-slate-900 truncate">{label}</span>
      <ChevronRight size={13} className="flex-shrink-0 text-slate-300 group-hover:text-blue-500 transition-colors" />
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

      {/* ── Your Progress ── */}
      <div className="rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', background: '#fff' }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          {t('dashboard.statsSection.title', 'Your Progress')}
        </p>

        {/* Profile Completion Ring */}
        <div className="flex items-center gap-3 pb-3 mb-2 border-b border-slate-100">
          {loading ? (
            <div className="w-14 h-14 rounded-full bg-slate-100 animate-pulse flex-shrink-0" />
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
            <p className="text-xs text-slate-400">{t('dashboard.statsSection.profileCompletion', 'Profile Completion')}</p>
            {!loading && pct === 100
              ? <div className="flex items-center gap-1 text-green-600 text-sm font-semibold mt-0.5"><CheckCircle size={13} /> Complete</div>
              : <p className="text-sm font-semibold text-slate-700 mt-0.5">{loading ? '...' : `${pct}% done`}</p>
            }
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="space-y-2">
            {[1,2,3,4].map(i => <div key={i} className="h-8 rounded-lg bg-slate-100 animate-pulse" />)}
          </div>
        ) : (
          <div>
            <StatRow icon={<FileText size={15} />} label={t('dashboard.statsSection.resumeVersions', 'Resume Versions')}
              value={overview?.resume_versions_count ?? 0} iconBg="#E3F2FD" iconColor="#1565C0" />
            <StatRow icon={<Briefcase size={15} />} label={t('dashboard.statsSection.applications', 'Applications')}
              value={overview?.applications_count ?? 0} iconBg="#FFF3E0" iconColor="#E65100" />
            <StatRow icon={<Users size={15} />} label={t('dashboard.statsSection.interviews', 'Interviews')}
              value={overview?.interviews_count ?? 0} iconBg="#F3E5F5" iconColor="#7B1FA2" />
            <StatRow icon={<Monitor size={15} />} label={t('dashboard.statsSection.sessionsJoined', 'Sessions Joined')}
              value={overview?.sessions_joined_count ?? 0} iconBg="#E8F5E9" iconColor="#2E7D32" />
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="rounded-2xl border border-slate-100 p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)', background: '#fff' }}>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
          {t('dashboard.quickActionsPanel.title', 'Quick Actions')}
        </p>
        <div className="flex flex-col">
          <ActionRow icon={<UserCheck size={15} />} label={t('dashboard.quickActionsPanel.myCoaches', 'My Coaches / Book Session')}
            onClick={() => navigate('/dashboard/coaching')} iconBg="#F3E5F5" iconColor="#7B1FA2" />
          <ActionRow icon={<Upload size={15} />} label={t('dashboard.quickActionsPanel.uploadResume', 'Upload Resume')}
            onClick={() => navigate('/dashboard/resume-builder')} iconBg="#E3F2FD" iconColor="#1565C0" />
          <ActionRow icon={<Search size={15} />} label={t('dashboard.quickActionsPanel.analyzeJD', 'Analyze Job Description')}
            onClick={() => navigate('/dashboard/resume-builder/jd-analyzer')} iconBg="#E8F5E9" iconColor="#2E7D32" />
          <ActionRow icon={<Network size={15} />} label={t('dashboard.quickActionsPanel.joinNetworking', 'Join Networking')}
            onClick={() => navigate('/dashboard/networking-sessions')} iconBg="#FFF3E0" iconColor="#E65100" />
          <ActionRow icon={<Calendar size={15} />} label={t('dashboard.quickActionsPanel.viewCalendar', 'View Member Calendar')}
            onClick={() => navigate('/dashboard/member-calendar')} iconBg="#EFF6FF" iconColor="#1976D2" />
          <ActionRow icon={<FolderOpen size={15} />} label={t('dashboard.quickActionsPanel.sharedResources', 'Shared Resources')}
            onClick={() => navigate('/shared-resources')} iconBg="#F0FDF4" iconColor="#16A34A" />
        </div>
      </div>

    </div>
  )
}
