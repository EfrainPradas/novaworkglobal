/**
 * Career Vision Welcome Page
 * Presents Career Vision with 2-circle design (Skills + Interests only)
 * Values will be added as 3rd circle later
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function CareerVisionWelcome() {
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
      navigate('/career-vision/dashboard')
    } catch (error) {
      console.error('Error starting Career Vision:', error)
      navigate('/career-vision/dashboard')
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

          {/* Header */}
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎯</div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              Discover Your Career Vision
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Find the intersection of what you're good at and what genuinely excites you
            </p>
          </div>

          {/* 2-Circle Venn Diagram */}
          <div className="mb-8">
            <div className="flex justify-center items-center py-8">
              <svg viewBox="0 0 400 250" className="w-full max-w-lg h-auto">
                {/* Skills Circle (Left - Blue) */}
                <circle
                  cx="140"
                  cy="125"
                  r="90"
                  className="fill-blue-50/50 stroke-blue-500 dark:fill-blue-900/20 dark:stroke-blue-400 transition-colors duration-200"
                  strokeWidth="3"
                />
                <text
                  x="95"
                  y="115"
                  className="fill-blue-500 dark:fill-blue-400 font-bold transition-colors duration-200"
                  fontSize="18"
                  textAnchor="middle"
                >
                  Skills &
                </text>
                <text
                  x="95"
                  y="138"
                  className="fill-blue-500 dark:fill-blue-400 font-bold transition-colors duration-200"
                  fontSize="18"
                  textAnchor="middle"
                >
                  Knowledge
                </text>

                {/* Interests Circle (Right - Purple) */}
                <circle
                  cx="260"
                  cy="125"
                  r="90"
                  className="fill-purple-50/50 stroke-purple-500 dark:fill-purple-900/20 dark:stroke-purple-400 transition-colors duration-200"
                  strokeWidth="3"
                />
                <text
                  x="305"
                  y="115"
                  className="fill-purple-500 dark:fill-purple-400 font-bold transition-colors duration-200"
                  fontSize="18"
                  textAnchor="middle"
                >
                  Interests &
                </text>
                <text
                  x="305"
                  y="138"
                  className="fill-purple-500 dark:fill-purple-400 font-bold transition-colors duration-200"
                  fontSize="18"
                  textAnchor="middle"
                >
                  Passions
                </text>

                {/* Center Intersection - Sweet Spot */}
                <ellipse
                  cx="200"
                  cy="125"
                  rx="40"
                  ry="50"
                  className="fill-green-50/80 stroke-green-500 dark:fill-green-900/30 dark:stroke-green-400 transition-colors duration-200"
                  strokeWidth="3"
                />
                <text
                  x="200"
                  y="135"
                  fontSize="30"
                  textAnchor="middle"
                >
                  ❤️
                </text>
              </svg>
            </div>

            {/* Center text */}
            <div className="text-center text-base text-gray-700 dark:text-gray-300 font-medium mb-6">
              When these two align, you find your <span className="text-green-600 dark:text-green-400 font-bold">Career Sweet Spot</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-5 text-center transition-colors duration-200">
              <div className="text-3xl mb-2">🎯</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Personalized job recommendations
              </p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-5 text-center transition-colors duration-200">
              <div className="text-3xl mb-2">📝</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Build targeted resumes faster
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-5 text-center transition-colors duration-200">
              <div className="text-3xl mb-2">✨</div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                Focus on opportunities that fit you
              </p>
            </div>
          </div>

          {/* Time & Progress Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-8 transition-colors duration-200">
            <div className="flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">Takes 10-15 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">Save progress anytime</span>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleStart}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Start Career Vision'}
            </button>

            <button
              onClick={handleSkip}
              disabled={loading}
              className="px-8 py-4 bg-white dark:bg-gray-700 text-gray-700 dark:text-white rounded-xl font-semibold text-lg hover:bg-gray-50 dark:hover:bg-gray-600 border-2 border-gray-300 dark:border-gray-600 transition-all disabled:opacity-50"
            >
              Skip for now →
            </button>
          </div>

          {/* Note */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            You can always start or skip this later from your dashboard
          </p>

        </div>
      </div>
    </div>
  )
}
