import React from 'react'
import { Zap } from 'lucide-react'

interface QuickAction {
  label: string
  message: string
}

interface Props {
  actions: QuickAction[]
  onSelect: (message: string) => void
}

export default function AgentQuickActions({ actions, onSelect }: Props) {
  return (
    <div className="px-3 pb-2">
      <div className="flex items-center gap-1 mb-2 text-xs text-slate-400 dark:text-slate-500">
        <Zap className="w-3 h-3" />
        <span>Acciones rápidas</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((action, i) => (
          <button
            key={i}
            onClick={() => onSelect(action.message)}
            className="px-2.5 py-1 text-xs bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors whitespace-nowrap"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  )
}
