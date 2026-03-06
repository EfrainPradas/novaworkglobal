import React, { useState, useEffect } from 'react'
import {
    X, Sparkles, CheckCircle2, Loader2, Check, Trophy
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { CARStory } from '../../types/resume'
import { trackEvent } from '../../lib/analytics'

interface Props {
    isOpen: boolean
    onClose: () => void
    stories: CARStory[]
    onSuccess: () => void
}

interface BulletOption {
    id: string
    text: string
    selected: boolean
}

interface StoryBullets {
    story: CARStory
    bullets: BulletOption[]
}

/**
 * Generates accomplishment bullets directly from CAR story data.
 * No AI — just formats the real Challenge, Actions, and Result 
 * into resume-ready bullet points for the Accomplishment Bank.
 */
export const AIAccomplishmentExtractor: React.FC<Props> = ({ isOpen, onClose, stories, onSuccess }) => {
    const [storyBullets, setStoryBullets] = useState<StoryBullets[]>([])
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        if (isOpen && stories.length > 0) {
            // Build bullets directly from the CAR data — no AI call
            const generated: StoryBullets[] = stories.map(story => {
                const bullets: BulletOption[] = []
                let idx = 0

                // Bullet from Result (the most resume-worthy piece)
                if (story.result && story.result.trim()) {
                    const role = story.role_title ? `As ${story.role_title}` : ''
                    const company = story.company_name ? ` at ${story.company_name}` : ''
                    const prefix = role || company ? `${role}${company}, ` : ''
                    bullets.push({
                        id: `${story.id}-result-${idx++}`,
                        text: `${prefix}${story.result.trim()}`,
                        selected: true
                    })
                }

                // Bullet from each Action
                if (story.actions && story.actions.length > 0) {
                    story.actions.filter(a => a && a.trim()).forEach(action => {
                        bullets.push({
                            id: `${story.id}-action-${idx++}`,
                            text: action.trim(),
                            selected: false
                        })
                    })
                }

                // Bullet combining Challenge + Result if both exist
                if (story.problem_challenge && story.result && story.problem_challenge.trim() && story.result.trim()) {
                    bullets.push({
                        id: `${story.id}-combined-${idx++}`,
                        text: `${story.problem_challenge.trim()} — ${story.result.trim()}`,
                        selected: false
                    })
                }

                return { story, bullets }
            })

            setStoryBullets(generated)
        }
    }, [isOpen, stories])

    if (!isOpen) return null

    const toggleBullet = (storyId: string | undefined, bulletId: string) => {
        setStoryBullets(prev => prev.map(sb => {
            if (sb.story.id === storyId) {
                return {
                    ...sb,
                    bullets: sb.bullets.map(b =>
                        b.id === bulletId ? { ...b, selected: !b.selected } : b
                    )
                }
            }
            return sb
        }))
    }

    const totalSelected = storyBullets.reduce((acc, sb) => acc + sb.bullets.filter(b => b.selected).length, 0)

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const itemsToInsert = storyBullets.flatMap(sb =>
                sb.bullets.filter(b => b.selected).map(b => ({
                    user_id: user.id,
                    bullet_text: b.text,
                    role_title: sb.story.role_title,
                    company_name: sb.story.company_name,
                    start_date: sb.story.start_date,
                    end_date: sb.story.end_date,
                    source: 'car_extracted',
                    par_story_id: sb.story.id,
                    is_starred: false,
                    times_used: 0,
                    competencies: sb.story.competencies || []
                }))
            )

            if (itemsToInsert.length === 0) {
                alert('No bullets selected to save.')
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
            alert('Failed to save accomplishments.')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add to Accomplishment Bank</h2>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Select bullets from your CAR stories to save</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-start gap-3">
                        <Trophy className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                        <p className="text-sm text-indigo-700 dark:text-indigo-400">
                            Select the bullets you want to add to your Accomplishment Bank. These come directly from your CAR {stories.length === 1 ? 'story' : 'stories'}.
                        </p>
                    </div>

                    {storyBullets.map(sb => (
                        <div key={sb.story.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden shadow-sm">
                            <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/80 border-b border-gray-200 dark:border-gray-700">
                                <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {sb.story.title || `${sb.story.role_title || 'Role'} at ${sb.story.company_name || 'Company'}`}
                                </h4>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    {sb.story.start_date || ''} {sb.story.end_date ? `— ${sb.story.end_date}` : ''}
                                </p>
                            </div>
                            <div className="p-4 space-y-2">
                                {sb.bullets.map(bullet => (
                                    <div
                                        key={bullet.id}
                                        onClick={() => toggleBullet(sb.story.id, bullet.id)}
                                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${bullet.selected
                                            ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20'
                                            : 'border-transparent bg-gray-50 dark:bg-gray-900 hover:border-gray-200 dark:hover:border-gray-700'
                                            }`}
                                    >
                                        <div className="flex gap-3 items-start">
                                            <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${bullet.selected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-gray-300 dark:border-gray-600'}`}>
                                                {bullet.selected && <Check className="w-3.5 h-3.5" />}
                                            </div>
                                            <p className={`text-sm leading-relaxed ${bullet.selected ? 'text-indigo-900 dark:text-indigo-100 font-medium' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {bullet.text}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/80 flex justify-between items-center rounded-b-2xl">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving || totalSelected === 0}
                        className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50 shadow-md shadow-emerald-600/20"
                    >
                        {isSaving ? (
                            <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                            <><CheckCircle2 className="w-4 h-4" /> Save {totalSelected} to Bank</>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
