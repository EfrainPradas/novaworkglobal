import { CheckCircle2, ChevronDown } from 'lucide-react'
import type { DashboardStep } from '../../types/dashboard'

interface StepCardProps {
  step: DashboardStep
  loading?: boolean
  onLearnMore: (route: string) => void
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  stepNumber?: number
}

export default function StepCard({ step, loading, onLearnMore, icon, iconBg, iconColor, stepNumber }: StepCardProps) {
  if (loading) {
    return (
      <div className="rounded-2xl border p-5 animate-pulse" style={{ background: '#fff', borderColor: '#E2E8F0' }}>
        <div className="flex items-start justify-between mb-3">
          <div className="w-9 h-9 rounded-xl" style={{ background: '#F0F3F8' }} />
          <div className="w-5 h-5 rounded-full" style={{ background: '#F0F3F8' }} />
        </div>
        <div className="h-3 rounded mb-2" style={{ background: '#F0F3F8', width: '40%' }} />
        <div className="h-4 rounded mb-2" style={{ background: '#F0F3F8', width: '60%' }} />
        <div className="h-3 rounded mb-1" style={{ background: '#F0F3F8', width: '90%' }} />
        <div className="h-3 rounded" style={{ background: '#F0F3F8', width: '70%' }} />
      </div>
    )
  }

  const isCompleted = step.status === 'completed'

  return (
    <div
      className="rounded-2xl border p-5 relative transition-all hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      style={{ background: '#fff', borderColor: '#E2E8F0', borderWidth: '0.5px' }}
      onClick={() => onLearnMore(step.route)}
    >
      {/* Completed checkmark */}
      {isCompleted && (
        <div className="absolute top-4 right-4">
          <CheckCircle2 size={18} className="text-green-500" />
        </div>
      )}

      {/* Icon */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: iconBg, color: iconColor }}
      >
        {icon}
      </div>

      {/* Step number */}
      {stepNumber !== undefined && (
        <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: '#8A99B2' }}>
          Step {stepNumber}
        </p>
      )}

      {/* Title + description */}
      <h4
        className="text-sm font-semibold mb-1 pr-6"
        style={{ color: '#0F2A45', fontFamily: "'Outfit', sans-serif" }}
      >
        {step.title}
      </h4>
      <p className="text-xs leading-relaxed mb-3" style={{ color: '#6B7A90', fontFamily: "'DM Sans', sans-serif" }}>
        {step.description}
      </p>

      {/* Learn more */}
      <span
        className="flex items-center gap-0.5 text-xs font-medium"
        style={{ color: '#1976D2' }}
      >
        Learn more <ChevronDown size={12} />
      </span>
    </div>
  )
}
