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
  Sparkles,
  Upload,
  Search,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import type { TierLevel } from '../../types/home-dashboard'
import SidebarCardButton from './SidebarCardButton'
import { checkCuratorAccess } from '../../services/careerFeed.service'
import { supabase } from '../../lib/supabase'
import { LogoAscendia } from '../common/LogoAscendia'

const SMART_MATCHES_PILOT_EMAIL = 'efrain.pradas@gmail.com'

interface HomeSidebarProps {
  userLevel: TierLevel
  width: number
  collapsed: boolean
}

const TIER_ORDER: Record<TierLevel, number> = { core: 1, advance: 2, apex: 3 }

export default function HomeSidebar({
  userLevel,
  width,
  collapsed,
}: HomeSidebarProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCurator, setIsCurator] = useState(false)
  const [isPilotUser, setIsPilotUser] = useState(false)
  useEffect(() => {
    checkCuratorAccess().then(setIsCurator).catch(() => setIsCurator(false))
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setIsPilotUser(data.user?.email === SMART_MATCHES_PILOT_EMAIL)
    }).catch(() => setIsPilotUser(false))
  }, [])

  const currentPath = location.pathname
  const canAccess = (required: TierLevel) => TIER_ORDER[userLevel] >= TIER_ORDER[required]

  const tierLabel: Record<TierLevel, string> = {
    core: t('membership.core', 'Ascendia Core'),
    advance: t('membership.advance', 'Ascendia Advance'),
    apex: t('membership.apex', 'Ascendia Apex'),
  }
  const currentTierLabel = tierLabel[userLevel]

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
        style={active ? { background: 'var(--ascendia-primary)' } : {}}
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
        height: '100%',
      }}
    >
      {/* Brand */}
      <div
        className="flex items-center"
        style={{
          height: 80,
          padding: collapsed ? '0 8px' : '0 22px',
          borderBottom: '1px solid var(--ascendia-border-soft)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <LogoAscendia
          className="cursor-pointer"
          onClick={() => navigate('/')}
          style={{
            maxHeight: 48,
            maxWidth: '100%',
            width: 'auto',
            objectFit: 'contain',
            display: 'block',
            color: '#91c171',
          }}
        />
        {/* Wordmark fallback (kept for safety; no longer auto-shown since the SVG is inline) */}
        <div
          style={{
            display: 'none',
            alignItems: 'center',
            gap: 10,
            color: 'var(--ascendia-primary)',
          }}
        >
          <div
            style={{
              width: 34, height: 34,
              borderRadius: 'var(--ascendia-radius-md)',
              background: 'var(--ascendia-primary)',
              color: 'var(--ascendia-primary-foreground)',
              display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: 16,
              letterSpacing: '-0.02em',
            }}
          >
            A
          </div>
          {!collapsed && (
            <span
              style={{
                fontWeight: 800,
                fontSize: 20,
                letterSpacing: '-0.01em',
                color: 'var(--ascendia-text)',
              }}
            >
              Ascendia
            </span>
          )}
        </div>
      </div>

      {/* Tier badge */}
      {!collapsed && (
        <div
          className="mx-3 mt-3 mb-1 px-3 py-1.5 dark:bg-gray-700"
          style={{
            background: 'var(--ascendia-accent)',
            borderRadius: 'var(--ascendia-radius-md)',
          }}
        >
          <p className="text-sm font-bold leading-tight" style={{ color: 'var(--ascendia-primary)' }}>
            {currentTierLabel}
          </p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
        {/* Overview */}
        {sectionLabel(t('sidebarOverview.dashboard'))}
        {navItem('/dashboard', <LayoutDashboard size={15} />, t('sidebarOverview.dashboard'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/resume/contact-info', <Sparkles size={15} />, t('sidebar.contactSetup', 'Contact Setup'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
          badge: t('sidebar.new', 'NEW'),
          badgeColor: 'var(--ascendia-primary)',
        })}
        {/* NovaNext Programs — features for the user's plan */}
        {sectionLabel(t('membership.title'))}
        {navItem('/dashboard/resume-builder', <FileText size={15} />, t('learningModules.resumeBuilder'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/career-vision', <Target size={15} />, t('learningModules.careerVision'), {
          required: 'advance',
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/job-search-hub', <Briefcase size={15} />, t('learningModules.jobSearch'), {
          required: 'advance',
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/interview', <Users size={15} />, t('learningModules.interviewMastery'), {
          required: 'apex',
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}

        {/* Community — temporarily hidden, not functional yet */}
        {/* {sectionLabel(t('sidebarCommunity.title'))}
        {navItem('/dashboard/networking-sessions', <Network size={15} />, t('sidebarCommunity.networkingSessions'), {
          iconBg: '#EAF4EC', iconColor: '#0E4B2B',
        })}
        {navItem('/dashboard/member-calendar', <Calendar size={15} />, t('sidebarCommunity.memberCalendar'), {
          iconBg: '#EAF4EC', iconColor: '#0E4B2B',
        })}
        {navItem('/dashboard/community', <Users size={15} />, t('sidebarCommunity.community'), {
          iconBg: '#EAF4EC', iconColor: '#0E4B2B',
        })} */}

        {/* Academy / Videos & Audio — hidden from visible navigation during Ascendia rebrand.
            Route /dashboard/academy and its components remain intact. */}
        {/* {!collapsed && (
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
              iconBg="#EAF4EC"
              iconColor="#0E4B2B"
              cardBg="#EAF4EC"
              cardHoverBg="#D5E9D9"
            />
          </div>
        )} */}

        {/* Tools */}
        {sectionLabel(t('sidebarTools.title'))}
        {isPilotUser && navItem('/dashboard/smart-matches', <Sparkles size={15} />, t('sidebarTools.smartMatches'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
          badge: t('sidebarTools.vipBadge'),
          badgeColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/coaching', <UserCheck size={15} />, t('sidebarTools.myCoaches'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/shared-resources', <FolderOpen size={15} />, t('sidebarTools.sharedResources'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}

        {/* Quick Actions — moved from the right panel */}
        {sectionLabel(t('dashboard.quickActionsPanel.title', 'Quick Actions'))}
        {navItem('/dashboard/resume-builder', <Upload size={15} />, t('dashboard.quickActionsPanel.uploadResume', 'Upload Resume'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/resume-builder/jd-analyzer', <Search size={15} />, t('dashboard.quickActionsPanel.analyzeJD', 'Analyze Job Description'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/networking-sessions', <Network size={15} />, t('dashboard.quickActionsPanel.joinNetworking', 'Join Networking'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}
        {navItem('/dashboard/member-calendar', <Calendar size={15} />, t('dashboard.quickActionsPanel.viewCalendar', 'View Member Calendar'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })}

        {/* Career feed curation — temporarily hidden */}
        {/* {isCurator && navItem('/dashboard/career-feed-curation', <Newspaper size={15} />, t('dashboard.careerFeed.curation'), {
          iconBg: 'var(--ascendia-accent)', iconColor: 'var(--ascendia-primary)',
        })} */}
      </nav>
    </aside>
  )
}
