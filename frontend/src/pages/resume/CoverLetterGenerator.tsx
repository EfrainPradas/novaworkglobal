import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
    FileText,
    Sparkles,
    Download,
    Save,
    Copy,
    Check,
    AlertCircle,
    ArrowLeft,
    Briefcase,
    Building,
    Settings,
    RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

interface CoverLetterMetadata {
    jobTitle: string
    companyName: string
    tone: string
    generatedAt: string
    wordCount: number
}

export default function CoverLetterGenerator() {
    const navigate = useNavigate()
    const location = useLocation()
    const [user, setUser] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)
    const [saved, setSaved] = useState(false)

    // Form inputs
    const [jobTitle, setJobTitle] = useState('')
    const [companyName, setCompanyName] = useState('')
    const [jobDescription, setJobDescription] = useState('')
    const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'formal'>('professional')
    const [highlights, setHighlights] = useState<string[]>([])
    const [newHighlight, setNewHighlight] = useState('')

    // Output
    const [coverLetter, setCoverLetter] = useState('')
    const [metadata, setMetadata] = useState<CoverLetterMetadata | null>(null)

    useEffect(() => {
        checkUser()

        // Auto-fill from navigation state (e.g. from JD Analyzer)
        if (location.state) {
            const { jobTitle, companyName, jobDescription } = location.state
            if (jobTitle) setJobTitle(jobTitle)
            if (companyName) setCompanyName(companyName)
            if (jobDescription) setJobDescription(jobDescription)
        }
    }, [location.state])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            navigate('/login')
            return
        }
        setUser(user)
    }

    const generateCoverLetter = async () => {
        if (!jobTitle.trim() || !companyName.trim()) {
            setError('Please enter both job title and company name')
            return
        }

        setLoading(true)
        setError(null)
        setSaved(false)

        try {
            const response = await fetch('/api/cover-letter/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    jobTitle,
                    companyName,
                    jobDescription,
                    tone,
                    highlights
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || 'Failed to generate cover letter')
            }

            setCoverLetter(data.coverLetter)
            setMetadata(data.metadata)
            console.log('✅ Cover letter generated:', data.metadata)
        } catch (err: any) {
            console.error('❌ Error generating cover letter:', err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const saveCoverLetter = async () => {
        if (!coverLetter) return

        try {
            const response = await fetch('/api/cover-letter/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    jobTitle,
                    companyName,
                    jobDescription,
                    coverLetterText: coverLetter,
                    tone
                })
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.details || 'Failed to save cover letter')
            }

            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err: any) {
            console.error('❌ Error saving cover letter:', err)
            setError(err.message)
        }
    }

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(coverLetter)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            console.error('Failed to copy:', err)
        }
    }

    const addHighlight = () => {
        if (newHighlight.trim() && highlights.length < 5) {
            setHighlights([...highlights, newHighlight.trim()])
            setNewHighlight('')
        }
    }

    const removeHighlight = (index: number) => {
        setHighlights(highlights.filter((_, i) => i !== index))
    }

    const downloadAsText = () => {
        const blob = new Blob([coverLetter], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Cover_Letter_${companyName.replace(/\s+/g, '_')}_${jobTitle.replace(/\s+/g, '_')}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-slate-900 transition-colors duration-200">
            <div className="max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl text-white shadow-lg">
                            <FileText className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cover Letter Generator</h1>
                            <p className="text-gray-600 dark:text-gray-300">AI-powered personalized cover letters in seconds</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/resume-builder')}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back to Resume Hub
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left: Input Form */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-all">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            Job Details
                        </h2>

                        {/* Job Title */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Briefcase className="w-4 h-4 inline mr-1" />
                                Job Title *
                            </label>
                            <input
                                type="text"
                                value={jobTitle}
                                onChange={(e) => setJobTitle(e.target.value)}
                                placeholder="e.g. Senior Software Engineer"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>

                        {/* Company Name */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Building className="w-4 h-4 inline mr-1" />
                                Company Name *
                            </label>
                            <input
                                type="text"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                placeholder="e.g. Google"
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>

                        {/* Job Description */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Job Description (Optional)
                            </label>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste the job description here for more personalized results..."
                                rows={5}
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none placeholder-gray-400 dark:placeholder-gray-500"
                            />
                        </div>

                        {/* Tone Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Tone
                            </label>
                            <div className="flex gap-3">
                                {(['professional', 'enthusiastic', 'formal'] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTone(t)}
                                        className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all capitalize ${tone === t
                                            ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Highlights */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Key Highlights to Include (Optional)
                            </label>
                            <div className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={newHighlight}
                                    onChange={(e) => setNewHighlight(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && addHighlight()}
                                    placeholder="e.g. Led team of 10 engineers"
                                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                                />
                                <button
                                    onClick={addHighlight}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Add
                                </button>
                            </div>
                            {highlights.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {highlights.map((h, i) => (
                                        <span
                                            key={i}
                                            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 rounded-full text-sm flex items-center gap-2 border border-purple-200 dark:border-purple-700"
                                        >
                                            {h}
                                            <button
                                                onClick={() => removeHighlight(i)}
                                                className="hover:text-purple-900 dark:hover:text-purple-100"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-300">
                                <AlertCircle className="w-5 h-5" />
                                {error}
                            </div>
                        )}

                        {/* Generate Button */}
                        <button
                            onClick={generateCoverLetter}
                            disabled={loading || !jobTitle.trim() || !companyName.trim()}
                            className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
                        >
                            {loading ? (
                                <>
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-5 h-5" />
                                    Generate Cover Letter
                                </>
                            )}
                        </button>
                    </div>

                    {/* Right: Output */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                Your Cover Letter
                            </h2>
                            {metadata && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {metadata.wordCount} words
                                </span>
                            )}
                        </div>

                        {coverLetter ? (
                            <>
                                <div className="prose prose-sm max-w-none mb-6">
                                    <textarea
                                        value={coverLetter}
                                        onChange={(e) => setCoverLetter(e.target.value)}
                                        className="w-full h-96 px-4 py-3 border border-gray-200 dark:border-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-serif text-gray-700 leading-relaxed"
                                    />
                                </div>

                                {/* Action Buttons */}
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex-1 py-3 px-4 border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                                    >
                                        {copied ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="w-5 h-5" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={downloadAsText}
                                        className="flex-1 py-3 px-4 border-2 border-purple-600 dark:border-purple-500 text-purple-600 dark:text-purple-400 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                                    >
                                        <Download className="w-5 h-5" />
                                        Download
                                    </button>
                                    <button
                                        onClick={saveCoverLetter}
                                        className="flex-1 py-3 px-4 bg-purple-600 dark:bg-purple-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-purple-700 dark:hover:bg-purple-600 transition-all"
                                    >
                                        {saved ? (
                                            <>
                                                <Check className="w-5 h-5" />
                                                Saved!
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-5 h-5" />
                                                Save
                                            </>
                                        )}
                                    </button>
                                </div>

                                {/* Metadata */}
                                {metadata && (
                                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                                        <p><strong>Job:</strong> {metadata.jobTitle} at {metadata.companyName}</p>
                                        <p><strong>Tone:</strong> {metadata.tone}</p>
                                        <p><strong>Generated:</strong> {new Date(metadata.generatedAt).toLocaleString()}</p>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-96 text-gray-400 dark:text-gray-500">
                                <FileText className="w-16 h-16 mb-4 opacity-50" />
                                <p className="text-lg font-medium">Your cover letter will appear here</p>
                                <p className="text-sm">Fill in the job details and click Generate</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
