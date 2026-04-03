import { ArrowRight, UserCheck, Upload, Search, FolderOpen } from 'lucide-react'

interface QuickActionsProps {
  onNavigate: (route: string) => void
}

const actions = [
  {
    icon: <UserCheck size={15} />,
    iconBg: '#F3E5F5',
    iconColor: '#7B1FA2',
    label: 'My Coaches / Book Session',
    route: '/coaching',
  },
  {
    icon: <Upload size={15} />,
    iconBg: '#E3F2FD',
    iconColor: '#1565C0',
    label: 'Upload Resume',
    route: '/resume/work-experience?openImport=true',
  },
  {
    icon: <Search size={15} />,
    iconBg: '#FFF3E0',
    iconColor: '#E65100',
    label: 'Analyze Job Description',
    route: '/resume-builder/jd-analyzer',
  },
  {
    icon: <FolderOpen size={15} />,
    iconBg: '#E8F5E9',
    iconColor: '#2E7D32',
    label: 'Shared Resources',
    route: '/shared-resources',
  },
]

export default function QuickActions({ onNavigate }: QuickActionsProps) {
  return (
    <div
      className="mx-4 mb-4 rounded-2xl border border-slate-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-800"
    >
      <p className="text-xs font-semibold mb-3 text-[#6B7A90] dark:text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Quick Actions
      </p>
      <div className="space-y-1.5">
        {actions.map((a) => (
          <button
            key={a.route}
            onClick={() => onNavigate(a.route)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 group text-left"
          >
            <span
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: a.iconBg, color: a.iconColor }}
            >
              {a.icon}
            </span>
            <span className="flex-1 text-xs font-medium text-[#0F2A45] dark:text-gray-200" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {a.label}
            </span>
            <ArrowRight size={13} className="text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  )
}
