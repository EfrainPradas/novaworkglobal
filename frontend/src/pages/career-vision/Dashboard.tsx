/**
 * Career Vision Dashboard
 * Shows progress and provides navigation to different Career Vision sections
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BackButton } from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'

export default function CareerVisionDashboard() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
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
      title: 'Skills & Interests',
      description: 'Identify what you\'re good at and what excites you',
      icon: '🎯',
      completed: sectionsStatus.skillsValues,
      route: '/career-vision/skills-values'
    },
    {
      id: 'preferences',
      title: 'Ideal Work Preferences',
      description: 'Define your must-haves and priorities',
      icon: '⚙️',
      completed: sectionsStatus.preferences,
      route: '/career-vision/preferences'
    },
    {
      id: 'job-history',
      title: 'Job History Analysis',
      description: 'Reflect on past roles to identify patterns',
      icon: '📋',
      completed: sectionsStatus.jobHistory,
      route: '/career-vision/job-history'
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('careerVision.dashboard.title', 'Your Career Vision Journey')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('careerVision.dashboard.subtitle', 'Complete these sections to discover your ideal career path')}
          </p>
        </div>

        {/* Progress Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8 border border-gray-200 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {t('careerVision.dashboard.progress', 'Progress')}
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
            {completedCount} of 3 sections completed
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
                    <span className="text-green-500">✓</span> Completed
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full text-xs font-bold border border-orange-300 dark:border-orange-800">
                    Not started
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

              <div className="flex items-center justify-between mt-auto">
                <button className={`px-4 py-2 rounded-lg font-semibold transition-all ${section.completed
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                  }`}>
                  {section.completed ? 'Review →' : 'Start →'}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        {completedCount === 3 ? (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 border border-green-300 dark:border-green-800 rounded-lg p-6 text-center">
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Career Vision Complete!
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You've completed all sections. View your comprehensive career profile now!
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => navigate('/career-vision/summary')}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                View Your Career Vision →
              </button>
              <BackButton to="/dashboard" label="Back to Dashboard" />
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
    </div>
  )
}
