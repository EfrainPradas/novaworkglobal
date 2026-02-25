import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { ArrowLeft, ArrowRight, GraduationCap, Plus, Pencil, Trash2, Loader2, X, CheckCircle2 } from 'lucide-react'

interface Education {
    id?: string
    institution_name: string
    degree_type: string
    field_of_study: string
    graduation_year: number | null
    gpa: string
    honors: string
}

const DEGREE_TYPES = ['Associate', 'Bachelor', 'Master', 'PhD', 'Certificate', 'Diploma', 'Other']

const emptyEntry: Education = {
    institution_name: '',
    degree_type: '',
    field_of_study: '',
    graduation_year: null,
    gpa: '',
    honors: ''
}

export default function EducationBuilder() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [userId, setUserId] = useState<string | null>(null)
    const [entries, setEntries] = useState<Education[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [form, setForm] = useState<Education>({ ...emptyEntry })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const currentYear = new Date().getFullYear()
    const years = Array.from({ length: currentYear - 1959 }, (_, i) => (currentYear - i).toString())

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { navigate('/signin'); return }
            setUserId(user.id)

            const { data, error } = await supabase
                .from('education')
                .select('*')
                .eq('user_id', user.id)
                .order('graduation_year', { ascending: false })

            if (!error && data) {
                setEntries(data.map(d => ({
                    id: d.id,
                    institution_name: d.institution_name || '',
                    degree_type: d.degree_type || d.degree || '',
                    field_of_study: d.field_of_study || '',
                    graduation_year: d.graduation_year || null,
                    gpa: d.gpa?.toString() || '',
                    honors: d.honors || ''
                })))
            }
        } catch (e) {
            console.error('Error loading education:', e)
        }
        setLoading(false)
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!form.institution_name?.trim()) newErrors.institution_name = 'Required'
        if (!form.degree_type?.trim()) newErrors.degree_type = 'Required'
        if (!form.field_of_study?.trim()) newErrors.field_of_study = 'Required'
        if (!form.graduation_year) newErrors.graduation_year = 'Required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validate() || !userId) return
        setSaving(true)

        const payload = {
            user_id: userId,
            institution_name: form.institution_name.trim(),
            degree_type: form.degree_type,
            field_of_study: form.field_of_study.trim(),
            graduation_year: form.graduation_year,
            gpa: form.gpa ? parseFloat(form.gpa) : null,
            honors: form.honors.trim() || null
        }

        try {
            if (editingIndex !== null && entries[editingIndex]?.id) {
                // Update existing
                await supabase.from('education').update(payload).eq('id', entries[editingIndex].id)
            } else {
                // Insert new
                await supabase.from('education').insert(payload)
            }
            await loadData()
            resetForm()
        } catch (e) {
            console.error('Error saving education:', e)
        }
        setSaving(false)
    }

    const handleDelete = async (index: number) => {
        const entry = entries[index]
        if (!entry?.id) return
        if (!confirm('Delete this education entry?')) return

        await supabase.from('education').delete().eq('id', entry.id)
        await loadData()
    }

    const handleEdit = (index: number) => {
        setForm({ ...entries[index] })
        setEditingIndex(index)
        setShowForm(true)
        setErrors({})
    }

    const resetForm = () => {
        setForm({ ...emptyEntry })
        setEditingIndex(null)
        setShowForm(false)
        setErrors({})
    }

    const handleContinue = async () => {
        await trackEvent('analytics', 'step_completed', { step_name: 'education', next_step: 'awards' })
        navigate('/resume/awards')
    }

    const inputClass = (field: string) =>
        `w-full px-4 py-2.5 rounded-xl border ${errors[field] ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Navigation Header */}
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={() => navigate(isStandalone ? '/resume-builder' : '/resume/work-experience')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {isStandalone ? 'Back to Resume Builder' : 'Back to Work Experience'}
                    </button>

                    {!isStandalone && (
                        <button
                            onClick={handleContinue}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all font-bold text-sm"
                        >
                            Next: Awards & Certifications <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isStandalone && (
                    <div className="flex space-x-6 mb-8 border-b border-gray-200 dark:border-gray-700">
                        <button
                            onClick={() => navigate('/resume/work-experience?mode=standalone')}
                            className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                        >
                            Work Experience
                        </button>
                        <button className="pb-3 border-b-2 border-blue-600 font-semibold text-blue-600 dark:text-blue-400">
                            Education
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
                        <GraduationCap className="w-6 h-6 text-indigo-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Education
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {entries.length > 0
                            ? 'Review your education history imported from your resume. Edit or add more entries.'
                            : 'Add your academic degrees, diplomas, and certificates.'}
                    </p>
                </div>

                {/* Existing Entries */}
                {entries.length > 0 && (
                    <div className="space-y-4 mb-6">
                        {entries.map((entry, i) => (
                            <div key={entry.id || i} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {entry.degree_type} {entry.field_of_study ? `in ${entry.field_of_study}` : ''}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 ml-7">
                                            {entry.institution_name}
                                            {entry.graduation_year ? ` • ${entry.graduation_year}` : ''}
                                        </p>
                                        {(entry.gpa || entry.honors) && (
                                            <p className="text-sm text-gray-500 dark:text-gray-500 ml-7 mt-1">
                                                {entry.gpa ? `GPA: ${entry.gpa}` : ''}
                                                {entry.gpa && entry.honors ? ' • ' : ''}
                                                {entry.honors || ''}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        <button onClick={() => handleEdit(i)} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(i)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Add Button */}
                {!showForm && (
                    <button
                        onClick={() => { resetForm(); setShowForm(true) }}
                        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 dark:text-gray-400 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2 mb-8"
                    >
                        <Plus className="w-5 h-5" /> Add Education
                    </button>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingIndex !== null ? 'Edit Education' : 'Add Education'}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Institution */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Institution Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.institution_name}
                                    onChange={e => setForm(p => ({ ...p, institution_name: e.target.value }))}
                                    className={inputClass('institution_name')}
                                    placeholder="Harvard University"
                                />
                                {errors.institution_name && <p className="text-red-500 text-xs mt-1">{errors.institution_name}</p>}
                            </div>

                            {/* Degree Type + Field of Study */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Degree Type <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.degree_type}
                                        onChange={e => setForm(p => ({ ...p, degree_type: e.target.value }))}
                                        className={inputClass('degree_type')}
                                    >
                                        <option value="">Select Degree</option>
                                        {DEGREE_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                    {errors.degree_type && <p className="text-red-500 text-xs mt-1">{errors.degree_type}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Field of Study <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.field_of_study}
                                        onChange={e => setForm(p => ({ ...p, field_of_study: e.target.value }))}
                                        className={inputClass('field_of_study')}
                                        placeholder="Computer Science"
                                    />
                                    {errors.field_of_study && <p className="text-red-500 text-xs mt-1">{errors.field_of_study}</p>}
                                </div>
                            </div>

                            {/* Year + GPA + Honors */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Graduation Year (YYYY) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.graduation_year || ''}
                                        onChange={e => setForm(p => ({ ...p, graduation_year: e.target.value ? parseInt(e.target.value) : null }))}
                                        className={inputClass('graduation_year')}
                                    >
                                        <option value="" disabled>Select Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                    {errors.graduation_year && <p className="text-red-500 text-xs mt-1">{errors.graduation_year}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        GPA
                                    </label>
                                    <input
                                        type="text"
                                        value={form.gpa}
                                        onChange={e => setForm(p => ({ ...p, gpa: e.target.value }))}
                                        className={inputClass('gpa')}
                                        placeholder="3.85"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Honors
                                    </label>
                                    <input
                                        type="text"
                                        value={form.honors}
                                        onChange={e => setForm(p => ({ ...p, honors: e.target.value }))}
                                        className={inputClass('honors')}
                                        placeholder="Magna Cum Laude"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                {editingIndex !== null ? 'Update' : 'Save'}
                            </button>
                            <button
                                onClick={resetForm}
                                className="py-3 px-6 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}


            </div>
        </div>
    )
}
