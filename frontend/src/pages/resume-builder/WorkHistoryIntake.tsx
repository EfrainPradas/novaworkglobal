import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Upload, Pencil, ArrowRight, ArrowLeft, FileText, Briefcase, GraduationCap, Award, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { trackEvent } from '../../lib/analytics'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

type IntakePath = null | 'upload' | 'manual'
type UploadStep = 'uploading' | 'extracting' | 'review'

interface ExtractedData {
    work_experience: any[]
    accomplishments: string[]
    education: any[]
    certifications: any[]
    profile_summary?: string
    areas_of_excellence?: string[]
}

export default function WorkHistoryIntake() {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [path, setPath] = useState<IntakePath>(null)
    const [uploadStep, setUploadStep] = useState<UploadStep>('uploading')
    const [file, setFile] = useState<File | null>(null)
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null)
    const [extracting, setExtracting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'experience' | 'accomplishments' | 'education' | 'certifications'>('experience')
    const [saving, setSaving] = useState(false)
    const [uploadedFilePath, setUploadedFilePath] = useState<string | null>(null)
    const trackedSteps = useRef<Set<string>>(new Set())

    // Existing data detection
    const [checkingData, setCheckingData] = useState(true)
    const [existingData, setExistingData] = useState<{
        workCount: number
        storyCount: number
        resumeId: string | null
    } | null>(null)

    useEffect(() => {
        checkExistingData()
    }, [])

    // Dynamic step tracking removed per user request to simplify event log

    const checkExistingData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) { setCheckingData(false); return }

            let resumeId: string | null = null
            let workCount = 0

            // Find resume
            const { data: resumes } = await supabase
                .from('user_resumes')
                .select('id')
                .eq('user_id', user.id)
                .eq('is_master', true)
                .order('created_at', { ascending: false })
                .limit(1)

            if (resumes && resumes.length > 0) {
                resumeId = resumes[0].id
                const { count } = await supabase
                    .from('work_experience')
                    .select('id', { count: 'exact', head: true })
                    .eq('resume_id', resumeId)

                workCount = count || 0
            }

            // Also check legacy (resume_id = userId)
            if (workCount === 0) {
                const { count } = await supabase
                    .from('work_experience')
                    .select('id', { count: 'exact', head: true })
                    .eq('resume_id', user.id)

                workCount = count || 0
            }

            // Count stories
            const { count: storyCount } = await supabase
                .from('par_stories')
                .select('id', { count: 'exact', head: true })
                .eq('user_id', user.id)

            // Always set existingData so we don't lose the resumeId
            setExistingData({ workCount, storyCount: storyCount || 0, resumeId })

        } catch (e) {
            console.error('Error checking existing data:', e)
        }
        setCheckingData(false)
    }

    // ─── Upload Path ───
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0]
        if (f) {
            const ext = f.name.toLowerCase()
            if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
                setError('Please upload a PDF or DOCX file.')
                return
            }
            setFile(f)
            setError(null)
        }
    }

    const handleFileUpload = async () => {
        if (!file) return
        setExtracting(true)
        setUploadStep('extracting')
        setError(null)

        try {
            trackEvent('analytics', 'resume_upload_started', { file_size_bytes: file.size, file_type: file.type })

            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Authentication required')

            // Upload to Supabase Storage first
            const ext = file.name.split('.').pop()
            const filePath = `${user.id}/${Date.now()}_resume.${ext}`

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(filePath, file)

            if (uploadError) {
                console.error('Storage upload error:', uploadError)
                // We won't block parsing if storage fails, but we'll try to log it
            } else {
                setUploadedFilePath(filePath)
            }

            const token = (await supabase.auth.getSession()).data.session?.access_token
            const formData = new FormData()
            formData.append('file', file)

            const resp = await fetch(`${API_BASE_URL}/api/parse-resume`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            })

            const result = await resp.json()
            if (!resp.ok) {
                trackEvent('observability', 'resume_parse_failed', { error_message: result?.message || result?.error || 'Upload failed', status: resp.status })
                throw new Error(result?.message || result?.error || 'Upload failed')
            }

            setExtractedData({
                work_experience: result.experiences || [],
                accomplishments: result.experiences?.flatMap((e: any) => e.accomplishments || []) || [],
                education: result.education || [],
                certifications: result.certifications || [],
                profile_summary: result.profile_summary || '',
                areas_of_excellence: result.areas_of_excellence || []
            })
            await trackEvent('analytics', 'step_completed', { step_name: 'upload-resume', next_step: 'review-confirm' })
            setUploadStep('review')
        } catch (err: any) {
            setError(err.message || 'Failed to parse resume.')
            setUploadStep('uploading')
        }
        setExtracting(false)
    }

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        const f = e.dataTransfer.files[0]
        if (f) {
            const ext = f.name.toLowerCase()
            if (!ext.endsWith('.pdf') && !ext.endsWith('.docx')) {
                setError('Please upload a PDF or DOCX file.')
                return
            }
            setFile(f)
            setError(null)
        }
    }, [])

    // ─── Save confirmed data ───
    const handleConfirmAndSave = async () => {
        if (!extractedData) return
        setSaving(true)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('User not found')

            let resumeId = existingData?.resumeId

            // 1. Ensure master resume exists
            if (!resumeId) {
                const { data: newResumes, error: createError } = await supabase
                    .from('user_resumes')
                    .insert({
                        user_id: user.id,
                        is_master: true,
                        full_name: user?.user_metadata?.full_name || 'User',
                        email: user.email,
                        file_url: uploadedFilePath
                    })
                    .select('id')

                if (createError) throw createError
                if (!newResumes || newResumes.length === 0) throw new Error('Failed to create resume')

                resumeId = newResumes[0].id
            }

            // 2. Update resume with profile summary and areas of excellence and file url
            if (extractedData.profile_summary || extractedData.areas_of_excellence || uploadedFilePath) {
                const updatePayload: any = {}
                if (extractedData.profile_summary) updatePayload.profile_summary = extractedData.profile_summary
                if (extractedData.areas_of_excellence) updatePayload.areas_of_excellence = extractedData.areas_of_excellence
                if (uploadedFilePath) updatePayload.file_url = uploadedFilePath

                await supabase
                    .from('user_resumes')
                    .update(updatePayload)
                    .eq('id', resumeId)
            }

            // 3. Save work experiences and accomplishments
            if (extractedData.work_experience && extractedData.work_experience.length > 0) {
                for (const exp of extractedData.work_experience) {
                    const { data: newExps, error: expError } = await supabase
                        .from('work_experience')
                        .insert({
                            resume_id: resumeId,
                            company_name: exp.company_name,
                            job_title: exp.job_title,
                            location_city: exp.location_city,
                            location_country: exp.location_country,
                            start_date: exp.start_date,
                            end_date: exp.end_date,
                            is_current: exp.is_current || false,
                            scope_description: exp.scope_description
                        })
                        .select('id')

                    if (expError) {
                        console.error('Error saving experience:', expError, exp)
                        continue
                    }
                    if (!newExps || newExps.length === 0) continue

                    const newExp = newExps[0]
                    console.log('Saved experience:', newExp)

                    // Save accomplishments for this experience
                    if (exp.accomplishments && Array.isArray(exp.accomplishments)) {
                        const accomplishments = exp.accomplishments.map((bullet, idx) => ({
                            work_experience_id: newExp.id,
                            bullet_text: bullet,
                            order_index: idx,
                            is_featured: false
                        }))

                        if (accomplishments.length > 0) {
                            await supabase.from('accomplishments').insert(accomplishments)
                        }

                        // Also save to bank
                        const bankItems = exp.accomplishments.map(bullet => ({
                            user_id: user.id,
                            bullet_text: bullet,
                            role_title: exp.job_title || '',
                            company_name: exp.company_name || '',
                            source: 'imported',
                            is_starred: false,
                            times_used: 1
                        }))

                        if (bankItems.length > 0) {
                            await supabase.from('accomplishment_bank').insert(bankItems)
                        }
                    }
                }
            }

            // 4. Save education
            if (extractedData.education && extractedData.education.length > 0) {
                try {
                    const education = extractedData.education.map(edu => ({
                        resume_id: resumeId,
                        user_id: user.id, // Required by foreign key / RLS
                        institution: edu.institution || 'Unknown Institution',
                        institution_name: edu.institution || 'Unknown Institution', // Required NOT NULL in some schemas
                        degree_title: edu.degree_title || edu.degree || 'Unknown Degree',
                        field_of_study: edu.field_of_study,
                        graduation_year: edu.graduation_year?.toString(),
                        degree: edu.degree || 'Unknown Degree'
                    }))
                    const { error: eduError } = await supabase.from('education').insert(education)
                    if (eduError) console.error('Error saving education:', eduError)
                } catch (err) {
                    console.error('Failed to save education block:', err)
                }
            }

            // 5. Save certifications
            if (extractedData.certifications && extractedData.certifications.length > 0) {
                try {
                    const certifications = extractedData.certifications.map(cert => ({
                        resume_id: resumeId,
                        user_id: user.id, // Required by foreign key / RLS
                        certification_name: cert.certification_name || cert.name || 'Unknown Certification', // Required NOT NULL
                        issuing_organization: cert.issuing_organization || 'Unknown Organization', // Required NOT NULL
                        issue_date: cert.year || cert.issue_date,
                        name: cert.name || cert.certification_name || 'Unknown Certification',
                        year: cert.year || cert.issue_date
                    }))
                    const { error: certError } = await supabase.from('certifications').insert(certifications)
                    if (certError) console.error('Error saving certifications:', certError)
                } catch (err) {
                    console.error('Failed to save certifications block:', err)
                }
            }

            // Success — move to work experience manager
            await trackEvent('analytics', 'step_completed', { step_name: 'review-confirm', next_step: 'work-experience' })
            navigate('/resume/work-experience')
        } catch (err: any) {
            console.error('Error saving resume data:', err)
            setError(err.message || 'Failed to save your progress. Please try again.')
        }
        setSaving(false)
    }

    // ─── Loading check ───
    if (checkingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        )
    }

    // ─── Existing Data View ───
    if (path === null && existingData) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
                <div className="max-w-3xl mx-auto">
                    <button
                        onClick={() => navigate('/resume-builder')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Resume Builder
                    </button>

                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium mb-4">
                            <CheckCircle2 className="w-4 h-4" /> Data Found
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Your Work History
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            We found existing data in your account. You can manage it or start fresh.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                        {/* Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button
                                onClick={() => setExistingData(null)}
                                className="w-full py-4 px-6 bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold text-lg rounded-xl transition-all flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" /> Upload Resume
                            </button>

                            <button
                                onClick={async () => {
                                    await trackEvent('analytics', 'step_completed', { step_name: 'work-history-intake', next_step: 'work-experience' })
                                    navigate('/resume/work-experience')
                                }}
                                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                            >
                                <Pencil className="w-5 h-5" /> Build Manually
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Intake Question ───
    if (path === null) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
                <div className="max-w-3xl mx-auto">

                    {/* Back button */}
                    <button
                        onClick={() => navigate('/resume-builder')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back to Resume Builder
                    </button>

                    {/* Header */}
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium mb-4">
                            <Briefcase className="w-4 h-4" /> Step 1
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
                            Create Your Work History
                        </h1>
                        <p className="text-lg text-gray-600 dark:text-gray-400">
                            Start by importing your existing resume or building manually.
                        </p>
                    </div>

                    {/* Intake Question */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-2">
                            Want a head start? Upload your current resume.
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-center mb-8 text-sm">
                            We'll extract your history so you don't have to type it from scratch.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Yes — Upload */}
                            <button
                                onClick={async () => {
                                    trackEvent('analytics', 'resume_mode_selected', { has_resume: true })
                                    await trackEvent('analytics', 'step_completed', { step_name: 'work-history-intake', next_step: 'upload-resume' })
                                    setPath('upload')
                                }}
                                className="group bg-white dark:bg-gray-800 p-8 rounded-2xl border-2 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-xl transition-all text-left flex flex-col justify-between"
                            >
                                <div>
                                    <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                        <Upload className="w-7 h-7" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Yes, I have a resume</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm">Upload your PDF or Word document and we'll extract your history automatically using AI.</p>
                                </div>
                                <div className="mt-6 flex items-center text-blue-600 font-medium">
                                    Upload File <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </button>

                            <button
                                onClick={async () => {
                                    trackEvent('analytics', 'resume_mode_selected', { has_resume: false })
                                    trackEvent('analytics', 'resume_manual_entry_started')
                                    await trackEvent('analytics', 'step_completed', { step_name: 'work-history-intake', next_step: 'work-experience' })
                                    navigate('/resume/work-experience')
                                }}
                                className="group p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-600 hover:border-emerald-500 dark:hover:border-emerald-400 bg-gradient-to-br from-white to-emerald-50 dark:from-gray-800 dark:to-emerald-900/20 transition-all duration-300 hover:shadow-lg text-left"
                            >
                                <div className="p-3 w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <Pencil className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Build Manually</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    Start fresh. Add your work experience, education, certifications, and accomplishments step by step.
                                </p>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Upload Path UI ───
    if (path === 'upload') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
                <div className="max-w-4xl mx-auto">

                    {/* Back */}
                    <button
                        onClick={() => { setPath(null); setFile(null); setExtractedData(null); setUploadStep('uploading') }}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Back
                    </button>

                    <div className="text-center mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Upload Your Resume</h1>
                        <p className="text-gray-600 dark:text-gray-400">We'll extract your work history using AI.</p>
                    </div>

                    {/* Upload Area or Extracting or Review */}
                    {uploadStep === 'uploading' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
                            <div
                                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center hover:border-blue-500 transition-colors cursor-pointer"
                                onDrop={handleDrop}
                                onDragOver={e => e.preventDefault()}
                                onClick={() => document.getElementById('file-upload')?.click()}
                            >
                                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Drag and drop your resume here
                                </p>
                                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                                <p className="text-xs text-gray-400">Supports PDF and DOCX</p>
                                <input
                                    id="file-upload"
                                    type="file"
                                    accept=".pdf,.docx"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            {file && (
                                <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{file.name}</span>
                                    </div>
                                    <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-4 h-4" /></button>
                                </div>
                            )}

                            {error && (
                                <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl flex items-center gap-2 text-red-700 dark:text-red-300">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </div>
                            )}

                            <button
                                onClick={handleFileUpload}
                                disabled={!file || extracting}
                                className="mt-6 w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
                            >
                                <Upload className="w-5 h-5" /> Upload & Extract
                            </button>
                        </div>
                    )}

                    {uploadStep === 'extracting' && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Extracting Your Resume Data...</h3>
                            <p className="text-gray-500">Our AI is reading your resume and organizing the information.</p>

                            <div className="mt-8 space-y-3 max-w-sm mx-auto text-left">
                                {['Work Experience', 'Accomplishments', 'Education', 'Certifications'].map((item, i) => (
                                    <div key={item} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${i === 0 ? 'bg-blue-500 text-white animate-pulse' : 'bg-gray-200 dark:bg-gray-700'}`}>
                                            {i === 0 ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-xs">{i + 1}</span>}
                                        </div>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {uploadStep === 'review' && extractedData && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
                            {/* Review Header */}
                            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review & Confirm</h2>
                                        <p className="text-sm text-gray-500">Review what we extracted from your resume.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs */}
                            <div className="border-b border-gray-200 dark:border-gray-700">
                                <div className="flex">
                                    {([
                                        { key: 'experience', label: 'Work Experience', icon: Briefcase, count: extractedData.work_experience.length },
                                        { key: 'accomplishments', label: 'Accomplishments', icon: Award, count: extractedData.accomplishments.length },
                                        { key: 'education', label: 'Education', icon: GraduationCap, count: extractedData.education.length },
                                        { key: 'certifications', label: 'Certifications', icon: Award, count: extractedData.certifications.length }
                                    ] as const).map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`flex-1 px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === tab.key
                                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                                : 'border-transparent text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            <span className="ml-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-xs rounded-full">{tab.count}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6 max-h-[50vh] overflow-y-auto">
                                {activeTab === 'experience' && (
                                    <div className="space-y-4">
                                        {extractedData.work_experience.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No work experience extracted</p>
                                        ) : (
                                            extractedData.work_experience.map((exp: any, i: number) => (
                                                <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{exp.job_title || exp.title}</h4>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{exp.company_name || exp.company} • {exp.start_date} - {exp.end_date || 'Present'}</p>
                                                    {exp.scope_description && <p className="text-gray-500 text-sm mt-2">{exp.scope_description}</p>}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                {activeTab === 'accomplishments' && (
                                    <div className="space-y-2">
                                        {extractedData.accomplishments.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No accomplishments extracted</p>
                                        ) : (
                                            extractedData.accomplishments.map((bullet: string, i: number) => (
                                                <div key={i} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg flex items-start gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0" />
                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{bullet}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                {activeTab === 'education' && (
                                    <div className="space-y-3">
                                        {extractedData.education.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No education extracted</p>
                                        ) : (
                                            extractedData.education.map((edu: any, i: number) => (
                                                <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{edu.degree_title || edu.degree}</h4>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{edu.institution} • {edu.graduation_year}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                                {activeTab === 'certifications' && (
                                    <div className="space-y-3">
                                        {extractedData.certifications.length === 0 ? (
                                            <p className="text-gray-500 text-center py-8">No certifications extracted</p>
                                        ) : (
                                            extractedData.certifications.map((cert: any, i: number) => (
                                                <div key={i} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                                                    <h4 className="font-semibold text-gray-900 dark:text-white">{cert.certification_name || cert.name}</h4>
                                                    <p className="text-gray-600 dark:text-gray-400 text-sm">{cert.issuing_organization}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Confirm Button */}
                            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleConfirmAndSave}
                                    disabled={saving}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                                >
                                    <CheckCircle2 className="w-5 h-5" /> Confirm & Continue
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}
