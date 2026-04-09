import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Target, FileText, Briefcase, Users,
  UserCheck, FolderOpen, ChevronLeft, ChevronRight
} from 'lucide-react'
import type { ModuleId, TierLevel } from '../../types/dashboard'

interface SidebarProps {
  activeModule: ModuleId
  onSelect: (id: ModuleId) => void
  userLevel: TierLevel
  tierLabel: string
  width: number
  collapsed: boolean
  onToggle: () => void
  onResizeStart: (e: React.MouseEvent) => void
}

const TIER_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  Momentum:  { bg: '#E8F5E9', text: '#2E7D32', border: '#A5D6A7', label: 'Momentum' },
  Essentials:{ bg: '#E3F2FD', text: '#1565C0', border: '#90CAF9', label: 'Essentials' },
  Vanguard: { bg: '#FFF3E0', text: '#E65100', border: '#FFCC80', label: 'Vanguard' },
}

const modules = [
  { id: 'career-vision'     as ModuleId, label: 'Career Vision',    icon: <Target size={16} />,   tier: 'Momentum',   iconBg: '#E8F5E9', iconColor: '#2E7D32' },
  { id: 'resume-builder'    as ModuleId, label: 'Resume Builder',   icon: <FileText size={16} />, tier: 'Essentials', iconBg: '#E3F2FD', iconColor: '#1565C0' },
  { id: 'job-search'        as ModuleId, label: 'Job Search',       icon: <Briefcase size={16} />,tier: 'Momentum',   iconBg: '#FFF3E0', iconColor: '#E65100' },
  { id: 'interview-mastery' as ModuleId, label: 'Interview Mastery',icon: <Users size={16} />,    tier: 'Vanguard',  iconBg: '#F3E5F5', iconColor: '#7B1FA2' },
]

const tools = [
  { label: 'My Coaches',       icon: <UserCheck size={14} />, iconBg: '#F3E5F5', iconColor: '#7B1FA2', route: '/coaches' },
  { label: 'Shared Resources', icon: <FolderOpen size={14} />,iconBg: '#E8F5E9', iconColor: '#2E7D32', route: '/shared-resources' },
]

export default function Sidebar({ activeModule, onSelect, userLevel, tierLabel, width, collapsed, onToggle, onResizeStart }: SidebarProps) {
  const navigate = useNavigate()
  const levels: Record<TierLevel, number> = { esenciales: 1, momentum: 2, vanguard: 3 }
  const canAccess = (req: string) => levels[userLevel] >= levels[req.toLowerCase() as TierLevel]

  const userTierKey = tierLabel.charAt(0).toUpperCase() + tierLabel.slice(1)
  const badge = TIER_BADGE[userTierKey] || TIER_BADGE.Essentials

  return (
    <aside
      className="flex flex-col flex-shrink-0 overflow-y-auto relative bg-white dark:bg-gray-800 border-r border-slate-200 dark:border-gray-700"
      style={{
        width,
        minWidth: width,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {/* Drag-resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute top-0 right-0 h-full z-20 flex items-center justify-center group"
        style={{ width: 8, cursor: 'col-resize' }}
        title="Drag to resize"
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

      {/* Tier badge */}
      <div className={`px-3 pt-4 pb-3 ${collapsed ? 'flex justify-center' : ''}`}>
        {!collapsed && (
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border"
            style={{ background: badge.bg, color: badge.text, borderColor: badge.border }}
          >
            ★ {badge.label} Member
          </span>
        )}
      </div>

      {/* Overview */}
      <div className={`px-2 mb-1 ${collapsed ? '' : 'px-3'}`}>
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#8A99B2] dark:text-gray-500">
            Overview
          </p>
        )}
        <button
          title="Dashboard"
          className="w-full flex items-center gap-2.5 rounded-lg py-2 transition-colors text-[#0F2A45] dark:text-white bg-[#EEF5FF] dark:bg-blue-900/30"
          style={{
            paddingLeft: collapsed ? 0 : 12,
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderLeft: collapsed ? 'none' : '3px solid #1976D2',
          }}
        >
          <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: '#E3F2FD', color: '#1976D2' }}>
            <LayoutDashboard size={13} />
          </span>
          {!collapsed && <span className="text-sm font-semibold">Dashboard</span>}
        </button>
      </div>

      {/* Learning Modules */}
      <div className={`mb-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#8A99B2] dark:text-gray-500">
            Learning Modules
          </p>
        )}
        <div className="space-y-0.5">
          {modules.map((item) => {
            const isActive = activeModule === item.id
            const locked = !canAccess(item.tier)
            const tb = TIER_BADGE[item.tier]
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                title={item.label}
                className={`w-full flex items-center rounded-lg py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 ${isActive ? 'bg-[#EEF5FF] dark:bg-blue-900/30 text-[#0F2A45] dark:text-white font-semibold' : 'text-[#6B7A90] dark:text-gray-400'}`}
                style={{
                  gap: collapsed ? 0 : 10,
                  paddingLeft: collapsed ? 0 : 9,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderLeft: collapsed ? 'none' : (isActive ? '3px solid #1976D2' : '3px solid transparent'),
                  fontWeight: isActive ? 600 : 400,
                  opacity: locked ? 0.5 : 1,
                }}
              >
                <span
                  className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: item.iconBg, color: item.iconColor }}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <>
                    <span className="flex-1 text-left text-sm truncate">{item.label}</span>
                    <span
                      className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border flex-shrink-0 mr-1"
                      style={{ background: tb.bg, color: tb.text, borderColor: tb.border }}
                    >
                      {tb.label}
                    </span>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tools */}
      <div className={`mt-2 ${collapsed ? 'px-2' : 'px-3'}`}>
        {!collapsed && (
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#8A99B2] dark:text-gray-500">
            Tools
          </p>
        )}
        <div className="space-y-0.5">
          {tools.map((t) => (
            <button
              key={t.route}
              onClick={() => navigate(t.route)}
              title={t.label}
              className="w-full flex items-center rounded-lg py-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 text-[#6B7A90] dark:text-gray-400"
              style={{
                gap: collapsed ? 0 : 10,
                paddingLeft: collapsed ? 0 : 9,
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderLeft: collapsed ? 'none' : '3px solid transparent',
              }}
            >
              <span className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: t.iconBg, color: t.iconColor }}>
                {t.icon}
              </span>
              {!collapsed && <span className="text-sm truncate">{t.label}</span>}
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
