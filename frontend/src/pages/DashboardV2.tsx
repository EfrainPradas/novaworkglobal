import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import UserMenu from '../components/common/UserMenu'
import NotificationBell from '../components/common/NotificationBell'
import {
  FileText, Target, Brain, ArrowRight,
  Star, Crown, Users, Play, BookOpen,
  Search, Upload, Lock, Award, TrendingUp,
} from 'lucide-react'

// ─────────────────────────────────────────────
// Circular Progress SVG
// ─────────────────────────────────────────────
function CircleProgress({ pct, size = 52 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="#DBEAFE" strokeWidth={5} fill="none" />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        stroke="#2563EB" strokeWidth={5} fill="none"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
      />
    </svg>
  )
}

export default function DashboardV2() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userLevel, setUserLevel] = useState<'essentials' | 'momentum' | 'executive'>('essentials')
  const [resumeProgress, setResumeProgress] = useState(0)
  const RESUME_TOTAL_STEPS = 5
  const [parStoriesCount, setParStoriesCount] = useState(0)
  const [hasProfile, setHasProfile] = useState(false)
  const [workExperienceCount, setWorkExperienceCount] = useState(0)
  const [tailoredResumesCount, setTailoredResumesCount] = useState(0)
  const [sentResumesCount, setSentResumesCount] = useState(0)
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { navigate('/signin'); return }
      setUser(user)

      const { data: userData } = await supabase
        .from('users').select('subscription_tier').eq('id', user.id).single()
      if (userData?.subscription_tier) {
        let tier = userData.subscription_tier
        if (tier === 'basic') tier = 'essentials'
        if (tier === 'pro') tier = 'momentum'
        setUserLevel(tier as 'essentials' | 'momentum' | 'executive')
      }

      const { data: profile } = await supabase
        .from('user_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setUserProfile(profile)

      let progress = 0
      const { data: contactData } = await supabase.from('user_contact_profile').select('user_id').eq('user_id', user.id).maybeSingle()
      if (contactData) progress++

      const { data: resumes } = await supabase.from('user_resumes').select('id, profile_summary').eq('user_id', user.id).eq('is_master', true).order('created_at', { ascending: false }).limit(1)
      const resumeData = resumes && resumes.length > 0 ? resumes[0] : null
      if (resumeData) { progress++; setHasProfile(true) }

      if (resumeData) {
        const { count } = await supabase.from('work_experience').select('id', { count: 'exact', head: true }).eq('resume_id', resumeData.id)
        if (count && count > 0) { progress++; setWorkExperienceCount(count) }
      }

      const { count: storyCount } = await supabase.from('par_stories').select('id', { count: 'exact', head: true }).eq('user_id', user.id)
      if (storyCount && storyCount > 0) { progress++; setParStoriesCount(storyCount) }
      if (resumeData?.profile_summary) progress++
      setResumeProgress(progress)

      const { count: tailoredCount } = await supabase.from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', user.id)
      if (tailoredCount !== null) setTailoredResumesCount(tailoredCount)

      const { count: sentCount } = await supabase.from('tailored_resumes').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'sent')
      if (sentCount !== null) setSentResumesCount(sentCount)

    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const canAccess = (level: string) => {
    const lvl: Record<string, number> = { essentials: 1, momentum: 2, executive: 3 }
    return lvl[userLevel] >= lvl[level]
  }

  const overallPct = Math.min(100, Math.round(
    (hasProfile ? 20 : 0) +
    (workExperienceCount > 0 ? 20 : 0) +
    (parStoriesCount > 0 ? 20 : 0) +
    (tailoredResumesCount > 0 ? 20 : 0) +
    (sentResumesCount > 0 ? 20 : 0)
  ))

  const resumePct = Math.round((resumeProgress / RESUME_TOTAL_STEPS) * 100)

  const firstName = userProfile?.full_name
    ? userProfile.full_name.split(' ')[0]
    : user?.email?.split('@')[0] || 'User'

  // ── 4 module cards ──
  const cards = [
    {
      id: 'career-vision',
      icon: Brain,
      iconBg: 'bg-blue-100 text-blue-600',
      tierLabel: 'Momentum',
      tierColor: 'bg-blue-50 text-blue-600 border-blue-200',
      title: 'Understand Your Career Vision',
      desc: 'Get a clear understanding of who you are and what is your success formula.',
      route: '/career-vision/dashboard',
      locked: !canAccess('momentum'),
      started: hasProfile,
      progress: hasProfile ? 100 : 0,
      requiredLevel: 'momentum',
      video: '/videos/AI_and_Your_Career_Path-EN.mp4',
    },
    {
      id: 'resume-builder',
      icon: FileText,
      iconBg: 'bg-green-100 text-green-600',
      tierLabel: 'Essentials',
      tierColor: 'bg-green-50 text-green-600 border-green-200',
      title: 'Resume Builder',
      desc: 'Build an interview magnet resume and your personal accomplishment bank.',
      route: '/resume-builder',
      locked: false,
      started: hasProfile || workExperienceCount > 0,
      progress: resumePct,
      requiredLevel: 'essentials',
      video: '/videos/The_NovaWork_Blueprint__resume_builder.mp4',
    },
    {
      id: 'job-search',
      icon: Target,
      iconBg: 'bg-orange-100 text-orange-600',
      tierLabel: 'Momentum',
      tierColor: 'bg-blue-50 text-blue-600 border-blue-200',
      title: 'Job Search and Positioning',
      desc: 'Use these techniques and get called for an interview 75% faster than others.',
      route: '/job-search-hub',
      locked: !canAccess('momentum'),
      started: tailoredResumesCount > 0,
      progress: tailoredResumesCount > 0 ? Math.min(90, tailoredResumesCount * 15) : 0,
      requiredLevel: 'momentum',
      video: '/videos/IMR-EN.mp4',
    },
    {
      id: 'interview',
      icon: Users,
      iconBg: 'bg-amber-100 text-amber-600',
      tierLabel: 'Executive',
      tierColor: 'bg-amber-50 text-amber-600 border-amber-200',
      title: 'Interview Mastery',
      desc: 'Be the one they choose. Understand and practice the interview to be the winning candidate.',
      route: '/interview',
      locked: !canAccess('executive'),
      started: false,
      progress: 0,
      requiredLevel: 'executive',
      video: '/videos/Your_Interview_Playbook-EN.mp4',
    },
  ]

  // ── Sidebar nav uses the same 4 modules ──
  const NAV_MODULES = cards.map(c => ({
    id: c.id,
    label: c.title,
    icon: c.icon,
    route: c.route,
    locked: c.locked,
  }))

  const QUICK_ACTIONS = [
    { icon: Search,   label: 'Analyze Job Description', color: 'bg-amber-50 text-amber-500',  path: '/resume-builder/jd-analyzer' },
    { icon: Upload,   label: 'Upload Resume',            color: 'bg-blue-50 text-blue-500',    path: '/resume/work-experience?openImport=true' },
    { icon: Users,    label: 'Book a 1:1 Session',       color: 'bg-teal-50 text-teal-500',    path: '/coaching' },
    { icon: BookOpen, label: 'Shared Resources',         color: 'bg-purple-50 text-purple-500',path: '/shared-resources' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">

      {/* ══════════════════════════════════
          LEFT SIDEBAR — 4 módulos como nav
      ══════════════════════════════════ */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen sticky top-0">

        {/* Spacer para alinearse con el header */}
        <div className="h-[73px] border-b border-gray-100 dark:border-gray-700 flex items-center px-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dashboard V2</p>
        </div>

        {/* Nav: los 4 módulos */}
        <nav className="flex-1 px-3 py-5 space-y-1">
          {NAV_MODULES.map(item => {
            const active = location.pathname === item.route
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => item.locked
                  ? alert(`Requires ${item.id === 'interview' ? 'Executive' : 'Momentum'} plan`)
                  : navigate(item.route)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left ${
                  active
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : item.locked
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-600' : item.locked ? 'text-gray-300 dark:text-gray-600' : 'text-gray-400'}`} />
                <span className="leading-snug">{item.label}</span>
                {item.locked && <Lock className="w-3 h-3 ml-auto text-gray-300" />}
              </button>
            )
          })}
        </nav>

        {/* Plan badge */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-700">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold ${
            userLevel === 'executive' ? 'bg-amber-50 text-amber-700' :
            userLevel === 'momentum'  ? 'bg-emerald-50 text-emerald-700' :
            'bg-gray-100 text-gray-600'
          }`}>
            {userLevel === 'executive' ? <Crown className="w-3.5 h-3.5" /> :
             userLevel === 'momentum'  ? <Star className="w-3.5 h-3.5" /> :
             <Award className="w-3.5 h-3.5" />}
            {userLevel.charAt(0).toUpperCase() + userLevel.slice(1)} Plan
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════
          MAIN AREA
      ══════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* ── TOP HEADER: Logo | Título | Stats | Bell | Avatar ── */}
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center gap-4 sticky top-0 z-40">

          {/* Logo */}
          <img src="/logo.png"       alt="NovaWork" className="h-9 w-auto dark:hidden shrink-0" />
          <img src="/logo-white.png" alt="NovaWork" className="h-9 w-auto hidden dark:block shrink-0" />

          {/* Título central */}
          <div className="flex-1 min-w-0 px-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">
              {t('dashboard.whatToAchieve', 'What do you want to achieve today?')}
            </h1>
            <p className="text-xs text-gray-400">Hi {firstName} 👋</p>
          </div>

          {/* Stats compactos */}
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {/* Overall % con círculo */}
            <div className="relative flex items-center justify-center">
              <CircleProgress pct={overallPct} size={48} />
              <span className="absolute text-[10px] font-bold text-blue-700 dark:text-blue-300">
                {overallPct}%
              </span>
            </div>

            {/* Separador */}
            <div className="h-8 w-px bg-gray-100 dark:bg-gray-700" />

            {/* Stats numéricos */}
            <div className="text-right">
              <p className="text-base font-bold text-gray-900 dark:text-white leading-none">{resumePct}%</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Resume</p>
            </div>
            <div className="text-right">
              <p className="text-base font-bold text-gray-900 dark:text-white leading-none">{tailoredResumesCount}/{tailoredResumesCount > 0 ? tailoredResumesCount : 1}</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">Sent</p>
            </div>
          </div>

          {/* Bell + Avatar */}
          <div className="flex items-center gap-3 ml-2 shrink-0">
            {user && <NotificationBell userId={user.id} />}
            <UserMenu user={user} userProfile={userProfile} />
          </div>
        </header>

        {/* ── MAIN CONTENT ── */}
        <main className="flex-1 p-6 overflow-y-auto">

          {/* ── 4 CARDS 2×2 ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {cards.map((card) => {
              const Icon = card.icon
              return (
                <div
                  key={card.id}
                  className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 flex flex-col transition-all duration-200 ${
                    card.locked
                      ? 'opacity-70'
                      : 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
                  }`}
                  onClick={() => {
                    if (card.locked) alert(`This feature requires the ${card.requiredLevel} plan.`)
                    else navigate(card.route)
                  }}
                >
                  {/* Icon + tier badge */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.iconBg}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${card.tierColor}`}>
                      <Star className="w-2.5 h-2.5" />
                      {card.tierLabel}
                    </span>
                  </div>

                  {/* Title + desc */}
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 leading-snug">
                    {card.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed flex-1 mb-4 line-clamp-3">
                    {card.desc}
                  </p>

                  {/* Status + progress bar */}
                  <div className="mb-3">
                    {card.locked ? (
                      <span className="text-xs text-amber-600 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Upgrade to {card.requiredLevel}
                      </span>
                    ) : card.started ? (
                      <div>
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span className="font-semibold text-blue-600">Continue</span>
                          <span>{card.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-700" style={{ width: `${card.progress}%` }} />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">Preview</span>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {card.locked ? null : (
                      <>
                        <button
                          onClick={(e) => { e.stopPropagation(); setActiveVideoSrc(card.video) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Play className="w-3 h-3" /> Ver Video
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); navigate(card.route) }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                        >
                          <BookOpen className="w-3 h-3" /> Learn more
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── BOTTOM ROW: Quick Actions | My Coaches ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">Quick Actions</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-600 text-white rounded-md">AI</span>
              </div>
              <div className="space-y-2">
                {QUICK_ACTIONS.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${action.color}`}>
                        <action.icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{action.label}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

            {/* My Coaches */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-800 dark:text-white">My Coaches</h3>
                <button
                  onClick={() => navigate('/coaching')}
                  className="text-xs text-blue-600 font-semibold hover:underline"
                >
                  View all →
                </button>
              </div>
              <div className="space-y-2">
                {[
                  { label: 'Resume Coach',    sub: 'Resume & Accomplishments', color: 'bg-blue-100 text-blue-600' },
                  { label: 'Career Strategist', sub: 'Career Vision & Direction', color: 'bg-teal-100 text-teal-600' },
                  { label: 'Interview Coach', sub: 'Interview Prep & Practice',  color: 'bg-amber-100 text-amber-600' },
                  { label: 'Job Search Coach', sub: 'Networking & Applications', color: 'bg-purple-100 text-purple-600' },
                ].map((coach) => (
                  <button
                    key={coach.label}
                    onClick={() => navigate('/coaching')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${coach.color}`}>
                      {coach.label.charAt(0)}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{coach.label}</p>
                      <p className="text-xs text-gray-400 truncate">{coach.sub}</p>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 ml-auto shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>

      {/* ══════════ VIDEO MODAL ══════════ */}
      {activeVideoSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={() => setActiveVideoSrc(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setActiveVideoSrc(null)} className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full aspect-video bg-black">
              <video src={activeVideoSrc} className="w-full h-full outline-none" controls controlsList="nodownload" autoPlay playsInline>
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
