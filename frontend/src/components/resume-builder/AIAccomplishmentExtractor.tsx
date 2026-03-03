import React, { useState, useEffect } from 'react'
import {
    X, Sparkles, AlertCircle, Loader2, CheckCircle2, ChevronRight,
    ArrowRight, Check, CheckSquare, Trophy
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CARStory, COMPETENCIES } from '../../types/resume'
import { useTranslation } from 'react-i18next'
import { trackEvent } from '../../lib/analytics'

interface Props {
    isOpen: boolean
    onClose: () => void
    stories: CARStory[]
    onSuccess: () => void
}

type Step = 'select_clusters' | 'generating' | 'review_save'

interface GeneratedOption {
    id: string; // Unique ID for selection tracking
    text: string;
}

interface ProcessedStory extends CARStory {
    generatedOptions: GeneratedOption[];
    selectedOptionIds: string[]; // Tracks the user's selected choice(s)
}

export const AIAccomplishmentExtractor: React.FC<Props> = ({ isOpen, onClose, stories, onSuccess }) => {
    const { t } = useTranslation()
    const [step, setStep] = useState<Step>('select_clusters')

    // Step 1 State
    const [selectedClusters, setSelectedClusters] = useState<string[]>([])

    // Step 2 & 3 State
    const [processedStories, setProcessedStories] = useState<ProcessedStory[]>([])
    const [isGenerating, setIsGenerating] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [progress, setProgress] = useState(0)

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setStep('select_clusters')
            setSelectedClusters([])
            setProcessedStories([])
            setError(null)
            setProgress(0)
        }
    }, [isOpen])

    if (!isOpen) return null

    const handleClusterToggle = (cluster: string) => {
        if (selectedClusters.includes(cluster)) {
            setSelectedClusters(prev => prev.filter(c => c !== cluster))
        } else {
            if (selectedClusters.length >= 5) {
                alert('You can select a maximum of 5 competency clusters.')
                return
            }
            setSelectedClusters(prev => [...prev, cluster])
        }
    }

    const startGeneration = async () => {
        if (selectedClusters.length === 0) {
            alert('Please select at least 1 competency cluster.')
            return
        }

        setStep('generating')
        setIsGenerating(true)
        setError(null)
        setProcessedStories([])

        const results: ProcessedStory[] = []

        try {
            // Process stories sequentially or in small batches to avoid rate limits
            for (let i = 0; i < stories.length; i++) {
                const story = stories[i]

                // Construct the payload matching the backend route requirements
                const payload = {
                    challenge: story.problem_challenge,
                    result: story.result,
                    role_company: `${story.role_title || ''} at ${story.company_name || ''}`,
                    skills: story.skills_tags || [],
                    competencies: selectedClusters // We send the user's explicitly chosen clusters here
                }

                // Simulate progress updates more smoothly
                setProgress(Math.round((i / stories.length) * 100))

                const apiUrl = import.meta.env.VITE_API_URL || ''
                const { data: { session } } = await supabase.auth.getSession()

                const response = await fetch(`${apiUrl}/api/ai/generate-accomplishments`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token}`
                    },
                    body: JSON.stringify(payload)
                })

                if (!response.ok) {
                    throw new Error(`Failed to generate for story: ${story.title || 'Untitled'}`)
                }

                const data = await response.json()

                // Parse options
                const options = (data.accomplishments || []).map((text: string, index: number) => ({
                    id: `${story.id}-opt-${index}`,
                    text
                }))

                results.push({
                    ...story,
                    generatedOptions: options,
                    selectedOptionIds: options.length > 0 ? [options[0].id] : [] // Auto-select the first one by default
                })
            }

            setProcessedStories(results)
            setProgress(100)

            // Artificial delay to show 100% completion state briefly
            setTimeout(() => {
                setStep('review_save')
                setIsGenerating(false)
            }, 800)

        } catch (err: any) {
            console.error('Extraction error:', err)
            setError(err.message || 'An error occurred during extraction.')
            setIsGenerating(false)
            setStep('select_clusters') // Send them back to retry
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
                            competencies: selectedClusters // Tag them with the chosen clusters
                        }
                    })
                )

            if (itemsToInsert.length === 0) {
                alert('No accomplishments selected to save.')
                setIsSaving(false)
                return
            }

            const { error } = await supabase
                .from('accomplishment_bank')
                .insert(itemsToInsert)

            if (error) throw error

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
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Accomplishment Extraction</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Transform your CAR stories into powerful resume bullets</p>
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
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Step 1: Select Clusters */}
                    {step === 'select_clusters' && (
                        <div className="space-y-6 max-w-2xl mx-auto py-4">
                            <div className="text-center space-y-2 mb-8">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Define your target themes</h3>
                                <p className="text-gray-500 dark:text-gray-400">Select up to 5 core competencies. The AI will analyze your {stories.length} CAR stories and generate variations tailored to these specific themes.</p>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center">
                                {COMPETENCIES.map(cluster => {
                                    const isSelected = selectedClusters.includes(cluster)
                                    return (
                                        <button
                                            key={cluster}
                                            onClick={() => handleClusterToggle(cluster)}
                                            className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${isSelected
                                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20 scale-105'
                                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/10'
                                                }`}
                                        >
                                            {cluster}
                                            {isSelected && <Check className="inline-block ml-2 w-4 h-4" />}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 2: Generating */}
                    {step === 'generating' && (
                        <div className="flex flex-col items-center justify-center py-20 space-y-6">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-indigo-100 dark:border-indigo-900 rounded-full animate-spin border-t-indigo-600 dark:border-t-indigo-500"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                                </div>
                            </div>

                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Crafting your accomplishments...</h3>
                                <p className="text-gray-500 dark:text-gray-400">Applying the {selectedClusters.length} chosen themes to your CAR stories.</p>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full max-w-md bg-gray-100 dark:bg-gray-800 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-indigo-600 h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Review and Save */}
                    {step === 'review_save' && (
                        <div className="space-y-8">
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-4">
                                <Trophy className="w-6 h-6 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-indigo-900 dark:text-indigo-300">Generation Complete</h4>
                                    <p className="text-sm text-indigo-700 dark:text-indigo-400 mt-1">Review the {processedStories.length} sets of variations below. Select your favorite version for each story to add to your Accomplishment Bank.</p>
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

                    {step === 'select_clusters' && (
                        <button
                            onClick={startGeneration}
                            disabled={selectedClusters.length === 0}
                            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-indigo-600/20"
                        >
                            Generate Variations <ArrowRight className="w-4 h-4" />
                        </button>
                    )}

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
