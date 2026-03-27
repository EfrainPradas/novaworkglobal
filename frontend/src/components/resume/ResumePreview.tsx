
import React, { useState, useEffect } from 'react'
import { Eye, X, Download, Printer } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'

interface ResumePreviewProps {
    userId: string | null
}

export default function ResumePreview({ userId }: ResumePreviewProps) {
    const { t } = useTranslation()
    const [isOpen, setIsOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [resumeData, setResumeData] = useState<any>(null)

    // Fetch data when modal opens
    useEffect(() => {
        if (isOpen && userId) {
            loadResumeData()
        }
    }, [isOpen, userId])

    const loadResumeData = async () => {
        setLoading(true)
        try {
            // 1. Get User Profile (Contact Info)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            const { data: user } = await supabase
                .from('users')
                .select('full_name, email, phone, linkedin_url')
                .eq('id', userId)
                .single()

            // 2. Get Work Experience and Master Resume Details
            // 2. Get Work Experience and Master Resume Details
            // Try master first
            let { data: masterResume } = await supabase
                .from('user_resumes')
                .select('id, profile_summary, areas_of_excellence, full_name, email, phone, linkedin_url, location_city, location_country, portfolio_url, resume_type')
                .eq('user_id', userId)
                .eq('is_master', true)
                .maybeSingle()

            // If no master resume found, try getting ANY resume for this user
            if (!masterResume) {
                const { data: anyResume } = await supabase
                    .from('user_resumes')
                    .select('id, profile_summary, areas_of_excellence, full_name, email, phone, linkedin_url, location_city, location_country, portfolio_url, resume_type')
                    .eq('user_id', userId)
                    .limit(1)
                    .maybeSingle()

                if (anyResume) {
                    masterResume = anyResume
                }
            }

            let workExperience: any[] = []

            if (masterResume) {
                const { data: work } = await supabase
                    .from('work_experience')
                    .select('*, accomplishments(*)')
                    .eq('resume_id', masterResume.id)
                    .order('start_date', { ascending: false })

                workExperience = work || []

                // Merge AI-generated bullets from accomplishment_bank (AI first, no duplicates)
                const { data: aiBullets } = await supabase
                    .from('accomplishment_bank')
                    .select('id, bullet_text, role_title, company_name')
                    .eq('user_id', userId!)
                    .eq('source', 'ai_generated')
                if (aiBullets && aiBullets.length > 0) {
                    workExperience = workExperience.map((exp: any) => {
                        const matching = aiBullets.filter(
                            b => b.role_title?.toLowerCase().trim() === exp.job_title?.toLowerCase().trim()
                        )
                        if (matching.length === 0) return exp
                        const existingTexts = new Set((exp.accomplishments || []).map((a: any) => a.bullet_text?.toLowerCase().trim()))
                        const newAI = matching
                            .filter(b => !existingTexts.has(b.bullet_text?.toLowerCase().trim()))
                            .map((b, i) => ({ id: `ai-${b.id}`, bullet_text: b.bullet_text, source: 'ai_generated', order_index: -(matching.length - i) }))
                        const combined = [...newAI, ...(exp.accomplishments || [])]
                        return { ...exp, accomplishments: combined }
                    })
                }
            }

            setResumeData({
                contact: {
                    full_name: masterResume?.full_name || user?.full_name || profile?.full_name,
                    email: masterResume?.email || user?.email,
                    phone: masterResume?.phone || user?.phone || profile?.phone,
                    linkedin: masterResume?.linkedin_url || user?.linkedin_url || profile?.linkedin_url,
                    location: masterResume?.location_city
                        ? (masterResume.location_country === 'USA' || !masterResume.location_country
                            ? masterResume.location_city
                            : `${masterResume.location_city}, ${masterResume.location_country}`)
                        : profile?.current_location,
                    portfolio: masterResume?.portfolio_url
                },
                summary: masterResume?.profile_summary,
                skills: masterResume?.areas_of_excellence || [],
                work_experience: workExperience,
                resume_type: masterResume?.resume_type || 'chronological'
            })

        } catch (error) {
            console.error('Error loading resume preview:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString: string | undefined, isCurrent: boolean) => {
        if (isCurrent) return t('common.present') || 'Present'
        if (!dateString) return ''
        // Handle YYYY-MM or YYYY
        if (dateString.length === 4) return dateString
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString(undefined, { year: 'numeric' })
        } catch (e) {
            return dateString
        }
    }

    if (!userId) return null

    return (
        <>
            {/* Floating Action Button */}
            <button
                id="resume-preview-btn"
                onClick={() => setIsOpen(true)}
                className="fixed bottom-8 left-8 z-50 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
                title="Preview Resume"
            >

                <Eye className="w-5 h-5" />
                <span className="font-medium">Preview Resume</span>
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b dark:border-gray-800">
                            <h2 className="text-lg font-bold flex items-center gap-2">
                                <Eye className="w-5 h-5 text-blue-500" />
                                Live Resume Preview
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600"
                                    title="Print"
                                >
                                    <Printer className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            const { data: { session } } = await supabase.auth.getSession();
                                            const token = session?.access_token;

                                            if (!token) {
                                                alert('Please sign in to export your resume.');
                                                return;
                                            }

                                            const response = await fetch(`${import.meta.env.VITE_API_URL || '/api'}/resume/export/${userId}/docx`, {
                                                headers: {
                                                    'Authorization': `Bearer ${token}`
                                                }
                                            });
                                            if (!response.ok) throw new Error('Export failed');

                                            const blob = await response.blob();
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.href = url;
                                            a.download = `resume_${userId}.docx`;
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            a.remove();
                                        } catch (error) {
                                            console.error('Export error:', error);
                                            alert('Failed to export resume. Please try again.');
                                        }
                                    }}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                    title="Export to Word"
                                >
                                    <Download className="w-4 h-4" />
                                    <span>Export to Word</span>
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-600"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-8 bg-gray-50 dark:bg-gray-900/50">
                            {loading ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                                </div>
                            ) : resumeData ? (
                                <div className="max-w-[21cm] mx-auto bg-white shadow-lg p-[1cm] min-h-[29.7cm] text-gray-900 font-serif">
                                    {/* Resume Header */}
                                    <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                                        <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{resumeData.contact.full_name}</h1>
                                        <div className="text-sm flex justify-center gap-3 text-gray-600 flex-wrap">
                                            {resumeData.contact.phone && <span>{resumeData.contact.phone}</span>}
                                            {resumeData.contact.email && <span>• {resumeData.contact.email}</span>}
                                            {resumeData.contact.linkedin && <span>• <a href={resumeData.contact.linkedin} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">LinkedIn</a></span>}
                                        </div>
                                    </div>

                                    {/* Profile Summary */}
                                    {resumeData.summary && (
                                        <div className="mb-6">
                                            <h2 className="text-lg font-bold border-b border-gray-300 mb-3 uppercase tracking-wide text-gray-800">Professional Summary</h2>
                                            <p className="text-sm leading-relaxed text-justify">{resumeData.summary}</p>
                                        </div>
                                    )}

                                    {/* Areas of Excellence */}
                                    {resumeData.skills && resumeData.skills.length > 0 && (
                                        <div className="mb-6">
                                            <h2 className="text-lg font-bold border-b border-gray-300 mb-3 uppercase tracking-wide text-gray-800">Areas of Excellence</h2>
                                            <div className="flex flex-wrap gap-2">
                                                <p className="text-sm w-full text-center font-medium opacity-90">{resumeData.skills.join(' | ')}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Work Experience */}
                                    {resumeData.work_experience && resumeData.work_experience.length > 0 && (
                                        <div className="mb-6">
                                            <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wide text-gray-800">
                                                {resumeData.resume_type === 'functional' ? 'Professional Capabilities' : 'Professional Experience'}
                                            </h2>
                                            <div className="space-y-6">
                                                {resumeData.work_experience.map((exp: any) => (
                                                    <div key={exp.id}>
                                                        <div className="flex justify-between items-baseline mb-1">
                                                            <h3 className="font-bold text-gray-900">{exp.company_name}</h3>
                                                            <span className="text-sm font-medium text-gray-600 space-x-2">
                                                                <span>{exp.location_city || ''}</span>
                                                                <span>{formatDate(exp.start_date, false)} – {formatDate(exp.end_date, exp.is_current)}</span>
                                                            </span>
                                                        </div>
                                                        <div className="text-sm font-semibold italic text-gray-700 mb-2">{exp.job_title}</div>
                                                        {exp.scope_description && (
                                                            <p className="text-sm mb-2 text-gray-600">{exp.scope_description}</p>
                                                        )}

                                                        {/* Accomplishments */}
                                                        {exp.accomplishments && exp.accomplishments.length > 0 && (
                                                            <ul className="list-disc pl-5 space-y-1">
                                                                {exp.accomplishments.sort((a: any, b: any) => a.order_index - b.order_index).map((acc: any) => (
                                                                    <li key={acc.id} className="text-sm leading-snug pl-1 marker:text-gray-400">
                                                                        {acc.bullet_text}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-gray-500">
                                    No resume data found. Start building your resume to see a preview.
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
