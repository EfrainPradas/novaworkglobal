import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Sparkles, Pencil, Check, X, RefreshCw, Loader2, Copy, CheckCircle2, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GeneratedProfessionalProfile } from '../../types/resume'
import { supabase } from '../../lib/supabase'
import { trackEvent } from '../../lib/analytics'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface Props {
    profile: GeneratedProfessionalProfile
    onBack: () => void
    onRegenerate: () => void
    generating: boolean
}

export default function GeneratedProfileView({ profile, onBack, onRegenerate, generating }: Props) {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const isStandalone = searchParams.get('mode') === 'standalone'
    const [editingField, setEditingField] = useState<string | null>(null)
    const [editValue, setEditValue] = useState('')
    const [localProfile, setLocalProfile] = useState(profile)
    const [saving, setSaving] = useState(false)
    const [copied, setCopied] = useState(false)

    const startEdit = (field: string, value: string) => {
        setEditingField(field)
        setEditValue(value || '')
    }

    const cancelEdit = () => {
        setEditingField(null)
        setEditValue('')
    }

    const saveEdit = async () => {
        if (!editingField || !localProfile.id) return
        setSaving(true)
        try {
            const token = (await supabase.auth.getSession()).data.session?.access_token
            const updateData = { [editingField]: editValue, edited_by_user: true }

            await fetch(`${API_BASE_URL}/api/positioning-questionnaire/generated-profile/${localProfile.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updateData)
            })

            setLocalProfile(prev => ({ ...prev, [editingField]: editValue, edited_by_user: true }))
            setEditingField(null)
        } catch (e) {
            console.error('Error saving edit:', e)
        }
        setSaving(false)
    }

    const copyFullProfile = () => {
        const text = [
            localProfile.output_identity_sentence,
            localProfile.output_blended_value_sentence,
            localProfile.output_competency_paragraph,
            '',
            'Areas of Excellence:',
            localProfile.output_areas_of_excellence
        ].join('\n\n')

        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const renderField = (label: string, field: string, value: string | undefined, multiline: boolean = false) => {
        const isEditing = editingField === field

        return (
            <div className="group">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
                    {!isEditing && (
                        <button
                            onClick={() => startEdit(field, value || '')}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                        >
                            <Pencil className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="space-y-2">
                        {multiline ? (
                            <textarea
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                rows={4}
                                className="w-full px-4 py-3 rounded-xl border-2 border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                        ) : (
                            <input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border-2 border-blue-400 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                autoFocus
                            />
                        )}
                        <div className="flex justify-end gap-2">
                            <button onClick={cancelEdit} className="px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">
                                <X className="w-4 h-4 inline mr-1" /> Cancel
                            </button>
                            <button onClick={saveEdit} disabled={saving} className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                                {saving ? <Loader2 className="w-4 h-4 inline mr-1 animate-spin" /> : <Check className="w-4 h-4 inline mr-1" />}
                                Save
                            </button>
                        </div>
                    </div>
                ) : (
                    <p className="text-gray-900 dark:text-white leading-relaxed">{value || <span className="text-gray-400 italic">Not generated</span>}</p>
                )}
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">

                {/* Back */}
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Questionnaire
                </button>

                {/* Header */}
                <div className="flex items-start justify-between mb-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium mb-3">
                            <Sparkles className="w-4 h-4" /> AI Generated — Version {localProfile.version}
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Your Professional Profile</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">Review and edit each section. Hover to edit.</p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={copyFullProfile}
                            className="px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                            {copied ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Copied!' : 'Copy All'}
                        </button>
                        <button
                            onClick={onRegenerate}
                            disabled={generating}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-purple-500/25"
                        >
                            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Regenerate
                        </button>
                    </div>
                </div>

                {localProfile.edited_by_user && (
                    <div className="mb-4 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Pencil className="w-4 h-4" /> This profile has been manually edited.
                    </div>
                )}

                {/* Profile Sections */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
                    <div className="p-6 md:p-8">
                        {renderField('Identity Sentence', 'output_identity_sentence', localProfile.output_identity_sentence)}
                    </div>
                    <div className="p-6 md:p-8">
                        {renderField('Blended Value Sentence', 'output_blended_value_sentence', localProfile.output_blended_value_sentence)}
                    </div>
                    <div className="p-6 md:p-8">
                        {renderField('Competency Paragraph', 'output_competency_paragraph', localProfile.output_competency_paragraph, true)}
                    </div>
                    <div className="p-6 md:p-8">
                        {renderField('Areas of Excellence (ATS Keywords)', 'output_areas_of_excellence', localProfile.output_areas_of_excellence)}
                    </div>

                    {/* Skills Section */}
                    {localProfile.output_skills_section && (
                        <div className="p-6 md:p-8">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4 block">Skills Section</label>
                            <div className="space-y-4">
                                {localProfile.output_skills_section.tools_platforms && localProfile.output_skills_section.tools_platforms.length > 0 && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tools & Platforms</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {localProfile.output_skills_section.tools_platforms.map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {localProfile.output_skills_section.methodologies && localProfile.output_skills_section.methodologies.length > 0 && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Methodologies</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {localProfile.output_skills_section.methodologies.map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {localProfile.output_skills_section.languages && localProfile.output_skills_section.languages.length > 0 && (
                                    <div>
                                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Languages</span>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {localProfile.output_skills_section.languages.map((s, i) => (
                                                <span key={i} className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Next step navigation */}
                {!isStandalone && (
                    <div className="flex justify-center mt-12 mb-20 text-center">
                        <div className="space-y-4">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">{t('resumeBuilder.profile.readyToBuildResume', 'Ready to build your resume based on this strategy?')}</p>
                            <button
                                onClick={() => navigate('/dashboard/resume-builder')}
                                className="flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-2xl shadow-xl transition-all transform hover:scale-105 font-bold text-xl"
                            >
                                {t('resumeBuilder.navigation.continueToResumeBuilder', 'Continue to Resume Builder')}
                                <ArrowRight className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
