import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, Outlet, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
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
  const location = useLocation()
  const { t, i18n } = useTranslation()
  // The dashboard index renders its own Progress + Calendar (mock layout),
  // so we hide the shell's right panel on `/dashboard` exact.
  const isIndexRoute = location.pathname === '/dashboard' || location.pathname === '/dashboard/'

  // ── Auth / profile ──────────────────────────────────────────
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<TierLevel>('core')

  // ── Stats ───────────────────────────────────────────────────
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  // ── Layout ──────────────────────────────────────────────────
  // Sidebar fixed (no collapse). Right panel keeps its existing resize.
  // Persist right panel state to localStorage so it survives refresh.
  const SIDEBAR_WIDTH = 260
  const [rightWidth, setRightWidth] = useState(() => {
    const saved = localStorage.getItem('nw_rightWidth')
    return saved ? Number(saved) : 280
  })
  const rightWidthRef = useRef(rightWidth)
  const [rightVisible, setRightVisible] = useState(() => {
    return localStorage.getItem('nw_rightVisible') === 'true'
  })

  // ── Mobile Drawer State ─────────────────────────────────────
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false)
  const [mobileRightOpen, setMobileRightOpen] = useState(false)

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
      localStorage.setItem('nw_rightWidth', String(rightWidthRef.current))
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [])

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
      // Auto-collapse right sidebar when viewport shrinks too narrow for 3 panels
      // Only override localStorage on actual resize, not on mount (respect persisted state)
      if (w < 1200 && w >= 768) {
        setRightVisible(prev => {
          if (prev) { localStorage.setItem('nw_rightVisible', 'false'); return false }
          return prev
        })
      }
    }
    window.addEventListener('resize', onResize)
    // Set isMobile on mount without overriding persisted rightVisible
    setIsMobile(window.innerWidth < 768)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const closeMobileDrawers = () => {
    setMobileLeftOpen(false)
    setMobileRightOpen(false)
  }

  // ── Topbar copy (Ascendia mock) ──────────────────────────────
  const formattedDate = new Intl.DateTimeFormat(i18n.language, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  }).format(new Date())
  const greetingName = userName?.split(' ')[0] ?? ''

  return (
    <GuidedPathProvider user={user}>
    <div
      className="dark:bg-gray-900"
      style={{
        minHeight: '100dvh',
        padding: isMobile ? 0 : 22,
        fontFamily: "'Inter', sans-serif",
        background: `
          radial-gradient(circle at 0 0, rgba(79,143,85,.08), transparent 28%),
          linear-gradient(135deg, #FFFFFF 0%, #F2F5F2 100%)
        `,
        color: 'var(--ascendia-text)',
      }}
    >
    <div
      className="flex overflow-hidden"
      style={{
        minHeight: isMobile ? '100dvh' : 'calc(100dvh - 44px)',
        maxWidth: 1460,
        margin: '0 auto',
        border: isMobile ? 'none' : '4px solid var(--ascendia-border-strong)',
        borderRadius: isMobile ? 0 : 'var(--ascendia-radius-xl)',
        background: 'var(--ascendia-surface)',
        boxShadow: isMobile ? 'none' : 'var(--ascendia-shadow-lg)',
      }}
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
            />
          </aside>
        )
      ) : (
        <HomeSidebar
          userLevel={userLevel}
          width={SIDEBAR_WIDTH}
          collapsed={false}
        />
      )}

      {/* ── CENTER PANEL ── */}
      <main
        className="flex-1 flex flex-col min-w-0 dark:bg-gray-900"
        style={{ background: 'var(--ascendia-surface-muted)' }}
      >
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-3 px-4 sm:px-8 flex-shrink-0"
          style={{
            height: 80,
            background: 'var(--ascendia-surface)',
            borderBottom: '1px solid var(--ascendia-border)',
          }}
        >
          {/* Mobile menu button */}
          {isMobile && (
            <button
              onClick={() => setMobileLeftOpen(true)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              style={{ color: 'var(--ascendia-text)' }}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="flex flex-col min-w-0">
            <span
              className="text-xs font-medium truncate"
              style={{ color: 'var(--ascendia-text-muted)' }}
            >
              {formattedDate}
            </span>
            <h1
              className="text-xl sm:text-[22px] font-bold leading-tight tracking-tight truncate text-slate-900 dark:text-slate-100"
            >
              {greetingName
                ? `${t('dashboard.welcomeBack')} ${greetingName}`
                : t('dashboard.welcomeBack').replace(/,\s*$/, '')}
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {user && <NotificationBell userId={user.id} />}
            <UserMenu user={user} userProfile={userProfile} />
          </div>
        </div>

        {/* Content - uses Outlet for nested routes. Page scrolls naturally; no internal scroll. */}
        <div className="flex-1">
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

      {/* ── RIGHT SIDEBAR ──
          Hidden on /dashboard index (the index renders its own Progress + Calendar
          to match the Ascendia mock). Still available on all nested routes. */}
      {isIndexRoute ? null : isMobile ? (
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
              style={{ width: 3, background: 'var(--ascendia-primary)' }}
            />
          </div>

          {/* Toggle */}
          <button
            onClick={() => { setRightVisible(false); localStorage.setItem('nw_rightVisible', 'false') }}
            className="absolute -left-4 top-6 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            style={{ background: 'var(--ascendia-primary)', color: '#fff', border: '2px solid #fff' }}
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
            onClick={() => { setRightVisible(true); localStorage.setItem('nw_rightVisible', 'true') }}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            style={{ background: 'var(--ascendia-primary)', color: '#fff', border: '2px solid #fff' }}
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
          style={{ background: 'var(--ascendia-primary)', color: 'var(--ascendia-primary-foreground)' }}
          title="Open stats panel"
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
    </div>
    </GuidedPathProvider>
  )
}