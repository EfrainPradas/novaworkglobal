import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Trophy, ClipboardList, CheckSquare, CheckCircle2, ChevronRight, Play } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import { trackEvent } from '../../lib/analytics'
import { useGuidedTour, TourTriggerButton } from '../../components/guided-tour'
import { resumeBuilderMenuTourConfig } from '../../config/tours/resumeBuilderMenuTour'
import { ModuleCardEnhancement } from '../../components/guided-path'
import type { GuidedStepKey } from '../../types/guidedPath'

const RESUME_STUDIO_VIDEO_ES = 'https://pub-2d93fef6f7834a81b20ed4331ab265a5.r2.dev/Videos%20Explicativos/Resume%20Studio/Resume_Studio_ES.mp4'
const RESUME_STUDIO_VIDEO_EN = 'https://pub-2d93fef6f7834a81b20ed4331ab265a5.r2.dev/Videos%20Explicativos/Resume%20Studio/Reseume_Studio_EN.mp4'

// Map ResumeBuilderMenu option IDs to guided step keys
const OPTION_TO_STEP_KEY: Record<string, GuidedStepKey> = {
  'work-and-education': 'resume_experience_capture',
  'accomplishments-hub': 'accomplishment_bank',
  'professional-profile': 'professional_positioning',
  'finalize': 'guided_path_complete',
}


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
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set())
  const [userLevel, setUserLevel] = useState<'core' | 'advance' | 'apex'>('core')
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set())
  const [tourStarted, setTourStarted] = useState(false)
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)
  const { startTour, hasCompletedTour } = useGuidedTour()

  const currentLang = i18n.language?.split('-')[0] || 'en'
  const resumeStudioVideoUrl = currentLang === 'es' ? RESUME_STUDIO_VIDEO_ES : (RESUME_STUDIO_VIDEO_EN || RESUME_STUDIO_VIDEO_ES)


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
        if (tier === 'basic') tier = 'core'
        if (tier === 'pro') tier = 'advance'
        setUserLevel(tier as 'core' | 'advance' | 'apex')
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
    const levels = { core: 1, advance: 2, apex: 3 }
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
      description: t('resumeBuilder.menu.workAndEducationDesc', 'Career and academic history.'),
      icon: Briefcase,
      route: '/dashboard/resume/work-experience?mode=standalone',
      completed: completedSteps.has('work-history') && completedSteps.has('education'),
      current: !completedSteps.has('work-history') || !completedSteps.has('education'),
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
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
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
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
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
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
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-200',
      expandedText: "With the three parts complete, choose whether to create a chronological resume, a functional resume, or both. A chronological resume is ideal for continuing in a similar career path. A functional résumé is great for career changers, versatile careers, project-based work, or international moves. Having both can be a valuable asset in your job search strategy."
    }
  ]

  if (!user) return null
  if (loading) return <div className="p-12 text-center text-gray-500">Loading...</div>

  // Calculate macro-step progress
  const macroStepsCompleted = resumeOptions.filter(opt => opt.completed).length
  const progressPercentage = Math.round((macroStepsCompleted / resumeOptions.length) * 100)

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
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

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t('resumeBuilder.menu.title')}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600 dark:text-slate-400">
                <LearnMoreLink
                  label={t('resumeBuilder.menu.readBefore', 'Read this before starting to use this tool')}
                  description=""
                  onClick={() => navigate('/dashboard/resume-builder/learn-more')}
                />
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-700 hover:bg-primary-800 text-white rounded-xl shadow-sm transition-all text-sm font-bold hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play size={16} fill="currentColor" />
                  {t('common.watchVideo', 'Watch video')}
                </button>
              </div>
            </div>

            <div className="w-full md:w-64 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2 text-sm font-medium">
                <span className="text-slate-600 dark:text-slate-400">{t('resumeBuilder.menu.yourProgress', 'Progress')}</span>
                <span className="text-primary-600 dark:text-primary-400">{progressPercentage}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-600 transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {resumeOptions.map((option, index) => {
            const Icon = option.icon
            const tourStepId = `resume-step-${index + 1}`
            const guidedStepKey = OPTION_TO_STEP_KEY[option.id]

            return (
              <ModuleCardEnhancement key={option.id} stepKey={guidedStepKey}>
                <div
                  data-tour={tourStepId}
                  onClick={() => navigate(option.route)}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all p-6 cursor-pointer group flex flex-col h-full"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary-50 dark:bg-gray-700 text-primary-600 dark:text-primary-400 flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300">
                    <Icon className="w-7 h-7" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    {option.title}
                    {option.completed && <CheckCircle2 className="text-green-500" size={20} />}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-1">
                    {option.description}
                  </p>

                  <div className="flex flex-col gap-3 mt-6">
                    <button
                      className="w-full px-4 py-2.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-700 shadow-md shadow-primary-600/20"
                    >
                      {option.completed ? t('careerVision.journey.review', 'Review') : t('careerVision.journey.start', 'Start')}
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </ModuleCardEnhancement>
            )
          })}
        </div>

      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-full aspect-video bg-black flex items-center justify-center relative">
              <video
                src={resumeStudioVideoUrl}
                className="w-full h-full outline-none"
                controls
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