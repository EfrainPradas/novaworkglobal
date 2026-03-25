import { CheckSquare, Calendar, Star } from 'lucide-react'
import type { DashboardStats } from '../../types/dashboard'

interface StatsCardProps {
  stats: DashboardStats
  loading: boolean
  weekLabel?: string
}

function ProgressRing({ percent, size = 56, strokeWidth = 5 }: { percent: number; size?: number; strokeWidth?: number }) {
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(percent, 100) / 100)
  const cx = size / 2
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E2E8F0" strokeWidth={strokeWidth} />
      <circle
        cx={cx} cy={cx} r={r}
        fill="none" stroke="#1976D2" strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${circ}`}
        strokeDashoffset={`${offset}`}
        transform={`rotate(-90 ${cx} ${cx})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  )
}

export default function StatsCard({ stats, loading, weekLabel = 'Mar 18–24' }: StatsCardProps) {
  if (loading) {
    return (
      <div className="mx-4 mb-4 rounded-2xl border p-5 animate-pulse" style={{ borderColor: '#E2E8F0' }}>
        <div className="h-3 rounded mb-4" style={{ background: '#F0F3F8', width: '60%' }} />
        <div className="flex items-center justify-between mb-3">
          <div className="h-10 w-16 rounded" style={{ background: '#F0F3F8' }} />
          <div className="w-14 h-14 rounded-full" style={{ background: '#F0F3F8' }} />
        </div>
        <div className="h-2 rounded-full mb-4" style={{ background: '#F0F3F8' }} />
        {[1,2,3].map(i => (
          <div key={i} className="flex justify-between mb-2">
            <div className="h-3 rounded" style={{ background: '#F0F3F8', width: '60%' }} />
            <div className="h-3 rounded" style={{ background: '#F0F3F8', width: '20%' }} />
          </div>
        ))}
      </div>
    )
  }

  const scorePercent = stats.resumeScore

  return (
    <div
      className="mx-4 mb-4 rounded-2xl border p-5"
      style={{ background: '#fff', borderColor: '#E2E8F0', borderWidth: '0.5px' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold" style={{ color: '#6B7A90', fontFamily: "'DM Sans', sans-serif" }}>
          Progress this week
        </p>
        <p className="text-[10px]" style={{ color: '#8A99B2' }}>{weekLabel}</p>
      </div>

      {/* Score row */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-[10px] mb-0.5" style={{ color: '#6B7A90' }}>Resume score</p>
          <div className="flex items-end gap-1.5">
            <span className="text-4xl font-bold leading-none" style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}>
              {scorePercent}
            </span>
          </div>
          {stats.resumeScoreDelta !== 0 && (
            <span className="text-xs font-medium" style={{ color: stats.resumeScoreDelta > 0 ? '#2E7D32' : '#C62828' }}>
              {stats.resumeScoreDelta > 0 ? '↑' : '↓'} +{Math.abs(stats.resumeScoreDelta)}
            </span>
          )}
        </div>
        <div className="relative">
          <ProgressRing percent={scorePercent} size={56} strokeWidth={5} />
          <span
            className="absolute inset-0 flex items-center justify-center text-xs font-bold"
            style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}
          >
            {scorePercent}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full overflow-hidden mb-5" style={{ background: '#E2E8F0' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${scorePercent}%`, background: '#1976D2' }}
        />
      </div>

      {/* Stats rows */}
      <div className="space-y-3 pt-3 border-t" style={{ borderColor: '#F0F3F8' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare size={14} className="text-blue-400" />
            <span className="text-xs" style={{ color: '#6B7A90', fontFamily: "'DM Sans', sans-serif" }}>
              Applications tracked
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}>
            {stats.applicationsTracked}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-green-400" />
            <span className="text-xs" style={{ color: '#6B7A90', fontFamily: "'DM Sans', sans-serif" }}>
              Interviews scheduled
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}>
            {stats.interviewsScheduled}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star size={14} className="text-orange-400" />
            <span className="text-xs" style={{ color: '#6B7A90', fontFamily: "'DM Sans', sans-serif" }}>
              Modules completed
            </span>
          </div>
          <span className="text-sm font-bold" style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}>
            {stats.modulesCompleted}/{stats.totalModules}
          </span>
        </div>
      </div>
    </div>
  )
}
