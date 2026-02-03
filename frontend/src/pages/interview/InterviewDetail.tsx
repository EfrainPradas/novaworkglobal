/**
 * Interview Detail Page
 * Shows interview preparation with 3-phase accordion structure
 * Based on NotebookLM Mind Map hierarchy
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation } from '../../types/interview'
import { formatInterviewDate, getDaysUntilInterview, getInterviewPhaseProgress } from '../../types/interview'

export default function InterviewDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [interview, setInterview] = useState<InterviewPreparation | null>(null)
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1) // Start with Phase 1 expanded

  useEffect(() => {
    if (id) {
      loadInterview()
    }
  }, [id])

  const loadInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      const { data, error } = await supabase
        .from('interview_preparations')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      if (!data) {
        navigate('/interview')
        return
      }

      setInterview(data)
    } catch (error) {
      console.error('Error loading interview:', error)
      navigate('/interview')
    } finally {
      setLoading(false)
    }
  }

  const togglePhase = (phase: number) => {
    setExpandedPhase(expandedPhase === phase ? null : phase)
  }

  const markPhaseComplete = async (phase: number) => {
    if (!interview) return

    try {
      const updates = {
        [`phase${phase}_completed` as keyof InterviewPreparation]: true
      }

      const { error } = await supabase
        .from('interview_preparations')
        .update(updates)
        .eq('id', interview.id)

      if (error) throw error

      // Reload interview
      await loadInterview()
    } catch (error) {
      console.error('Error marking phase complete:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading interview...</p>
        </div>
      </div>
    )
  }

  if (!interview) {
    return null
  }

  const progress = getInterviewPhaseProgress(interview)
  const daysUntil = getDaysUntilInterview(interview)

  const phases = [
    {
      number: 1,
      title: 'Before the Interview (Prepare)',
      icon: '📘',
      color: 'blue',
      completed: interview.phase1_completed,
      sections: [
        { id: 'research', title: 'Research Thoroughly', icon: '🔍', route: 'research' },
        { id: 'content', title: 'Content Preparation', icon: '📝', route: 'jd-comparison' },
        { id: 'practice', title: 'Practice Techniques', icon: '🎯', route: 'practice' },
        { id: 'type', title: 'Identify Interview Type', icon: '🎭', route: 'interview-type' }
      ]
    },
    {
      number: 2,
      title: 'During the Interview (Execution)',
      icon: '💼',
      color: 'green',
      completed: interview.phase2_completed,
      sections: [
        { id: 'notes', title: 'Interview Session Notes', icon: '📋', route: 'session-notes' },
        { id: 'questions', title: 'Questions to Ask', icon: '❓', route: 'my-questions' }
      ]
    },
    {
      number: 3,
      title: 'After the Interview (Follow-up)',
      icon: '✉️',
      color: 'purple',
      completed: interview.phase3_completed,
      sections: [
        { id: 'thank-you', title: 'Thank You Notes', icon: '💌', route: 'thank-you' },
        { id: 'followup', title: 'Follow-up Timeline', icon: '📅', route: 'followups' },
        { id: 'negotiation', title: 'Negotiation Prep', icon: '💰', route: 'negotiation' }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/interview')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Back to Interviews
          </button>

          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {interview.position_title}
                </h1>
                <p className="text-xl text-gray-700 mb-3">
                  {interview.company_name}
                </p>
                {interview.interview_date && (
                  <p className="text-sm text-gray-600">
                    {formatInterviewDate(interview.interview_date)}
                    {daysUntil !== null && daysUntil > 0 && (
                      <span className="ml-2 text-primary-600 font-medium">
                        {daysUntil} days to prepare
                      </span>
                    )}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary-600 mb-1">
                  {progress}%
                </div>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-primary-600 h-3 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Interview Type Tags */}
            {(interview.interview_type_who || interview.interview_type_how || interview.interview_type_when) && (
              <div className="flex flex-wrap gap-2">
                {interview.interview_type_who && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    WHO: {interview.interview_type_who}
                  </span>
                )}
                {interview.interview_type_how && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                    HOW: {interview.interview_type_how}
                  </span>
                )}
                {interview.interview_type_when && (
                  <span className="px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                    WHEN: {interview.interview_type_when}
                  </span>
                )}
                {interview.interview_type_how_many && (
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                    HOW MANY: {interview.interview_type_how_many}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3-Phase Accordion (NotebookLM Mind Map Structure) */}
        <div className="space-y-4">
          {phases.map((phase) => (
            <div
              key={phase.number}
              className={`bg-white rounded-xl shadow-lg border-2 transition-all ${
                expandedPhase === phase.number
                  ? `border-${phase.color}-500`
                  : 'border-gray-200'
              }`}
            >
              {/* Phase Header */}
              <button
                onClick={() => togglePhase(phase.number)}
                className="w-full p-6 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-lg bg-${phase.color}-100 flex items-center justify-center text-2xl`}>
                    {phase.icon}
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl font-bold text-gray-900">
                      Phase {phase.number}: {phase.title}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {phase.sections.length} sections
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {phase.completed && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      ✅ Completed
                    </span>
                  )}
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform ${
                      expandedPhase === phase.number ? 'transform rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Phase Content */}
              {expandedPhase === phase.number && (
                <div className="px-6 pb-6 border-t border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {phase.sections.map((section) => (
                      <button
                        key={section.id}
                        onClick={() => navigate(`/interview/${id}/${section.route}`)}
                        className="p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 hover:border-primary-500 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{section.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{section.title}</h3>
                            <p className="text-xs text-gray-500">Click to view/edit</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {!phase.completed && (
                    <button
                      onClick={() => markPhaseComplete(phase.number)}
                      className="mt-4 w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Mark Phase {phase.number} as Complete ✅
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Question Bank Quick Access */}
        <div className="mt-8 bg-gradient-to-r from-teal-600 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">❓ Practice Interview Questions</h3>
              <p className="text-white/90">
                Browse and prepare answers from our question bank
              </p>
            </div>
            <button
              onClick={() => navigate('/interview/questions')}
              className="px-6 py-3 bg-white text-teal-600 rounded-lg hover:bg-gray-50 transition-colors font-medium shadow-lg"
            >
              Question Bank
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
