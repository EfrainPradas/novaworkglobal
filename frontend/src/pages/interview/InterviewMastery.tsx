/**
 * Interview Mastery System™ - Main Dashboard
 * STEP 3: Interview Preparation & Strategy
 * Shows list of interview preparations and provides navigation
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation } from '../../types/interview'
import { getDaysUntilInterview, formatInterviewDate } from '../../types/interview'
import { Crosshair, ClipboardList, Calendar, PenSquare, CheckCircle2, Briefcase, Mail, BookOpen } from 'lucide-react'

export default function InterviewMastery() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isStandalone = searchParams.get('mode') === 'standalone'
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
    navigate('/dashboard/interview/new')
  }

  const handleViewInterview = (id: string) => {
    navigate(`/dashboard/interview/${id}`)
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      preparing: { color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300', label: t('interviewMastery.statusPreparing', 'Preparing') },
      scheduled: { color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300', label: t('interviewMastery.statusScheduled', 'Scheduled') },
      completed: { color: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300', label: t('interviewMastery.statusCompleted', 'Completed') },
      cancelled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300', label: t('interviewMastery.statusCancelled', 'Cancelled') }
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
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('interviewMastery.loading', 'Loading interviews...')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-12 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header */}
        <div className="mb-8">
          <BackButton to="/dashboard/job-search-hub" label={t('interviewMastery.backToJobSearch', 'Back to Job Search')} className="pl-0" />

          <div className="mt-4 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {t('interviewMastery.title', 'Interview Mastery System™')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('interviewMastery.subtitle', 'Master your interview preparation with the 3-phase methodology')}
              </p>
            </div>
            <button
              onClick={handleCreateInterview}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-semibold shadow-md shadow-primary-600/20 whitespace-nowrap"
            >
              {t('interviewMastery.newPrep', '+ New Interview Prep')}
            </button>
          </div>
        </div>

        {/* Stats Marquee */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 px-4 py-3 mb-8 flex flex-col sm:flex-row sm:items-center divide-y sm:divide-y-0 sm:divide-x divide-slate-200 dark:divide-slate-700">
          {[
            { label: t('interviewMastery.totalInterviews', 'Total Interviews'), value: interviews.length, Icon: ClipboardList },
            { label: t('interviewMastery.upcoming', 'Upcoming'), value: interviews.filter(i => i.status === 'scheduled').length, Icon: Calendar },
            { label: t('interviewMastery.preparing', 'Preparing'), value: interviews.filter(i => i.status === 'preparing').length, Icon: PenSquare },
            { label: t('interviewMastery.completed', 'Completed'), value: interviews.filter(i => i.status === 'completed').length, Icon: CheckCircle2 },
          ].map(({ label, value, Icon }) => (
            <div key={label} className="flex-1 flex items-center gap-3 px-4 py-2">
              <div className="w-10 h-10 shrink-0 bg-primary-50 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 dark:text-primary-400">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-600 dark:text-slate-400 truncate">{label}</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {interviews.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-12 text-center transition-colors duration-200">
            <div className="w-24 h-24 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-primary-600 dark:text-primary-400">
              <Crosshair className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {t('interviewMastery.emptyTitle', 'Ready to Master Your Interviews?')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t('interviewMastery.emptyDesc', 'The Interview Mastery System™ guides you through a proven 3-phase methodology: Before (Prepare) → During (Execute) → After (Follow-up)')}
            </p>
            <button
              onClick={handleCreateInterview}
              className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-lg shadow-lg hover:shadow-xl"
            >
              {t('interviewMastery.createFirst', 'Create Your First Interview Prep')}
            </button>
          </div>
        )}

        {/* Interview List */}
        {interviews.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('interviewMastery.yourPreps', 'Your Interview Preparations')}</h2>

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
                                ({daysUntil} {t('interviewMastery.daysToPrepare', 'days to prepare')})
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                          {progress}%
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{t('interviewMastery.complete', 'Complete')}</p>
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
                      <div className={`text-center p-3 rounded-lg ${interview.phase1_completed ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${interview.phase1_completed ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/40 dark:text-primary-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}>
                          {interview.phase1_completed ? <CheckCircle2 className="w-5 h-5" /> : <PenSquare className="w-5 h-5" />}
                        </div>
                        <p className={`text-sm font-medium ${interview.phase1_completed ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {t('interviewMastery.phase1', 'Phase 1: Prepare')}
                        </p>
                      </div>
                      <div className={`text-center p-3 rounded-lg ${interview.phase2_completed ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${interview.phase2_completed ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/40 dark:text-primary-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}>
                          {interview.phase2_completed ? <CheckCircle2 className="w-5 h-5" /> : <Briefcase className="w-5 h-5" />}
                        </div>
                        <p className={`text-sm font-medium ${interview.phase2_completed ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {t('interviewMastery.phase2', 'Phase 2: Execute')}
                        </p>
                      </div>
                      <div className={`text-center p-3 rounded-lg ${interview.phase3_completed ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1 ${interview.phase3_completed ? 'bg-primary-100 text-primary-600 dark:bg-primary-800/40 dark:text-primary-400' : 'bg-gray-200 text-gray-500 dark:bg-gray-600 dark:text-gray-400'}`}>
                          {interview.phase3_completed ? <CheckCircle2 className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                        </div>
                        <p className={`text-sm font-medium ${interview.phase3_completed ? 'text-primary-700 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {t('interviewMastery.phase3', 'Phase 3: Follow-up')}
                        </p>
                      </div>
                    </div>

                    {/* Interview Type Tags */}
                    {(interview.interview_type_who || interview.interview_type_how) && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {interview.interview_type_who && (
                          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-xs font-medium">
                            {interview.interview_type_who}
                          </span>
                        )}
                        {interview.interview_type_how && (
                          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-xs font-medium">
                            {interview.interview_type_how}
                          </span>
                        )}
                        {interview.interview_type_when && (
                          <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-300 rounded-full text-xs font-medium">
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
        <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-800 rounded-xl shadow-lg p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <BookOpen className="w-7 h-7" /> {t('interviewMastery.questionBank', 'Question Bank')}
              </h3>
              <p className="text-white/90">
                {t('interviewMastery.questionBankDesc', 'Access 70+ curated interview questions with answering tips')}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard/interview/questions')}
              className="px-6 py-3 bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium shadow-lg"
            >
              {t('interviewMastery.browseQuestions', 'Browse Questions')}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
