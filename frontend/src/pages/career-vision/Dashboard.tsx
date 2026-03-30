/**
 * Career Vision Dashboard
 * Shows progress and provides navigation to different Career Vision sections
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Play } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'

export default function CareerVisionDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [activeVideoSrc, setActiveVideoSrc] = useState<string | null>(null)
  const [sectionsStatus, setSectionsStatus] = useState({
    skillsValues: false,
    jobHistory: false,
    preferences: false
  })

  useEffect(() => {
    loadProgress()
  }, [])

  // Reload progress when page becomes visible (e.g., after completing a section)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('📊 Career Vision Dashboard visible, reloading progress...')
        loadProgress()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      // Check skills/interests completion from user_skills and user_interests tables
      const { count: skillsCount } = await supabase
        .from('user_skills')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const { count: interestsCount } = await supabase
        .from('user_interests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const skillsValuesComplete = (skillsCount && skillsCount >= 3) && (interestsCount && interestsCount >= 3)

      // Check job history completion (at least 1 job)
      const { count: jobCount } = await supabase
        .from('job_history_analysis')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      const jobHistoryComplete = jobCount && jobCount >= 1

      // Check preferences completion
      const { data: prefs } = await supabase
        .from('ideal_work_preferences')
        .select('industry_preference')
        .eq('user_id', user.id)
        .maybeSingle()

      const preferencesComplete = !!prefs?.industry_preference

      setSectionsStatus({
        skillsValues: skillsValuesComplete || false,
        jobHistory: jobHistoryComplete || false,
        preferences: preferencesComplete || false
      })
    } catch (error) {
      console.error('Error loading Career Vision progress:', error)
    } finally {
      setLoading(false)
    }
  }

  const completedCount = Object.values(sectionsStatus).filter(Boolean).length
  const progressPercent = Math.round((completedCount / 3) * 100)

  const sections = [
    {
      id: 'skills-values',
      title: t('careerVision.journey.skillsInterests', 'Skills & Interests'),
      description: t('careerVision.journey.skillsSubtitle', 'List what you know and what you would do again'),
      icon: '🎯',
      completed: sectionsStatus.skillsValues,
      route: '/dashboard/career-vision/skills-values',
      videoSrc: `${import.meta.env.BASE_URL}videos/AI_and_Your_Career_Path-EN.mp4`
    },
    {
      id: 'job-history',
      title: t('careerVision.journey.jobHistoryAnalysis', 'Job History Analysis'),
      description: t('careerVision.journey.jobHistorySubtitle', 'Reflect on past roles to identify patterns'),
      icon: '📋',
      completed: sectionsStatus.jobHistory,
      route: '/dashboard/career-vision/job-history',
      videoSrc: `${import.meta.env.BASE_URL}videos/AI_and_Your_Career_Path-EN.mp4`
    },
    {
      id: 'preferences',
      title: t('careerVision.journey.idealWorkPreferences', 'Ideal Work Preferences'),
      description: t('careerVision.journey.idealWorkSubtitle', 'Define your must-haves and priorities'),
      icon: '⚙️',
      completed: sectionsStatus.preferences,
      route: '/dashboard/career-vision/preferences',
      videoSrc: `${import.meta.env.BASE_URL}videos/AI_and_Your_Career_Path-EN.mp4`
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your progress...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('careerVision.journey.title', 'Your Career Vision Journey')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t('careerVision.journey.subtitle', 'Complete these sections to discover your ideal career path')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveVideoSrc(`${import.meta.env.BASE_URL}videos/Mapping_the_Professional_DNA__The_Skills_&_Interests_Assessment.mp4`)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" /> {t('careerVision.journey.watchVideo', 'Watch video')}
            </button>
            <LearnMoreLink
              label={t('careerVision.journey.whatIsCareerVision', 'What is Career Vision?')}
              description={t('careerVision.journey.clarityHired', 'Clarity gets you hired 2x faster')}
              onClick={() => navigate('/dashboard/career-vision/learn-more')}
            />
          </div>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t('careerVision.journey.progress', 'Progress')}
            </h2>
            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{progressPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-primary-600 to-secondary-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t('careerVision.journey.sectionsCompleted', '{{completed}} of {{total}} sections completed', { completed: completedCount, total: 3 })}
          </p>
        </div>


        {/* Sections Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow hover:shadow-xl transition-all p-6 cursor-pointer relative overflow-hidden ${section.completed
                ? 'border-2 border-green-400 dark:border-green-600/50'
                : 'border-2 border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
                }`}
              onClick={() => navigate(section.route)}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4">
                {section.completed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-300 dark:border-green-800">
                    {t('careerVision.journey.completed', '✓ Completed')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-300 dark:border-orange-800">
                    {t('careerVision.journey.notStarted', 'Not started')}
                  </span>
                )}
              </div>

              <div className="text-5xl mb-4">{section.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 pr-24">
                {section.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                {section.description}
              </p>

              <div className="flex items-center gap-2 mb-3">
                <button className={`px-4 py-2 rounded-lg font-semibold transition-all ${section.completed
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}>
                  {section.completed ? t('careerVision.journey.review', 'Review →') : t('careerVision.journey.start', 'Start →')}
                </button>
              </div>

              {/* Watch video + Learn more */}
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={(e) => { e.stopPropagation(); setActiveVideoSrc(section.videoSrc) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <Play className="w-3 h-3" /> {t('careerVision.journey.watchVideo', 'Watch video')}
                </button>
                <LearnMoreLink
                  label={t('careerVision.journey.exploreSection', 'Explore section')}
                  description={t('careerVision.journey.deepenKnowledge', 'Deepen your self-knowledge and strategy')}
                  onClick={(e: any) => { e.stopPropagation(); navigate('/dashboard/career-vision/learn-more') }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {completedCount === 3 ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border border-green-300 dark:border-green-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('careerVision.journey.completeTitle', 'Career Vision Complete!')}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('careerVision.journey.completeSubtitle', "You've completed all sections. View your comprehensive career profile now!")}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/dashboard/career-vision/summary')}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                {t('careerVision.journey.viewCareerVision', 'View Your Career Vision →')}
              </button>
              <BackButton to="/dashboard" label={t('careerVision.journey.backToDashboard', 'Back to Dashboard')} />
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t('careerVision.dashboard.note', 'Complete all sections to generate your personalized Career Vision statement')}
            </p>
            <BackButton to="/dashboard" label={t('careerVision.dashboard.backToDashboard', 'Back to Main Dashboard')} />
          </div>
        )}
      </div>

      {/* Video Modal */}
      {activeVideoSrc && (
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
        onClick={() => setActiveVideoSrc(null)}
      >
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
        <div
          className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setActiveVideoSrc(null)}
            className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
            aria-label="Close video"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full aspect-video bg-black">
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
