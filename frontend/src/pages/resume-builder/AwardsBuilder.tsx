import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { ArrowLeft, ArrowRight, Award, Plus, Pencil, Trash2, Loader2, X, CheckCircle2, ExternalLink } from 'lucide-react'

interface Certification {
    id?: string
    certification_name: string
    issuing_organization: string
    issue_date: string
    expiration_date: string
    credential_id: string
    credential_url: string
}

const emptyEntry: Certification = {
    certification_name: '',
    issuing_organization: '',
    issue_date: '',
    expiration_date: '',
    credential_id: '',
    credential_url: ''
}

export default function AwardsBuilder() {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [userId, setUserId] = useState<string | null>(null)
    const [entries, setEntries] = useState<Certification[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [form, setForm] = useState<Certification>({ ...emptyEntry })
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
                .from('certifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (!error && data) {
                setEntries(data.map(d => ({
                    id: d.id,
                    certification_name: d.certification_name || d.name || '',
                    issuing_organization: d.issuing_organization || '',
                    issue_date: d.issue_date || d.year || '',
                    expiration_date: d.expiration_date || '',
                    credential_id: d.credential_id || '',
                    credential_url: d.credential_url || ''
                })))
            }
        } catch (e) {
            console.error('Error loading certifications:', e)
        }
        setLoading(false)
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!form.certification_name?.trim()) newErrors.certification_name = 'Required'
        if (!form.issuing_organization?.trim()) newErrors.issuing_organization = 'Required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validate() || !userId) return
        setSaving(true)

        const payload = {
            user_id: userId,
            certification_name: form.certification_name.trim(),
            issuing_organization: form.issuing_organization.trim(),
            issue_date: form.issue_date || null,
            expiration_date: form.expiration_date || null,
            credential_id: form.credential_id.trim() || null,
            credential_url: form.credential_url.trim() || null
        }

        try {
            if (editingIndex !== null && entries[editingIndex]?.id) {
                await supabase.from('certifications').update(payload).eq('id', entries[editingIndex].id)
            } else {
                await supabase.from('certifications').insert(payload)
            }
            await loadData()
            resetForm()
        } catch (e) {
            console.error('Error saving certification:', e)
        }
        setSaving(false)
    }

    const handleDelete = async (index: number) => {
        const entry = entries[index]
        if (!entry?.id) return
        if (!confirm('Delete this certification?')) return

        await supabase.from('certifications').delete().eq('id', entry.id)
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
        await trackEvent('analytics', 'step_completed', { step_name: 'awards', next_step: 'pos-identity' })
        navigate('/resume/questionnaire')
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
                        onClick={() => navigate(isStandalone ? '/resume-builder' : '/resume/education')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> {isStandalone ? 'Back to Resume Builder' : 'Back to Education'}
                    </button>

                    {!isStandalone && (
                        <button
                            onClick={handleContinue}
                            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all font-bold text-sm"
                        >
                            Next: Positioning Questionnaire <ArrowRight className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {isStandalone && (
                    <div className="flex space-x-6 mb-8 border-b border-gray-200 dark:border-gray-700">
                        <button className="pb-3 border-b-2 border-blue-600 font-semibold text-blue-600 dark:text-blue-400">
                            Awards & Certifications
                        </button>
                        <button
                            onClick={() => navigate('/resume/story-cards?mode=standalone')}
                            className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 font-medium transition-colors"
                        >
                            CAR Stories
                        </button>
                    </div>
                )}

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
                        <Award className="w-6 h-6 text-amber-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Awards & Certifications
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        {entries.length > 0
                            ? 'Review your certifications imported from your resume. Edit or add more.'
                            : 'Add your professional certifications, licenses, and awards.'}
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
                                            <Award className="w-5 h-5 text-amber-500" />
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                                {entry.certification_name}
                                            </h3>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 ml-7">
                                            {entry.issuing_organization}
                                            {entry.issue_date ? ` • ${entry.issue_date}` : ''}
                                        </p>
                                        {entry.credential_url && (
                                            <a
                                                href={entry.credential_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-sm text-blue-600 hover:text-blue-800 ml-7 mt-1 inline-flex items-center gap-1"
                                            >
                                                <ExternalLink className="w-3 h-3" /> View Credential
                                            </a>
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
                        className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl text-gray-500 dark:text-gray-400 hover:border-amber-500 hover:text-amber-600 transition-all flex items-center justify-center gap-2 mb-8"
                    >
                        <Plus className="w-5 h-5" /> Add Award / Certification
                    </button>
                )}

                {/* Form */}
                {showForm && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 mb-8">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingIndex !== null ? 'Edit Certification' : 'Add Certification'}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name + Organization */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Certification / Award Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.certification_name}
                                        onChange={e => setForm(p => ({ ...p, certification_name: e.target.value }))}
                                        className={inputClass('certification_name')}
                                        placeholder="AWS Solutions Architect"
                                    />
                                    {errors.certification_name && <p className="text-red-500 text-xs mt-1">{errors.certification_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Issuing Organization <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={form.issuing_organization}
                                        onChange={e => setForm(p => ({ ...p, issuing_organization: e.target.value }))}
                                        className={inputClass('issuing_organization')}
                                        placeholder="Amazon Web Services"
                                    />
                                    {errors.issuing_organization && <p className="text-red-500 text-xs mt-1">{errors.issuing_organization}</p>}
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Issue Date (YYYY)
                                    </label>
                                    <select
                                        value={form.issue_date}
                                        onChange={e => setForm(p => ({ ...p, issue_date: e.target.value }))}
                                        className={inputClass('issue_date')}
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Expiration Date (YYYY)
                                    </label>
                                    <select
                                        value={form.expiration_date}
                                        onChange={e => setForm(p => ({ ...p, expiration_date: e.target.value }))}
                                        className={inputClass('expiration_date')}
                                    >
                                        <option value="">Select Year</option>
                                        {years.map(year => (
                                            <option key={year} value={year}>{year}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Credential */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Credential ID
                                    </label>
                                    <input
                                        type="text"
                                        value={form.credential_id}
                                        onChange={e => setForm(p => ({ ...p, credential_id: e.target.value }))}
                                        className={inputClass('credential_id')}
                                        placeholder="ABC-123-XYZ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Credential URL
                                    </label>
                                    <input
                                        type="url"
                                        value={form.credential_url}
                                        onChange={e => setForm(p => ({ ...p, credential_url: e.target.value }))}
                                        className={inputClass('credential_url')}
                                        placeholder="https://verify.example.com/..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Form Actions */}
                        <div className="flex items-center gap-3 mt-6">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 px-6 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
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
