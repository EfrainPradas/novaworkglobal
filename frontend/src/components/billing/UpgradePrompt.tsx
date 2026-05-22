import { Lock } from 'lucide-react'

interface UpgradePromptProps {
  feature: string
  className?: string
}

/**
 * Shown to Core (or unauthenticated) users when they try to export/download.
 * Advance and Apex users bypass this gate.
 */
export default function UpgradePrompt({ feature, className = '' }: UpgradePromptProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center ${className}`}>
      <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 grid place-items-center">
        <Lock className="w-5 h-5" />
      </div>
      <p className="text-sm font-semibold text-slate-900">
        {feature} requires Ascendia Advance or higher
      </p>
      <p className="text-xs text-slate-500 max-w-xs">
        Upgrade to export and download your resume in multiple formats.
      </p>
      <button
        onClick={() => window.location.href = '/dashboard/billing'}
        className="mt-1 px-5 py-2 rounded-lg bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
      >
        View Plans
      </button>
    </div>
  )
}