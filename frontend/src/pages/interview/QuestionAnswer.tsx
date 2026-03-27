/**
 * Question Answer Page
 * Edit and refine your answer for a specific interview question
 */

import { useState, useEffect, useRef } from 'react'
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

    // Recording state
    const [showRecorder, setShowRecorder] = useState(false)
    const [isRecording, setIsRecording] = useState(false)
    const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
    const [recordingSeconds, setRecordingSeconds] = useState(0)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const videoPreviewRef = useRef<HTMLVideoElement>(null)
    const videoPlaybackRef = useRef<HTMLVideoElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const chunksRef = useRef<Blob[]>([])
    const timerRef = useRef<NodeJS.Timeout | null>(null)

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

    const openRecorder = async () => {
        setCameraError(null)
        setRecordedBlob(null)
        setShowRecorder(true)
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            streamRef.current = stream
            if (videoPreviewRef.current) {
                videoPreviewRef.current.srcObject = stream
            }
        } catch (err: any) {
            setCameraError('Could not access camera/microphone. Please allow permissions and try again.')
        }
    }

    const closeRecorder = () => {
        stopStream()
        setShowRecorder(false)
        setIsRecording(false)
        setRecordedBlob(null)
        setRecordingSeconds(0)
    }

    const stopStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop())
            streamRef.current = null
        }
        if (timerRef.current) clearInterval(timerRef.current)
    }

    const startRecording = () => {
        if (!streamRef.current) return
        chunksRef.current = []
        setRecordedBlob(null)
        setRecordingSeconds(0)

        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
            ? 'video/webm;codecs=vp9'
            : MediaRecorder.isTypeSupported('video/webm')
                ? 'video/webm'
                : 'video/mp4'

        const recorder = new MediaRecorder(streamRef.current, { mimeType })
        mediaRecorderRef.current = recorder

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data)
        }

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: mimeType })
            setRecordedBlob(blob)
            if (timerRef.current) clearInterval(timerRef.current)
            // Show playback
            setTimeout(() => {
                if (videoPlaybackRef.current) {
                    videoPlaybackRef.current.src = URL.createObjectURL(blob)
                }
            }, 100)
        }

        recorder.start(250)
        setIsRecording(true)

        // Timer
        timerRef.current = setInterval(() => {
            setRecordingSeconds(s => s + 1)
        }, 1000)
    }

    const stopRecording = () => {
        mediaRecorderRef.current?.stop()
        setIsRecording(false)
    }

    const downloadRecording = () => {
        if (!recordedBlob) return
        const ext = recordedBlob.type.includes('mp4') ? 'mp4' : 'webm'
        const filename = `interview-practice-${question?.question_text?.slice(0, 30).replace(/[^a-z0-9]/gi, '_') || 'answer'}.${ext}`
        const url = URL.createObjectURL(recordedBlob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        a.click()
        URL.revokeObjectURL(url)
    }

    const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

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
            navigate('/dashboard/interview/questions')

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
                    <button onClick={() => navigate('/dashboard/interview/questions')} className="mt-4 text-primary-600 hover:text-primary-700">
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
                    onClick={() => navigate('/dashboard/interview/questions')}
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

                    {/* Practice Recording Section */}
                    <div className="px-6 pb-6">
                        {!showRecorder ? (
                            <button
                                onClick={openRecorder}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-red-300 dark:border-red-700 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors font-medium"
                            >
                                🎥 Record Yourself Answering
                                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-1">— saved only to your device</span>
                            </button>
                        ) : (
                            <div className="border-2 border-red-200 dark:border-red-800 rounded-xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🎥</span>
                                        <span className="font-semibold text-gray-800 dark:text-white text-sm">Practice Recording</span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">Not saved to server</span>
                                    </div>
                                    <button onClick={closeRecorder} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl font-bold leading-none">×</button>
                                </div>

                                {cameraError ? (
                                    <div className="p-6 text-center">
                                        <p className="text-red-600 dark:text-red-400 text-sm">{cameraError}</p>
                                    </div>
                                ) : (
                                    <div className="p-4">
                                        {/* Side-by-side layout: teleprompter + camera */}
                                        <div className="flex gap-4 mb-4">

                                            {/* Left: Question + Answer as teleprompter */}
                                            <div className="flex-1 flex flex-col gap-3 min-w-0">
                                                {/* Question */}
                                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-1">❓ Question</p>
                                                    <p className="text-sm font-semibold text-gray-800 dark:text-white leading-snug">{question?.question_text}</p>
                                                </div>
                                                {/* Answer */}
                                                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800 flex-1 overflow-y-auto" style={{ maxHeight: '260px' }}>
                                                    <p className="text-xs font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide mb-1">📝 Your Answer</p>
                                                    {answerText ? (
                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{answerText}</p>
                                                    ) : (
                                                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">No answer written yet — write your answer above first.</p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Camera */}
                                            <div className="w-72 flex-shrink-0">
                                                {!recordedBlob ? (
                                                    <div className="relative bg-black rounded-lg overflow-hidden h-full min-h-[200px]">
                                                        <video
                                                            ref={videoPreviewRef}
                                                            autoPlay
                                                            muted
                                                            playsInline
                                                            className="w-full h-full object-cover"
                                                        />
                                                        {isRecording && (
                                                            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 text-white px-2.5 py-1 rounded-full text-xs">
                                                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block"></span>
                                                                REC {formatTime(recordingSeconds)}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="relative bg-black rounded-lg overflow-hidden h-full min-h-[200px]">
                                                        <video
                                                            ref={videoPlaybackRef}
                                                            controls
                                                            playsInline
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Controls */}
                                        <div className="flex items-center justify-center gap-3">
                                            {!recordedBlob ? (
                                                <>
                                                    {!isRecording ? (
                                                        <button
                                                            onClick={startRecording}
                                                            className="flex items-center gap-2 px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
                                                        >
                                                            <span className="w-3 h-3 rounded-full bg-white inline-block"></span>
                                                            Start Recording
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={stopRecording}
                                                            className="flex items-center gap-2 px-6 py-2.5 bg-gray-700 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
                                                        >
                                                            <span className="w-3 h-3 bg-white inline-block"></span>
                                                            Stop Recording
                                                        </button>
                                                    )}
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={downloadRecording}
                                                        className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
                                                    >
                                                        ⬇️ Download to My Device
                                                    </button>
                                                    <button
                                                        onClick={() => { setRecordedBlob(null); setRecordingSeconds(0) }}
                                                        className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                                                    >
                                                        Record Again
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
                                            🔒 Your recording stays on your device — we never store it
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
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
                                onClick={() => navigate('/dashboard/interview/questions')}
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
