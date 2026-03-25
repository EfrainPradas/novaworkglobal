import { Play, BookOpen } from 'lucide-react'
import {
  ClipboardList, Star, AlignLeft, Layers,
  Target, Briefcase, Users
} from 'lucide-react'
import StepCard from './StepCard'
import type { DashboardModule, ModuleId } from '../../types/dashboard'

interface ModulePanelProps {
  module: DashboardModule
  userName: string | null
  loading: boolean
  onWatchVideo: (src: string) => void
  onNavigate: (route: string) => void
}

// Icons per step (module → step index)
const STEP_ICONS: Record<ModuleId, Array<{ icon: React.ReactNode; bg: string; color: string }>> = {
  'resume-builder': [
    { icon: <ClipboardList size={16} />, bg: '#E3F2FD', color: '#1565C0' },
    { icon: <Star size={16} />,          bg: '#FFF3E0', color: '#E65100' },
    { icon: <AlignLeft size={16} />,     bg: '#F3E5F5', color: '#7B1FA2' },
    { icon: <Layers size={16} />,        bg: '#E8F5E9', color: '#2E7D32' },
  ],
  'career-vision': [
    { icon: <Target size={16} />,       bg: '#E8F5E9', color: '#2E7D32' },
    { icon: <Briefcase size={16} />,    bg: '#E3F2FD', color: '#1565C0' },
    { icon: <AlignLeft size={16} />,    bg: '#FFF3E0', color: '#E65100' },
  ],
  'job-search': [
    { icon: <Target size={16} />,       bg: '#FFF3E0', color: '#E65100' },
    { icon: <Briefcase size={16} />,    bg: '#E3F2FD', color: '#1565C0' },
    { icon: <Users size={16} />,        bg: '#E8F5E9', color: '#2E7D32' },
    { icon: <Star size={16} />,         bg: '#F3E5F5', color: '#7B1FA2' },
    { icon: <AlignLeft size={16} />,    bg: '#E8F5E9', color: '#1565C0' },
  ],
  'interview-mastery': [
    { icon: <ClipboardList size={16} />, bg: '#F3E5F5', color: '#7B1FA2' },
    { icon: <Target size={16} />,        bg: '#E3F2FD', color: '#1565C0' },
    { icon: <Star size={16} />,          bg: '#FFF3E0', color: '#E65100' },
    { icon: <Users size={16} />,         bg: '#E8F5E9', color: '#2E7D32' },
  ],
}

const TIER_BADGE: Record<string, { bg: string; text: string; border: string }> = {
  Momentum:  { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7' },
  Essentials:{ bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9' },
  Executive: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80' },
}

function ProgressRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const strokeWidth = 6
  const r = (size - strokeWidth * 2) / 2
  const circ = 2 * Math.PI * r
  const offset = circ * (1 - Math.min(percent, 100) / 100)
  const cx = size / 2
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
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
      <div className="flex flex-col items-center z-10">
        <span className="text-sm font-bold leading-none" style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}>
          {percent}%
        </span>
        <span className="text-[9px] text-center leading-tight mt-0.5" style={{ color: '#8A99B2' }}>
          Your<br />Progress
        </span>
      </div>
    </div>
  )
}

// Today's date formatted
function getTodayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

export default function ModulePanel({ module, userName, loading, onWatchVideo, onNavigate }: ModulePanelProps) {
  const tier = TIER_BADGE[module.tier] || TIER_BADGE.Essentials
  const progressPercent = module.totalSteps > 0
    ? Math.round((module.completedSteps / module.totalSteps) * 100)
    : 0
  const icons = STEP_ICONS[module.id] || STEP_ICONS['resume-builder']

  return (
    <div className="p-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Welcome row */}
      <div className="mb-5">
        <p className="text-xs mb-0.5" style={{ color: '#8A99B2' }}>{getTodayLabel()}</p>
        <h2 className="text-lg font-semibold" style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}>
          {userName ? `Welcome back, ${userName.split(' ')[0]}` : 'Welcome back'}
        </h2>
      </div>

      {/* Module header card */}
      <div
        className="rounded-2xl border p-5 mb-5"
        style={{ background: '#fff', borderColor: '#E2E8F0', borderWidth: '0.5px' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Module · Tier */}
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: '#8A99B2' }}>
              Module ·{' '}
              <span style={{ color: tier.text }}>{module.tier}</span>
            </p>

            {/* Title + description */}
            <h2
              className="text-2xl font-bold mb-1 leading-tight"
              style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}
            >
              {module.title}
            </h2>
            <p className="text-sm mb-4" style={{ color: '#6B7A90' }}>{module.description}</p>

            {/* Steps completed */}
            {loading ? (
              <div className="h-3 w-32 rounded animate-pulse" style={{ background: '#F0F3F8' }} />
            ) : (
              <p className="text-xs mb-4" style={{ color: '#8A99B2' }}>
                {module.completedSteps} of {module.totalSteps} steps completed
              </p>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onWatchVideo(module.videoSrc)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-colors hover:opacity-90"
                style={{ background: '#1976D2' }}
              >
                <Play size={13} /> Watch video
              </button>
              <button
                onClick={() => onNavigate(module.learnMoreRoute)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-colors hover:opacity-90"
                style={{ background: '#E3F2FD', color: '#1565C0' }}
              >
                <BookOpen size={13} /> Learn more
              </button>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex-shrink-0">
            {loading ? (
              <div className="w-[72px] h-[72px] rounded-full animate-pulse" style={{ background: '#F0F3F8' }} />
            ) : (
              <ProgressRing percent={progressPercent} size={72} />
            )}
          </div>
        </div>
      </div>

      {/* Step cards 2×2 grid */}
      <div className="grid grid-cols-2 gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <StepCard
                key={i}
                step={{ id: '', title: '', description: '', status: 'not-started', route: '' }}
                loading
                onLearnMore={() => {}}
                icon={null}
                iconBg=""
                iconColor=""
              />
            ))
          : module.steps.map((step, i) => (
              <StepCard
                key={step.id}
                step={step}
                onLearnMore={onNavigate}
                icon={icons[i]?.icon}
                iconBg={icons[i]?.bg || '#E3F2FD'}
                iconColor={icons[i]?.color || '#1565C0'}
                stepNumber={i + 1}
              />
            ))
        }
      </div>
    </div>
  )
}
