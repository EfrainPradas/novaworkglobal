import { ArrowRight } from 'lucide-react'

interface LearnMoreLinkProps {
  label: string
  description: string
  onClick: () => void
  className?: string
}

export default function LearnMoreLink({ label, description, onClick, className = '' }: LearnMoreLinkProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      aria-label={`${label}${description ? ': ' + description : ''}`}
      className={`inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-lg text-xs font-medium cursor-pointer hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-700 transition-colors ${className}`}
    >
      <span className="font-bold">{label}</span>
      {description && <span>{description}</span>}
      <ArrowRight className="w-4 h-4 ml-1" />
    </div>
  )
}
