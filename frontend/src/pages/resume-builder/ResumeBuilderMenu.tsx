import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Briefcase, Trophy, ClipboardList, CheckSquare, CheckCircle, ArrowRight, Play, GraduationCap, Award, Star, ChevronDown, ChevronUp, Info } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import ServiceAddOns from '../../components/services/ServiceAddOns'
import { trackEvent } from '../../lib/analytics'
import { useGuidedTour, TourTriggerButton } from '../../components/guided-tour'
import { resumeBuilderMenuTourConfig } from '../../config/tours/resumeBuilderMenuTour'


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
  expandedText: string
}

export default function ResumeBuilderMenu() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userLevel, setUserLevel] = useState<'essentials' | 'momentum' | 'executive'>('essentials')
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [tourStarted, setTourStarted] = useState(false)
  const { startTour, hasCompletedTour } = useGuidedTour()


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

      // Check and start tour
      const completed = await hasCompletedTour(resumeBuilderMenuTourConfig.tourId)
      if (!completed && !tourStarted) {
        setTourStarted(true)
        setTimeout(() => {
          startTour(resumeBuilderMenuTourConfig)
        }, 800)
      }
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

    try {
      // Check accomplishment bank
      const { data: bankData } = await supabase
        .from('accomplishment_bank')
        .select('id')
        .eq('user_id', userId)
        .limit(1)

      if (bankData && bankData.length > 0) completed.add('accomplishment-bank')
    } catch (e) {
      console.warn('Bank progress check failed:', e)
    }

    setCompletedSteps(completed)
  }

  const resumeOptions: ResumeOption[] = [
    {
      id: 'work-and-education',
      title: t('resumeBuilder.menu.workAndEducationTitle', 'Work Experience and Education'),
      description: t('resumeBuilder.menu.workAndEducationDesc', 'Build your career history and academic record.'),
      icon: Briefcase,
      route: '/dashboard/resume/work-experience?mode=standalone',
      completed: completedSteps.has('work-history') && completedSteps.has('education'),
      current: !completedSteps.has('work-history') || !completedSteps.has('education'),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      expandedText: "In the first part, you'll outline your work experience. This is where you list the companies and roles you've held, along with the key details like the company name, position, years, and locations. Follow the steps carefully to ensure you capture all the essential information."
    },
    {
      id: 'accomplishments-hub',
      title: t('resumeBuilder.menu.accomplishmentBankTitle', 'Accomplishment Bank'),
      description: t('resumeBuilder.menu.accomplishmentBankDesc', 'Highlight your key accomplishments.'),
      icon: Trophy,
      route: '/dashboard/resume/accomplishments-hub?mode=standalone',
      completed: completedSteps.has('accomplishment-bank') && completedSteps.has('story-cards'),
      current: (completedSteps.has('work-history') && completedSteps.has('education')) && (!completedSteps.has('accomplishment-bank') || !completedSteps.has('story-cards')),
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      expandedText: "Next, you'll move on to the Accomplishment Bank, where you'll gather all the major achievements from your career. You can populate this section in two ways: either by uploading accomplishments from an older resume or by building them through our CAR system (Context/Challenge + Actions + Results). Once you've compiled your accomplishments, you can organize them either chronologically or by competencies. This serves as a lifetime repository of your achievements, making it easy to reference and update as your career progresses."
    },
    {
      id: 'professional-profile',
      title: t('resumeBuilder.menu.professionalSummaryTitle', 'Professional Summary'),
      description: t('resumeBuilder.menu.professionalSummaryDesc', 'Introduce and position yourself.'),
      icon: ClipboardList,
      route: '/dashboard/resume/questionnaire?mode=standalone',
      completed: completedSteps.has('questionnaire'),
      current: completedSteps.has('story-cards') && !completedSteps.has('questionnaire'),
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
      borderColor: 'border-teal-200',
      expandedText: "Build the reader's first impression of who you are — a positioning paragraph that includes the main ATS keywords and showcases your professional identity. Create it by writing it yourself, following video instructions, or using our AI questionnaire for guidance."
    },
    {
      id: 'finalize',
      title: t('resumeBuilder.menu.chooseResumeTitle', 'Choose your Resume'),
      description: t('resumeBuilder.menu.chooseResumeDesc', 'Chronological or Functional'),
      icon: CheckSquare,
      route: '/dashboard/resume/type-selection?mode=standalone',
      completed: completedSteps.has('finalize'),
      current: completedSteps.has('questionnaire') && !completedSteps.has('finalize'),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      expandedText: "With the three parts complete, choose whether to create a chronological resume, a functional resume, or both. A chronological resume is ideal for continuing in a similar career path. A functional résumé is great for career changers, versatile careers, project-based work, or international moves. Having both can be a valuable asset in your job search strategy."
    }
  ]

  if (!user) return null
  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>

  // Calculate macro-step progress
  const macroStepsCompleted = resumeOptions.filter(opt => opt.completed).length
  const progressPercentage = Math.round((macroStepsCompleted / resumeOptions.length) * 100)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">



        {/* Back Button */}
        <div className="flex items-center justify-between mb-4">
          <BackButton
            to="/dashboard"
            label={t('resumeBuilder.menu.backToDashboard')}
            variant="light"
            className="pl-0"
          />
          <TourTriggerButton
            tour={resumeBuilderMenuTourConfig}
            onStartTour={startTour}
            hasCompletedTour={hasCompletedTour}
          />
        </div>

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-md text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
          <div className="w-full">
            <div className="flex flex-col md:flex-row items-start justify-between gap-6 w-full">
              <div className="flex items-start gap-4">
                <img src="/logo.png" alt="NovaWork Global" className="h-16 w-auto block dark:hidden" />
                <img src="/logo-white.png" alt="NovaWork Global" className="h-16 w-auto hidden dark:block" />
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold mb-1 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="break-words">{t('resumeBuilder.menu.title')}</span>
                  </h1>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-gray-500 text-xs">{macroStepsCompleted} of {resumeOptions.length} steps completed</span>
                    <span className="text-gray-300 text-xs">|</span>
                    <button
                      onClick={() => navigate('/dashboard/resume-builder/learn-more')}
                      className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline underline-offset-2 transition-colors whitespace-nowrap"
                    >
                      Read this before starting to use this tool →
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex items-center w-full md:w-auto">
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  <Play className="w-4 h-4" /> Watch video
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
          {resumeOptions.map((option, index) => {
            const Icon = option.icon
            const tourStepId = `resume-step-${index + 1}`

            return (
              <div
                key={option.id}
                data-tour={tourStepId}
                className={`
                group relative p-8 rounded-2xl border transition-all duration-300
                bg-white dark:bg-gray-800 hover:shadow-2xl cursor-pointer hover:-translate-y-1
                border-gray-200 dark:border-gray-700
                ${option.current ? `ring-2 ring-offset-2 dark:ring-offset-gray-900 ${option.color.replace('text-', 'ring-')}` : ''}
              `}
                onClick={() => navigate(option.route)}
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

                <div className="flex items-center justify-end mt-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setExpandedCards(prev => {
                        const next = new Set(prev)
                        if (next.has(option.id)) next.delete(option.id)
                        else next.add(option.id)
                        return next
                      })
                    }}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  >
                    {expandedCards.has(option.id) ? (
                      <>{t('resumeBuilder.menu.showLess', 'Show less')} <ChevronUp className="w-4 h-4" /></>
                    ) : (
                      <>{t('resumeBuilder.menu.learnMore', 'Learn more')} <ChevronDown className="w-4 h-4" /></>
                    )}
                  </button>
                </div>

                {/* Expanded Content inside the Card */}
                {expandedCards.has(option.id) && (
                  <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed border-t border-gray-100 dark:border-gray-700/50 pt-4">
                    {option.expandedText}
                  </div>
                )}
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
                  src={encodeURI(`${import.meta.env.BASE_URL}videos/The_NovaWork_Blueprint__resume_builder.mp4`)}
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
    </div>
  )
}