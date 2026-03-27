import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { FileText, Target, Network, BookOpen, ArrowRight, UserCircle } from 'lucide-react'
import type { DashboardOverview, TierLevel } from '../../types/home-dashboard'

interface NextBestActionCardsProps {
  overview: DashboardOverview | null
  userLevel: TierLevel
}

interface ActionCard {
  id: string
  icon: React.ReactNode
  label: string
  description: string
  route: string
  iconBg: string
  iconColor: string
  priority: number
}

export default function NextBestActionCards({ overview, userLevel }: NextBestActionCardsProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const canAccess = (tier: TierLevel) => {
    const order: Record<TierLevel, number> = { essentials: 1, momentum: 2, executive: 3 }
    return order[userLevel] >= order[tier]
  }

  const allActions: ActionCard[] = [
    {
      id: 'profile',
      icon: <UserCircle size={18} />,
      label: t('dashboard.nextActions.startOnboarding'),
      description: t('dashboard.statsSection.profileCompletion'),
      route: '/resume/contact-info',
      iconBg: '#EFF6FF', iconColor: '#1976D2',
      priority: (overview?.profile_completion_percent ?? 0) < 50 ? 0 : 99,
    },
    {
      id: 'resume',
      icon: <FileText size={18} />,
      label: t('dashboard.nextActions.continueResume'),
      description: t('dashboard.resumeBuilderDesc'),
      route: '/resume-builder',
      iconBg: '#E3F2FD', iconColor: '#1565C0',
      priority: (overview?.resume_versions_count ?? 0) === 0 ? 1 : 4,
    },
    {
      id: 'career-vision',
      icon: <Target size={18} />,
      label: t('dashboard.nextActions.finishCareerVision'),
      description: t('dashboard.careerVisionDesc'),
      route: '/career-vision',
      iconBg: '#E8F5E9', iconColor: '#2E7D32',
      priority: canAccess('momentum') ? 2 : 99,
    },
    {
      id: 'session',
      icon: <Network size={18} />,
      label: t('dashboard.nextActions.joinSession'),
      description: t('sidebarCommunity.networkingSessions'),
      route: '/dashboard/networking-sessions',
      iconBg: '#FFF3E0', iconColor: '#E65100',
      priority: 3,
    },
    {
      id: 'resources',
      icon: <BookOpen size={18} />,
      label: t('dashboard.nextActions.reviewResources'),
      description: t('dashboard.resources.title'),
      route: '/shared-resources',
      iconBg: '#F3E5F5', iconColor: '#7B1FA2',
      priority: 5,
    },
  ]

  const visible = allActions
    .filter(a => a.priority < 90)
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 4)

  if (visible.length === 0) return null

  return (
    <div className="mb-5">
      <h2 className="text-sm font-semibold text-slate-700 mb-3">{t('dashboard.nextActions.title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map(action => (
          <button
            key={action.id}
            onClick={() => navigate(action.route)}
            className="group bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98]"
            style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
          >
            <span
              className="flex-shrink-0 flex items-center justify-center rounded-xl"
              style={{ width: 40, height: 40, background: action.iconBg, color: action.iconColor }}
            >
              {action.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-snug">{action.label}</p>
            </div>
            <ArrowRight
              size={16}
              className="flex-shrink-0 text-slate-300 group-hover:text-slate-500 transition-colors"
            />
          </button>
        ))}
      </div>
    </div>
  )
}
