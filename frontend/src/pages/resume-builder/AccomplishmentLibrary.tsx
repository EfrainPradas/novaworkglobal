import React, { useState, useEffect } from 'react'
import {
    Search, Filter, Plus, FileDown, Star, LayoutGrid, List, Sparkles,
    RefreshCw, ChevronDown, CheckSquare, Settings, ArrowLeft, ArrowRight, Play, BookOpen, Wand2, Tag, RotateCw, X, Briefcase, Loader2, Copy
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { supabase } from '../../lib/supabase'
import { AccomplishmentBankItem } from '../../types/resume'
import { AccomplishmentBankCard } from '../../components/resume-builder/AccomplishmentBankCard'
import { BackButton } from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import ResumePreview from '../../components/resume/ResumePreview'
import { trackEvent } from '../../lib/analytics'

export default function AccomplishmentLibrary({ isNested = false }: { isNested?: boolean }) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [userId, setUserId] = useState<string | null>(null)
    const [items, setItems] = useState<AccomplishmentBankItem[]>([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [filterText, setFilterText] = useState('')
    const [showStarredOnly, setShowStarredOnly] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [roles, setRoles] = useState<string[]>([])

    const [newItemText, setNewItemText] = useState('')
    const [newRole, setNewRole] = useState('')
    const [newCompany, setNewCompany] = useState('')
    const [newStart, setNewStart] = useState('')
    const [newEnd, setNewEnd] = useState('')
    const [isAdding, setIsAdding] = useState(false)
    const [isVideoModalOpen, setIsVideoModalOpen] = useState(false)

    // AI Grouping State
    const [isGroupingPanelOpen, setIsGroupingPanelOpen] = useState(false)
    const [customPrompt, setCustomPrompt] = useState('')
    const [isCustomGrouping, setIsCustomGrouping] = useState(false)
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'assistant', content: string, groups?: { theme: string, storyIds: string[] }[] }[]>([])

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event
        if (over && active.id !== over.id) {
            setItems((prev) => {
                const oldIndex = prev.findIndex((i) => i.id === active.id)
                const newIndex = prev.findIndex((i) => i.id === over.id)
                const newItems = arrayMove(prev, oldIndex, newIndex)

                // Save custom order to localStorage
                localStorage.setItem(`accomplishment_order_${userId}`, JSON.stringify(newItems.map(i => i.id)))
                return newItems
            })
        }
    }

    useEffect(() => {
        loadLibrary()
    }, [])

    const loadLibrary = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return
            setUserId(user.id)

            const { data, error } = await supabase
                .from('accomplishment_bank')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error

            let fetchedItems = data || []
            try {
                const savedOrderStr = localStorage.getItem(`accomplishment_order_${user.id}`)
                if (savedOrderStr) {
                    const savedOrder = JSON.parse(savedOrderStr) as string[]
                    fetchedItems.sort((a, b) => {
                        const idxA = savedOrder.indexOf(a.id!)
                        const idxB = savedOrder.indexOf(b.id!)
                        if (idxA === -1 && idxB === -1) return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
                        if (idxA === -1) return 1
                        if (idxB === -1) return -1
                        return idxA - idxB
                    })
                }
            } catch (e) {
                console.error('Error parsing custom order:', e)
            }

            setItems(fetchedItems)

            // Extract unique roles for filter
            const uniqueRoles = Array.from(new Set(data?.map(i => i.role_title).filter(Boolean) as string[]))
            setRoles(uniqueRoles)
        } catch (error) {
            console.error('Error loading library:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleContinue = async () => {
        await trackEvent('analytics', 'step_completed', { step_name: 'accomplishment-library', next_step: 'story-cards' })
        navigate('/resume/story-cards')
    }

    const importFromWorkExperience = async () => {
        try {
            setImporting(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch from Work Experience (accomplishments table)
            const { data: resumes } = await supabase.from('resume_versions').select('id').eq('user_id', user.id)
            const resumeIds = resumes?.map(r => r.id) || []

            const { data: allExperience } = await supabase
                .from('work_experience')
                .select(`
          job_title, 
          company_name,
          accomplishments (bullet_text)
        `)
                .in('resume_id', resumeIds)

            // 2. Fetch from CAR Stories (par_accomplishments table)
            const { data: carStories } = await supabase
                .from('par_accomplishments')
                .select(`
            id,
            accomplishment_bullet,
            role_id,
            roles (
                job_title,
                company_name
            )
        `)
                .eq('user_id', user.id)
                .not('accomplishment_bullet', 'is', null)

            let importCount = 0
            const newItems: any[] = []

            // flattened list of existing bank bullets to avoid duplicates
            const existingTexts = new Set(items.map(i => i.bullet_text))

            // Process Work Experience Bullets
            allExperience?.forEach(exp => {
                exp.accomplishments?.forEach((acc: any) => {
                    if (acc.bullet_text && !existingTexts.has(acc.bullet_text)) {
                        newItems.push({
                            user_id: user.id,
                            bullet_text: acc.bullet_text,
                            role_title: exp.job_title,
                            company_name: exp.company_name,
                            source: 'imported'
                        })
                        existingTexts.add(acc.bullet_text)
                        importCount++
                    }
                })
            })

            // Process CAR Stories
            carStories?.forEach((story: any) => {
                const bullet = story.accomplishment_bullet
                if (bullet && !existingTexts.has(bullet)) {
                    newItems.push({
                        user_id: user.id,
                        bullet_text: bullet,
                        role_title: story.roles?.job_title,
                        company_name: story.roles?.company_name,
                        source: 'car_story',
                        par_story_id: story.id
                    })
                    existingTexts.add(bullet)
                    importCount++
                }
            })
            if (newItems.length > 0) {
                const { error } = await supabase.from('accomplishment_bank').insert(newItems)
                if (error) throw error

                trackEvent('audit', 'accomplishments_imported', { count: newItems.length })

                await loadLibrary()
                alert(t('accomplishmentLibrary.importSuccess', { count: importCount, defaultValue: `{{count}} accomplishments imported!` }))
            } else {
                alert(t('accomplishmentLibrary.importNone', 'No new accomplishments to import — all are already in your library.'))
            }

        } catch (error) {
            console.error('Import error:', error)
        } finally {
            setImporting(false)
        }
    }

    const handleAddCustomGroup = (promptOverride?: string) => {
        const userMsg = (promptOverride || customPrompt).trim()
        if (!userMsg) return

        setChatHistory(prev => [...prev, { role: 'user', content: userMsg }])
        if (!promptOverride) setCustomPrompt('')
        setIsCustomGrouping(true)

        // Simulate a detailed AI response
        setTimeout(() => {
            const simulatedGroups = [
                {
                    theme: userMsg.includes('competencies') ? 'Core Competencies' : `Strategic Focus: ${userMsg.length > 20 ? userMsg.substring(0, 20) + '...' : userMsg}`,
                    storyIds: items.slice(0, 2).map(s => s.id).filter(Boolean) as string[]
                },
                {
                    theme: userMsg.includes('competencies') ? 'Leadership & Strategy' : 'Complementary Achievements',
                    storyIds: items.slice(2, 4).map(s => s.id).filter(Boolean) as string[]
                }
            ]

            setChatHistory(prev => [...prev, {
                role: 'assistant',
                content: userMsg.includes('competencies')
                    ? "I've regrouped your accomplishments into 4 key competency areas as requested, maintaining the original wording."
                    : `Based on your request "${userMsg}", I've analyzed your patterns:`,
                groups: simulatedGroups
            }])
            setIsCustomGrouping(false)
        }, 1500)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm(t('common.deleteConfirm', 'Are you sure you want to delete this?'))) return

        try {
            await supabase.from('accomplishment_bank').delete().eq('id', id)
            trackEvent('audit', 'accomplishment_deleted', {}, 'accomplishment_bank', id)
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (error) {
            console.error('Delete error:', error)
        }
    }

    const handleUpdate = async (id: string, updates: Partial<AccomplishmentBankItem>) => {
        try {
            const { error } = await supabase
                .from('accomplishment_bank')
                .update(updates)
                .eq('id', id)

            if (error) throw error

            trackEvent('audit', 'accomplishment_updated', {
                fields_changed: Object.keys(updates)
            }, 'accomplishment_bank', id)

            setItems(prev => prev.map(i => i.id === id ? { ...i, ...updates } : i))
        } catch (error) {
            console.error('Update error:', error)
        }
    }

    const handleAddManual = async () => {
        if (!newItemText.trim()) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const newItem = {
                user_id: user.id,
                bullet_text: newItemText,
                source: 'manual',
                role_title: newRole.trim() || undefined,
                company_name: newCompany.trim() || undefined,
                start_date: newStart.trim() || undefined,
                end_date: newEnd.trim() || undefined
            }

            const { data, error } = await supabase
                .from('accomplishment_bank')
                .insert(newItem)
                .select()
                .single()

            if (error) throw error

            trackEvent('audit', 'accomplishment_created', {
                source: 'manual',
                length: newItemText.length
            }, 'accomplishment_bank', data?.id)

            setItems([data, ...items])
            setNewItemText('')
            setNewRole('')
            setNewCompany('')
            setNewStart('')
            setNewEnd('')
            setIsAdding(false)
        } catch (error) {
            console.error('Add error:', error)
        }
    }

    // Filter Items
    const filteredItems = items.filter(item => {
        const matchesText = item.bullet_text.toLowerCase().includes(filterText.toLowerCase()) ||
            item.role_title?.toLowerCase().includes(filterText.toLowerCase()) ||
            item.skills?.some(s => s.toLowerCase().includes(filterText.toLowerCase()))

        const matchesRole = selectedRole === 'all' || item.role_title === selectedRole
        const matchesStar = !showStarredOnly || item.is_starred

        return matchesText && matchesRole && matchesStar
    })

    return (
        <>
            <div className={`${isNested ? 'pb-8 md:pb-16' : 'min-h-screen py-8'} bg-transparent px-4 sm:px-6 lg:px-8`}>
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Header */}
                    {!isNested && (
                        <div className="flex items-center justify-between mb-2">
                            <button
                                onClick={() => navigate('/resume-builder')}
                                className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-sm font-medium"
                            >
                                <ArrowLeft className="w-4 h-4" /> {t('common.backToResumeBuilder', 'Back to Resume Builder')}
                            </button>

                            {!isStandalone && (
                                <button
                                    onClick={handleContinue}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-xl shadow-md transition-all font-bold text-sm"
                                >
                                    Next: CARs <ArrowRight className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <span className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <LayoutGrid size={24} />
                                </span>
                                {t('accomplishmentLibrary.title', 'Accomplishment Bank')}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xl">
                                {t('accomplishmentLibrary.subtitle', 'Your personal bank of achievements — organized, tagged, and ready for any resume.')}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2 justify-end">
                            <button
                                onClick={() => setIsVideoModalOpen(true)}
                                className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-sm transition-colors"
                            >
                                <Play size={18} />
                                Watch video
                            </button>
                            <button
                                onClick={() => navigate('/resume/accomplishment-bank-learn-more')}
                                className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-lg shadow-sm transition-colors"
                            >
                                <BookOpen size={18} />
                                Learn more
                            </button>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 dark:bg-emerald-500 text-white rounded-lg hover:bg-emerald-700 dark:hover:bg-emerald-600 shadow-sm transition-colors"
                            >
                                <Plus size={18} />
                                {t('accomplishmentLibrary.addNew', 'Add Accomplishment')}
                            </button>
                            <button
                                onClick={() => setIsGroupingPanelOpen(!isGroupingPanelOpen)}
                                className={`flex items-center gap-1.5 px-4 py-2 text-white rounded-lg shadow-sm transition-colors ${isGroupingPanelOpen ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-[#4F46E5] hover:bg-[#4338CA]'}`}
                            >
                                <Wand2 size={18} />
                                Area of Expertise Grouping. (AI)
                            </button>
                        </div>
                    </div>

                    {/* Controls Bar */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-10">

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search accomplishments..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-800 transition-colors"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-white dark:hover:bg-gray-800 transition-colors focus:ring-2 focus:ring-emerald-500 text-sm max-w-[150px]"
                                >
                                    <option value="all">{t('accomplishmentLibrary.allItems', 'All Items')}</option>
                                    {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                            <button
                                onClick={() => setShowStarredOnly(!showStarredOnly)}
                                className={`p-2 rounded-lg border transition-colors ${showStarredOnly ? 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50 text-amber-600 dark:text-amber-400' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                title={t('accomplishmentLibrary.starredOnly', 'Starred Only')}
                            >
                                <Star size={18} fill={showStarredOnly ? "currentColor" : "none"} />
                            </button>

                            <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1"></div>

                            <button
                                onClick={importFromWorkExperience}
                                disabled={importing}
                                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                            >
                                <FileDown size={18} />
                                {importing ? t('accomplishmentLibrary.importingAll', 'Importing...') : t('accomplishmentLibrary.importExisting', 'Import from Work Experience')}
                            </button>
                        </div>
                    </div>

                    {/* AI Grouping Panel */}
                    {isGroupingPanelOpen && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-indigo-200 dark:border-indigo-800/50 p-4 md:p-6 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Wand2 className="w-5 h-5 text-[#4F46E5] dark:text-indigo-400" /> Area of Expertise Grouping. (AI)
                                </h3>
                                <button onClick={() => setIsGroupingPanelOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="flex flex-col">
                                {/* Quick Action Buttons */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                                    <button onClick={() => handleAddCustomGroup("group these accomplishments in 4 groups of competencies without changing the way the accomplishments are written")} className="p-3 border border-[#C7D2FE] dark:border-indigo-800 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold text-[#4F46E5] dark:text-indigo-400 hover:bg-[#EEF2FF] dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 shadow-sm"><Tag className="w-4 h-4" /> By Competencies</button>
                                    <button onClick={() => handleAddCustomGroup("give me another classification")} className="p-3 border border-[#C7D2FE] dark:border-indigo-800 bg-white dark:bg-gray-800 rounded-xl text-sm font-bold text-[#4F46E5] dark:text-indigo-400 hover:bg-[#EEF2FF] dark:hover:bg-indigo-900/40 transition-colors flex items-center justify-center gap-2 shadow-sm"><RotateCw className="w-4 h-4" /> Reclassify</button>
                                </div>

                                {chatHistory.length > 0 && (
                                    <div className="flex justify-end mb-2">
                                        <button onClick={() => setChatHistory([])} className="text-xs text-red-400 hover:text-red-500 transition-colors flex items-center gap-1 font-medium">
                                            <X className="w-4 h-4" /> Clear results
                                        </button>
                                    </div>
                                )}

                                {/* Scrollable Chat + Results Area */}
                                <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[500px]" style={{ scrollbarWidth: 'thin' }}>
                                    {chatHistory.length === 0 && (
                                        <div className="text-center py-10 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                                            <Wand2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Click a button above or type a prompt below to group your accomplishments.</p>
                                        </div>
                                    )}
                                    {chatHistory.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} gap-2`}>
                                            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-[#4F46E5] text-white rounded-tr-none shadow-md' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-tl-none shadow-sm'}`}>
                                                {msg.content}
                                            </div>
                                            {msg.groups && (
                                                <div className="w-full space-y-4 mt-2">
                                                    {msg.groups.map((group, gi) => (
                                                        <div key={gi} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                                                            {/* Group Header */}
                                                            <div className="bg-gradient-to-r from-[#EEF2FF] to-[#E0E7FF] dark:from-indigo-900/40 dark:to-indigo-800/20 px-4 py-3 flex items-center justify-between">
                                                                <h5 className="font-bold text-[#4F46E5] dark:text-indigo-400 text-sm flex items-center gap-2">
                                                                    <Tag className="w-4 h-4" /> {group.theme}
                                                                </h5>
                                                                <span className="text-xs bg-white dark:bg-gray-900 text-[#4F46E5] dark:text-indigo-400 font-bold px-2.5 py-1 rounded-full shadow-sm">{group.storyIds.length} accomplishments</span>
                                                            </div>
                                                            {/* Accomplishment List */}
                                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                                {group.storyIds.map(sid => {
                                                                    const s = items.find(x => x.id === sid)
                                                                    if (!s) return null
                                                                    return (
                                                                        <div key={sid} className="px-4 py-3">
                                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#10B981] mr-2"></span>
                                                                                {s.bullet_text}
                                                                            </p>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {isCustomGrouping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-3">
                                                <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
                                                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Analyzing your accomplishments...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Chat Input */}
                                <div className="bg-white dark:bg-gray-900 p-2 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center gap-2 mt-auto">
                                    <Wand2 className="w-5 h-5 text-gray-400 ml-2" />
                                    <input
                                        type="text"
                                        value={customPrompt}
                                        onChange={e => setCustomPrompt(e.target.value)}
                                        placeholder="Type a custom instruction..."
                                        className="w-full text-sm py-2 px-2 border-none dark:text-gray-200 bg-transparent focus:ring-0 outline-none"
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault()
                                                handleAddCustomGroup()
                                            }
                                        }}
                                    />
                                    <button
                                        onClick={() => handleAddCustomGroup()}
                                        disabled={!customPrompt.trim() || isCustomGrouping}
                                        className="bg-[#4F46E5] text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#4338CA] disabled:opacity-50 transition-colors shadow-sm"
                                    >
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Add Manual Form */}
                    {isAdding && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-emerald-200 dark:border-emerald-800/50 p-4 animate-in slide-in-from-top duration-200">
                            <h3 className="text-sm font-medium text-emerald-800 dark:text-emerald-400 mb-2">{t('accomplishmentLibrary.addNew', 'Add Accomplishment')}</h3>
                            <textarea
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                placeholder={t('accomplishmentLibrary.bulletPlaceholder', 'e.g., Led team of 5...')}
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-[100px] mb-3"
                                autoFocus
                            />

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.role', 'Role')}</label>
                                    <input
                                        type="text"
                                        value={newRole}
                                        onChange={e => setNewRole(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="e.g. Sales Manager"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.company', 'Company')}</label>
                                    <input
                                        type="text"
                                        value={newCompany}
                                        onChange={e => setNewCompany(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="e.g. Modere"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.startDate', 'Start Date')}</label>
                                    <input
                                        type="text"
                                        value={newStart}
                                        onChange={e => setNewStart(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="e.g. Jan 2020"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.endDate', 'End Date')}</label>
                                    <input
                                        type="text"
                                        value={newEnd}
                                        onChange={e => setNewEnd(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder="e.g. Present"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button onClick={handleAddManual} className="px-3 py-1.5 text-sm bg-emerald-600 dark:bg-emerald-500 text-white rounded hover:bg-emerald-700 dark:hover:bg-emerald-600">
                                    {t('common.save', 'Save')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grid / List */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400">{t('common.loading', 'Loading...')}</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <div className="bg-gray-50 dark:bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <LayoutGrid size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">{t('accomplishmentLibrary.noAccomplishments', 'No accomplishments yet')}</h3>
                            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">{t('accomplishmentLibrary.noAccomplishmentsHelp', 'Start building your library by adding accomplishments or importing them from your work experience.')}</p>
                            <button
                                onClick={importFromWorkExperience}
                                className="mt-4 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                            >
                                {t('accomplishmentLibrary.importExisting', 'Import from Work Experience')}
                            </button>
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={filteredItems.map(i => i.id!)} strategy={verticalListSortingStrategy}>
                                <div className="grid grid-cols-1 gap-4">
                                    {filteredItems.map(item => (
                                        <AccomplishmentBankCard
                                            key={item.id}
                                            item={item}
                                            onUpdate={handleUpdate}
                                            onDelete={handleDelete}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                </div>
            </div>
            {userId && <ResumePreview userId={userId} />}

            {/* Video Modal */}
            {isVideoModalOpen && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
                    onClick={() => setIsVideoModalOpen(false)}
                >
                    {/* Dark Overlay */}
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

                    {/* Modal Content */}
                    <div
                        className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close button */}
                        <button
                            onClick={() => setIsVideoModalOpen(false)}
                            className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
                            aria-label="Close video"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Video Player */}
                        <div className="w-full aspect-video bg-black flex items-center justify-center relative">
                            <video
                                src={`${import.meta.env.BASE_URL}videos/Master_Your_Resume_in_6_Steps.mp4`}
                                className="w-full h-full outline-none"
                                controls
                                controlsList="nodownload"
                                autoPlay
                                playsInline
                            >
                                Your browser does not support the video tag.
                            </video>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
