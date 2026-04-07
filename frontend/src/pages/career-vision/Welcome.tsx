/**
 * Career Vision Welcome Page
 * Presents Career Vision with 2-circle design (Skills + Interests only)
 * Uses NovaWork brand colors
 */
import { getVideoUrl } from '@/config/videoUrls'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { Play } from 'lucide-react'
import LearnMoreLink from '../../components/common/LearnMoreLink'

export default function CareerVisionWelcome() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const handleStart = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      // Navigate to Career Vision Dashboard
      navigate('/dashboard/career-vision/dashboard')
    } catch (error) {
      console.error('Error starting Career Vision:', error)
      navigate('/dashboard/career-vision/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="max-w-4xl w-full">
        {/* Main Welcome Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 md:p-12 border border-transparent dark:border-gray-700 transition-colors duration-200">

          {/* Logo */}
          <div className="text-center mb-6">
            <img
              src="/logo.png"
              alt="NovaWork Global"
              className="h-28 w-auto mx-auto block dark:hidden"
            />
            <img
              src="/logo-white.png"
              alt="NovaWork Global"
              className="h-28 w-auto mx-auto hidden dark:block"
            />
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              {t('careerVision.welcome.title', 'Discover Your Career Vision')}
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('careerVision.welcome.subtitle', "Find the intersection of what you're good at and what genuinely excites you")}
            </p>
          </div>

          {/* 2-Circle Venn Diagram with NovaWork colors */}
          <div className="mb-8">
            <div className="flex justify-center items-center py-8">
              <svg viewBox="0 0 400 250" className="w-full max-w-lg h-auto">
                {/* Skills Circle (Left - NovaWork Primary Blue) */}
                <circle
                  cx="130"
                  cy="125"
                  r="100"
                  fill="rgba(37, 99, 235, 0.08)"
                  stroke="#1e40af"
                  strokeWidth="3"
                />
                <text
                  x="100"
                  y="115"
                  fill="#1e40af"
                  fontWeight="bold"
                  fontSize="16"
                  textAnchor="middle"
                >
                  {t('careerVision.welcome.skillsAmp', 'Skills &')}
                </text>
                <text
                  x="100"
                  y="138"
                  fill="#1e40af"
                  fontWeight="bold"
                  fontSize="16"
                  textAnchor="middle"
                >
                  {t('careerVision.welcome.knowledge', 'Knowledge')}
                </text>

                {/* Interests Circle (Right - NovaWork Teal) */}
                <circle
                  cx="270"
                  cy="125"
                  r="100"
                  fill="rgba(13, 148, 136, 0.08)"
                  stroke="#0d9488"
                  strokeWidth="3"
                />
                <text
                  x="300"
                  y="115"
                  fill="#0d9488"
                  fontWeight="bold"
                  fontSize="16"
                  textAnchor="middle"
                >
                  {t('careerVision.welcome.interestsAmp', 'Interests &')}
                </text>
                <text
                  x="300"
                  y="138"
                  fill="#0d9488"
                  fontWeight="bold"
                  fontSize="16"
                  textAnchor="middle"
                >
                  {t('careerVision.welcome.passions', 'Passions')}
                </text>

                {/* Center Intersection - Ideal Job / Career Vision */}
                <ellipse
                  cx="200"
                  cy="125"
                  rx="40"
                  ry="50"
                  fill="rgba(37, 99, 235, 0.12)"
                  stroke="#1e3a5f"
                  strokeWidth="3"
                />
                <text
                  x="200"
                  y="118"
                  fill="#1e3a5f"
                  fontWeight="bold"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {t('careerVision.welcome.idealJob', 'Ideal Job')}
                </text>
                <text
                  x="200"
                  y="135"
                  fill="#1e3a5f"
                  fontWeight="bold"
                  fontSize="11"
                  textAnchor="middle"
                >
                  {t('careerVision.welcome.careerVisionLabel', 'Career Vision')}
                </text>
              </svg>
            </div>

            {/* Center text */}
            <div className="text-center text-base text-gray-700 dark:text-gray-300 font-medium mb-6">
              {t('careerVision.welcome.whenAligned', 'When these two align, you find your')} <span className="text-primary-600 dark:text-primary-400 font-bold">{t('careerVision.welcome.careerVisionIdealJob', 'Career Vision / Ideal Job')}</span>
            </div>
          </div>

          {/* Watch Video + Learn More Buttons */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <a
              href={getVideoUrl('AI_and_Your_Career_Path-EN.mp4')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" /> {t('common.watchVideo', 'Watch video')}
            </a>
            <LearnMoreLink
              label={t('careerVision.welcome.startYourCareerVision', 'Start your Career Vision')}
              description={t('careerVision.welcome.clarityFirstStep', 'Clarity is the first step to landing the right job')}
              onClick={() => navigate('/dashboard/career-vision/dashboard')}
            />
          </div>

          {/* Time & Progress Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-8 transition-colors duration-200">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('careerVision.welcome.takesTenFifteen', 'Takes 10-15 minutes')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{t('careerVision.welcome.saveProgress', 'Save progress anytime')}</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-teal-600 text-white rounded-xl font-bold text-lg hover:from-primary-700 hover:to-teal-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? t('common.loading', 'Loading...') : t('careerVision.welcome.startCareerVision', 'Start Career Vision')}
            </button>
          </div>

          {/* Note */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t('careerVision.welcome.skipNote', 'You can always start or skip this later from your dashboard')}
          </p>

        </div>
      </div>
    </div>
  )
}
