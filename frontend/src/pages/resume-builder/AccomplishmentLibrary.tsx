import React, { useState, useEffect } from 'react'
import {
    Search, Filter, Plus, FileDown, Star, LayoutGrid, List, Sparkles,
    RefreshCw, ChevronDown, CheckSquare, Settings, ArrowLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { AccomplishmentBankItem } from '../../types/resume'
import { AccomplishmentBankCard } from '../../components/resume-builder/AccomplishmentBankCard'
import { BackButton } from '../../components/common/BackButton'
import { useTranslation } from 'react-i18next'
import ResumePreview from '../../components/resume/ResumePreview'
import { trackEvent } from '../../lib/analytics'

export default function AccomplishmentLibrary() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [userId, setUserId] = useState<string | null>(null)
    const [items, setItems] = useState<AccomplishmentBankItem[]>([])
    const [loading, setLoading] = useState(true)
    const [importing, setImporting] = useState(false)
    const [filterText, setFilterText] = useState('')
    const [showStarredOnly, setShowStarredOnly] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string>('all')
    const [roles, setRoles] = useState<string[]>([])

    const [newItemText, setNewItemText] = useState('')
    const [isAdding, setIsAdding] = useState(false)

    // AI Selection State
    const [aiMode, setAiMode] = useState(false)
    const [targetJob, setTargetJob] = useState('')
    const [aiLoading, setAiLoading] = useState(false)

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

            setItems(data || [])

            // Extract unique roles for filter
            const uniqueRoles = Array.from(new Set(data?.map(i => i.role_title).filter(Boolean) as string[]))
            setRoles(uniqueRoles)
        } catch (error) {
            console.error('Error loading library:', error)
        } finally {
            setLoading(false)
        }
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
                role_title: selectedRole !== 'all' ? selectedRole : undefined
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
            <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <span className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                                    <LayoutGrid size={24} />
                                </span>
                                {t('accomplishmentLibrary.title', 'Accomplishment Library')}
                            </h1>
                            <p className="text-gray-500 max-w-xl">
                                {t('accomplishmentLibrary.subtitle', 'Your personal bank of achievements — organized, tagged, and ready for any resume.')}
                            </p>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => setIsAdding(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow-sm transition-colors"
                            >
                                <Plus size={18} />
                                {t('accomplishmentLibrary.addNew', 'Add Accomplishment')}
                            </button>
                            <button
                                onClick={() => setAiMode(!aiMode)}
                                className={`flex items-center gap-2 px-4 py-2 border rounded-lg shadow-sm transition-colors ${aiMode ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Sparkles size={18} />
                                {t('accomplishmentLibrary.autoAssemble', 'AI Auto-Select')}
                            </button>
                        </div>
                    </div>

                    {/* AI Assembler Panel */}
                    {aiMode && (
                        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-6 shadow-sm animate-in slide-in-from-top duration-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white rounded-full shadow-sm text-purple-600">
                                    <Sparkles size={24} />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{t('accomplishmentLibrary.autoAssemble', 'AI Auto-Select')}</h3>
                                        <p className="text-gray-600 text-sm">{t('accomplishmentLibrary.autoAssembleHelp', 'Enter a target job title and let AI pick the best accomplishments for your resume.')}</p>
                                    </div>

                                    <div className="flex gap-2 max-w-md">
                                        <input
                                            type="text"
                                            value={targetJob}
                                            onChange={(e) => setTargetJob(e.target.value)}
                                            placeholder={t('accomplishmentLibrary.targetJobPlaceholder', 'e.g., Senior Product Manager')}
                                            className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                                        />
                                        <button
                                            disabled={!targetJob || aiLoading}
                                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                        >
                                            {aiLoading ? t('accomplishmentLibrary.assembling', 'AI is selecting...') : t('accomplishmentLibrary.assemble', 'Auto-Select')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Controls Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row gap-4 justify-between items-center sticky top-4 z-10">

                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative flex-1 md:w-64">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search accomplishments..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 bg-gray-50 focus:bg-white transition-colors"
                                />
                            </div>

                            <div className="relative">
                                <select
                                    value={selectedRole}
                                    onChange={(e) => setSelectedRole(e.target.value)}
                                    className="appearance-none pl-3 pr-8 py-2 border rounded-lg bg-gray-50 hover:bg-white transition-colors focus:ring-2 focus:ring-emerald-500 text-sm max-w-[150px]"
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
                                className={`p-2 rounded-lg border transition-colors ${showStarredOnly ? 'bg-amber-50 border-amber-200 text-amber-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                title={t('accomplishmentLibrary.starredOnly', 'Starred Only')}
                            >
                                <Star size={18} fill={showStarredOnly ? "currentColor" : "none"} />
                            </button>

                            <div className="h-6 w-px bg-gray-200 mx-1"></div>

                            <button
                                onClick={importFromWorkExperience}
                                disabled={importing}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 transition-colors px-3 py-2 rounded-lg hover:bg-emerald-50"
                            >
                                <FileDown size={18} />
                                {importing ? t('accomplishmentLibrary.importingAll', 'Importing...') : t('accomplishmentLibrary.importExisting', 'Import from Work Experience')}
                            </button>
                        </div>
                    </div>

                    {/* Add Manual Form */}
                    {isAdding && (
                        <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 animate-in slide-in-from-top duration-200">
                            <h3 className="text-sm font-medium text-emerald-800 mb-2">{t('accomplishmentLibrary.addNew', 'Add Accomplishment')}</h3>
                            <textarea
                                value={newItemText}
                                onChange={(e) => setNewItemText(e.target.value)}
                                placeholder={t('accomplishmentLibrary.bulletPlaceholder', 'e.g., Led team of 5...')}
                                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[100px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded">
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button onClick={handleAddManual} className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700">
                                    {t('common.save', 'Save')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Grid / List */}
                    {loading ? (
                        <div className="text-center py-12 text-gray-500">{t('common.loading', 'Loading...')}</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <LayoutGrid size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">{t('accomplishmentLibrary.noAccomplishments', 'No accomplishments yet')}</h3>
                            <p className="text-gray-500 max-w-md mx-auto">{t('accomplishmentLibrary.noAccomplishmentsHelp', 'Start building your library by adding accomplishments or importing them from your work experience.')}</p>
                            <button
                                onClick={importFromWorkExperience}
                                className="mt-4 text-emerald-600 font-medium hover:underline"
                            >
                                {t('accomplishmentLibrary.importExisting', 'Import from Work Experience')}
                            </button>
                        </div>
                    ) : (
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
                    )}

                </div>
            </div>
            {userId && <ResumePreview userId={userId} />}
        </>
    )
}
