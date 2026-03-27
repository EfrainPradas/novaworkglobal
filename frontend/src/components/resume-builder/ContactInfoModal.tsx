import React, { useState, useEffect } from 'react'
import { X, User, Phone, MapPin, Globe, Linkedin, ExternalLink, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { UserContactProfile } from '../../types/resume'
import { COUNTRIES, US_STATES } from '../../constants/locations'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface ContactInfoModalProps {
    userId: string
    userEmail?: string
    onComplete: () => void
}

export default function ContactInfoModal({ userId, userEmail, onComplete }: ContactInfoModalProps) {
    const [form, setForm] = useState<Partial<UserContactProfile>>({
        first_name: '',
        middle_name: '',
        last_name: '',
        phone: '',
        email: userEmail || '',
        address_line1: '',
        address_line2: '',
        country: '',
        state: '',
        city: '',
        postal_code: '',
        linkedin_url: '',
        portfolio_url: ''
    })
    const [errors, setErrors] = useState<Record<string, string>>({})
    const [saving, setSaving] = useState(false)
    const [loading, setLoading] = useState(true)
    const [saveError, setSaveError] = useState<string | null>(null)

    useEffect(() => {
        loadExisting()
    }, [])

    const loadExisting = async () => {
        try {
            const { data, error } = await supabase
                .from('user_contact_profile')
                .select('*')
                .eq('user_id', userId)
                .single()

            // If table doesn't exist, we still show the form — save will go through the API
            if (error && (error.message?.includes('does not exist') || error.code === '42P01')) {
                console.warn('user_contact_profile table not found — migration needed')
            } else if (data) {
                setForm(data)
            }
        } catch (e) {
            // No existing profile — that's fine
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
                throw new Error(body?.error || 'Failed to save contact profile. The database migration may not have been run yet.')
            }
            onComplete()
        } catch (err: any) {
            console.error('Error saving contact profile:', err)
            setSaveError(err.message || 'Failed to save. Please try again or skip for now.')
        }
        setSaving(false)
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
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
                </div>
            </div>
        )
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl my-8">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-t-2xl">
                    <div className="flex items-center gap-3 text-white">
                        <div className="p-2 bg-white/20 rounded-xl">
                            <User className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Personal Details</h2>
                            <p className="text-blue-100 text-sm">Complete your contact information to get started</p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Alert */}
                    <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-amber-800 dark:text-amber-200">
                            Fields marked with <span className="text-red-500 font-bold">*</span> are required before you can proceed.
                        </p>
                    </div>

                    {/* Name Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.first_name || ''}
                                onChange={e => updateField('first_name', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.first_name ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
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
                                value={form.middle_name || ''}
                                onChange={e => updateField('middle_name', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="M."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={form.last_name || ''}
                                onChange={e => updateField('last_name', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.last_name ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
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
                                value={form.phone || ''}
                                onChange={e => updateField('phone', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                                placeholder="+1 (555) 123-4567"
                            />
                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <input
                                type="email"
                                value={form.email || ''}
                                onChange={e => updateField('email', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="john@example.com"
                                readOnly={!!userEmail}
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
                                value={form.country || ''}
                                onChange={e => updateField('country', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.country ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
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
                                    value={form.state || ''}
                                    onChange={e => updateField('state', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.state ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                                >
                                    {US_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={form.state || ''}
                                    onChange={e => updateField('state', e.target.value)}
                                    className={`w-full px-4 py-2.5 rounded-xl border ${errors.state ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
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
                                value={form.city || ''}
                                onChange={e => updateField('city', e.target.value)}
                                className={`w-full px-4 py-2.5 rounded-xl border ${errors.city ? 'border-red-400 bg-red-50' : 'border-gray-300 dark:border-gray-600'} bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all`}
                                placeholder="San Francisco"
                            />
                            {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>
                    </div>

                    {/* Address */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Address Line 1
                            </label>
                            <input
                                type="text"
                                value={form.address_line1 || ''}
                                onChange={e => updateField('address_line1', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="123 Main St"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                ZIP / Postal Code
                            </label>
                            <input
                                type="text"
                                value={form.postal_code || ''}
                                onChange={e => updateField('postal_code', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="94105"
                            />
                        </div>
                    </div>

                    {/* Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <Linkedin className="w-4 h-4 inline mr-1" />
                                LinkedIn URL
                            </label>
                            <input
                                type="url"
                                value={form.linkedin_url || ''}
                                onChange={e => updateField('linkedin_url', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <ExternalLink className="w-4 h-4 inline mr-1" />
                                Portfolio URL
                            </label>
                            <input
                                type="url"
                                value={form.portfolio_url || ''}
                                onChange={e => updateField('portfolio_url', e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                placeholder="https://yourportfolio.com"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl space-y-3">
                    {saveError && (
                        <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl">
                            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm text-red-700 dark:text-red-300">{saveError}</p>
                                <button
                                    onClick={onComplete}
                                    className="text-xs text-red-600 dark:text-red-400 underline mt-1 hover:text-red-800"
                                >
                                    Skip for now →
                                </button>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 shadow-lg shadow-blue-500/25"
                    >
                        {saving ? 'Saving...' : 'Save & Continue'}
                    </button>
                    <button
                        onClick={onComplete}
                        className="w-full py-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors"
                    >
                        Skip for now →
                    </button>
                </div>
            </div>
        </div>
    )
}
