import React, { useState, useEffect } from 'react'
import {
    X, Sparkles, AlertCircle, Loader2, CheckCircle2, Check, Trophy
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CARStory } from '../../types/resume'
import PhoenixLoader from '../PhoenixLoader'
import { trackEvent } from '../../lib/analytics'

interface Props {
    isOpen: boolean
    onClose: () => void
    stories: CARStory[]
    onSuccess: () => void
}

type Step = 'generating' | 'review_save'

interface GeneratedOption {
    id: string
    text: string
}

interface ProcessedStory extends CARStory {
    generatedOptions: GeneratedOption[]
    selectedOptionIds: string[]
}

/**
 * Generates accomplishment bullets by calling the AI API based directly on the CAR story.
 * Skips the previous "Target Themes" selection step and goes straight to generating.
 */
export const AIAccomplishmentExtractor: React.FC<Props> = ({ isOpen, onClose, stories, onSuccess }) => {
    const [step, setStep] = useState<Step>('generating')
    const [processedStories, setProcessedStories] = useState<ProcessedStory[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        if (isOpen && stories.length > 0) {
            setStep('generating')
            setProcessedStories([])
            setError(null)
            setProgress(0)
            startGeneration()
        }
    }, [isOpen, stories])

    if (!isOpen) return null

    const startGeneration = async () => {
        setIsGenerating(true)
        setError(null)
        setProcessedStories([])

        const results: ProcessedStory[] = []

        try {
            for (let i = 0; i < stories.length; i++) {
                const story = stories[i]

                const payload = {
                    challenge: story.problem_challenge || 'N/A',
                    result: story.result || 'N/A',
                    role_title: story.role_title,
                    company_name: story.company_name,
                    skills: story.skills_tags || [],
                    competencies: [] // Omitted entirely so the AI doesn't invent based on external themes
                }

                // Make sure we have enough text for the backend validation (>10 chars)
                if (payload.challenge.length < 10) payload.challenge = payload.challenge.padEnd(10, '.')
                if (payload.result.length < 10) payload.result = payload.result.padEnd(10, '.')

                setProgress(Math.round((i / stories.length) * 100))

                // In production, we need the deployment-specific API prefix if VITE_API_URL is missing
                const fallbackApi = window.location.pathname.startsWith('/novaworkglobal')
                    ? '/novaworkglobal-api'
                    : ''
                const apiUrl = import.meta.env.VITE_API_URL || fallbackApi
                const { data: { session } } = await supabase.auth.getSession()

                const controller = new AbortController()
                const timeoutId = setTimeout(() => controller.abort(), 45000)

                let response;
                try {
                    response = await fetch(`${apiUrl}/api/ai/generate-accomplishments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`
                        },
                        body: JSON.stringify(payload),
                        signal: controller.signal
                    })
                } finally {
                    clearTimeout(timeoutId)
                }

                if (!response.ok) {
                    const errBody = await response.json().catch(() => null)
                    console.error('Backend error details:', errBody)
                    
                    // Use fallback accomplishments if backend returned them
                    if (errBody?.fallback_accomplishments?.length > 0) {
                        const fallbackOpts = errBody.fallback_accomplishments.map((text: string, idx: number) => ({
                            id: `${story.id}-fallback-${idx}`,
                            text
                        }))
                        results.push({
                            ...story,
                            generatedOptions: fallbackOpts,
                            selectedOptionIds: [fallbackOpts[0]?.id]
                        })
                        continue
                    }
                    
                    throw new Error(`Server error ${response.status}: ${errBody?.details || errBody?.error || 'Unknown error'} (Story: ${story.title || 'Untitled'})`)
                }

                const data = await response.json()

                const options = (data.accomplishments || []).map((text: string, index: number) => ({
                    id: `${story.id}-opt-${index}`,
                    text
                }))

                results.push({
                    ...story,
                    generatedOptions: options,
                    selectedOptionIds: options.length > 0 ? [options[0].id] : []
                })
            }

            setProcessedStories(results)
            setProgress(100)

            setTimeout(() => {
                setStep('review_save')
                setIsGenerating(false)
            }, 800)

        } catch (err: any) {
            console.error('Extraction error:', err)
            setError(err.message || 'An error occurred during AI generation.')
            setIsGenerating(false)
        }
    }

    const handleSelectOption = (storyId: string, optionId: string) => {
        setProcessedStories(prev => prev.map(s => {
            if (s.id === storyId) {
                const isSelected = s.selectedOptionIds.includes(optionId)
                return {
                    ...s,
                    selectedOptionIds: isSelected
                        ? s.selectedOptionIds.filter(id => id !== optionId)
                        : [...s.selectedOptionIds, optionId]
                }
            }
            return s
        }))
    }

    const handleSaveToBank = async () => {
        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const itemsToInsert = processedStories
                .flatMap(story =>
                    story.selectedOptionIds.map(optionId => {
                        const selectedText = story.generatedOptions.find(o => o.id === optionId)?.text || ''
                        return {
                            user_id: user.id,
                            bullet_text: selectedText,
                            role_title: story.role_title,
                            company_name: story.company_name,
                            start_date: story.start_date,
                            end_date: story.end_date,
                            source: 'ai_generated',
                            par_story_id: story.id,
                            is_starred: false,
                            times_used: 0,
                            competencies: story.competencies || []
                        }
                    })
                )

            if (itemsToInsert.length === 0) {
                alert('No accomplishments selected to save.')
                setIsSaving(false)
                return
            }

            const { error: dbError } = await supabase
                .from('accomplishment_bank')
                .insert(itemsToInsert)

            if (dbError) throw dbError

            trackEvent('analytics', 'accomplishments_extracted', { count: itemsToInsert.length })
            onSuccess()
            onClose()
        } catch (err: any) {
            console.error('Save error:', err)
            alert('Failed to save accomplishments to the bank.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Resume Bullets</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Review AI-polished bullets from your CAR stories</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3 text-sm">
                            <AlertCircle className="w-5 h-5 shrink-0" />
                            <div>
                                <p>{error}</p>
                                <button
                                    onClick={() => { setError(null); startGeneration() }}
                                    className="mt-2 text-sm font-semibold underline hover:no-underline"
                                >
                                    Try again
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Generating */}
                    {step === 'generating' && !error && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-6">
                            <div className="flex flex-col items-center gap-3">
                                <PhoenixLoader size="md" />
                                <span className="text-indigo-900 font-semibold mt-4">Polishing accomplishments...</span>
                            </div>

                            <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                                Analyzing your CAR {stories.length === 1 ? 'story' : 'stories'} to generate professional resume-ready bullets.
                            </p>

                            {/* Progress Bar */}
                            <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Review and Save */}
                    {step === 'review_save' && (
                        <div className="space-y-8">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-4">
                                <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Generation Complete</h4>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Review the AI-generated variations below. Select your favorite options for each story to save to your Accomplishment Bank.</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {processedStories.map((story, i) => (
                                    <div key={story.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                                        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                            <div>
                                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Story {i + 1}</span>
                                                <h4 className="font-semibold text-gray-900 dark:text-white mt-1">{story.title || `${story.role_title} at ${story.company_name}`}</h4>
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-3">
                                            {story.generatedOptions.map((opt, optIndex) => {
                                                const isSelected = story.selectedOptionIds.includes(opt.id)
                                                return (
                                                    <div
                                                        key={opt.id}
                                                        onClick={() => handleSelectOption(story.id!, opt.id)}
                                                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                                            : 'border-transparent bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                                                            }`}
                                                    >
                                                        <div className="flex gap-3 items-start">
                                                            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                                {isSelected && <Check className="w-3.5 h-3.5" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1 block">Option {optIndex + 1}</span>
                                                                <p className={`text-sm ${isSelected ? 'text-indigo-900 dark:text-indigo-100 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>{opt.text}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Controls */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                        disabled={isGenerating || isSaving}
                    >
                        Cancel
                    </button>

                    {step === 'review_save' && (
                        <button
                            onClick={handleSaveToBank}
                            disabled={isSaving}
                            className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/20"
                        >
                            {isSaving ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            ) : (
                                <><CheckCircle2 className="w-4 h-4" /> Save ({processedStories.reduce((acc, s) => acc + s.selectedOptionIds.length, 0)}) to Bank</>
                            )}
                        </button>
                    )}
                </div>

            </div>
        </div>
    )
} 
