import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, Printer, CheckCircle, Pencil, Save, Loader2, Globe } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { BackButton } from '../../components/common/BackButton'
import { useGuidedStep } from '../../hooks/useGuidedStep'
import { CompletionCelebration } from '../../components/guided-path'
import { usePlanTier } from '../../hooks/usePlanTier'
import UpgradePrompt from '../../components/billing/UpgradePrompt'
import {
  SECTION_HEADERS,
  translateResumeData,
  detectResumeLanguage,
  type ResumeLanguage,
  type SectionHeaders,
} from '../../services/resumeTranslator'

const RESUME_LANG_KEY = 'novawork_resume_output_language'
const TRANSLATION_CACHE_PREFIX = 'novawork_translation_cache_'

export default function ResumeFinalPreview() {
    const guided = useGuidedStep('guided_path_complete')
    const { can: canUse } = usePlanTier()
    const [showCelebration, setShowCelebration] = useState(false)

    // Trigger celebration when guided path is complete
    useEffect(() => {
      if (guided.isGuidedMode && guided.isStepComplete) {
        setShowCelebration(true)
      }
    }, [guided.isGuidedMode, guided.isStepComplete])

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
    const [activeLanguage, setActiveLanguage] = useState<ResumeLanguage>('en')
    const [sectionHeaders, setSectionHeaders] = useState<SectionHeaders>(SECTION_HEADERS.en)
    const [isTranslating, setIsTranslating] = useState(false)

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
            // 1. Contact info
            const { data: profile } = await supabase
                .from('user_profiles').select('*').eq('user_id', uid).maybeSingle()
            const { data: user } = await supabase
                .from('users').select('full_name, email, phone, linkedin_url').eq('id', uid).single()
            const { data: contactProfile } = await supabase
                .from('user_contact_profile').select('*').eq('user_id', uid).maybeSingle()

            // 2. Master resume — ALWAYS take the LATEST one to ensure consistency with the builder
            const { data: masterResumes } = await supabase
                .from('user_resumes')
                .select('*')
                .eq('user_id', uid)
                .eq('is_master', true)
                .order('created_at', { ascending: false })
                .limit(1)
            
            let masterResume = masterResumes?.[0]

            if (!masterResume) {
                const { data: anyResumes } = await supabase
                    .from('user_resumes')
                    .select('*')
                    .eq('user_id', uid)
                    .order('created_at', { ascending: false })
                    .limit(1)
                masterResume = anyResumes?.[0]
            }

            // 3. Generated professional profile (latest)
            const { data: generatedProfiles } = await supabase
                .from('generated_professional_profile')
                .select('*').eq('user_id', uid)
                .order('version', { ascending: false }).limit(1)
            const generatedProfile = generatedProfiles?.[0] || null

            let workExperience: any[] = []
            let education: any[] = []

            if (masterResume) {
                const { data: work } = await supabase
                    .from('work_experience').select('*, accomplishments(*)')
                    .eq('resume_id', masterResume.id).order('start_date', { ascending: false })
                workExperience = (work || []).map((exp: any) => {
                    const filteredAccomplishments = (exp.accomplishments || [])
                        .filter((a: any) => a.is_visible !== false)
                        .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                    return { ...exp, accomplishments: filteredAccomplishments }
                })

                const { data: edu } = await supabase
                    .from('education').select('*')
                    .eq('resume_id', masterResume.id).order('graduation_year', { ascending: false })
                
                if (edu && edu.length > 0) {
                    education = edu
                } else {
                    const { data: eduFallback } = await supabase
                        .from('education').select('*')
                        .eq('user_id', uid).order('graduation_year', { ascending: false })
                    education = eduFallback || []
                }

                if (masterResume.resume_type === 'functional') {
                    const { data: groups } = await supabase
                        .from('saved_accomplishment_groups').select('*')
                        .eq('user_id', uid).order('created_at', { ascending: false })
                    if (groups && groups.length > 0) {
                        setSavedGroups(groups)
                        setSelectedGroupId(groups[0].id)
                    }
                }
            }

            // 4. Certifications
            const { data: certs } = await supabase
                .from('certifications').select('*').eq('user_id', uid)
                .order('issue_date', { ascending: false })
            const certifications = certs || []

            // 5. Awards
            const { data: awards } = await supabase
                .from('awards').select('*').eq('user_id', uid)
                .order('issue_date', { ascending: false })
            const finalAwards = awards || []

            // 6. Build combined profile paragraph
            let combinedProfile = ''
            let areasOfExcellence: string[] = []
            let skillsSection: { tools_platforms?: string[], methodologies?: string[], languages?: string[] } = {}

            // Determine if the user manually edited their resume profile AFTER the AI generated it
            const generatedTime = generatedProfile?.created_at ? new Date(generatedProfile.created_at).getTime() : 0;
            const resumeUpdateTime = masterResume?.updated_at ? new Date(masterResume.updated_at).getTime() : 
                                    (masterResume?.created_at ? new Date(masterResume.created_at).getTime() : 0);
            
            const userEditIsNewer = !!masterResume?.profile_summary && (resumeUpdateTime > generatedTime);

            if (generatedProfile && !userEditIsNewer) {
                const parts = [
                    generatedProfile.output_identity_sentence,
                    generatedProfile.output_blended_value_sentence,
                    generatedProfile.output_competency_paragraph
                ].filter(Boolean)
                combinedProfile = parts.join(' ')

                const rawAreas = generatedProfile.output_areas_of_excellence
                if (typeof rawAreas === 'string' && rawAreas) {
                    areasOfExcellence = rawAreas.split('|').map((s: string) => s.trim()).filter(Boolean)
                } else if (Array.isArray(rawAreas)) {
                    areasOfExcellence = rawAreas
                }

                // Extract skills section (tools, methodologies, languages)
                const rawSkills = generatedProfile.output_skills_section
                if (rawSkills) {
                    skillsSection = typeof rawSkills === 'string' ? JSON.parse(rawSkills) : rawSkills
                }
            } else if (masterResume?.profile_summary) {
                combinedProfile = masterResume.profile_summary
                areasOfExcellence = masterResume?.areas_of_excellence || []
            }

            const contactName = contactProfile
                ? [contactProfile.first_name, contactProfile.middle_name, contactProfile.last_name]
                    .filter(Boolean)
                    .join(' ')
                : null

            const contactLocation = contactProfile
                ? [contactProfile.city, contactProfile.state, contactProfile.country]
                    .filter(Boolean)
                    .join(', ')
                : null

            const fullResumeData = {
                contact: {
                    full_name: contactName || masterResume?.full_name || user?.full_name || profile?.full_name || null,
                    email: contactProfile?.email || masterResume?.email || user?.email || null,
                    phone: contactProfile?.phone || masterResume?.phone || user?.phone || profile?.phone || null,
                    linkedin: contactProfile?.linkedin_url || masterResume?.linkedin_url || user?.linkedin_url || profile?.linkedin_url || null,
                    linkedin_url: contactProfile?.linkedin_url || masterResume?.linkedin_url || user?.linkedin_url || profile?.linkedin_url || null,
                    location: contactLocation || (masterResume?.location_city
                        ? (masterResume.location_country === 'USA' || !masterResume.location_country
                            ? masterResume.location_city
                            : `${masterResume.location_city}, ${masterResume.location_country}`)
                        : profile?.current_location || null),
                    portfolio: contactProfile?.portfolio_url || masterResume?.portfolio_url || null
                },
                summary: combinedProfile,
                areas_of_excellence: areasOfExcellence,
                skills_section: skillsSection,
                work_experience: workExperience,
                education: education,
                certifications: certifications,
                awards: finalAwards,
                resume_type: masterResume?.resume_type || 'chronological',
                master_resume_id: masterResume?.id
            }

            setResumeData(fullResumeData)
            setEditSummaryText(combinedProfile)

            // After loading full data, check if user selected a different output language
            await applyOutputLanguage(fullResumeData, masterResume)
        } catch (error) {
            console.error('Error loading resume preview:', error)
        }
    }

    // Simple hash function for change detection
    const hashResumeContent = (data: any): string => {
        const fields = [
            data.summary || '',
            JSON.stringify(data.areas_of_excellence || []),
            JSON.stringify(data.work_experience?.map((e: any) => ({
                job_title: e.job_title, scope_description: e.scope_description,
                role_explanation: e.role_explanation,
                accomplishments: e.accomplishments?.map((a: any) => a.bullet_text)
            })) || []),
            JSON.stringify(data.education?.map((e: any) => ({
                degree_title: e.degree_title, field_of_study: e.field_of_study
            })) || []),
            JSON.stringify(data.certifications?.map((c: any) => c.certification_name) || []),
            JSON.stringify(data.awards?.map((a: any) => a.certification_name || a.name) || []),
        ]
        const combined = fields.join('|||')
        let hash = 0
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash |= 0
        }
        return hash.toString(36)
    }

    // Check localStorage for selected output language and translate if needed
    const applyOutputLanguage = async (loadedData: any, masterResume: any) => {
        const stored = localStorage.getItem(RESUME_LANG_KEY)
        if (!stored) return

        try {
            const { language, sectionHeaders: headers } = JSON.parse(stored)

            // Set section headers immediately
            setActiveLanguage(language)
            setSectionHeaders(headers)

            // If English (original language), no translation needed
            if (language === 'en') {
                localStorage.removeItem(RESUME_LANG_KEY)
                return
            }

            // Check localStorage for a cached translation with matching content hash
            const contentHash = hashResumeContent(loadedData)
            const cacheKey = `${TRANSLATION_CACHE_PREFIX}${language}_${contentHash}`
            const cachedTranslation = localStorage.getItem(cacheKey)

            if (cachedTranslation) {
                try {
                    const cached = JSON.parse(cachedTranslation)
                    setResumeData(cached)
                    setEditSummaryText(cached.summary || '')
                    localStorage.removeItem(RESUME_LANG_KEY)
                    return
                } catch {
                    localStorage.removeItem(cacheKey)
                }
            }

            // No localStorage cache — check Supabase for a saved translation
            const resumeId = loadedData.master_resume_id
            if (resumeId) {
                try {
                    const { data: savedTranslation } = await supabase
                        .from('resume_translations')
                        .select('content_hash, translated_data')
                        .eq('resume_id', resumeId)
                        .eq('language', language)
                        .maybeSingle()

                    if (savedTranslation && savedTranslation.content_hash === contentHash) {
                        setResumeData(savedTranslation.translated_data)
                        setEditSummaryText(savedTranslation.translated_data.summary || '')
                        // Also cache in localStorage for next time
                        try { localStorage.setItem(cacheKey, JSON.stringify(savedTranslation.translated_data)) } catch {}
                        localStorage.removeItem(RESUME_LANG_KEY)
                        return
                    }
                } catch (e) {
                    // Table might not exist yet — continue to API translation
                }
            }

            // No valid cache — translate via API
            console.log('🌐 Starting translation via API, language:', language)
            setIsTranslating(true)
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) { console.error('🌐 No auth token available'); setIsTranslating(false); return }

            const translated = await translateResumeData(loadedData, language, token)
            setResumeData(translated)
            setEditSummaryText(translated.summary || '')

            // Cache the translation in localStorage for future use
            try {
                localStorage.setItem(cacheKey, JSON.stringify(translated))
                // Also clean up old cached translations for this language
                const keysToRemove: string[] = []
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i)
                    if (key && key.startsWith(`${TRANSLATION_CACHE_PREFIX}${language}_`) && key !== cacheKey) {
                        keysToRemove.push(key)
                    }
                }
                keysToRemove.forEach(k => localStorage.removeItem(k))
            } catch (saveErr) {
                console.warn('Could not cache translation in localStorage:', saveErr)
            }

            // Save translation to Supabase for cross-session persistence
            try {
                const resumeId = loadedData.master_resume_id
                if (resumeId && userId) {
                    await supabase
                        .from('resume_translations')
                        .upsert({
                            user_id: userId,
                            resume_id: resumeId,
                            language,
                            content_hash: contentHash,
                            translated_data: translated,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'resume_id,language' })
                    console.log('💾 Translation saved to Supabase')
                }
            } catch (saveErr) {
                console.warn('Could not save translation to Supabase:', saveErr)
            }

            localStorage.removeItem(RESUME_LANG_KEY)
            setIsTranslating(false)
        } catch (e) {
            console.error('Error applying output language:', e)
            setIsTranslating(false)
        }
    }

    const formatDate = (dateString: string | undefined, isCurrent: boolean) => {
        if (isCurrent) return t('common.present') || 'Present'
        if (!dateString) return ''
        if (dateString.length === 4) return dateString
        try {
            return new Date(dateString).toLocaleDateString(undefined, { year: 'numeric' })
        } catch { return dateString }
    }

    const handleSaveSummary = async () => {
        if (!userId || !resumeData?.master_resume_id) return
        setSavingSummary(true)
        try {
            const { error } = await supabase
                .from('user_resumes').update({ profile_summary: editSummaryText })
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
            const { data: { session } } = await supabase.auth.getSession()
            const token = session?.access_token
            if (!token) return
            const fallbackApi = window.location.pathname.startsWith('/novaworkglobal') ? '/novaworkglobal-api' : ''
            const apiUrl = import.meta.env.VITE_API_URL || fallbackApi
            let exportUrl = `${apiUrl}/api/resume/export/${userId}/docx`
            const response = await fetch(exportUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    resumeData: resumeData,
                    groupId: selectedGroupId,
                    functionalGroups: groupedDataForFunctional,
                    sectionHeaders: sectionHeaders,
                    language: activeLanguage
                })
            })
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Export failed' }))
                throw new Error(errorData.error || 'Export failed')
            }
            const blob = await response.blob()
            const contentDisposition = response.headers.get('content-disposition')
            let filename = `resume_${userId}.docx`
            if (contentDisposition) {
                const match = contentDisposition.match(/filename\*?=["']?([^"']+)["']?/)
                if (match?.[1]) filename = decodeURIComponent(match[1].replace(/UTF-8''/i, ''))
            } else {
                const date = new Date().toISOString().split('T')[0]
                const name = resumeData.contact.full_name?.replace(/[^a-z0-9]/gi, '_') || 'Resume'
                filename = `${name} - Resume - ${date}.docx`
            }
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url; a.download = filename
            document.body.appendChild(a); a.click()
            window.URL.revokeObjectURL(url); a.remove()
        } catch (error: any) {
            console.error('Export error:', error)
            alert(`Failed to export: ${error.message || 'Unknown error'}`)
        }
    }

    if (loading || isTranslating) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-950 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">
                {isTranslating
                    ? t('resumeBuilder.languageSelection.translating', 'Translating your resume...')
                    : 'Loading...'}
            </p>
        </div>
    )

    const selectedGroup = savedGroups.find(g => g.id === selectedGroupId)
    const groupedDataForFunctional = selectedGroup?.grouped_data || []

    /* ───────── Inline style helpers ───────── */
    const pageStyle: React.CSSProperties = {
        fontFamily: "'Times New Roman', Times, serif",
        fontSize: '10.5pt',
        lineHeight: '1.35',
        color: '#000000',
        backgroundColor: '#fff',
        maxWidth: '21cm',
        margin: '0 auto',
        padding: '1.1cm 1.3cm',
    }
    const sectionTitle: React.CSSProperties = {
        fontWeight: 'bold',
        fontSize: '10.5pt',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '5px',
        marginTop: '10px',
    }
    const subSectionTitle: React.CSSProperties = {
        fontWeight: '600',
        fontSize: '10pt',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '4px',
        marginTop: '8px',
        color: '#000000',
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 p-6 md:p-10">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* ── Top action bar ── */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div>
                        <BackButton to="/dashboard/resume/type-selection" label="Back to Selection" variant="light" className="pl-0 mb-2" />
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            <CheckCircle className="w-6 h-6 text-green-500" />
                            Resume Generated!
                        </h1>
                        <p className="text-slate-500 dark:text-slate-400">Review your {resumeData?.resume_type} resume below.{activeLanguage !== 'en' ? ` (${activeLanguage === 'es' ? 'Español' : 'English'})` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {activeLanguage !== 'en' && (
                            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-full text-xs font-semibold">
                                <Globe className="w-3.5 h-3.5" />
                                {sectionHeaders === SECTION_HEADERS.es ? t('resumeBuilder.languageSelection.esBadge', 'Español') : t('resumeBuilder.languageSelection.enBadge', 'English')}
                            </span>
                        )}
                        {activeLanguage !== 'en' && (
                            <button
                                onClick={() => {
                                    localStorage.setItem(RESUME_LANG_KEY, JSON.stringify({
                                      language: 'en',
                                      sectionHeaders: SECTION_HEADERS.en,
                                    }))
                                    navigate('/dashboard/resume/type-selection?mode=standalone')
                                }}
                                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors no-print"
                            >
                                <Globe className="w-3.5 h-3.5" />
                                {t('resumeBuilder.languageSelection.changeLanguage', 'Change Language')}
                            </button>
                        )}
                        <button onClick={() => window.print()} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-medium text-sm">
                            <Printer className="w-4 h-4" /> Print
                        </button>
                        {canUse('canExportResume') ? (
                        <button onClick={handleExport} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm">
                            <Download className="w-4 h-4" /> Word
                        </button>
                        ) : (
                        <UpgradePrompt feature="Resume export" className="flex-1 md:flex-none" />
                        )}
                        <button onClick={() => navigate('/dashboard/resume/tracking?mode=standalone')} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors font-bold text-sm">
                            Finish
                        </button>
                    </div>
                </div>

                {/* ── Resume paper ── */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 p-4 md:p-8">
                    {resumeData ? (
                        <div style={pageStyle}>

                            {/* NAME & CONTACT — no divider line */}
                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                <div style={{ fontSize: '18pt', fontWeight: 'bold', letterSpacing: '0.04em', marginBottom: '3px' }}>
                                    {(resumeData.contact.full_name || '').toLowerCase().replace(/\b\w/g, (c: string) => c.toUpperCase())}
                                </div>
                                <div style={{ fontSize: '9.5pt', color: '#111', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    {resumeData.contact.phone && <span>{resumeData.contact.phone}</span>}
                                    {resumeData.contact.email && <span>• {resumeData.contact.email}</span>}
                                    {resumeData.contact.linkedin && <span>• LinkedIn</span>}
                                </div>
                            </div>

                            {/* PROFESSIONAL PROFILE — 3 sentences in one paragraph */}
                            {resumeData.summary && (
                                <div style={{ marginBottom: '8px' }} className="group relative">
                                    <div style={sectionTitle}>{sectionHeaders.professionalSummary}</div>
                                    {isEditingSummary ? (
                                        <div className="no-print bg-slate-50 p-3 rounded-xl border border-blue-200">
                                            <textarea
                                                value={editSummaryText}
                                                onChange={e => setEditSummaryText(e.target.value)}
                                                className="w-full h-32 p-3 text-sm leading-relaxed border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y"
                                                placeholder="Write your professional summary here..."
                                            />
                                            <div className="flex justify-end gap-2 mt-3">
                                                <button onClick={() => { setEditSummaryText(resumeData.summary || ''); setIsEditingSummary(false) }} className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-md text-sm font-medium">Cancel</button>
                                                <button onClick={handleSaveSummary} disabled={savingSummary} className="px-4 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium flex items-center gap-2">
                                                    {savingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <p style={{ fontSize: '10pt', textAlign: 'justify', margin: 0 }}>{resumeData.summary}</p>
                                            <button onClick={() => setIsEditingSummary(true)} className="no-print opacity-0 group-hover:opacity-100 absolute top-0 right-0 p-1 text-gray-400 hover:text-blue-600 transition-opacity" title="Edit">
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* AREAS OF EXCELLENCE — merged list to save space */}
                            {(resumeData.areas_of_excellence?.length > 0 || resumeData.skills_section) && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={subSectionTitle}>{sectionHeaders.areasOfExcellence}</div>
                                    <p style={{ fontSize: '9.5pt', textAlign: 'center', margin: '0' }}>
                                        {[
                                            ...(resumeData.areas_of_excellence || []),
                                            resumeData.skills_section?.tools_platforms?.length > 0 ? `${sectionHeaders.skillsTools}: ${resumeData.skills_section.tools_platforms.join(' | ')}` : null,
                                            resumeData.skills_section?.methodologies?.length > 0 ? `${sectionHeaders.skillsMethodologies}: ${resumeData.skills_section.methodologies.join(' | ')}` : null,
                                            resumeData.skills_section?.languages?.length > 0 ? `${sectionHeaders.skillsLanguages}: ${resumeData.skills_section.languages.join(' | ')}` : null,
                                        ].filter(Boolean).join(' | ')}
                                    </p>
                                </div>
                            )}

                            {/* FUNCTIONAL: Selected Accomplishments */}
                            {resumeData.resume_type === 'functional' && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={sectionTitle}>{sectionHeaders.selectedAccomplishments}</div>
                                    {savedGroups.length > 0 && (
                                        <div className="mb-3 no-print bg-blue-50/50 p-3 border border-blue-100 rounded-lg max-w-sm">
                                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Select Saved Group</label>
                                            <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)} className="w-full text-sm border-gray-200 rounded-md bg-white">
                                                {savedGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                            </select>
                                        </div>
                                    )}
                                    {groupedDataForFunctional.length === 0 && savedGroups.length === 0 && (
                                        <p style={{ fontSize: '10pt', fontStyle: 'italic', color: '#666' }}>No saved accomplishment groups found.</p>
                                    )}
                                    <div>
                                        {groupedDataForFunctional.map((group: any, idx: number) => (
                                            <div key={idx} style={{ marginBottom: '6px' }}>
                                                <div style={{ fontWeight: 'bold', fontSize: '10pt', marginBottom: '2px' }}>{group.theme}</div>
                                                <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
                                                    {group.accomplishments?.map((acc: any, i: number) => (
                                                        <li key={i} style={{ fontSize: '9.5pt', lineHeight: '1.35', marginBottom: '1px' }}>
                                                            {typeof acc === 'object' ? acc.text : acc}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* FUNCTIONAL: Work History */}
                            {resumeData.resume_type === 'functional' && resumeData.work_experience?.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={sectionTitle}>{sectionHeaders.workHistory}</div>
                                    <div>
                                        {resumeData.work_experience
                                            .sort((a: any, b: any) => {
                                                if (a.is_current && !b.is_current) return -1;
                                                if (!a.is_current && b.is_current) return 1;
                                                return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                                            })
                                            .map((exp: any, i: number) => (
                                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                                                        {exp.job_title}
                                                    </span>
                                                    <span style={{ fontSize: '9.5pt', color: '#444', marginLeft: '4px' }}>
                                                        {exp.company_name}{exp.location_city ? ` | ${exp.location_city}` : ''}
                                                    </span>
                                                </div>
                                                <span style={{ fontSize: '9.5pt', color: '#444', whiteSpace: 'nowrap' }}>
                                                    {formatDate(exp.start_date, false)} – {formatDate(exp.end_date, exp.is_current)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* WORK EXPERIENCE — Grouped by Company */}
                            {resumeData.resume_type === 'chronological' && resumeData.work_experience?.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={sectionTitle}>{sectionHeaders.workExperience}</div>
                                    <div>
                                        {(() => {
                                            const grouped = resumeData.work_experience.reduce((acc: any[], exp: any) => {
                                                const companyLower = exp.company_name.trim().toLowerCase();
                                                const existing = acc.find(item => item.company_name.trim().toLowerCase() === companyLower);
                                                
                                                if (existing) {
                                                    existing.positions.push(exp);
                                                    // Update overall date range
                                                    if (new Date(exp.start_date) < new Date(existing.minStart)) {
                                                        existing.minStart = exp.start_date;
                                                    }
                                                    if (exp.is_current) {
                                                        existing.maxEnd = 'Present';
                                                        existing.isCurrent = true;
                                                    } else if (existing.maxEnd !== 'Present') {
                                                        const currentMax = new Date(existing.maxEnd);
                                                        const entryEnd = new Date(exp.end_date);
                                                        if (entryEnd > currentMax) existing.maxEnd = exp.end_date;
                                                    }
                                                } else {
                                                    acc.push({
                                                        company_name: exp.company_name,
                                                        location_city: exp.location_city,
                                                        minStart: exp.start_date,
                                                        maxEnd: exp.is_current ? 'Present' : exp.end_date,
                                                        isCurrent: exp.is_current,
                                                        positions: [exp]
                                                    });
                                                }
                                                return acc;
                                            }, []);

                                            return grouped.map((group: any, gIdx: number) => (
                                                <div key={gIdx} style={{ marginBottom: '12px' }}>
                                                    {/* Company Header: Company .. Location [Overall Dates] */}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '10.5pt' }}>
                                                            {group.company_name}{group.location_city ? ` | ${group.location_city}` : ''}
                                                        </span>
                                                        <span style={{ fontSize: '9.5pt', fontWeight: 'bold', color: '#111' }}>
                                                            {formatDate(group.minStart, false)} – {group.maxEnd === 'Present' ? sectionHeaders.present : formatDate(group.maxEnd, false)}
                                                        </span>
                                                    </div>

                                                    {/* Positions under this company */}
                                                    {group.positions.sort((a: any, b: any) => {
                                                        if (a.is_current && !b.is_current) return -1;
                                                        if (!a.is_current && b.is_current) return 1;
                                                        return new Date(b.start_date).getTime() - new Date(a.start_date).getTime();
                                                    }).map((pos: any, pIdx: number) => (
                                                        <div key={pos.id} style={{ marginTop: group.positions.length > 1 ? '4px' : '0px' }}>
                                                            {/* Job Position - bold only */}
                                                            <div style={{ fontWeight: 'bold', fontSize: '10pt', letterSpacing: '0.02em', marginBottom: '2px', marginTop: '1px' }}>
                                                                {pos.job_title}
                                                                {group.positions.length > 1 && (
                                                                    <span style={{ textDecoration: 'none', fontWeight: 'normal', fontSize: '9pt', color: '#666', marginLeft: '8px', textTransform: 'none' }}>
                                                                        ({formatDate(pos.start_date, false)} – {formatDate(pos.end_date, pos.is_current)})
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {/* Scope */}
                                                            {pos.scope_description && (
                                                                <p style={{ fontSize: '9.5pt', color: '#333', margin: '2px 0 3px', textAlign: 'justify' }}>{pos.scope_description}</p>
                                                            )}
                                                            {/* Accomplishments */}
                                                            {pos.accomplishments?.length > 0 && (
                                                                <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
                                                                    {[...pos.accomplishments].sort((a: any, b: any) => a.order_index - b.order_index).map((acc: any) => (
                                                                        <li key={acc.id} style={{ fontSize: '9.5pt', lineHeight: '1.35', marginBottom: '1px' }}>
                                                                            {acc.bullet_text}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ));
                                        })()}
                                    </div>
                                </div>
                            )}

                            {/* EDUCATION — no divider */}
                            {resumeData.education?.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={sectionTitle}>{sectionHeaders.education}</div>
                                    <div>
                                        {resumeData.education.map((edu: any) => (
                                            <div key={edu.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '3px' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '10pt' }}>
                                                        {edu.degree_title || edu.degree_type || edu.degree || 'Degree'}
                                                    </span>
                                                    <span style={{ fontSize: '9.5pt', color: '#444', marginLeft: '4px' }}>
                                                        {edu.institution || edu.institution_name}{edu.location ? `, ${edu.location}` : ''}
                                                    </span>
                                                    {edu.field_of_study && (
                                                        <span style={{ fontSize: '9.5pt', color: '#444', marginLeft: '4px' }}>
                                                            in {edu.field_of_study}
                                                        </span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '9.5pt', color: '#444', whiteSpace: 'nowrap' }}>{edu.graduation_year || edu.year}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* CERTIFICATIONS — no divider */}
                            {resumeData.certifications?.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={sectionTitle}>{sectionHeaders.certifications}</div>
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
                                        {resumeData.certifications.map((cert: any) => (
                                            <li key={cert.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                                <div style={{ fontSize: '9.5pt' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{cert.certification_name}</span>
                                                    {cert.issuing_organization && (
                                                        <span style={{ color: '#444', marginLeft: '4px' }}>• {cert.issuing_organization}</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '9pt', color: '#444', whiteSpace: 'nowrap' }}>
                                                    {cert.issue_date ? new Date(cert.issue_date).getFullYear() : ''}
                                                    {cert.expiration_date ? ` – ${new Date(cert.expiration_date).getFullYear()}` : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* AWARDS — no divider */}
                            {resumeData.awards?.length > 0 && (
                                <div style={{ marginBottom: '8px' }}>
                                    <div style={sectionTitle}>{sectionHeaders.awards}</div>
                                    <ul style={{ listStyleType: 'disc', paddingLeft: '16px', margin: 0 }}>
                                        {resumeData.awards.map((award: any) => (
                                            <li key={award.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                                                <div style={{ fontSize: '9.5pt' }}>
                                                    <span style={{ fontWeight: 'bold' }}>{award.certification_name || award.name}</span>
                                                    {award.issuing_organization && (
                                                        <span style={{ color: '#444', marginLeft: '4px' }}>• {award.issuing_organization}</span>
                                                    )}
                                                </div>
                                                <span style={{ fontSize: '9pt', color: '#444', whiteSpace: 'nowrap' }}>
                                                    {award.issue_date ? new Date(award.issue_date).getFullYear() : ''}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">No resume data found.</div>
                    )}
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; }
                    .max-w-5xl { max-width: none !important; margin: 0 !important; padding: 0 !important; }
                    .rounded-2xl { border-radius: 0 !important; box-shadow: none !important; border: none !important; }
                    @page { margin: 1cm; size: A4; }
                }
            ` }} />

            {/* Guided Path Completion Celebration */}
            {guided.isGuidedMode && guided.isStepComplete && showCelebration && (
              <CompletionCelebration onDismiss={() => setShowCelebration(false)} />
            )}
        </div>
    )
}
