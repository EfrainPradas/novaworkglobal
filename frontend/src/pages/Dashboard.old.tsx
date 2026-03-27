import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/common/UserMenu'
import NotificationBell from '../components/common/NotificationBell'
import { FileText, Upload, Search, ArrowRight, Lock, Briefcase, Target, Users, Award, Play, BookOpen } from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [parStoriesCount, setParStoriesCount] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)
  const [workExperienceCount, setWorkExperienceCount] = useState(0)
  const [tailoredResumesCount, setTailoredResumesCount] = useState(0)
  const [sentResumesCount, setSentResumesCount] = useState(0)
  const [userLevel, setUserLevel] = useState<'essentials' | 'momentum' | 'executive'>('essentials')
  const [careerVisionStatus, setCareerVisionStatus] = useState({
    started: false,
    completed: false,
    skipped: false,
    hasSeenPrompt: false
  })
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        navigate('/signin')
        return
      }

      setUser(user)
      await loadProgress(user.id)
      setLoading(false)
    }

    checkAuth()
  }, [navigate])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        loadProgress(user.id)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user])

  const loadProgress = async (userId: string) => {
    try {
      const { count } = await supabase
        .from('par_stories')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (count !== null) setParStoriesCount(count)

      // Check profile from any resume (not just is_master)
      const { data: resumes } = await supabase
        .from('user_resumes')
        .select('id, profile_summary, areas_of_excellence')
        .eq('user_id', userId)

      if (resumes && resumes.length > 0) {
        const profileResume = resumes.find(r => r.profile_summary && r.profile_summary.length > 10 && r.areas_of_excellence && r.areas_of_excellence.length > 0)
        if (profileResume) setHasProfile(true)

        // Count work experience across all resumes
        let totalWorkExp = 0
        for (const resume of resumes) {
          const { count: workExpCount } = await supabase
            .from('work_experience')
            .select('*', { count: 'exact', head: true })
            .eq('resume_id', resume.id)

          totalWorkExp += workExpCount || 0
        }

        // Legacy fallback: resume_id = userId
        if (totalWorkExp === 0) {
          const { count: legacyCount } = await supabase
            .from('work_experience')
            .select('*', { count: 'exact', head: true })
            .eq('resume_id', userId)

          totalWorkExp += legacyCount || 0
        }

        setWorkExperienceCount(totalWorkExp)
      } else {
        // No resumes at all — check legacy (resume_id = userId)
        const { count: legacyCount } = await supabase
          .from('work_experience')
          .select('*', { count: 'exact', head: true })
          .eq('resume_id', userId)

        if (legacyCount && legacyCount > 0) setWorkExperienceCount(legacyCount)
      }

      const { count: tailoredCount } = await supabase
        .from('tailored_resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (tailoredCount !== null) setTailoredResumesCount(tailoredCount)

      const { count: sentCount } = await supabase
        .from('tailored_resumes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'sent')

      if (sentCount !== null) setSentResumesCount(sentCount)

      const { data: careerVision } = await supabase
        .from('user_profiles')
        .select('career_vision_started, career_vision_completed, career_vision_skipped, has_seen_career_vision_prompt')
        .eq('user_id', userId)
        .maybeSingle()

      if (careerVision) {
        setCareerVisionStatus({
          started: careerVision.career_vision_started || false,
          completed: careerVision.career_vision_completed || false,
          skipped: careerVision.career_vision_skipped || false,
          hasSeenPrompt: careerVision.has_seen_career_vision_prompt || false
        })
      }

      // Subscription tier
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', userId)
        .single()

      if (userData?.subscription_tier) {
        let tier = userData.subscription_tier
        if (tier === 'basic') tier = 'essentials'
        if (tier === 'pro') tier = 'momentum'
        setUserLevel(tier as 'essentials' | 'momentum' | 'executive')
      }

      // User profile name
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('full_name')
        .eq('user_id', userId)
        .maybeSingle()

      const { data: resumeData } = await supabase
        .from('user_resumes')
        .select('full_name')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()

      if (profileData?.full_name) {
        setUserProfile(profileData)
      } else if (resumeData) {
        setUserProfile(resumeData)
      }
    } catch (error) {
      console.error('Error loading progress:', error)
    }
  }

  // ── helpers ──
  const canAccess = (requiredLevel: string) => {
    const levels: Record<string, number> = { essentials: 1, momentum: 2, executive: 3 }
    return levels[userLevel] >= levels[requiredLevel]
  }

  const tierLabel = userLevel.charAt(0).toUpperCase() + userLevel.slice(1)

  // Progress for "recommended next step"
  const completedSteps = [hasProfile, workExperienceCount > 0, parStoriesCount > 0, tailoredResumesCount > 0, sentResumesCount > 0]
  const completedCount = completedSteps.filter(Boolean).length
  const totalSteps = 5

  // Resume score (simple heuristic)
  const resumeScore = Math.min(100, Math.round(
    (hasProfile ? 25 : 0) +
    (workExperienceCount > 0 ? Math.min(25, workExperienceCount * 8) : 0) +
    (parStoriesCount > 0 ? Math.min(25, parStoriesCount * 5) : 0) +
    (tailoredResumesCount > 0 ? 25 : 0)
  ))

  // ── what to recommend ──
  const getRecommendation = () => {
    if (!hasProfile) return { title: 'Build My Resume', desc: 'Start by creating your professional profile. We\'ll guide you step by step.', route: '/resume-builder', progress: completedCount }
    if (workExperienceCount === 0) return { title: 'Add Work Experience', desc: 'Add your work history to strengthen your resume.', route: '/resume/work-experience', progress: completedCount }
    if (parStoriesCount === 0) return { title: 'Write CAR Stories', desc: 'Capture your key accomplishments using the CAR framework.', route: '/resume-builder/par-stories', progress: completedCount }
    if (tailoredResumesCount === 0) return { title: 'Tailor Your Resume', desc: 'Analyze a job description and tailor your resume for maximum match.', route: '/resume-builder/jd-analyzer', progress: completedCount }
    return { title: 'Build My Resume', desc: 'Continue where you left off. We\'ll prioritize edits to improve ATS match and clarity.', route: '/resume-builder', progress: completedCount }
  }

  const recommendation = getRecommendation()

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ────────────────────────────────────────────────
  // CARD DATA
  // ────────────────────────────────────────────────
  const cards = [
    {
      id: 'career-vision',
      icon: <Target className="w-6 h-6" />,
      iconBg: 'bg-blue-100 text-blue-600',
      tier: 'Momentum' as const,
      title: 'Understand Your Career Vision',
      description: 'Get a clear understanding of who you are and what is your success formula.',
      route: '/career-vision/dashboard',
      locked: !canAccess('momentum'),
      started: careerVisionStatus.started,
      completed: careerVisionStatus.completed,
      videoSrc: '/videos/AI_and_Your_Career_Path-EN.mp4'
    },
    {
      id: 'resume-builder',
      icon: <FileText className="w-6 h-6" />,
      iconBg: 'bg-green-100 text-green-600',
      tier: 'Essentials' as const,
      title: 'Resume Builder',
      description: 'Build an interview magnet resume and your personal accomplishment bank.',
      route: '/resume-builder',
      locked: false,
      started: hasProfile || workExperienceCount > 0,
      completed: hasProfile && workExperienceCount > 0 && parStoriesCount > 0,
      videoSrc: '/videos/The_NovaWork_Blueprint__resume_builder.mp4'
    },
    {
      id: 'job-search',
      icon: <Briefcase className="w-6 h-6" />,
      iconBg: 'bg-orange-100 text-orange-600',
      tier: 'Momentum' as const,
      title: 'Job Search and Positioning',
      description: 'Use these techniques and get called for an interview 75% faster than others.',
      route: '/fast-track/plan-your-search',
      locked: !canAccess('momentum'),
      started: tailoredResumesCount > 0,
      completed: sentResumesCount > 0,
      videoSrc: '/videos/IMR-EN.mp4'
    },
    {
      id: 'interview',
      icon: <Users className="w-6 h-6" />,
      iconBg: 'bg-purple-100 text-purple-600',
      tier: 'Executive' as const,
      title: 'Interview Mastery',
      description: 'Be the one they choose. Understand and practice the interview to be the winning candidate.',
      route: '/interview',
      locked: !canAccess('executive'),
      started: false,
      completed: false,
      videoSrc: '/videos/Your_Interview_Playbook-EN.mp4'
    }
  ]

  const tierColors: Record<string, string> = {
    Essentials: 'bg-green-100 text-green-700 border-green-200',
    Momentum: 'bg-blue-100 text-blue-700 border-blue-200',
    Executive: 'bg-amber-100 text-amber-700 border-amber-200'
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* ═══════════ HEADER ═══════════ */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="NovaWork Global" className="h-12 w-auto block dark:hidden" />
              <img src="/logo-white.png" alt="NovaWork Global" className="h-12 w-auto hidden dark:block" />
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                {userLevel === 'executive' && <Award className="w-3 h-3 text-amber-500" />}
                {userLevel === 'executive' ? t('dashboard.executiveMember', 'Executive Member') : 
                 userLevel === 'momentum' ? t('dashboard.momentumMember', 'Momentum Member') : 
                 t('dashboard.essentialsPlan', 'Essentials Plan')}
              </span>
            </div>
            <div className="flex items-center gap-4">
              {user && <NotificationBell userId={user.id} />}
              <UserMenu user={user} userProfile={userProfile} />
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Top Row: Recommended Next Step + Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* Recommended Next Step */}
          <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800 rounded-2xl border border-blue-100 dark:border-gray-700 p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

              <div className="flex items-start gap-4 flex-1">
                <div className="flex-shrink-0 w-14 h-14 bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shadow-sm">
                  <FileText className="w-7 h-7" />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Recommended Next Step</div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{recommendation.title}</h3>
                  <p className="text-gray-600 dark:text-gray-300 max-w-md">{recommendation.desc}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => navigate(recommendation.route)}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md shadow-blue-500/20"
                >
                  Continue <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveVideoSrc(`/videos/Resume General.mp4?t=${Date.now()}`)
                  }}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-xl transition-all shadow-md shadow-teal-500/20"
                >
                  <Play className="w-5 h-5" /> {t('dashboard.watchVideo', 'Watch video')}
                </button>
              </div>

            </div>
          </div>

          {/* Stats sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
              <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Your stats this week</div>
              {/* Profile Completeness */}
              <div className="text-center mb-4">
                <div className="text-4xl font-bold text-gray-900 dark:text-white">{resumeScore}%</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Profile completeness</div>
                <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[180px] mx-auto">
                  <div className="h-full bg-blue-600 rounded-full transition-all" style={{ width: `${resumeScore}%` }} />
                </div>
              </div>
              <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <FileText className="w-4 h-4 text-gray-400" /> Applications tracked
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{tailoredResumesCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Users className="w-4 h-4 text-gray-400" /> Interviews scheduled
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white">{sentResumesCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Card Grid + Quick Actions ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* 2×2 Card Grid */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {cards.map(card => (
              <div
                key={card.id}
                className={`
                  bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm
                  transition-all duration-200
                  ${card.locked ? 'opacity-75' : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'}
                `}
                onClick={() => {
                  if (card.locked) {
                    alert(`This feature requires the ${card.tier} plan. Upgrade to unlock!`)
                  } else {
                    navigate(card.route)
                  }
                }}
              >
                {/* Top row: icon + tier badge */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                    {card.icon}
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${tierColors[card.tier]}`}>
                    <Award className="w-3 h-3" />
                    {card.tier}
                  </span>
                </div>

                {/* Title + description */}
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">{card.description}</p>

                {/* Footer: action + video/learn buttons */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-3">
                  {card.locked ? (
                    <span className="flex items-center justify-center sm:justify-start gap-1.5 text-sm text-amber-600 font-medium">
                      Upgrade to {card.tier}
                      <Lock className="w-3.5 h-3.5 ml-1 text-gray-400" />
                    </span>
                  ) : card.started ? (
                    <span className="text-sm font-semibold text-blue-600 text-center sm:text-left w-full sm:w-auto">Continue</span>
                  ) : (
                    <span className="text-sm text-gray-500 text-center sm:text-left w-full sm:w-auto">Preview</span>
                  )}

                  {/* Progress indicator for Resume Builder */}
                  {card.id === 'resume-builder' && !card.locked && (
                    <div className="h-1.5 w-full sm:w-16 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-2 sm:mt-0">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${(completedCount / totalSteps) * 100}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Watch video + Learn more */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveVideoSrc(card.videoSrc)
                    }}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Play className="w-3 h-3" /> {t('dashboard.watchVideo', 'Watch video')}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!card.locked) navigate(card.route)
                    }}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <BookOpen className="w-3 h-3" /> Learn more
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm h-fit">
            <div className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">Quick actions</div>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/dashboard/resume/work-experience?openImport=true')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Upload resume</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/dashboard/resume-builder/jd-analyzer')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <Search className="w-4 h-4 text-amber-400 group-hover:text-amber-500 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Analyze job description</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-amber-500 transition-colors" />
              </button>

              <button
                onClick={() => navigate('/shared-resources')}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <BookOpen className="w-4 h-4 text-teal-500 group-hover:text-teal-600 transition-colors" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Shared Resources</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-600 transition-colors" />
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* Video Modal */}
      {activeVideoSrc && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setActiveVideoSrc(null)}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setActiveVideoSrc(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black flex items-center justify-center relative">
              <video
                src={activeVideoSrc}
                className="w-full h-full outline-none"
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
