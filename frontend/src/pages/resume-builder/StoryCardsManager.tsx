import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Filter, Trophy, Briefcase, Star, StarOff, Tag, Link2, Pencil, Trash2, ChevronDown, ChevronUp, CheckCircle2, X, Loader2, ArrowRight } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { CARStory, COMPETENCIES } from '../../types/resume'
import { useTranslation } from 'react-i18next'

export default function StoryCardsManager() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const { t } = useTranslation()
    const [stories, setStories] = useState<CARStory[]>([])
    const [workExperiences, setWorkExperiences] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'final'>('all')
    const [filterCompetency, setFilterCompetency] = useState('')
    const [filterWillDoAgain, setFilterWillDoAgain] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingStory, setEditingStory] = useState<CARStory | null>(null)

    // Form state
    const [form, setForm] = useState<Partial<CARStory>>({
        title: '',
        role_company: '',
        year: '',
        problem_challenge: '',
        actions: ['', ''],
        result: '',
        metrics: [],
        will_do_again: false,
        competencies: [],
        skills_tags: [],
        status: 'draft'
    })
    const [saving, setSaving] = useState(false)
    const [skillInput, setSkillInput] = useState('')
    const [linkingStoryId, setLinkingStoryId] = useState<string | null>(null)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Load stories from both tables
            const { data: parStories } = await supabase
                .from('par_stories')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            const { data: bankStories } = await supabase
                .from('accomplishment_bank')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            // Map accomplishment_bank bullets so they render text properly in the UI
            const mappedBankStories = (bankStories || []).map(b => ({
                id: b.id,
                title: 'Imported Accomplishment',
                role_company: (b.role_title && b.company_name) ? `${b.role_title} at ${b.company_name}` : (b.role_title || b.company_name || 'Imported Experience'),
                year: '',
                problem_challenge: b.bullet_text, // Map bullet text to the leading content block
                actions: [],
                result: '',
                metrics: [],
                will_do_again: b.is_starred || false,
                competencies: [],
                skills_tags: [],
                status: 'draft',
                created_at: b.created_at,
                is_bank_item: true // flag to differentiate interactions
            }))

            // Deduplicate accomplishment_bank bullets by text to avoid showing the same imported item multiple times
            const uniqueBankStories = mappedBankStories.filter((v, i, a) => a.findIndex(t => (t.problem_challenge === v.problem_challenge)) === i)

            // Transform bank stories if necessary to match CARStory interface or just merge
            const mergedStories = [...(parStories || []), ...uniqueBankStories].sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })

            // Load work experiences for linking — try all user resumes
            const { data: resumes } = await supabase
                .from('user_resumes')
                .select('id')
                .eq('user_id', user.id)

            let allWorkExps: any[] = []
            if (resumes && resumes.length > 0) {
                for (const resume of resumes) {
                    const { data: weData } = await supabase
                        .from('work_experience')
                        .select('id, job_title, company_name')
                        .eq('resume_id', resume.id)
                        .order('start_date', { ascending: false })

                    if (weData) allWorkExps = [...allWorkExps, ...weData]
                }
            }

            // Legacy fallback: resume_id = user.id
            if (allWorkExps.length === 0) {
                const { data: legacyWE } = await supabase
                    .from('work_experience')
                    .select('id, job_title, company_name')
                    .eq('resume_id', user.id)
                    .order('start_date', { ascending: false })

                if (legacyWE) allWorkExps = legacyWE
            }

            setWorkExperiences(allWorkExps)
            setStories(mergedStories)
        } catch (e) {
            console.error('Error loading stories:', e)
        }
        setLoading(false)
    }

    const filteredStories = useMemo(() => {
        return stories.filter(s => {
            if (searchQuery && !(`${s.title} ${s.role_company} ${s.problem_challenge} ${s.result}`).toLowerCase().includes(searchQuery.toLowerCase())) return false
            if (filterStatus !== 'all' && s.status !== filterStatus) return false
            if (filterCompetency && !(s.competencies || []).includes(filterCompetency)) return false
            if (filterWillDoAgain && !s.will_do_again) return false
            return true
        })
    }, [stories, searchQuery, filterStatus, filterCompetency, filterWillDoAgain])

    const handleNewStory = () => {
        setEditingStory(null)
        setForm({
            title: '',
            role_company: '',
            year: '',
            problem_challenge: '',
            actions: ['', ''],
            result: '',
            metrics: [],
            will_do_again: false,
            competencies: [],
            skills_tags: [],
            status: 'draft'
        })
        setShowForm(true)
    }

    const handleEdit = (story: CARStory) => {
        setEditingStory(story)
        setForm({
            ...story,
            actions: story.actions?.length ? story.actions : ['', '']
        })
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this story card?')) return
        try {
            await supabase.from('par_stories').delete().eq('id', id)
            setStories(prev => prev.filter(s => s.id !== id))
        } catch (e) {
            console.error('Error deleting:', e)
        }
    }

    const handleSave = async () => {
        if (!form.role_company?.trim() || !form.problem_challenge?.trim() || !form.result?.trim()) return
        setSaving(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const cleanActions = (form.actions || []).filter(a => a.trim())
            const storyData = {
                user_id: user.id,
                title: form.title?.trim() || `${form.role_company} - Challenge`,
                role_company: form.role_company,
                year: form.year,
                problem_challenge: form.problem_challenge,
                actions: cleanActions,
                result: form.result,
                metrics: form.metrics || [],
                will_do_again: form.will_do_again || false,
                competencies: form.competencies || [],
                skills_tags: form.skills_tags || [],
                status: form.status || 'draft',
                source_type: editingStory?.source_type || 'manual',
                converted_to_bullet: form.converted_to_bullet || false,
                bullet_text: form.bullet_text
            }

            if (editingStory?.id) {
                const { data } = await supabase
                    .from('par_stories')
                    .update(storyData)
                    .eq('id', editingStory.id)
                    .select()
                    .single()

                if (data) setStories(prev => prev.map(s => s.id === editingStory.id ? data : s))
            } else {
                const { data } = await supabase
                    .from('par_stories')
                    .insert(storyData)
                    .select()
                    .single()

                if (data) setStories(prev => [data, ...prev])
            }

            setShowForm(false)
            setEditingStory(null)
        } catch (e) {
            console.error('Error saving:', e)
        }
        setSaving(false)
    }

    const handleLinkToRole = async (storyId: string, workExpId: string) => {
        try {
            await supabase.from('accomplishment_work_link').insert({
                accomplishment_id: storyId,
                work_experience_id: workExpId
            })
            setLinkingStoryId(null)
        } catch (e) {
            console.error('Error linking:', e)
        }
    }

    const addAction = () => {
        setForm(prev => ({ ...prev, actions: [...(prev.actions || []), ''] }))
    }

    const updateAction = (idx: number, value: string) => {
        setForm(prev => {
            const actions = [...(prev.actions || [])]
            actions[idx] = value
            return { ...prev, actions }
        })
    }

    const addSkillTag = () => {
        if (!skillInput.trim()) return
        setForm(prev => ({
            ...prev,
            skills_tags: [...(prev.skills_tags || []), skillInput.trim()]
        }))
        setSkillInput('')
    }

    const removeSkillTag = (idx: number) => {
        setForm(prev => ({
            ...prev,
            skills_tags: (prev.skills_tags || []).filter((_, i) => i !== idx)
        }))
    }

    const toggleCompetency = (comp: string) => {
        setForm(prev => {
            const current = prev.competencies || []
            return {
                ...prev,
                competencies: current.includes(comp)
                    ? current.filter(c => c !== comp)
                    : [...current, comp]
            }
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">

                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(isStandalone ? '/resume-builder' : '/resume/awards')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {isStandalone ? 'Back to Resume Builder' : 'Back to Awards & Certifications'}
                    </button>
                </div>

                {isStandalone && (
                    <div className="flex space-x-6 mb-8 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => navigate('/resume/awards?mode=standalone')}
                            className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                        >
                            Awards & Certifications
                        </button>
                        <button className="pb-3 border-b-2 border-blue-600 font-semibold text-blue-600 dark:text-blue-400">
                            CAR Stories
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-3">
                            <Trophy className="w-4 h-4" /> Step 2
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Accomplishments (Story Cards)</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Build your achievement bank using CAR/STAR framework.</p>
                    </div>
                    <button
                        onClick={handleNewStory}
                        className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2"
                    >
                        <Plus className="w-5 h-5" /> Create Story Card
                    </button>
                </div>

                {/* Search & Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search stories..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="draft">Draft</option>
                            <option value="final">Final</option>
                        </select>
                        <select
                            value={filterCompetency}
                            onChange={e => setFilterCompetency(e.target.value)}
                            className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        >
                            <option value="">All Competencies</option>
                            {COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <button
                            onClick={() => setFilterWillDoAgain(!filterWillDoAgain)}
                            className={`px-4 py-2 rounded-xl border text-sm font-medium flex items-center gap-1.5 ${filterWillDoAgain
                                ? 'border-yellow-400 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            <Star className="w-4 h-4" /> Would do again
                        </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{filteredStories.length} stories found</p>
                </div>

                {/* Form Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl my-8 max-h-[90vh] overflow-y-auto">
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {editingStory ? 'Edit Story Card' : 'New Story Card'}
                                </h2>
                                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="p-6 space-y-5">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Story Title</label>
                                    <input
                                        value={form.title || ''}
                                        onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        placeholder="e.g., Global Supply Chain Transformation"
                                    />
                                </div>

                                {/* Role & Year */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role & Company <span className="text-red-500">*</span></label>
                                        <input
                                            value={form.role_company || ''}
                                            onChange={e => setForm(prev => ({ ...prev, role_company: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="e.g., VP Operations at Acme Corp"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                                        <input
                                            value={form.year || ''}
                                            onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder="2023"
                                        />
                                    </div>
                                </div>

                                {/* CAR Fields */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">C</span>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Challenge <span className="text-red-500">*</span></label>
                                    </div>
                                    <textarea
                                        value={form.problem_challenge || ''}
                                        onChange={e => setForm(prev => ({ ...prev, problem_challenge: e.target.value }))}
                                        rows={3}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                        placeholder="What specific problem or situation did you face?"
                                    />

                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">A</span>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Actions</label>
                                    </div>
                                    {(form.actions || []).map((action, idx) => (
                                        <input
                                            key={idx}
                                            value={action}
                                            onChange={e => updateAction(idx, e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            placeholder={`Action ${idx + 1}...`}
                                        />
                                    ))}
                                    <button onClick={addAction} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                                        <Plus className="w-4 h-4" /> Add action
                                    </button>

                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold">R</span>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Result (Measured) <span className="text-red-500">*</span></label>
                                    </div>
                                    <textarea
                                        value={form.result || ''}
                                        onChange={e => setForm(prev => ({ ...prev, result: e.target.value }))}
                                        rows={2}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                        placeholder="What was the quantifiable outcome?"
                                    />
                                </div>

                                {/* Competencies */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Competencies</label>
                                    <div className="flex flex-wrap gap-2">
                                        {COMPETENCIES.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => toggleCompetency(c)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${(form.competencies || []).includes(c)
                                                    ? 'bg-blue-100 text-blue-700 border border-blue-300 dark:bg-blue-900/30 dark:text-blue-300'
                                                    : 'bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Skills Tags */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skills Tags</label>
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {(form.skills_tags || []).map((tag, idx) => (
                                            <span key={idx} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs flex items-center gap-1">
                                                {tag}
                                                <button onClick={() => removeSkillTag(idx)}><X className="w-3 h-3" /></button>
                                            </span>
                                        ))}
                                    </div>
                                    <div className="flex gap-2">
                                        <input
                                            value={skillInput}
                                            onChange={e => setSkillInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkillTag())}
                                            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                                            placeholder="Add skill..."
                                        />
                                        <button onClick={addSkillTag} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm font-medium hover:bg-gray-200 text-gray-700 dark:text-gray-300">Add</button>
                                    </div>
                                </div>

                                {/* Status & Will Do Again */}
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</label>
                                        <select
                                            value={form.status || 'draft'}
                                            onChange={e => setForm(prev => ({ ...prev, status: e.target.value as any }))}
                                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                                        >
                                            <option value="draft">Draft</option>
                                            <option value="final">Final</option>
                                        </select>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={form.will_do_again || false}
                                            onChange={e => setForm(prev => ({ ...prev, will_do_again: e.target.checked }))}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        I would do this again
                                    </label>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                                <button onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium">Cancel</button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 shadow-lg shadow-blue-500/25"
                                >
                                    {saving ? 'Saving...' : editingStory ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stories List */}
                {filteredStories.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                        <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Story Cards Yet</h3>
                        <p className="text-gray-500 mb-6">Create stories to highlight your key achievements using the CAR framework.</p>
                        <button
                            onClick={handleNewStory}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all"
                        >
                            <Plus className="w-5 h-5 inline mr-2" /> Create First Story Card
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredStories.map(story => (
                            <div key={story.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{story.title || story.role_company}</h3>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${story.status === 'final'
                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                                                }`}>
                                                {story.status || 'draft'}
                                            </span>
                                            {story.will_do_again && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{story.role_company} • {story.year}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setLinkingStoryId(linkingStoryId === story.id ? null : (story.id || null))}
                                            className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                            title="Link to role"
                                        >
                                            <Link2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleEdit(story)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => story.id && handleDelete(story.id)} className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Link to Role Dropdown */}
                                {linkingStoryId === story.id && workExperiences.length > 0 && (
                                    <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
                                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">Link to a role:</p>
                                        <div className="space-y-1">
                                            {workExperiences.map(we => (
                                                <button
                                                    key={we.id}
                                                    onClick={() => story.id && handleLinkToRole(story.id, we.id)}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-blue-100 dark:hover:bg-blue-800/40 text-gray-700 dark:text-gray-300 transition-colors"
                                                >
                                                    <Briefcase className="w-3 h-3 inline mr-2" />{we.job_title} at {we.company_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* CAR Display */}
                                <div className="space-y-2 mt-3">
                                    <div className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">C</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{story.problem_challenge}</p>
                                    </div>
                                    {(story.actions || []).filter(a => a).map((action, i) => (
                                        <div key={i} className="flex items-start gap-2">
                                            <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">A</span>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{action}</p>
                                        </div>
                                    ))}
                                    <div className="flex items-start gap-2">
                                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">R</span>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium">{story.result}</p>
                                    </div>
                                </div>

                                {/* Tags */}
                                {((story.competencies?.length || 0) > 0 || (story.skills_tags?.length || 0) > 0) && (
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        {(story.competencies || []).map(c => (
                                            <span key={c} className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-full text-xs">{c}</span>
                                        ))}
                                        {(story.skills_tags || []).map((s, i) => (
                                            <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs">{s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Continue to Next Step */}
                {!showForm && !isStandalone && (
                    <div className="flex justify-center mt-12 pb-8">
                        <button
                            onClick={() => navigate('/resume/jd-analyzer')}
                            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105 font-bold text-lg"
                        >
                            {t('resumeBuilder.navigation.continueToStep', { step: t('resumeBuilder.steps.jdAnalyzer') })}
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
