/**
 * Question Bank
 * Browse 70+ curated interview questions with answering tips
 * Filter by category: Skills, Interests, Values, Competency
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import {
  InterviewQuestion,
  InterviewQuestionAnswer,
  QUESTION_CATEGORIES,
  QUESTION_CATEGORY_DESCRIPTIONS,
  QuestionCategory
} from '../../types/interview'

export default function QuestionBank() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [questions, setQuestions] = useState<InterviewQuestion[]>([])
  const [myAnswers, setMyAnswers] = useState<InterviewQuestionAnswer[]>([])
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'all'>('all')
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)

  useEffect(() => {
    checkAndGenerateAnswers()
    loadQuestions()
    loadMyAnswers()
  }, [])

  const checkAndGenerateAnswers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check if user has answers already
      const { count } = await supabase
        .from('interview_question_answers')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      // If user has very few answers (e.g. < 3), trigger AI generation
      if (count === null || count < 3) {
        setLoading(true)
        console.log('🤖 Triggering AI answer generation...')

        // Import dynamically to avoid circular dependencies if any
        const { interviewService } = await import('../../services/interviewService')
        const result = await interviewService.generateAnswersAI()

        if (result.success && result.generatedCount > 0) {
          console.log(`✅ AI generated ${result.generatedCount} answers`)
          setTimeout(() => {
            loadMyAnswers() // Reload to show new answers
            setLoading(false)
          }, 1000)
        } else {
          setLoading(false)
        }
      }
    } catch (error) {
      console.error('Error generating AI answers:', error)
      setLoading(false)
    }
  }

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('interview_questions')
        .select('*')
        .eq('is_active', true)
        .order('question_category', { ascending: true })

      if (error) throw error

      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMyAnswers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('interview_question_answers')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error

      setMyAnswers(data || [])
    } catch (error) {
      console.error('Error loading my answers:', error)
    }
  }

  const hasAnswer = (questionId: string) => {
    return myAnswers.some(a => a.question_id === questionId)
  }

  const getAnswer = (questionId: string) => {
    return myAnswers.find(a => a.question_id === questionId)
  }

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  const handlePrepareAnswer = (questionId: string) => {
    navigate(`/interview/questions/${questionId}/answer`)
  }

  const filteredQuestions = selectedCategory === 'all'
    ? questions
    : questions.filter(q => q.question_category === selectedCategory)

  const getCategoryStats = () => {
    return QUESTION_CATEGORIES.map(category => {
      const categoryQuestions = questions.filter(q => q.question_category === category)
      const answeredCount = categoryQuestions.filter(q => hasAnswer(q.id!)).length
      return {
        category,
        total: categoryQuestions.length,
        answered: answeredCount,
        percent: categoryQuestions.length > 0 ? Math.round((answeredCount / categoryQuestions.length) * 100) : 0
      }
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading questions & analyzing profile...</p>
        </div>
      </div>
    )
  }

  const categoryStats = getCategoryStats()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/interview')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center gap-2"
          >
            ← Back to Interviews
          </button>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              📚 Interview Question Bank
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              70+ curated questions with expert answering tips
            </p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
              >
                All ({questions.length})
              </button>
              {QUESTION_CATEGORIES.map(category => {
                const stats = categoryStats.find(s => s.category === category)
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedCategory === category
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                  >
                    {QUESTION_CATEGORY_DESCRIPTIONS[category].title} ({stats?.total || 0})
                    {stats && stats.answered > 0 && (
                      <span className="ml-2 text-xs">
                        ✓ {stats.answered}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Category Description */}
        {selectedCategory !== 'all' && (
          <div className="mb-8 bg-gradient-to-r from-primary-600 to-purple-600 rounded-xl shadow-lg p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">
              {QUESTION_CATEGORY_DESCRIPTIONS[selectedCategory].title}
            </h2>
            <p className="text-white/90 mb-2">
              <strong>Purpose:</strong> {QUESTION_CATEGORY_DESCRIPTIONS[selectedCategory].purpose}
            </p>
            <p className="text-white/90">
              <strong>Strategy:</strong> {QUESTION_CATEGORY_DESCRIPTIONS[selectedCategory].strategy}
            </p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {categoryStats.map(stat => (
            <div key={stat.category} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                {QUESTION_CATEGORY_DESCRIPTIONS[stat.category].title}
              </h3>
              <div className="flex items-end justify-between mb-2">
                <div className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stat.answered}/{stat.total}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {stat.percent}%
                </div>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all"
                  style={{ width: `${stat.percent}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {filteredQuestions.map((question, index) => {
            const answer = getAnswer(question.id!)
            const isExpanded = expandedQuestion === question.id

            return (
              <div
                key={question.id}
                className={`bg-white dark:bg-gray-800 rounded-xl shadow-md border transition-all ${hasAnswer(question.id!)
                  ? 'border-green-200 dark:border-green-800'
                  : 'border-gray-100 dark:border-gray-700'
                  }`}
              >
                <button
                  onClick={() => toggleQuestion(question.id!)}
                  className="w-full p-6 flex items-start justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        Q{index + 1}
                      </span>
                      {hasAnswer(question.id!) && (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium">
                          ✓ Prepared
                        </span>
                      )}
                      {question.source !== 'general' && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                          {question.source.toUpperCase()}
                        </span>
                      )}
                      {question.par_methodology_applicable && (
                        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                          PAR
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {question.question_text}
                    </h3>
                  </div>
                  <svg
                    className={`w-6 h-6 text-gray-400 transition-transform flex-shrink-0 ml-4 ${isExpanded ? 'transform rotate-180' : ''
                      }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700">
                    {/* Answering Tips */}
                    {question.answering_tips && (
                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">💡 Answering Tips:</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300">{question.answering_tips}</p>
                      </div>
                    )}

                    {/* My Answer */}
                    {answer && (
                      <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-green-900 dark:text-green-200">✓ Your Prepared Answer</h4>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-green-700 dark:text-green-300">
                              Confidence: {answer.confidence_level}/5
                            </span>
                            {answer.times_practiced > 0 && (
                              <span className="text-xs text-green-700 dark:text-green-300">
                                Practiced: {answer.times_practiced}x
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-green-800 dark:text-green-300 whitespace-pre-wrap">
                          {answer.answer_text}
                        </p>
                        <button
                          onClick={() => handlePrepareAnswer(question.id!)}
                          className="mt-3 text-sm text-green-700 dark:text-green-300 hover:text-green-800 font-medium"
                        >
                          Edit Answer →
                        </button>
                      </div>
                    )}

                    {/* Prepare Answer Button */}
                    {!answer && (
                      <button
                        onClick={() => handlePrepareAnswer(question.id!)}
                        className="mt-4 w-full px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
                      >
                        Prepare Answer for This Question
                      </button>
                    )}

                    {/* Question Metadata */}
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Category: {question.question_category}</span>
                      {question.question_subcategory && (
                        <>
                          <span>•</span>
                          <span>{question.question_subcategory}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>Difficulty: {question.difficulty_level}</span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {filteredQuestions.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-12 text-center transition-colors duration-200">
            <p className="text-gray-600 dark:text-gray-400">No questions found in this category.</p>
          </div>
        )}
      </div>
    </div>
  )
}
