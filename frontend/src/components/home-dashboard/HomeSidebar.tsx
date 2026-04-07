import { useTranslation } from 'react-i18next'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Target,
  FileText,
  Briefcase,
  Users,
  Calendar,
  Network,
  UserCheck,
  FolderOpen,
  Newspaper,
  ChevronRight,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { TierLevel } from '../../types/home-dashboard'
import SidebarCardButton from './SidebarCardButton'
import { checkCuratorAccess } from '../../services/careerFeed.service'

interface HomeSidebarProps {
  userLevel: TierLevel
  width: number
  collapsed: boolean
  onToggle: () => void
  onResizeStart: (e: React.MouseEvent) => void
}

const TIER_ORDER: Record<TierLevel, number> = { essentials: 1, momentum: 2, executive: 3 }

export default function HomeSidebar({
  userLevel,
  width,
  collapsed,
  onToggle,
  onResizeStart,
}: HomeSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCurator, setIsCurator] = useState(false)

  useEffect(() => {
    checkCuratorAccess().then(setIsCurator).catch(() => setIsCurator(false))
  }, [])

  const currentPath = location.pathname
  const canAccess = (required: TierLevel) => TIER_ORDER[userLevel] >= TIER_ORDER[required]

  const tierLabel = {
    essentials: t('membership.essential'),
    momentum: t('membership.momentum'),
    executive: t('membership.executive'),
  }[userLevel]

  const navItem = (
    path: string,
    icon: React.ReactNode,
    label: string,
    opts?: {
      badge?: string
      badgeColor?: string
      required?: TierLevel
      iconBg?: string
      iconColor?: string
    }
  ) => {
    const active = currentPath === path || currentPath.startsWith(path + '/')
    const locked = opts?.required && !canAccess(opts.required)

    return (
      <button
        onClick={() => !locked && navigate(path)}
        title={collapsed ? label : undefined}
        className={`
          w-full flex items-center gap-3 rounded-xl transition-all duration-150
          ${collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'}
          ${active
            ? 'text-white shadow-sm'
            : locked
            ? 'text-slate-300 dark:text-gray-500 cursor-not-allowed'
            : 'text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-700 hover:text-slate-800 dark:hover:text-white'}
        `}
        style={active ? { background: '#1976D2' } : {}}
      >
        <span
          className="flex-shrink-0 flex items-center justify-center rounded-lg"
          style={{
            width: 30,
            height: 30,
            background: active ? 'rgba(255,255,255,0.2)' : (opts?.iconBg ?? '#F1F5F9'),
            color: active ? '#fff' : (opts?.iconColor ?? '#64748B'),
          }}
        >
          {icon}
        </span>
        {!collapsed && (
          <span className="flex-1 text-left text-sm font-medium leading-tight truncate">
            {label}
          </span>
        )}
        {!collapsed && opts?.badge && (
          <span
            className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: opts.badgeColor ?? '#E8F5E9',
              color: opts.badgeColor ? '#fff' : '#2E7D32',
              fontSize: 10,
            }}
          >
            {opts.badge}
          </span>
        )}
        {!collapsed && locked && (
          <span className="flex-shrink-0 text-xs text-slate-300 dark:text-gray-500">🔒</span>
        )}
      </button>
    )
  }

  const sectionLabel = (label: string) => {
    if (collapsed) return null
    return (
      <div className="px-3 pt-4 pb-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-gray-500">{label}</p>
      </div>
    )
  }

  return (
    <aside
      className="flex-shrink-0 relative flex flex-col overflow-hidden bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700"
      style={{
        width,
        minWidth: width,
        transition: 'width 0.15s ease',
        height: '100dvh',
      }}
    >
      {/* Drag-resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute top-0 right-0 h-full z-20 flex items-center justify-center group"
        style={{ width: 8, cursor: 'col-resize' }}
      >
        <div
          className="h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ width: 3, background: '#1976D2' }}
        />
      </div>

      {/* Toggle button */}
      <button
        onClick={onToggle}
        className="absolute -right-4 top-6 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
        style={{ background: '#1976D2', color: '#fff', border: '2px solid #fff' }}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className={`flex-shrink-0 flex items-center ${collapsed ? 'justify-center py-3' : 'px-4 py-3'}`}>
        {collapsed ? (
          <img src="/logo.png" alt="NovaWork" className="h-8 w-8 object-contain" />
        ) : (
          <img src="/logo.png" alt="NovaWork Global" className="h-12 w-auto object-contain" />
        )}
      </div>

      {/* Tier badge */}
      {!collapsed && (
        <div className="mx-3 mb-1 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-gray-700">
          <p className="text-sm font-bold leading-tight" style={{ color: '#1976D2' }}>
            NovaNext
          </p>
          <p className="text-xs text-slate-500 dark:text-gray-400 leading-tight">{tierLabel}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {/* Overview */}
        {sectionLabel(t('sidebarOverview.dashboard'))}
        {navItem('/dashboard', <LayoutDashboard size={15} />, t('sidebarOverview.dashboard'), {
          iconBg: '#E3F2FD', iconColor: '#1565C0',
        })}
        {navItem('/dashboard/resume/contact-info', <Sparkles size={15} />, 'Smart Guide', {
          iconBg: '#EFF6FF', iconColor: '#1F5BAA',
          badge: 'NEW',
          badgeColor: '#1F5BAA',
        })}

        {/* NovaNext Programs — features for the user's plan */}
        {sectionLabel(t('membership.title'))}
        {navItem('/dashboard/resume-builder', <FileText size={15} />, t('learningModules.resumeBuilder'), {
          iconBg: '#eef6fc', iconColor: '#1F5BAA',
        })}
        {navItem('/dashboard/career-vision', <Target size={15} />, t('learningModules.careerVision'), {
          required: 'momentum',
          iconBg: '#eef6fc', iconColor: '#1F5BAA',
        })}
        {navItem('/dashboard/job-search-hub', <Briefcase size={15} />, t('learningModules.jobSearch'), {
          required: 'momentum',
          iconBg: '#eef6fc', iconColor: '#1F5BAA',
        })}
        {navItem('/dashboard/interview', <Users size={15} />, t('learningModules.interviewMastery'), {
          required: 'executive',
          iconBg: '#eef6fc', iconColor: '#1F5BAA',
        })}

        {/* Community — temporarily hidden, not functional yet */}
        {/* {sectionLabel(t('sidebarCommunity.title'))}
        {navItem('/dashboard/networking-sessions', <Network size={15} />, t('sidebarCommunity.networkingSessions'), {
          iconBg: '#EFF6FF', iconColor: '#1976D2',
        })}
        {navItem('/dashboard/member-calendar', <Calendar size={15} />, t('sidebarCommunity.memberCalendar'), {
          iconBg: '#EFF6FF', iconColor: '#1976D2',
        })}
        {navItem('/dashboard/community', <Users size={15} />, t('sidebarCommunity.community'), {
          iconBg: '#EFF6FF', iconColor: '#1976D2',
        })} */}

        {/* NovaNext Academy */}
        {!collapsed && (
          <div className="px-3 pt-4 pb-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">{t('novaNextAcademy.title')}</p>
          </div>
        )}
        {!collapsed && (
          <div className="px-2">
            <SidebarCardButton
              title={t('novaNextAcademy.title')}
              label={t('novaNextAcademy.videosAudio')}
              subtitle={t('novaNextAcademy.subtitle')}
              path="/dashboard/academy"
              iconBg="#eef6fc"
              iconColor="#1F5BAA"
              cardBg="#eef6fc"
              cardHoverBg="#d9e9f8"
            />
          </div>
        )}

        {/* Tools */}
        {sectionLabel(t('sidebarTools.title'))}
        {navItem('/dashboard/coaching', <UserCheck size={15} />, t('sidebarTools.myCoaches'), {
          iconBg: '#eef6fc', iconColor: '#1F5BAA',
        })}
        {navItem('/shared-resources', <FolderOpen size={15} />, t('sidebarTools.sharedResources'), {
          iconBg: '#eef6fc', iconColor: '#1F5BAA',
        })}
        {/* Career feed curation — temporarily hidden */}
        {/* {isCurator && navItem('/dashboard/career-feed-curation', <Newspaper size={15} />, t('dashboard.careerFeed.curation'), {
          iconBg: '#E3F2FD', iconColor: '#1565C0',
        })} */}
      </nav>
    </aside>
  )
}
