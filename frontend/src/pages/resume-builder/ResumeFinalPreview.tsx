import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Printer, CheckCircle, Pencil, Save, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'

export default function ResumeFinalPreview() {
    const { t } = useTranslation()
    const navigate = useNavigate()
    const [userId, setUserId] = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [resumeData, setResumeData] = useState<any>(null)
    const [isEditingSummary, setIsEditingSummary] = useState(false)
    const [editSummaryText, setEditSummaryText] = useState('')
    const [savingSummary, setSavingSummary] = useState(false)
    const [savedGroups, setSavedGroups] = useState<any[]>([])
    const [selectedGroupId, setSelectedGroupId] = useState<string>('')

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUserId(user.id)
                await loadResumeData(user.id)
            } else {
                navigate('/signin')
            }
            setLoading(false)
        }
        checkUser()
    }, [])

    const loadResumeData = async (uid: string) => {
        try {
            // 1. Get User Profile (Contact Info)
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', uid)
                .maybeSingle()

            const { data: user } = await supabase
                .from('users')
                .select('full_name, email, phone, linkedin_url')
                .eq('id', uid)
                .single()

            // 2. Get Work Experience and Master Resume Details
            let { data: masterResume } = await supabase
                .from('user_resumes')
                .select('*')
                .eq('user_id', uid)
                .eq('is_master', true)
                .maybeSingle()

            if (!masterResume) {
                const { data: anyResume } = await supabase
                    .from('user_resumes')
                    .select('*')
                    .eq('user_id', uid)
                    .limit(1)
                    .maybeSingle()

                masterResume = anyResume
            }

            let workExperience: any[] = []
            let education: any[] = []
            let standaloneAccomplishments: any[] = []

            if (masterResume) {
                const { data: work } = await supabase
                    .from('work_experience')
                    .select('*, accomplishments(*)')
                    .eq('resume_id', masterResume.id)
                    .order('start_date', { ascending: false })

                workExperience = work || []

                const { data: edu } = await supabase
                    .from('education')
                    .select('*')
                    .eq('resume_id', masterResume.id)
                    .order('order_index', { ascending: true })

                education = edu || []

                // For functional resumes, we fetching saved groups instead of just starred items
                if (masterResume.resume_type === 'functional') {
                    const { data: groups } = await supabase
                        .from('saved_accomplishment_groups')
                        .select('*')
                        .eq('user_id', uid)
                        .order('created_at', { ascending: false })

                    if (groups && groups.length > 0) {
                        setSavedGroups(groups)
                        setSelectedGroupId(groups[0].id)
                    }
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
                education: education,
                resume_type: masterResume?.resume_type || 'chronological',
                master_resume_id: masterResume?.id // For saving edits
            })
            setEditSummaryText(masterResume?.profile_summary || '')
        } catch (error) {
            console.error('Error loading resume preview:', error)
        }
    }

    const formatDate = (dateString: string | undefined, isCurrent: boolean) => {
        if (isCurrent) return t('common.present') || 'Present'
        if (!dateString) return ''
        if (dateString.length === 4) return dateString
        try {
            const date = new Date(dateString)
            return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' })
        } catch (e) {
            return dateString
        }
    }

    const handleSaveSummary = async () => {
        if (!userId || !resumeData?.master_resume_id) return
        setSavingSummary(true)
        try {
            const { error } = await supabase
                .from('user_resumes')
                .update({ profile_summary: editSummaryText })
                .eq('id', resumeData.master_resume_id)

            if (error) throw error

            setResumeData({ ...resumeData, summary: editSummaryText })
            setIsEditingSummary(false)
        } catch (error) {
            console.error('Error saving summary:', error)
            alert('Failed to save summary.')
        } finally {
            setSavingSummary(false)
        }
    }

    const handleExport = async () => {
        if (!userId || !resumeData) return
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) return;

            // In production, we need the deployment-specific API prefix if VITE_API_URL is missing
            const fallbackApi = window.location.pathname.startsWith('/novaworkglobal')
                ? '/novaworkglobal-api'
                : '/api'
            const apiUrl = import.meta.env.VITE_API_URL || fallbackApi

            let exportUrl = `${apiUrl}/resume/export/${userId}/docx`
            if (resumeData.resume_type === 'functional' && selectedGroupId) {
                exportUrl += `?groupId=${selectedGroupId}`
            }

            const response = await fetch(exportUrl, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Export failed' }));
                throw new Error(errorData.error || 'Export failed');
            }

            const blob = await response.blob();
            console.log(`📦 Received blob: ${blob.size} bytes, type: ${blob.type}`);

            // Try to get filename from header
            const contentDisposition = response.headers.get('content-disposition');
            let filename = `resume_${userId}.docx`;

            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*?=["']?([^"']+)["']?/);
                if (match && match[1]) {
                    filename = decodeURIComponent(match[1].replace(/UTF-8''/i, ''));
                }
            } else {
                // Fallback if no header
                const date = new Date().toISOString().split('T')[0];
                const name = resumeData.contact.full_name?.replace(/[^a-z0-9]/gi, '_') || 'Resume';
                filename = `${name} - Resume - ${date}.docx`;
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            console.log('✨ Export triggered successfully');
        } catch (error: any) {
            console.error('Export error:', error);
            const msg = error.message || 'Unknown error';
            alert(`Failed to export: ${msg}. Please try again.`);
        }
    }

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    )

    // Get the currently selected group data for Functional layout
    const selectedGroup = savedGroups.find(g => g.id === selectedGroupId)
    const groupedDataForFunctional = selectedGroup?.grouped_data || []

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">
                {/* Header Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                        <BackButton to="/resume/type-selection" label="Back to Selection" variant="light" className="pl-0 mb-2" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            Resume Generated!
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">Review your {resumeData?.resume_type} resume below.</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => window.print()}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm"
                        >
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        <button
                            onClick={handleExport}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm"
                        >
                            <Download className="w-4 h-4" /> Word
                        </button>
                        <button
                            onClick={() => navigate('/resume/tracking?mode=standalone')}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-bold text-sm"
                        >
                            Finish
                        </button>
                    </div>
                </div>

                {/* Resume Preview Area */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-4 md:p-8">
                    {resumeData ? (
                        <div className="max-w-[21cm] mx-auto bg-white p-[1cm] min-h-[29.7cm] text-gray-900 font-serif border border-gray-100 shadow-inner">
                            {/* Standard Chronological View (or default) */}
                            <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                                <h1 className="text-3xl font-bold tracking-wider mb-2">
                                    {(resumeData.contact.full_name || '').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                                </h1>
                                <div className="text-sm flex justify-center gap-3 text-gray-600 flex-wrap">
                                    {resumeData.contact.location && <span>{resumeData.contact.location}</span>}
                                    {resumeData.contact.phone && <span>• {resumeData.contact.phone}</span>}
                                    {resumeData.contact.email && <span>• {resumeData.contact.email}</span>}
                                    {resumeData.contact.linkedin && <span>• LinkedIn</span>}
                                </div>
                            </div>

                            {/* Summary / Professional Profile */}
                            <div className="mb-6 group relative">
                                <h2 className="text-lg font-bold border-b border-gray-300 mb-3 uppercase tracking-wide text-gray-800 flex items-center justify-between">
                                    <span>Professional Profile</span>
                                    {!isEditingSummary && (
                                        <button
                                            onClick={() => setIsEditingSummary(true)}
                                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity no-print"
                                            title="Edit Profile"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </button>
                                    )}
                                </h2>

                                {isEditingSummary ? (
                                    <div className="no-print bg-slate-50 p-3 rounded-xl border border-blue-200">
                                        <textarea
                                            value={editSummaryText}
                                            onChange={(e) => setEditSummaryText(e.target.value)}
                                            className="w-full h-32 p-3 text-sm leading-relaxed border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                            placeholder="Write your professional summary here..."
                                        />
                                        <div className="flex justify-end gap-2 mt-3">
                                            <button
                                                onClick={() => {
                                                    setEditSummaryText(resumeData.summary || '')
                                                    setIsEditingSummary(false)
                                                }}
                                                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveSummary}
                                                disabled={savingSummary}
                                                className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
                                            >
                                                {savingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                                Save
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    resumeData.summary && (
                                        <p className="text-sm leading-relaxed text-justify">{resumeData.summary}</p>
                                    )
                                )}
                            </div>

                            {/* Skills (Areas of Excellence) */}
                            {resumeData.skills && resumeData.skills.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold border-b border-gray-300 mb-3 uppercase tracking-wide text-gray-800">Areas of Excellence</h2>
                                    <p className="text-sm w-full text-center font-medium opacity-90">{resumeData.skills.join(' • ')}</p>
                                </div>
                            )}

                            {/* Functional Layout: Selected Accomplishments from Saved Groups */}
                            {resumeData.resume_type === 'functional' && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wide text-gray-800">
                                        Selected Accomplishments
                                    </h2>

                                    {savedGroups.length > 0 && (
                                        <div className="mb-4 bg-blue-50/50 p-4 border border-blue-100 rounded-lg max-w-sm rounded-[0.5rem]">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Select Saved Group</label>
                                            <select
                                                value={selectedGroupId}
                                                onChange={(e) => setSelectedGroupId(e.target.value)}
                                                className="w-full text-sm border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
                                            >
                                                {savedGroups.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {groupedDataForFunctional.length === 0 && savedGroups.length === 0 && (
                                        <p className="text-sm text-slate-500 italic">No saved accomplishment groups found. Please use the AI in the Accomplishment Hub to generate and save a group first.</p>
                                    )}

                                    <div className="space-y-4">
                                        {groupedDataForFunctional.map((group: any, idx: number) => (
                                            <div key={idx}>
                                                <h3 className="text-sm font-semibold text-slate-800 mb-1">{group.theme}</h3>
                                                <ul className="list-disc pl-5 space-y-1">
                                                    {group.accomplishments?.map((acc: any, i: number) => (
                                                        <li key={i} className="text-sm leading-snug pl-1 marker:text-gray-400">
                                                            {typeof acc === 'object' ? acc.text : acc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Chronological Layout: Work Experience */}
                            {resumeData.resume_type === 'chronological' && resumeData.work_experience && resumeData.work_experience.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wide text-gray-800">
                                        Professional Experience
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

                            {/* Education (Both Formats) */}
                            {resumeData.education && resumeData.education.length > 0 && (
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold border-b border-gray-300 mb-4 uppercase tracking-wide text-gray-800">
                                        Education
                                    </h2>
                                    <div className="space-y-4">
                                        {resumeData.education.map((edu: any) => (
                                            <div key={edu.id} className="flex justify-between items-baseline">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">{edu.degree_title}</div>
                                                    <div className="text-sm text-gray-700">{edu.institution}{edu.location ? `, ${edu.location}` : ''}</div>
                                                </div>
                                                <div className="text-sm text-gray-600 font-medium whitespace-nowrap">
                                                    {edu.graduation_year}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">No resume data found.</div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .max-w-5xl { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                    .bg-white { shadow: none !important; border: none !important; }
                    .rounded-2xl { border-radius: 0 !important; }
                }
            ` }} />
        </div>
    )
}
