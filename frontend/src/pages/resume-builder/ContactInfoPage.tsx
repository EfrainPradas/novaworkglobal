import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, User, Phone, MapPin, Globe, Linkedin, ExternalLink, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'
import { COUNTRIES, US_STATES } from '../../constants/locations'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

export default function ContactInfoPage() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saveError, setSaveError] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const [form, setForm] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        phone: '',
        email: '',
        address_line1: '',
        address_line2: '',
        country: '',
        state: '',
        city: '',
        postal_code: '',
        linkedin_url: '',
        portfolio_url: ''
    })

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { navigate('/signin'); return }

            setUserId(user.id)
            setForm(prev => ({ ...prev, email: user.email || '' }))

            // Try to load existing contact profile
            const { data, error } = await supabase
                .from('user_contact_profile')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle()

            if (!error && data) {
                setForm({
                    first_name: data.first_name || '',
                    middle_name: data.middle_name || '',
                    last_name: data.last_name || '',
                    phone: data.phone || '',
                    email: data.email || user.email || '',
                    address_line1: data.address_line1 || '',
                    address_line2: data.address_line2 || '',
                    country: data.country || '',
                    state: data.state || '',
                    city: data.city || '',
                    postal_code: data.postal_code || '',
                    linkedin_url: data.linkedin_url || '',
                    portfolio_url: data.portfolio_url || ''
                })
            } else {
                // Fallback: try to pre-fill from user_profiles
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .maybeSingle()

                if (profile?.full_name) {
                    const parts = profile.full_name.trim().split(/\s+/)
                    setForm(prev => ({
                        ...prev,
                        first_name: parts[0] || '',
                        last_name: parts.length > 1 ? parts[parts.length - 1] : ''
                    }))
                }
            }
        } catch (e) {
            console.error('Error loading contact data:', e)
        }
        setLoading(false)
    }

    const validate = () => {
        const newErrors: Record<string, string> = {}
        if (!form.first_name?.trim()) newErrors.first_name = 'Required'
        if (!form.last_name?.trim()) newErrors.last_name = 'Required'
        if (!form.phone?.trim()) newErrors.phone = 'Required'
        if (!form.country?.trim()) newErrors.country = 'Required'
        if (!form.state?.trim()) newErrors.state = 'Required'
        if (!form.city?.trim()) newErrors.city = 'Required'
        if (!form.linkedin_url?.trim()) newErrors.linkedin_url = 'Required'
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async () => {
        if (!validate()) return
        setSaving(true)
        setSaveError(null)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            const resp = await fetch(`${API_BASE_URL}/api/contact-profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(form)
            })
            if (!resp.ok) {
                const body = await resp.json().catch(() => ({}))
                throw new Error(body?.error || 'Failed to save. The database migration may not have been run yet.')
            }
            // Success — move to next step
            await trackEvent('analytics', 'step_completed', { step_name: 'contact-details', next_step: 'work-history-intake' })
            navigate('/dashboard/resume/work-history')
        } catch (err: any) {
            console.error('Error saving contact profile:', err)
            setSaveError(err.message || 'Failed to save. Please try again.')
        }
        setSaving(false)
    }

    const handleSkipToNext = async () => {
        await trackEvent('analytics', 'step_completed', { step_name: 'contact-details', next_step: 'work-history-intake', skipped: true })
        navigate('/dashboard/resume/work-history')
    }

    const updateField = (field: string, value: string) => {
        setForm(prev => ({ ...prev, [field]: value }))
        if (errors[field]) {
            setErrors(prev => {
                const next = { ...prev }
                delete next[field]
                return next
            })
        }
    }

    const showUSStates = form.country === 'USA'

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    const inputClass = (field: string) =>
        `w-full px-4 py-2.5 rounded-xl border ${errors[field] ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Back nav */}
                <button
                    onClick={() => navigate('/dashboard/resume-builder')}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Resume Builder
                </button>

                {/* Step indicator */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                        <span className="text-sm font-semibold text-blue-600">Personal Details</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2 opacity-40">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                        <span className="text-sm text-gray-500">Work History</span>
                    </div>
                    <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700" />
                    <div className="flex items-center gap-2 opacity-40">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 text-gray-500 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                        <span className="text-sm text-gray-500">Story Cards</span>
                    </div>
                </div>

                {/* Title */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                        Personal Details
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        This information will appear at the top of your resume
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                    <div className="p-6 md:p-8 space-y-5">

                        {/* Name Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    First Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.first_name}
                                    onChange={e => updateField('first_name', e.target.value)}
                                    className={inputClass('first_name')}
                                    placeholder="John"
                                />
                                {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Middle Name
                                </label>
                                <input
                                    type="text"
                                    value={form.middle_name}
                                    onChange={e => updateField('middle_name', e.target.value)}
                                    className={inputClass('middle_name')}
                                    placeholder="M."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Last Name <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.last_name}
                                    onChange={e => updateField('last_name', e.target.value)}
                                    className={inputClass('last_name')}
                                    placeholder="Doe"
                                />
                                {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
                            </div>
                        </div>

                        {/* Phone & Email */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Phone <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => updateField('phone', e.target.value)}
                                    className={inputClass('phone')}
                                    placeholder="+1 (555) 123-4567"
                                />
                                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => updateField('email', e.target.value)}
                                    className={inputClass('email')}
                                    placeholder="john@example.com"
                                    readOnly
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Globe className="w-4 h-4 inline mr-1" />
                                    Country <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.country}
                                    onChange={e => updateField('country', e.target.value)}
                                    className={inputClass('country')}
                                >
                                    {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                </select>
                                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <MapPin className="w-4 h-4 inline mr-1" />
                                    State / Province <span className="text-red-500">*</span>
                                </label>
                                {showUSStates ? (
                                    <select
                                        value={form.state}
                                        onChange={e => updateField('state', e.target.value)}
                                        className={inputClass('state')}
                                    >
                                        {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={form.state}
                                        onChange={e => updateField('state', e.target.value)}
                                        className={inputClass('state')}
                                        placeholder="State or Province"
                                    />
                                )}
                                {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={form.city}
                                    onChange={e => updateField('city', e.target.value)}
                                    className={inputClass('city')}
                                    placeholder="San Francisco"
                                />
                                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                            </div>
                        </div>

                        {/* Address fields intentionally hidden per UX audit to reduce friction */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Linkedin className="w-4 h-4 inline mr-1" />
                                    LinkedIn URL <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="url"
                                    value={form.linkedin_url}
                                    onChange={e => updateField('linkedin_url', e.target.value)}
                                    className={inputClass('linkedin_url')}
                                    placeholder="https://linkedin.com/in/..."
                                />
                                {errors.linkedin_url && <p className="text-red-500 text-xs mt-1">{errors.linkedin_url}</p>}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <ExternalLink className="w-4 h-4 inline mr-1" />
                                    Portfolio URL
                                </label>
                                <input
                                    type="url"
                                    value={form.portfolio_url}
                                    onChange={e => updateField('portfolio_url', e.target.value)}
                                    className={inputClass('portfolio_url')}
                                    placeholder="https://yourportfolio.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 md:p-8 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl space-y-3">
                        {saveError && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
                            </div>
                        )}
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                        >
                            {saving ? 'Saving...' : (
                                <>Next: Review Work History <ArrowRight className="w-5 h-5" /></>
                            )}
                        </button>
                        <button
                            onClick={handleSkipToNext}
                            className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
                        >
                            Skip for now →
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
