/**
 * Interview Mastery System™ - Main Dashboard
 * STEP 3: Interview Preparation & Strategy
 * Shows list of interview preparations and provides navigation
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation } from '../../types/interview'
import { getDaysUntilInterview, formatInterviewDate } from '../../types/interview'

export default function InterviewMastery() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [interviews, setInterviews] = useState<InterviewPreparation[]>([])
  const [showNewInterviewModal, setShowNewInterviewModal] = useState(false)

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      const { data, error } = await supabase
        .from('interview_preparations')
        .select('*')
        .eq('user_id', user.id)
        .order('interview_date', { ascending: false, nullsFirst: false })

      if (error) throw error

      setInterviews(data || [])
    } catch (error) {
      console.error('Error loading interviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInterview = () => {
    navigate('/interview/new')
  }

  const handleViewInterview = (id: string) => {
    navigate(`/interview/${id}`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      preparing: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Preparing' },
      scheduled: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', label: 'Scheduled' },
      completed: { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', label: 'Completed' },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: 'Cancelled' }
    }
    const badge = badges[status as keyof typeof badges] || badges.preparing
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    )
  }

  const getPhaseProgress = (interview: InterviewPreparation) => {
    const phases = [
      interview.phase1_completed,
      interview.phase2_completed,
      interview.phase3_completed
    ]
    const completed = phases.filter(Boolean).length
    return Math.round((completed / 3) * 100)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading interviews...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/job-search-hub" label="Back to Job Search" className="mb-4 pl-0" />

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                🎯 Interview Mastery System™
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Master your interview preparation with the 3-phase methodology
              </p>
            </div>
            <button
              onClick={handleCreateInterview}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-lg hover:shadow-xl"
            >
              + New Interview Prep
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Interviews</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{interviews.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {interviews.filter(i => i.status === 'scheduled').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📅</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Preparing</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {interviews.filter(i => i.status === 'preparing').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📝</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Completed</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {interviews.filter(i => i.status === 'completed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <span className="text-2xl">✅</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center transition-colors duration-200">
            <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ready to Master Your Interviews?
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              The Interview Mastery System™ guides you through a proven 3-phase methodology:
              <br />
              <strong>Before</strong> (Prepare) → <strong>During</strong> (Execute) → <strong>After</strong> (Follow-up)
            </p>
            <button
              onClick={handleCreateInterview}
              className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
            >
              Create Your First Interview Prep
            </button>
          </div>
        )}

        {/* Interview List */}
        {interviews.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Your Interview Preparations</h2>

            {interviews.map((interview) => {
              const daysUntil = getDaysUntilInterview(interview)
              const progress = getPhaseProgress(interview)

              return (
                <div
                  key={interview.id}
                  onClick={() => handleViewInterview(interview.id!)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer border border-gray-100 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {interview.position_title}
                          </h3>
                          {getStatusBadge(interview.status)}
                        </div>
                        <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                          {interview.company_name}
                        </p>
                        {interview.interview_date && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {formatInterviewDate(interview.interview_date)}
                            {daysUntil !== null && daysUntil > 0 && (
                              <span className="ml-2 text-primary-600 dark:text-primary-400 font-medium">
                                ({daysUntil} days to prepare)
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                          {progress}%
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Complete</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Phase Indicators */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className={`text-center p-3 rounded-lg ${interview.phase1_completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className="text-2xl mb-1">
                          {interview.phase1_completed ? '✅' : '📝'}
                        </div>
                        <p className={`text-sm font-medium ${interview.phase1_completed ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          Phase 1: Prepare
                        </p>
                      </div>
                      <div className={`text-center p-3 rounded-lg ${interview.phase2_completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className="text-2xl mb-1">
                          {interview.phase2_completed ? '✅' : '💼'}
                        </div>
                        <p className={`text-sm font-medium ${interview.phase2_completed ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          Phase 2: Execute
                        </p>
                      </div>
                      <div className={`text-center p-3 rounded-lg ${interview.phase3_completed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className="text-2xl mb-1">
                          {interview.phase3_completed ? '✅' : '✉️'}
                        </div>
                        <p className={`text-sm font-medium ${interview.phase3_completed ? 'text-green-700 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          Phase 3: Follow-up
                        </p>
                      </div>
                    </div>

                    {/* Interview Type Tags */}
                    {(interview.interview_type_who || interview.interview_type_how) && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {interview.interview_type_who && (
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                            {interview.interview_type_who}
                          </span>
                        )}
                        {interview.interview_type_how && (
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                            {interview.interview_type_how}
                          </span>
                        )}
                        {interview.interview_type_when && (
                          <span className="px-3 py-1 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300 rounded-full text-xs font-medium">
                            {interview.interview_type_when}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Quick Access to Question Bank */}
        <div className="mt-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">📚 Question Bank</h3>
              <p className="text-white/90">
                Access 70+ curated interview questions with answering tips
              </p>
            </div>
            <button
              onClick={() => navigate('/interview/questions')}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-lg"
            >
              Browse Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
