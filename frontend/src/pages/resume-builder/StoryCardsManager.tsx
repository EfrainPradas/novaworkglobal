import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Plus, Search, Trophy, Briefcase, Star, Link2, Pencil, Trash2, X, Loader2, ArrowRight, Wand2, Copy, BookOpen, Sparkles, Filter, ChevronDown, Calendar, CheckSquare, Tag } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { CARStory, COMPETENCIES } from '../../types/resume'
import { useTranslation } from 'react-i18next'

const ACTION_VERBS = {
    'Leadership & Management': ['Directed', 'Executed', 'Guided', 'Managed', 'Orchestrated', 'Spearheaded'],
    'Operations & Execution': ['Accelerated', 'Achieved', 'Delivered', 'Improved', 'Optimized', 'Streamlined'],
    'Analytics & Strategy': ['Analyzed', 'Assessed', 'Evaluated', 'Identified', 'Measured', 'Quantified'],
    'Technical & Engineering': ['Architected', 'Built', 'Deployed', 'Engineered', 'Programmed', 'Resolved'],
    'Sales & Growth': ['Expanded', 'Generated', 'Increased', 'Negotiated', 'Secured', 'Yielded']
}

const EXAMPLES = [
    { role: 'Data Analyst', text: 'Optimized SQL performance across reporting pipelines by refactoring queries, improving joins/filters, tuning indexes, and reducing redundant transformations, boosting overall reporting efficiency by 35% and shortening refresh cycles for business-critical dashboards.' },
    { role: 'Software Engineer', text: 'Architected and deployed a microservices-based backend using Node.js and Docker, replacing a legacy monolithic architecture, which reduced system downtime by 99% and decreased deployment times from 2 hours to 15 minutes.' },
    { role: 'Product Manager', text: 'Spearheaded the launch of a new mobile app feature by conducting user research, defining requirements, and collaborating with cross-functional teams, resulting in a 25% increase in daily active users and $1.2M in new annual recurring revenue.' }
]

export default function StoryCardsManager() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const { t } = useTranslation()

    // Existing State
    const [stories, setStories] = useState<CARStory[]>([])
    const [workExperiences, setWorkExperiences] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'ready' | 'polished'>('all')
    const [filterCompetency, setFilterCompetency] = useState('')
    const [filterWillDoAgain, setFilterWillDoAgain] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingStory, setEditingStory] = useState<CARStory | null>(null)

    // New State for Redesign
    const [sortOrder, setSortOrder] = useState<'newest' | 'strongest' | 'role'>('newest')
    const [activePanel, setActivePanel] = useState<'verbs' | 'examples' | 'ai' | null>(null)
    const [lastInsertedVerb, setLastInsertedVerb] = useState('')
    const [isGrouping, setIsGrouping] = useState(false)
    const [aiGroups, setAiGroups] = useState<{ theme: string, storyIds: string[] }[]>([])

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

            const mappedBankStories = (bankStories || []).map(b => ({
                id: b.id,
                title: 'Imported Accomplishment',
                role_company: (b.role_title && b.company_name) ? `${b.role_title} at ${b.company_name}` : (b.role_title || b.company_name || 'Imported Experience'),
                year: '',
                problem_challenge: b.bullet_text,
                actions: [],
                result: '',
                metrics: [],
                will_do_again: b.is_starred || false,
                competencies: [],
                skills_tags: [],
                status: 'draft',
                created_at: b.created_at,
                is_bank_item: true
            }))

            const uniqueBankStories = mappedBankStories.filter((v, i, a) => a.findIndex(t => (t.problem_challenge === v.problem_challenge)) === i)

            const mergedStories = [...(parStories || []), ...uniqueBankStories].sort((a, b) => {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            })

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
        let filtered = stories.filter(s => {
            if (searchQuery && !(`${s.title} ${s.role_company} ${s.problem_challenge} ${s.result}`).toLowerCase().includes(searchQuery.toLowerCase())) return false
            if (filterStatus !== 'all' && s.status !== filterStatus) return false
            if (filterCompetency && !(s.competencies || []).includes(filterCompetency)) return false
            if (filterWillDoAgain && !s.will_do_again) return false
            return true
        })

        if (sortOrder === 'newest') {
            filtered = filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        } else if (sortOrder === 'strongest') {
            filtered = filtered.sort((a, b) => (b.metrics?.length || 0) - (a.metrics?.length || 0))
        } else if (sortOrder === 'role') {
            filtered = filtered.sort((a, b) => (a.role_company || '').localeCompare(b.role_company || ''))
        }

        return filtered
    }, [stories, searchQuery, filterStatus, filterCompetency, filterWillDoAgain, sortOrder])

    // Stats calculation
    const stats = {
        total: stories.length,
        draft: stories.filter(s => s.status === 'draft').length,
        ready: stories.filter(s => s.status === 'ready').length,
        polished: stories.filter(s => s.status === 'polished').length
    }

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

    const handleDelete = async (id: string, isBankItem?: boolean) => {
        if (!confirm('Delete this story card?')) return
        try {
            if (isBankItem) {
                await supabase.from('accomplishment_bank').delete().eq('id', id)
            } else {
                await supabase.from('par_stories').delete().eq('id', id)
            }
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
                title: form.title?.trim() || `${form.role_company} - Accomplishment`,
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
                if (editingStory.is_bank_item) {
                    const bankData = {
                        role_title: form.role_company,
                        bullet_text: form.problem_challenge,
                        is_starred: form.will_do_again
                    }
                    const { data } = await supabase
                        .from('accomplishment_bank')
                        .update(bankData)
                        .eq('id', editingStory.id)
                        .select()
                        .single()

                    if (data) {
                        const updated = { ...editingStory, ...form } as CARStory
                        setStories(prev => prev.map(s => s.id === editingStory.id ? updated : s))
                    }
                } else {
                    const { data } = await supabase
                        .from('par_stories')
                        .update(storyData)
                        .eq('id', editingStory.id)
                        .select()
                        .single()

                    if (data) setStories(prev => prev.map(s => s.id === editingStory.id ? data : s))
                }
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

    const insertTextToField = (field: 'problem_challenge' | 'actions' | 'result', text: string) => {
        if (!showForm) {
            handleNewStory()
            setTimeout(() => {
                if (field === 'actions') {
                    setForm(prev => ({ ...prev, actions: [text, ''] }))
                } else {
                    setForm(prev => ({ ...prev, [field]: text }))
                }
            }, 100)
            return
        }

        if (field === 'actions') {
            setForm(prev => {
                const acts = [...(prev.actions || [])]
                const emptyIdx = acts.findIndex(a => !a.trim())
                if (emptyIdx !== -1) {
                    acts[emptyIdx] = text
                } else {
                    acts.push(text)
                }
                return { ...prev, actions: acts }
            })
        } else {
            setForm(prev => ({
                ...prev,
                [field]: prev[field] ? `${prev[field]} ${text}` : text
            }))
        }
    }

    const copyToClipboard = async (text: string, verb?: string) => {
        await navigator.clipboard.writeText(text)
        if (verb) setLastInsertedVerb(verb)
    }

    const handleAIGrouping = async () => {
        setIsGrouping(true)
        setActivePanel('ai')
        // In a real implementation this would call an API
        // For now, simulate an API call that groups stories
        setTimeout(() => {
            setAiGroups([
                { theme: 'Process Optimization & Efficiency', storyIds: stories.slice(0, 2).map(s => s.id) },
                { theme: 'Cross-Functional Leadership', storyIds: stories.slice(2, 4).map(s => s.id) }
            ])
            setIsGrouping(false)
        }, 2000)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-[#4F46E5] animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] p-4 md:p-8 font-sans">
            <div className="max-w-6xl mx-auto">
                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(isStandalone ? '/resume-builder' : '/resume/awards')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium"
                    >
                        <ArrowLeft className="w-4 h-4" /> {isStandalone ? 'Back to Resume Builder' : 'Back to Awards & Certifications'}
                    </button>
                </div>

                {isStandalone && (
                    <div className="flex space-x-6 mb-8 border-b border-gray-200">
                        <button
                            onClick={() => navigate('/resume/awards?mode=standalone')}
                            className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium transition-colors"
                        >
                            Awards & Certifications
                        </button>
                        <button className="pb-3 border-b-2 border-[#4F46E5] font-semibold text-[#4F46E5]">
                            CAR Stories
                        </button>
                    </div>
                )}

                {/* Workspace Header Redesign */}
                <div className="bg-white rounded-2xl p-8 mb-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center px-3 py-1 rounded-full border border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                            Step 2
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-6">Accomplishments Bank</h1>

                        <div className="flex gap-3">
                            <div className="px-4 py-1.5 rounded-full border border-gray-200 text-sm flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{stats.total}</span> <span className="text-gray-500">Stories</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full border border-gray-200 text-sm flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{stats.draft}</span> <span className="text-gray-500">Drafts</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full border border-gray-200 text-sm flex items-center gap-2">
                                <span className="font-semibold text-[#7E22CE]">{stats.ready}</span> <span className="text-gray-500">Ready</span>
                            </div>
                            <div className="px-4 py-1.5 rounded-full border border-gray-200 text-sm flex items-center gap-2">
                                <span className="font-semibold text-[#059669]">{stats.polished}</span> <span className="text-gray-500">Polished</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 min-w-[340px]">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-gray-900 text-sm">Quick Actions</span>
                            <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase bg-gray-200 px-2 py-0.5 rounded">Tools</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed">Keep the writing tools visible and grouped in one focused area.</p>

                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleNewStory}
                                className="w-full py-2.5 bg-[#4F46E5] text-white font-medium rounded-xl hover:bg-[#4338CA] transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> Create CAR
                            </button>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setActivePanel(activePanel === 'verbs' ? null : 'verbs')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-colors ${activePanel === 'verbs' ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <Sparkles className="w-4 h-4 text-gray-400" /> Action Verbs
                                </button>
                                <button
                                    onClick={() => setActivePanel(activePanel === 'examples' ? null : 'examples')}
                                    className={`flex-1 py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-colors ${activePanel === 'examples' ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                                >
                                    <BookOpen className="w-4 h-4 text-gray-400" /> View Examples
                                </button>
                            </div>
                            <button
                                onClick={handleAIGrouping}
                                className={`w-full py-2 rounded-xl text-sm font-medium border flex items-center justify-center gap-2 transition-colors ${activePanel === 'ai' ? 'bg-[#EEF2FF] border-[#C7D2FE] text-[#4F46E5]' : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'}`}
                            >
                                <Wand2 className="w-4 h-4 text-gray-400" /> AI Grouping
                            </button>
                        </div>
                    </div>
                </div>

                {/* Capsule Toolbar Redesign */}
                <div className="mb-6">
                    <div className="bg-white rounded-full p-2 shadow-sm border border-gray-200 flex flex-wrap md:flex-nowrap items-center gap-3">
                        <div className="relative flex-1 min-w-[200px] flex items-center ml-2">
                            <Search className="w-4 h-4 text-gray-400 absolute left-2" />
                            <input
                                type="text"
                                placeholder="Search accomplishments..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-8 pr-4 py-2 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                            />
                        </div>
                        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                        <div className="relative">
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="pl-4 pr-8 py-2 bg-transparent text-sm text-gray-600 focus:outline-none appearance-none cursor-pointer hover:bg-gray-50 rounded-full transition-colors border border-gray-200"
                            >
                                <option value="all">All Status</option>
                                <option value="draft">Draft</option>
                                <option value="ready">Ready</option>
                                <option value="polished">Polished</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <div className="relative">
                            <select
                                value={filterCompetency}
                                onChange={e => setFilterCompetency(e.target.value)}
                                className="pl-4 pr-8 py-2 bg-transparent text-sm text-gray-600 focus:outline-none appearance-none cursor-pointer hover:bg-gray-50 rounded-full transition-colors border border-gray-200"
                            >
                                <option value="">All Competencies</option>
                                {COMPETENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>

                        <button
                            onClick={() => setFilterWillDoAgain(!filterWillDoAgain)}
                            className={`px-4 py-2 rounded-full border text-sm font-medium flex items-center gap-1.5 transition-colors ${filterWillDoAgain
                                ? 'bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]'
                                : 'text-gray-600 bg-transparent border-gray-200 hover:bg-gray-50'
                                }`}
                        >
                            Would do again {filterWillDoAgain && <div className="w-1.5 h-1.5 rounded-full bg-[#D97706] ml-1"></div>}
                        </button>

                        <div className="h-6 w-px bg-gray-200 hidden md:block"></div>

                        <div className="relative mr-2">
                            <select
                                value={sortOrder}
                                onChange={e => setSortOrder(e.target.value as any)}
                                className="pl-4 pr-8 py-2 bg-transparent text-sm text-gray-600 focus:outline-none appearance-none cursor-pointer hover:bg-gray-50 rounded-full transition-colors border border-gray-200"
                            >
                                <option value="newest">Newest</option>
                                <option value="strongest">Strongest Results</option>
                                <option value="role">By Role</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center mt-3 px-2">
                        <p className="text-xs text-gray-500 font-medium">{filteredStories.length} accomplishments found</p>
                        {lastInsertedVerb && (
                            <p className="text-xs text-gray-500">Last inserted action verb: <span className="font-semibold text-[#4F46E5]">{lastInsertedVerb}</span></p>
                        )}
                    </div>
                </div>

                {/* Main Content Area (Cards & Side Panels) */}
                <div className="flex gap-6 relative">
                    {/* Story Cards List */}
                    <div className="flex-1 space-y-6 max-w-full min-w-0">
                        {filteredStories.map(story => (
                            <div key={story.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                                {/* Card Header */}
                                <div className="flex items-start justify-between mb-4 pb-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-lg font-bold text-gray-900 truncate">{story.title || story.role_company}</h3>
                                            {/* Dynamic Status Pill */}
                                            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase flex-shrink-0 ${story.status === 'draft' ? 'bg-[#FEF3C7] text-[#D97706]' :
                                                    story.status === 'ready' ? 'bg-[#F3E8FF] text-[#7E22CE]' :
                                                        story.status === 'polished' ? 'bg-[#D1FAE5] text-[#059669]' :
                                                            'bg-gray-100 text-gray-600'
                                                }`}>
                                                {story.status || 'draft'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1.5 ml-4 flex-shrink-0">
                                        <button onClick={() => setLinkingStoryId(linkingStoryId === story.id ? null : (story.id || null))} className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"><Link2 className="w-4 h-4" /></button>
                                        <button onClick={() => handleEdit(story)} className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-[#4F46E5] hover:bg-[#EEF2FF] transition-colors"><Pencil className="w-4 h-4" /></button>
                                        <button onClick={() => story.id && handleDelete(story.id, story.is_bank_item)} className="p-1.5 rounded-full border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 mb-5 text-sm text-gray-500">
                                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {story.role_company || 'N/A'}</span>
                                    <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {story.year || 'N/A'}</span>
                                    {story.will_do_again && <span className="flex items-center gap-1 text-[#D97706]"><Star className="w-4 h-4 fill-current" /> Promoted</span>}
                                </div>

                                {/* Link to Role Dropdown */}
                                {linkingStoryId === story.id && workExperiences.length > 0 && (
                                    <div className="mb-5 p-3 bg-[#EEF2FF] rounded-xl border border-[#C7D2FE]">
                                        <p className="text-xs font-semibold text-[#4F46E5] mb-2 uppercase tracking-wide">Link to a role:</p>
                                        <div className="space-y-1">
                                            {workExperiences.map(we => (
                                                <button
                                                    key={we.id}
                                                    onClick={() => story.id && handleLinkToRole(story.id, we.id)}
                                                    className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-[#E0E7FF] text-gray-700 transition-colors flex items-center gap-2"
                                                >
                                                    <Briefcase className="w-3.5 h-3.5" />{we.job_title} at {we.company_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Split C-A-R Cards Layout */}
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full items-stretch">
                                    {/* Challenge Block */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col min-h-[160px]">
                                        <div className="flex items-center gap-2 mb-3 text-gray-400 font-semibold tracking-wider text-[11px] uppercase">
                                            <span className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 text-gray-600 text-xs">C</span>
                                            Challenge
                                        </div>
                                        <p className="text-sm text-gray-700 leading-relaxed overflow-y-auto">{story.problem_challenge || <span className="text-gray-300 italic">No challenge defined...</span>}</p>
                                    </div>

                                    {/* Action Block */}
                                    <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col min-h-[160px]">
                                        <div className="flex items-center gap-2 mb-3 text-gray-400 font-semibold tracking-wider text-[11px] uppercase">
                                            <span className="w-5 h-5 flex items-center justify-center rounded bg-gray-100 text-gray-600 text-xs">A</span>
                                            Action
                                        </div>
                                        {story.actions && story.actions.filter(a => a).length > 0 ? (
                                            <ul className="text-sm text-gray-700 leading-relaxed space-y-1.5 list-disc pl-4 overflow-y-auto">
                                                {story.actions.filter(a => a).map((action, i) => <li key={i}>{action}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="text-sm text-gray-300 italic">No actions defined...</p>
                                        )}
                                    </div>

                                    {/* Result Block (High Contrast) */}
                                    <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-4 flex flex-col min-h-[160px]">
                                        <div className="flex items-center gap-2 mb-3 text-[#4F46E5] font-semibold tracking-wider text-[11px] uppercase">
                                            <span className="w-5 h-5 flex items-center justify-center rounded bg-[#E0E7FF] text-[#4F46E5] text-xs">R</span>
                                            Result
                                        </div>
                                        <p className="text-sm text-[#4F46E5] font-medium leading-relaxed overflow-y-auto">{story.result || <span className="text-[#A5B4FC] italic font-normal">No result defined...</span>}</p>
                                    </div>
                                </div>

                                {/* Tags at bottom */}
                                {((story.competencies?.length || 0) > 0 || (story.skills_tags?.length || 0) > 0) && (
                                    <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-50">
                                        {(story.competencies || []).map(c => (
                                            <span key={c} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1"><Tag className="w-3 h-3" /> {c}</span>
                                        ))}
                                        {(story.skills_tags || []).map((s, i) => (
                                            <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-medium flex items-center gap-1"><CheckSquare className="w-3 h-3" /> {s}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {filteredStories.length === 0 && (
                            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Accomplishments Found</h3>
                                <p className="text-gray-500 max-w-sm mx-auto">Adjust your filters or create a new CAR story to build your accomplishment bank.</p>
                            </div>
                        )}
                    </div>

                    {/* Sliding Side Panels (Right Column) */}
                    {activePanel && (
                        <div className="w-[340px] xl:w-[380px] flex-shrink-0 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-4 h-[calc(100vh-2rem)] flex flex-col animate-in slide-in-from-right duration-300 z-10">
                            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10 sticky top-0">
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    {activePanel === 'verbs' ? <><Sparkles className="w-4 h-4 text-[#4F46E5]" /> Action Verbs</> :
                                        activePanel === 'examples' ? <><BookOpen className="w-4 h-4 text-[#4F46E5]" /> Verified Examples</> :
                                            <><Wand2 className="w-4 h-4 text-[#4F46E5]" /> AI Grouping</>}
                                </h3>
                                <button onClick={() => setActivePanel(null)} className="text-gray-400 hover:text-gray-700">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
                                {activePanel === 'verbs' && (
                                    <div className="space-y-6">
                                        <p className="text-sm text-gray-600">Click a verb to quickly copy it to your clipboard.</p>
                                        {Object.entries(ACTION_VERBS).map(([category, verbs]) => (
                                            <div key={category}>
                                                <h4 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">{category}</h4>
                                                <div className="flex flex-wrap gap-2">
                                                    {verbs.map(verb => (
                                                        <button
                                                            key={verb}
                                                            onClick={() => copyToClipboard(verb, verb)}
                                                            className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:border-[#4F46E5] hover:text-[#4F46E5] transition-colors shadow-sm"
                                                        >
                                                            {verb}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activePanel === 'examples' && (
                                    <div className="space-y-4">
                                        <p className="text-sm text-gray-600 mb-4">Strong examples formatted correctly with quantified metrics.</p>
                                        {EXAMPLES.map((ex, i) => (
                                            <div key={i} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                                                <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-[10px] uppercase tracking-wider font-bold rounded mb-2">{ex.role}</span>
                                                <p className="text-sm text-gray-700 leading-relaxed pr-6">{ex.text}</p>
                                                <button
                                                    onClick={() => copyToClipboard(ex.text)}
                                                    className="absolute top-4 right-4 text-gray-400 hover:text-[#4F46E5] opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {activePanel === 'ai' && (
                                    <div>
                                        {isGrouping ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                                <Wand2 className="w-8 h-8 text-[#4F46E5] animate-pulse mb-4" />
                                                <h4 className="font-semibold text-gray-900 mb-1">Analyzing Patterns</h4>
                                                <p className="text-sm text-gray-500 leading-relaxed max-w-[200px] mx-auto">AI is reading your accomplishments to find strategic clusters...</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-5">
                                                <p className="text-sm text-gray-600 border-b border-gray-200 pb-4">The AI identified these common themes across your accomplishments:</p>
                                                {aiGroups.map((group, i) => (
                                                    <div key={i} className="bg-white p-4 rounded-xl border border-[#C7D2FE] shadow-sm">
                                                        <h4 className="font-bold text-[#4F46E5] mb-4 text-sm">{group.theme}</h4>
                                                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Linked Stories</p>
                                                        <ul className="space-y-2">
                                                            {group.storyIds.map(id => {
                                                                const s = stories.find(x => x.id === id)
                                                                return s ? <li key={id} className="text-sm text-gray-700 truncate flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>{s.title || s.role_company}</li> : null
                                                            })}
                                                        </ul>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Modal Redesign */}
            {showForm && (
                <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[100] flex justify-center p-4 overflow-y-auto">
                    <div className="bg-gray-50 rounded-2xl shadow-2xl w-full max-w-4xl my-8 flex flex-col h-fit">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-white border-b border-gray-200 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-[#4F46E5]">
                                    <Trophy className="w-5 h-5" />
                                </div>
                                {editingStory ? 'Edit Story Card' : 'New Story Card'}
                            </h2>
                            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors"><X className="w-6 h-6" /></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 gap-6 grid grid-cols-1 lg:grid-cols-3">
                            <div className="lg:col-span-2 space-y-6">
                                {/* 1. Basic Info */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-5">
                                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3 mb-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 text-xs font-bold text-gray-600">1</span>
                                        <h3 className="font-semibold text-gray-900">Basic Info</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-5">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Story Title</label>
                                            <input
                                                value={form.title || ''}
                                                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-shadow"
                                                placeholder="e.g., Global Supply Chain Transformation"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Role & Company <span className="text-red-500">*</span></label>
                                            <input
                                                value={form.role_company || ''}
                                                onChange={e => setForm(prev => ({ ...prev, role_company: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-shadow"
                                                placeholder="e.g., VP Operations at Acme Corp"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Year</label>
                                            <input
                                                value={form.year || ''}
                                                onChange={e => setForm(prev => ({ ...prev, year: e.target.value }))}
                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none transition-shadow"
                                                placeholder="2023"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* 2. CAR Builder */}
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-2">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 text-xs font-bold text-gray-600">2</span>
                                            <h3 className="font-semibold text-gray-900">CAR Builder</h3>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setActivePanel('verbs')} className="text-xs font-semibold text-[#4F46E5] flex items-center gap-1 hover:bg-[#EEF2FF] px-2.5 py-1.5 rounded-lg transition-colors"><Sparkles className="w-3.5 h-3.5" /> Action Verbs</button>
                                            <button onClick={() => setActivePanel('examples')} className="text-xs font-semibold text-[#4F46E5] flex items-center gap-1 hover:bg-[#EEF2FF] px-2.5 py-1.5 rounded-lg transition-colors"><BookOpen className="w-3.5 h-3.5" /> Examples</button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                                            <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">C</span> Challenge <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={form.problem_challenge || ''}
                                            onChange={e => setForm(prev => ({ ...prev, problem_challenge: e.target.value }))}
                                            rows={2}
                                            className="w-full p-3.5 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none resize-none text-sm transition-colors"
                                            placeholder="What specific problem or situation did you face?"
                                        />
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-3">
                                            <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-600">A</span> Actions
                                        </label>
                                        <div className="space-y-3">
                                            {(form.actions || []).map((action, idx) => (
                                                <input
                                                    key={idx}
                                                    value={action}
                                                    onChange={e => updateAction(idx, e.target.value)}
                                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none text-sm transition-colors"
                                                    placeholder={`Action ${idx + 1}...`}
                                                />
                                            ))}
                                            <button onClick={addAction} className="text-sm font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1.5 px-2">
                                                <Plus className="w-4 h-4" /> Add action
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="flex items-center gap-2 text-sm font-semibold text-[#4F46E5] mb-3">
                                            <span className="w-6 h-6 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-xs">R</span> Result (Measured) <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={form.result || ''}
                                            onChange={e => setForm(prev => ({ ...prev, result: e.target.value }))}
                                            rows={2}
                                            className="w-full p-3.5 rounded-xl border border-[#C7D2FE] bg-[#EEF2FF] text-gray-900 focus:bg-white focus:ring-2 focus:ring-[#4F46E5] focus:border-transparent outline-none resize-none text-sm transition-colors"
                                            placeholder="What was the quantifiable outcome? (e.g. Increased revenue by 20%)"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* 3. Classification (Sidebar) */}
                            <div className="space-y-6">
                                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                                    <div className="flex items-center gap-2 border-b border-gray-100 pb-3 mb-2">
                                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-gray-100 text-xs font-bold text-gray-600">3</span>
                                        <h3 className="font-semibold text-gray-900">Classification</h3>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Status</label>
                                        <div className="grid grid-cols-1 gap-2">
                                            {['draft', 'ready', 'polished'].map(s => (
                                                <button
                                                    key={s}
                                                    onClick={() => setForm(prev => ({ ...prev, status: s as any }))}
                                                    className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wide uppercase border text-center transition-all ${form.status === s ? 'bg-[#4F46E5] text-white border-[#4F46E5] shadow-md shadow-indigo-500/20' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}
                                                >
                                                    {s}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Highlight</label>
                                        <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${form.will_do_again ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#D97706] shadow-sm' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                            <input
                                                type="checkbox"
                                                checked={form.will_do_again || false}
                                                onChange={e => setForm(prev => ({ ...prev, will_do_again: e.target.checked }))}
                                                className="hidden"
                                            />
                                            <Star className={`w-5 h-5 ${form.will_do_again ? 'fill-current' : ''}`} />
                                            <span className="text-sm font-semibold">I would do this again</span>
                                        </label>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Competencies</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {COMPETENCIES.map(c => (
                                                <button
                                                    key={c}
                                                    onClick={() => toggleCompetency(c)}
                                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold tracking-wide uppercase transition-all ${(form.competencies || []).includes(c)
                                                        ? 'bg-gray-900 text-white shadow-md'
                                                        : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:border-gray-300'
                                                        }`}
                                                >
                                                    {c}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-3">Skills Tags</label>
                                        <div className="flex flex-wrap gap-2 mb-3">
                                            {(form.skills_tags || []).map((tag, idx) => (
                                                <span key={idx} className="px-2.5 py-1.5 bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm">
                                                    {tag}
                                                    <button onClick={() => removeSkillTag(idx)} className="hover:bg-[#E0E7FF] rounded-full p-0.5"><X className="w-3 h-3 hover:text-red-500" /></button>
                                                </span>
                                            ))}
                                        </div>
                                        <div className="flex gap-2">
                                            <input
                                                value={skillInput}
                                                onChange={e => setSkillInput(e.target.value)}
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkillTag())}
                                                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 text-sm focus:ring-2 focus:ring-[#4F46E5] outline-none transition-shadow"
                                                placeholder="Add tag..."
                                            />
                                            <button onClick={addSkillTag} className="px-3 py-2 bg-gray-900 rounded-lg text-sm text-white font-semibold hover:bg-gray-800 transition-colors shadow-md">Add</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sticky Footer */}
                        <div className="px-6 py-4 bg-white border-t border-gray-200 rounded-b-2xl flex justify-between items-center sticky bottom-0 z-10">
                            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors">Cancel</button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-8 py-3 bg-[#4F46E5] text-white font-bold rounded-xl hover:bg-[#4338CA] transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                            >
                                {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : editingStory ? 'Update Story' : 'Save Story'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
