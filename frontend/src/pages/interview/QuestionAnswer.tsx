/**
 * Question Answer Page
 * Edit and refine your answer for a specific interview question
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { InterviewQuestion, InterviewQuestionAnswer } from '../../types/interview'

export default function QuestionAnswer() {
    const { questionId } = useParams()
    const navigate = useNavigate()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [question, setQuestion] = useState<InterviewQuestion | null>(null)
    const [answer, setAnswer] = useState<InterviewQuestionAnswer | null>(null)

    // Form state
    const [answerText, setAnswerText] = useState('')
    const [confidenceLevel, setConfidenceLevel] = useState(3)

    useEffect(() => {
        if (questionId) {
            loadData()
        }
    }, [questionId])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load Question
            const { data: questionData, error: qError } = await supabase
                .from('interview_questions')
                .select('*')
                .eq('id', questionId)
                .single()

            if (qError) throw qError
            setQuestion(questionData)

            // Load Answer (if exists)
            const { data: answerData, error: aError } = await supabase
                .from('interview_question_answers')
                .select('*')
                .eq('question_id', questionId)
                .eq('user_id', user.id)
                .single()

            if (answerData) {
                setAnswer(answerData)
                setAnswerText(answerData.answer_text)
                setConfidenceLevel(answerData.confidence_level)
            } else {
                // Prepare empty answer state
                setAnswerText('')
                setConfidenceLevel(3)
            }

        } catch (error) {
            console.error('Error loading data:', error)
        } finally {
            setLoading(false)
        }
    }



    const handleGenerateAI = async () => {
        if (!questionId) return
        setGenerating(true)
        try {
            // Import dynamically
            const { interviewService } = await import('../../services/interviewService')
            const result = await interviewService.generateAnswersAI(questionId)

            if (result.success && result.answer) {
                setAnswerText(result.answer.answer_text)
                setConfidenceLevel(result.answer.confidence_level || 3)
            } else {
                alert('AI could not generate an answer at this time. Please try again.')
            }
        } catch (error: any) {
            console.error('Error generating AI answer:', error)
            alert(`Failed to generate answer: ${error.message || 'Unknown error'}`)
        } finally {
            setGenerating(false)
        }
    }

    const handleSave = async () => {
        if (!questionId) return
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No user found')

            const answerData = {
                user_id: user.id,
                question_id: questionId,
                answer_text: answerText,
                confidence_level: confidenceLevel,
                needs_improvement: confidenceLevel < 4,
                updated_at: new Date().toISOString()
            }

            // Use upsert to handle both new answers and updates to existing (including AI-generated) answers
            const { error } = await supabase
                .from('interview_question_answers')
                .upsert(answerData, {
                    onConflict: 'user_id, question_id'
                })

            if (error) throw error

            // Go back to bank
            navigate('/interview/questions')

        } catch (error) {
            console.error('Error saving answer:', error)
            alert('Failed to save answer. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!question) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-xl font-bold text-gray-900">Question not found</h2>
                    <button onClick={() => navigate('/interview/questions')} className="mt-4 text-primary-600 hover:text-primary-700">
                        Go Back
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
            <div className="max-w-3xl mx-auto px-4">
                {/* Header */}
                <button
                    onClick={() => navigate('/interview/questions')}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-6 flex items-center gap-2"
                >
                    ← Back to Question Bank
                </button>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                    {/* Question Section */}
                    <div className="p-6 bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full uppercase tracking-wide">
                                {question.question_category}
                            </span>
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full uppercase tracking-wide">
                                {question.difficulty_level}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{question.question_text}</h1>
                        {question.answering_tips && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-semibold block mb-1">💡 Pro Tip:</span>
                                {question.answering_tips}
                            </div>
                        )}
                    </div>

                    {/* Editor Section */}
                    <div className="p-6">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Your Answer
                        </label>
                        <textarea
                            value={answerText}
                            onChange={(e) => setAnswerText(e.target.value)}
                            rows={12}
                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 font-sans text-base leading-relaxed p-4"
                            placeholder="Write your answer here based on the PAR method (Problem, Action, Result)..."
                        />

                        <div className="mt-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                How confident do you feel about this answer? (1-5)
                            </label>
                            <div className="flex gap-4">
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setConfidenceLevel(level)}
                                        className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${confidenceLevel === level
                                            ? 'bg-primary-600 text-white border-primary-600'
                                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1 px-1">
                                <span>Needs Work</span>
                                <span>Ready for Interview</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-b-xl">
                        <button
                            onClick={handleGenerateAI}
                            disabled={generating || saving}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                        >
                            {generating ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span>✨</span> Generate with AI
                                </>
                            )}
                        </button>

                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate('/interview/questions')}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || generating}
                                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Answer'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
