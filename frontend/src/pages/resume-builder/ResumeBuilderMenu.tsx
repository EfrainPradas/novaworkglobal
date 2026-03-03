import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, Trophy, ClipboardList, CheckSquare, CheckCircle, ArrowRight, Play, BookOpen, GraduationCap, Award } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import ServiceAddOns from '../../components/services/ServiceAddOns'
import { trackEvent } from '../../lib/analytics'


interface ResumeOption {
  id: string
  title: string
  description: string
  icon: React.ElementType
  route: string
  completed: boolean
  current: boolean
  color: string
  bgColor: string
  borderColor: string
}

export default function ResumeBuilderMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userLevel, setUserLevel] = useState<'essentials' | 'momentum' | 'executive'>('essentials')
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)


  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      // Fetch subscription tier
      const { data: userData } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', user.id)
        .single()

      // Map both old and new tier names
      if (userData?.subscription_tier) {
        let tier = userData.subscription_tier
        // Map old tier names to new ones
        if (tier === 'basic') tier = 'essentials'
        if (tier === 'pro') tier = 'momentum'
        setUserLevel(tier as 'essentials' | 'momentum' | 'executive')
      }

      await loadProgress(user.id)

    }
    setLoading(false)
  }



  const canAccess = (requiredLevel: string) => {
    const levels = { essentials: 1, momentum: 2, executive: 3 }
    return levels[userLevel] >= levels[requiredLevel as keyof typeof levels]
  }

  const loadProgress = async (userId: string) => {
    const completed = new Set<string>()

    try {
      // Check work experience (Step 1) — try both approaches for compatibility
      // First try via user_resumes, then fall back to direct query
      const { data: resumes } = await supabase
        .from('user_resumes')
        .select('id')
        .eq('user_id', userId)

      let hasWorkExp = false
      if (resumes && resumes.length > 0) {
        for (const resume of resumes) {
          const { data: workExp } = await supabase
            .from('work_experience')
            .select('id')
            .eq('resume_id', resume.id)
            .limit(1)

          if (workExp && workExp.length > 0) {
            hasWorkExp = true
            break
          }
        }
      }

      // Also check the original way (resume_id = userId for legacy data)
      if (!hasWorkExp) {
        const { data: legacyWorkExp } = await supabase
          .from('work_experience')
          .select('id')
          .eq('resume_id', userId)
          .limit(1)

        if (legacyWorkExp && legacyWorkExp.length > 0) hasWorkExp = true
      }

      if (hasWorkExp) completed.add('work-history')
    } catch (e) {
      console.warn('Step 1 progress check failed:', e)
    }

    try {
      // Check story cards / accomplishments (Step 2)
      const { data: stories } = await supabase
        .from('par_stories')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (stories && stories.length > 0) completed.add('story-cards')
    } catch (e) {
      console.warn('Step 2 progress check failed:', e)
    }

    try {
      // Check positioning questionnaire (Step 3) — V2 table, may not exist
      const { data: questionnaire, error } = await supabase
        .from('positioning_questionnaire')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle()

      if (!error && questionnaire) completed.add('questionnaire')
    } catch (e) {
      // Table doesn't exist yet — that's OK
    }

    try {
      // Check generated profile (Step 4) — V2 table, may not exist
      const { data: genProfile, error } = await supabase
        .from('generated_professional_profile')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (!error && genProfile && genProfile.length > 0) completed.add('finalize')
    } catch (e) {
      // Table doesn't exist yet — that's OK
    }

    try {
      // Check education
      const { data: eduData } = await supabase
        .from('education')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (eduData && eduData.length > 0) completed.add('education')
    } catch (e) {
      console.warn('Education progress check failed:', e)
    }

    try {
      // Check certifications / awards
      const { data: certData } = await supabase
        .from('certifications')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (certData && certData.length > 0) completed.add('awards')
    } catch (e) {
      console.warn('Awards progress check failed:', e)
    }

    setCompletedSteps(completed)
  }

  const resumeOptions: ResumeOption[] = [
    {
      id: 'work-and-education',
      title: 'Work Experience and Education',
      description: 'Build your career history and academic record.',
      icon: Briefcase,
      route: '/resume/work-experience?mode=standalone',
      completed: completedSteps.has('work-history') && completedSteps.has('education'),
      current: !completedSteps.has('work-history') || !completedSteps.has('education'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      id: 'accomplishments',
      title: 'CAR Stories',
      description: 'Review awards and highlight your key achievements.',
      icon: Trophy,
      route: completedSteps.has('awards') ? '/resume/story-cards?mode=standalone' : '/resume/awards?mode=standalone',
      completed: completedSteps.has('awards') && completedSteps.has('story-cards'),
      current: (completedSteps.has('work-history') && completedSteps.has('education')) && (!completedSteps.has('awards') || !completedSteps.has('story-cards')),
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      id: 'professional-profile',
      title: 'Professional Profile',
      description: 'Define your strategic identity and target market.',
      icon: ClipboardList,
      route: '/resume/questionnaire?mode=standalone',
      completed: completedSteps.has('questionnaire'),
      current: (completedSteps.has('awards') && completedSteps.has('story-cards')) && !completedSteps.has('questionnaire'),
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200'
    },
    {
      id: 'finalize',
      title: 'Finalize and adapt',
      description: 'Review, tailor to a job, export.',
      icon: CheckSquare,
      route: '/resume/jd-analyzer?mode=standalone',
      completed: completedSteps.has('finalize'),
      current: completedSteps.has('questionnaire') && !completedSteps.has('finalize'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    }
  ]

  if (!user) return null
  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>

  // Calculate macro-step progress
  const macroStepsCompleted = resumeOptions.filter(opt => opt.completed).length
  const progressPercentage = Math.round((macroStepsCompleted / resumeOptions.length) * 100)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10 min-h-screen">



      {/* Back Button */}
      <BackButton
        to="/dashboard"
        label={t('resumeBuilder.menu.backToDashboard')}
        variant="light"
        className="mb-4 pl-0"
      />

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
        <div>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <img src="/logo.png" alt="NovaWork Global" className="h-16 w-auto block dark:hidden" />
              <img src="/logo-white.png" alt="NovaWork Global" className="h-16 w-auto hidden dark:block" />
              <div>
                <h1 className="text-3xl font-bold mb-1 flex items-center gap-3">
                  <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  {t('resumeBuilder.menu.title')}
                </h1>
                <span className="text-gray-500 text-xs">{macroStepsCompleted} of {resumeOptions.length} steps completed</span>
                <p className="text-gray-600 dark:text-gray-300 max-w-xl">
                  Follow the steps to complete an interview magnet resume
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={async () => {
                  await trackEvent('analytics', 'step_completed', { step_name: 'funnel-start', next_step: 'contact-details' })
                  navigate('/resume/contact-info')
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-500/25"
              >
                <ArrowRight className="w-4 h-4" /> Start Workflow
              </button>
              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <Play className="w-4 h-4" /> Watch video
              </button>
              <button
                onClick={() => navigate('/resume-builder')}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                <BookOpen className="w-4 h-4" /> Learn more
              </button>
            </div>
          </div>
        </div>

        {/* Global Progress Indicator */}
        <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                className="text-gray-200 dark:text-gray-600"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                fill="none"
                strokeDasharray={175}
                strokeDashoffset={175 - (175 * progressPercentage) / 100}
                className="text-blue-600 dark:text-blue-400 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-sm font-bold text-gray-700 dark:text-gray-200">{progressPercentage}%</span>
          </div>
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white">{t('resumeBuilder.menu.yourProgress')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('resumeBuilder.menu.stepsCompleted', { completed: macroStepsCompleted, total: resumeOptions.length })}</p>
          </div>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {resumeOptions.map((option) => {
          const Icon = option.icon

          return (
            <div
              key={option.id}
              onClick={() => navigate(option.route)}
              className={`
                group relative p-8 rounded-2xl border transition-all duration-300
                bg-white dark:bg-gray-800 hover:shadow-2xl cursor-pointer hover:-translate-y-1
                border-gray-200 dark:border-gray-700
                ${option.current ? `ring-2 ring-offset-2 dark:ring-offset-gray-900 ${option.color.replace('text-', 'ring-')}` : ''}
              `}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-xl ${option.bgColor} dark:bg-gray-700 ${option.color} dark:text-white`}>
                  <Icon className="w-8 h-8" />
                </div>
                {option.completed ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className={`w-6 h-6 ${option.color} dark:text-white`} />
                  </div>
                )}
              </div>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {option.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                {option.description}
              </p>

              <div className="flex items-center justify-between mt-auto">
                <span className={`text-sm font-medium ${option.color} dark:text-white`}>
                  {option.completed ? t('resumeBuilder.menu.editDetails') : t('resumeBuilder.menu.getStarted')}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <ServiceAddOns />

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsVideoModalOpen(false)}
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
              onClick={() => setIsVideoModalOpen(false)}
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
                src={`${import.meta.env.BASE_URL}videos/Master Your Resume in 6 Steps_720p_caption.mp4`}
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