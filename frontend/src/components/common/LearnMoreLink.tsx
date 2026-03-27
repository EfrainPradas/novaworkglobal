interface LearnMoreLinkProps {
  label: string
  description: string
  onClick: () => void
  className?: string
}

export default function LearnMoreLink({ label, description, onClick, className = '' }: LearnMoreLinkProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex items-center gap-1 text-sm text-left transition-opacity hover:opacity-75 ${className}`}
    >
      <span className="font-bold text-primary-700 dark:text-primary-400">{label}:</span>
      <span className="text-gray-600 dark:text-gray-400"> {description}</span>
      <span className="ml-0.5 inline-block group-hover:translate-x-0.5 transition-transform">→</span>
    </button>
  )
}
