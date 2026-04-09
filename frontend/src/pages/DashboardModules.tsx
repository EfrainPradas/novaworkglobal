import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/common/UserMenu'
import NotificationBell from '../components/common/NotificationBell'
import Sidebar from '../components/dashboard/Sidebar'
import ModulePanel from '../components/dashboard/ModulePanel'
import StatsCard from '../components/dashboard/StatsCard'
import QuickActions from '../components/dashboard/QuickActions'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { ModuleId, TierLevel, DashboardModule, DashboardStats, StepStatus } from '../types/dashboard'
import { getVideoUrl } from '@/config/videoUrls'

// ─── module definitions (static shape, dynamic status filled at runtime) ───
function buildModules(
  workExpCount: number,
  parCount: number,
  hasProfile: boolean,
  tailoredCount: number,
  progressRows: Array<{ module_id: string; step_id: string }>,
  userLevel: TierLevel
): Record<ModuleId, DashboardModule> {
  const levels: Record<TierLevel, number> = { esenciales: 1, momentum: 2, vanguard: 3 }
  const can = (req: TierLevel) => levels[userLevel] >= levels[req]

  const stepStatus = (moduleId: string, stepId: string): StepStatus =>
    progressRows.some(r => r.module_id === moduleId && r.step_id === stepId) ? 'completed' : 'not-started'

  // Resume Builder — derived from existing tables
  const rbSteps = [
    {
      id: 'work-experience', title: 'Work Experience & Education',
      description: 'Build your career history and academic record.',
      status: (workExpCount > 0 ? 'completed' : 'not-started') as StepStatus,
      route: '/resume/work-experience?mode=standalone',
    },
    {
      id: 'accomplishment-bank', title: 'Accomplishment Bank',
      description: 'Highlight your key accomplishments.',
      status: (parCount > 0 ? 'completed' : 'not-started') as StepStatus,
      route: '/resume/accomplishments-hub?mode=standalone',
    },
    {
      id: 'professional-summary', title: 'Professional Summary',
      description: 'Introduce and position yourself.',
      status: (hasProfile ? 'completed' : 'not-started') as StepStatus,
      route: '/resume/questionnaire?mode=standalone',
    },
    {
      id: 'choose-resume', title: 'Choose Your Resume',
      description: 'Chronological or Functional.',
      status: (tailoredCount > 0 ? 'completed' : 'not-started') as StepStatus,
      route: '/resume/type-selection?mode=standalone',
    },
  ]
  const rbCompleted = rbSteps.filter(s => s.status === 'completed').length

  const cvSteps = [
    { id: 'skills-values', title: 'Skills & Interests',       description: 'List what you know and what you would do again.',          status: stepStatus('career-vision', 'skills-values'), route: '/career-vision/skills-values?mode=standalone' },
    { id: 'job-history',   title: 'Job History Analysis',     description: 'Reflect on past roles to identify patterns.',              status: stepStatus('career-vision', 'job-history'),   route: '/career-vision/job-history?mode=standalone' },
    { id: 'preferences',   title: 'Ideal Work Preferences',   description: 'Define your must-haves and priorities.',                   status: stepStatus('career-vision', 'preferences'),   route: '/career-vision/preferences?mode=standalone' },
  ]
  const cvCompleted = cvSteps.filter(s => s.status === 'completed').length

  const jsSteps = [
    { id: 'plan-search',       title: 'Plan Your Search',          description: 'Define your target market (Companies, Industries, Roles) and strategy.',          status: stepStatus('job-search', 'plan-search'),       route: '/job-search/plan-your-search?mode=standalone' },
    { id: 'online-apps',       title: 'Online Job Applications',   description: 'Track applications, leverage referrals, and analyze JDs in one place.',           status: stepStatus('job-search', 'online-apps'),       route: '/job-search/online-applications?mode=standalone' },
    { id: 'headhunters',       title: 'Headhunters & Firms',       description: 'Target recruiters with smart filters and access top firm rankings.',               status: stepStatus('job-search', 'headhunters'),       route: '/job-search/headhunters?mode=standalone' },
    { id: 'networking',        title: 'Networking Strategy',       description: 'Access the hidden job market with the 60-Day Plan and 90-Sec Story.',             status: stepStatus('job-search', 'networking'),        route: '/job-search/networking?mode=standalone' },
    { id: 'online-presence',   title: 'Your Online Presence',      description: 'Optimize your LinkedIn profile and personal brand to attract recruiters.',         status: stepStatus('job-search', 'online-presence'),   route: '/job-search/social-positioning?mode=standalone' },
  ]
  const jsCompleted = jsSteps.filter(s => s.status === 'completed').length

  const imSteps = [
    { id: 'new-prep',       title: 'New Interview Prep',   description: 'Start preparing for an upcoming interview with the 3-phase methodology.',  status: stepStatus('interview-mastery', 'new-prep'),      route: '/interview/new?mode=standalone' },
    { id: 'research',       title: 'Research & Prepare',   description: 'Know the company, role, and panel inside out before interview day.',        status: stepStatus('interview-mastery', 'research'),      route: '/interview?mode=standalone' },
    { id: 'question-bank',  title: 'Question Bank',        description: 'Master 70+ curated interview questions with answering tips.',               status: stepStatus('interview-mastery', 'question-bank'), route: '/interview/questions?mode=standalone' },
    { id: 'practice',       title: 'Practice Sessions',    description: 'Simulate the interview experience and sharpen your answers.',                status: stepStatus('interview-mastery', 'practice'),      route: '/interview?mode=standalone' },
  ]
  const imCompleted = imSteps.filter(s => s.status === 'completed').length

  return {
    'resume-builder': {
      id: 'resume-builder', title: 'Resume Builder',
      description: 'Build an interview-magnet resume and your personal accomplishment bank.',
      tier: 'Essentials', requiredLevel: 'esenciales', iconBg: '#E3F2FD',
      completedSteps: rbCompleted, totalSteps: 4, steps: rbSteps,
      videoSrc: getVideoUrl('The_NovaWork_Blueprint__resume_builder.mp4'),
      learnMoreRoute: '/resume-builder',
      locked: false,
    },
    'career-vision': {
      id: 'career-vision', title: 'Career Vision',
      description: 'Get a clear understanding of who you are and what is your success formula.',
      tier: 'Momentum', requiredLevel: 'momentum', iconBg: '#E8F5E9',
      completedSteps: cvCompleted, totalSteps: 3, steps: cvSteps,
      videoSrc: getVideoUrl('AI_and_Your_Career_Path-EN.mp4'),
      learnMoreRoute: '/career-vision/dashboard',
      locked: !can('momentum'),
    },
    'job-search': {
      id: 'job-search', title: 'Job Search',
      description: 'Use these techniques and get called for an interview 75% faster than others.',
      tier: 'Momentum', requiredLevel: 'momentum', iconBg: '#FFF3E0',
      completedSteps: jsCompleted, totalSteps: 5, steps: jsSteps,
      videoSrc: undefined,
      learnMoreRoute: '/fast-track/plan-your-search',
      locked: !can('momentum'),
    },
    'interview-mastery': {
      id: 'interview-mastery', title: 'Interview Mastery',
      description: 'Be the one they choose. Understand and practice the interview to win.',
      tier: 'Vanguard', requiredLevel: 'vanguard', iconBg: '#F3E5F5',
      completedSteps: imCompleted, totalSteps: 4, steps: imSteps,
      videoSrc: getVideoUrl('Your_Interview_Playbook-EN.mp4'),
      learnMoreRoute: '/interview',
      locked: !can('vanguard'),
    },
  }
}

// BACKUP: This is the original module-navigation dashboard, preserved at /dashboard/modules
export default function DashboardModules() {
  const navigate = useNavigate()
  const [activeModule, setActiveModule] = useState<ModuleId>('resume-builder')
  const [sidebarWidth, setSidebarWidth] = useState(300)
  const sidebarWidthRef = useRef(300)
  const [rightWidth, setRightWidth] = useState(280)
  const rightWidthRef = useRef(280)
  const [rightVisible, setRightVisible] = useState(true)
  const sidebarCollapsed = sidebarWidth <= 80

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
    const next = sidebarCollapsed ? 240 : 60
    sidebarWidthRef.current = next
    setSidebarWidth(next)
  }, [sidebarCollapsed])
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userLevel, setUserLevel] = useState<TierLevel>('esenciales')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    resumeScore: 0, resumeScoreDelta: 6,
    applicationsTracked: 0, interviewsScheduled: 0,
    modulesCompleted: 0, totalModules: 4,
  })
  const [modules, setModules] = useState<Record<ModuleId, DashboardModule> | null>(null)
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/signin'); return }
      setUser(user)
      await loadData(user.id)
      setLoading(false)
    }
    load()
  }, [navigate])

  // Reload on tab focus
  useEffect(() => {
    const onVisible = () => { if (!document.hidden && user) loadData(user.id) }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [user])

  const loadData = async (userId: string) => {
    try {
      // ── tier ──
      const { data: userData } = await supabase
        .from('users').select('subscription_tier').eq('id', userId).single()
      let tier: TierLevel = 'esenciales'
      if (userData?.subscription_tier) {
        let t = userData.subscription_tier
        if (t === 'basic') t = 'esenciales'
        if (t === 'pro')   t = 'momentum'
        tier = t as TierLevel
        setUserLevel(tier)
      }

      // ── user name ──
      const { data: profileData } = await supabase
        .from('user_profiles').select('full_name').eq('user_id', userId).maybeSingle()
      const { data: resumeData } = await supabase
        .from('user_resumes').select('full_name').eq('user_id', userId).limit(1).maybeSingle()
      setUserProfile(profileData?.full_name ? profileData : resumeData)

      // ── resume builder progress ──
      const { count: parCount } = await supabase
        .from('par_stories').select('*', { count: 'exact', head: true }).eq('user_id', userId)

      const { data: resumes } = await supabase
        .from('user_resumes').select('id, profile_summary, areas_of_excellence').eq('user_id', userId)

      let hasProfile = false
      let workExpCount = 0

      if (resumes && resumes.length > 0) {
        hasProfile = !!resumes.find(r => r.profile_summary && r.profile_summary.length > 10)
        for (const r of resumes) {
          const { count } = await supabase
            .from('work_experience').select('*', { count: 'exact', head: true }).eq('resume_id', r.id)
          workExpCount += count || 0
        }
        if (workExpCount === 0) {
          const { count } = await supabase
            .from('work_experience').select('*', { count: 'exact', head: true }).eq('resume_id', userId)
          workExpCount += count || 0
        }
      }

      const { count: tailoredCount } = await supabase
        .from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId)
      const { count: sentCount } = await supabase
        .from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'sent')

      // ── user_progress for other modules (graceful fallback) ──
      let progressRows: Array<{ module_id: string; step_id: string }> = []
      try {
        const { data } = await supabase
          .from('user_progress').select('module_id, step_id').eq('user_id', userId)
        progressRows = data || []
      } catch {
        // table may not exist yet — handled gracefully
      }

      // ── build modules ──
      const mods = buildModules(workExpCount, parCount || 0, hasProfile, tailoredCount || 0, progressRows, tier)
      setModules(mods)

      // ── stats ──
      const resumeScore = Math.min(100, Math.round(
        (hasProfile ? 25 : 0) +
        (workExpCount > 0 ? Math.min(25, workExpCount * 8) : 0) +
        ((parCount || 0) > 0 ? Math.min(25, (parCount || 0) * 5) : 0) +
        ((tailoredCount || 0) > 0 ? 25 : 0)
      ))
      const modulesCompleted = Object.values(mods).filter(m => m.completedSteps === m.totalSteps).length

      setStats({
        resumeScore,
        resumeScoreDelta: 6,
        applicationsTracked: tailoredCount || 0,
        interviewsScheduled: sentCount || 0,
        modulesCompleted,
        totalModules: 4,
      })
    } catch (err) {
      console.error('Dashboard load error:', err)
    }
  }

  const activeModuleData = modules?.[activeModule] ?? {
    id: activeModule, title: '', description: '', tier: 'Essentials' as const,
    requiredLevel: 'esenciales' as TierLevel, iconBg: '#E3F2FD',
    completedSteps: 0, totalSteps: 4, steps: [], videoSrc: '', learnMoreRoute: '/', locked: false,
  }

  const tierLabel = userLevel.charAt(0).toUpperCase() + userLevel.slice(1)

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: '100dvh', background: '#F0F3F8', fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* ── LEFT SIDEBAR ── */}
      <Sidebar
        activeModule={activeModule}
        onSelect={setActiveModule}
        userLevel={userLevel}
        tierLabel={userLevel}
        width={sidebarWidth}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onResizeStart={handleSidebarResize}
      />

      {/* ── CENTER PANEL ── */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top bar with user controls */}
        <div
          className="flex items-center justify-between gap-2 px-4 py-2 flex-shrink-0"
          style={{ background: '#F0F3F8' }}
        >
          <img src="/logo.png" alt="NovaWork Global" className="h-14 w-auto object-contain" />
          <div className="flex items-center gap-2">
            {user && <NotificationBell userId={user.id} />}
            <UserMenu user={user} userProfile={userProfile} />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ModulePanel
            module={activeModuleData}
            userName={userProfile?.full_name ?? null}
            loading={loading}
            onWatchVideo={setActiveVideoSrc}
            onNavigate={navigate}
          />
        </div>
      </main>

      {/* ── RIGHT SIDEBAR ── */}
      {rightVisible ? (
        <aside
          className="flex-shrink-0 overflow-y-auto relative"
          style={{ width: rightWidth, minWidth: rightWidth, background: '#FFFFFF', borderLeft: '1px solid #E2E8F0' }}
        >
          {/* Drag-resize handle (left edge) */}
          <div
            onMouseDown={handleRightResize}
            className="absolute top-0 left-0 h-full z-20 flex items-center justify-center group"
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
            onClick={() => setRightVisible(false)}
            className="absolute -left-4 top-6 z-30 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-md hover:shadow-lg hover:scale-110"
            style={{ background: '#1976D2', color: '#fff', border: '2px solid #fff' }}
            title="Hide panel"
          >
            <ChevronRight size={14} />
          </button>

          <div className="pt-[130px]">
            <StatsCard stats={stats} loading={loading} />
            <QuickActions onNavigate={navigate} />
          </div>
        </aside>
      ) : (
        /* Collapsed right sidebar — thin strip with toggle */
        <div
          className="flex-shrink-0 border-l flex flex-col items-center pt-4 transition-all duration-200"
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

      {/* ── VIDEO MODAL ── */}
      {activeVideoSrc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          onClick={() => setActiveVideoSrc(null)}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveVideoSrc(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full aspect-video">
              <video src={activeVideoSrc} className="w-full h-full" controls autoPlay playsInline controlsList="nodownload">
                Your browser does not support video.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
