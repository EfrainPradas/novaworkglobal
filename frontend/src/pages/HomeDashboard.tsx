import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/common/UserMenu'
import NotificationBell from '../components/common/NotificationBell'
import HomeSidebar from '../components/home-dashboard/HomeSidebar'
import WelcomeHero from '../components/home-dashboard/WelcomeHero'
import ProgressSummary from '../components/home-dashboard/ProgressSummary'
import NextBestActionCards from '../components/home-dashboard/NextBestActionCards'
import MemberSessionsSection from '../components/home-dashboard/MemberSessionsSection'
import CommunityHighlights from '../components/home-dashboard/CommunityHighlights'
import ResourcesFeed from '../components/home-dashboard/ResourcesFeed'
import RecentActivity from '../components/home-dashboard/RecentActivity'
import { getDashboardOverview, getUserName, getUserTier } from '../services/home-dashboard/dashboard.service'
import type { DashboardOverview, TierLevel } from '../types/home-dashboard'

export default function HomeDashboard() {
  const navigate = useNavigate()

  // ── Auth / profile ──────────────────────────────────────────
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userLevel, setUserLevel] = useState<TierLevel>('essentials')

  // ── Stats ───────────────────────────────────────────────────
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [overviewLoading, setOverviewLoading] = useState(true)

  // ── Layout ──────────────────────────────────────────────────
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const sidebarWidthRef = useRef(260)
  const [rightWidth, setRightWidth] = useState(280)
  const rightWidthRef = useRef(280)
  const [rightVisible, setRightVisible] = useState(true)
  const sidebarCollapsed = sidebarWidth <= 80

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

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: '100dvh', background: '#F0F3F8', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <HomeSidebar
        userLevel={userLevel}
        width={sidebarWidth}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onResizeStart={handleSidebarResize}
      />

      {/* ── CENTER PANEL ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar */}
        <div
          className="flex items-center justify-between gap-2 px-5 py-2 flex-shrink-0"
          style={{ background: '#F0F3F8' }}
        >
          <h1
            className="text-base font-semibold text-slate-700 truncate"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            Dashboard
          </h1>
          <div className="flex items-center gap-2">
            {user && <NotificationBell userId={user.id} />}
            <UserMenu user={user} userProfile={userProfile} />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Hero */}
          <WelcomeHero
            userName={userName}
            profileCompletion={overview?.profile_completion_percent ?? 0}
          />

          {/* Next Best Actions */}
          {!overviewLoading && (
            <NextBestActionCards overview={overview} userLevel={userLevel} />
          )}

          {/* Member Sessions */}
          {user && <MemberSessionsSection userId={user.id} />}

          {/* Community */}
          <CommunityHighlights userLevel={userLevel} />

          {/* Resources */}
          <ResourcesFeed userLevel={userLevel} />

          {/* Recent Activity */}
          {user && <RecentActivity userId={user.id} />}
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      {rightVisible ? (
        <aside
          className="flex-shrink-0 overflow-y-auto relative"
          style={{
            width: rightWidth,
            minWidth: rightWidth,
            background: '#FFFFFF',
            borderLeft: '1px solid #E2E8F0',
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

          <div className="pt-6 px-4">
            <ProgressSummary
              overview={overview}
              loading={overviewLoading}
              compact
            />
          </div>
        </aside>
      ) : (
        <div
          className="flex-shrink-0 border-l flex flex-col items-center pt-4"
          style={{ width: 32, background: '#FFFFFF', borderColor: '#E2E8F0' }}
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
    </div>
  )
}
