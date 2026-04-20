import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, Outlet } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Menu, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/common/UserMenu'
import NotificationBell from '../components/common/NotificationBell'
import HomeSidebar from '../components/home-dashboard/HomeSidebar'
import WelcomeHero from '../components/home-dashboard/WelcomeHero'
import DashboardRightPanel from '../components/home-dashboard/DashboardRightPanel'
import QuickActionCards from '../components/home-dashboard/QuickActionCards'
import MemberSessionsSection from '../components/home-dashboard/MemberSessionsSection'
import CommunityHighlights from '../components/home-dashboard/CommunityHighlights'
import ResourcesFeed from '../components/home-dashboard/ResourcesFeed'
import RecentActivity from '../components/home-dashboard/RecentActivity'
import { getDashboardOverview, getUserName, getUserTier } from '../services/home-dashboard/dashboard.service'
import type { DashboardOverview, TierLevel } from '../types/home-dashboard'
import { GuidedPathProvider } from '../contexts/GuidedPathContext'

export default function HomeDashboard() {
  const navigate = useNavigate()

  // ── Auth / profile ──────────────────────────────────────────
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<TierLevel>('esenciales')

  // ── Stats ───────────────────────────────────────────────────
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  // ── Layout ──────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(60)
  const sidebarWidthRef = useRef(60)
  const [rightWidth, setRightWidth] = useState(280)
  const rightWidthRef = useRef(280)
  const [rightVisible, setRightVisible] = useState(false)
  const sidebarCollapsed = sidebarWidth <= 80

  // ── Mobile Drawer State ─────────────────────────────────────
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false)
  const [mobileRightOpen, setMobileRightOpen] = useState(false)

  // ── Sidebar resize ─────────────────────────────────────────
  const handleSidebarResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = sidebarWidthRef.current
    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(60, Math.min(480, startWidth + ev.clientX - startX))
      sidebarWidthRef.current = newW
      setSidebarWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const handleRightResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startX = e.clientX
    const startWidth = rightWidthRef.current
    const onMove = (ev: MouseEvent) => {
      const newW = Math.max(200, Math.min(480, startWidth - (ev.clientX - startX)))
      rightWidthRef.current = newW
      setRightWidth(newW)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

  const toggleSidebar = useCallback(() => {
    const next = sidebarCollapsed ? 260 : 60
    sidebarWidthRef.current = next
    setSidebarWidth(next)
  }, [sidebarCollapsed])

  // ── Load data ───────────────────────────────────────────────
  const loadData = useCallback(async (userId: string) => {
    setOverviewLoading(true)
    try {
      const [name, tier, ov] = await Promise.all([
        getUserName(userId),
        getUserTier(userId),
        getDashboardOverview(userId),
      ])
      setUserName(name)
      setUserLevel(tier)
      setOverview(ov)
    } catch (err) {
      console.error('[HomeDashboard] loadData error:', err)
    } finally {
      setOverviewLoading(false)
    }
  }, [])

  useEffect(() => {
    async function boot() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/signin'); return }
      setUser(user)

      // Also get profile for UserMenu
      const { data: profileData } = await supabase
        .from('user_profiles').select('full_name').eq('user_id', user.id).maybeSingle()
      setUserProfile(profileData)

      await loadData(user.id)
    }
    boot()
  }, [navigate, loadData])

  // Reload on tab focus (matches existing codebase pattern)
  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden && user) loadData(user.id)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user, loadData])

  // Mobile resize handler + auto-collapse right sidebar on narrow screens
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth
      setIsMobile(w < 768)
      // Auto-collapse right sidebar when viewport is too narrow for 3 panels
      if (w < 1200 && w >= 768) {
        setRightVisible(false)
      }
    }
    onResize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeMobileDrawers = () => {
    setMobileLeftOpen(false)
    setMobileRightOpen(false)
  }

  return (
    <GuidedPathProvider user={user}>
    <div
      className="flex overflow-hidden bg-[#F0F3F8] dark:bg-gray-900"
      style={{ height: '100dvh', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── MOBILE LEFT DRAWER BACKDROP ── */}
      {isMobile && mobileLeftOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeMobileDrawers}
        />
      )}

      {/* ── MOBILE RIGHT DRAWER BACKDROP ── */}
      {isMobile && mobileRightOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40"
          onClick={closeMobileDrawers}
        />
      )}

      {/* ── LEFT SIDEBAR ── */}
      {isMobile ? (
        mobileLeftOpen && (
          <aside
            className="fixed left-0 top-0 bottom-0 z-50 flex flex-col bg-white dark:bg-gray-800"
            style={{
              width: 280,
              boxShadow: '4px 0 20px rgba(0,0,0,0.15)',
            }}
          >
            <button
              onClick={() => setMobileLeftOpen(false)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors z-10 text-slate-500 dark:text-slate-400"
            >
              <X size={18} />
            </button>
            <HomeSidebar
              userLevel={userLevel}
              width={280}
              collapsed={false}
              onToggle={() => setMobileLeftOpen(false)}
              onResizeStart={() => {}}
            />
          </aside>
        )
      ) : (
        <HomeSidebar
          userLevel={userLevel}
          width={sidebarWidth}
          collapsed={sidebarCollapsed}
          onToggle={toggleSidebar}
          onResizeStart={handleSidebarResize}
        />
      )}

      {/* ── CENTER PANEL ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-2 px-3 sm:px-5 py-2 flex-shrink-0 bg-[#F0F3F8] dark:bg-gray-900"
        >
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setMobileLeftOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/50 dark:hover:bg-gray-700 transition-colors text-slate-600 dark:text-slate-300"
            >
              <Menu size={20} />
            </button>
          )}
          <h1
            className={`text-base font-semibold text-slate-700 dark:text-slate-200 truncate ${isMobile ? 'flex-1 text-center mr-9' : ''}`}
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {user && <NotificationBell userId={user.id} />}
            <UserMenu user={user} userProfile={userProfile} />
          </div>
        </div>

        {/* Scrollable content - uses Outlet for nested routes */}
        <div className="flex-1 overflow-y-auto">
          <Outlet context={{
            user,
            userProfile,
            userName,
            userLevel,
            overview,
            overviewLoading
          }} />
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      {isMobile ? (
        mobileRightOpen && (
          <aside
            className="fixed right-0 top-0 bottom-0 z-50 overflow-y-auto bg-white dark:bg-gray-800"
            style={{
              width: 300,
              boxShadow: '-4px 0 20px rgba(0,0,0,0.15)',
            }}
          >
            <button
              onClick={() => setMobileRightOpen(false)}
              className="absolute top-3 left-3 w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-gray-700 transition-colors z-10 text-slate-500 dark:text-slate-400"
            >
              <X size={18} />
            </button>
            <div className="pt-10">
              <DashboardRightPanel userId={user?.id ?? null} />
            </div>
          </aside>
        )
      ) : rightVisible ? (
        <aside
          className="flex-shrink-0 overflow-y-auto relative bg-white dark:bg-gray-800 border-l border-slate-200 dark:border-gray-700"
          style={{
            width: rightWidth,
            minWidth: rightWidth,
          }}
        >
          {/* Drag-resize handle (left edge) */}
          <div
            onMouseDown={handleRightResize}
            className="absolute top-0 left-0 h-full z-20 flex items-center justify-center group"
            style={{ width: 8, cursor: 'col-resize' }}
          >
            <div
              className="h-12 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ width: 3, background: '#1976D2' }}
            />
          </div>

          {/* Toggle */}
          <button
            onClick={() => setRightVisible(false)}
            className="absolute -left-4 top-6 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            style={{ background: '#1976D2', color: '#fff', border: '2px solid #fff' }}
            title="Hide panel"
          >
            <ChevronRight size={14} />
          </button>

          <DashboardRightPanel userId={user?.id ?? null} />
        </aside>
      ) : (
        <div
          className="flex-shrink-0 border-l border-slate-200 dark:border-gray-700 flex flex-col items-center pt-4 bg-white dark:bg-gray-800"
          style={{ width: 32 }}
        >
          <button
            onClick={() => setRightVisible(true)}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            style={{ background: '#1976D2', color: '#fff', border: '2px solid #fff' }}
            title="Show panel"
          >
            <ChevronLeft size={14} />
          </button>
        </div>
      )}

      {/* ── MOBILE RIGHT PANEL TOGGLE BUTTON ── */}
      {isMobile && !mobileRightOpen && (
        <button
          onClick={() => setMobileRightOpen(true)}
          className="fixed bottom-4 right-4 z-30 w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          style={{ background: '#1976D2', color: '#fff' }}
          title="Open stats panel"
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
    </GuidedPathProvider>
  )
}
