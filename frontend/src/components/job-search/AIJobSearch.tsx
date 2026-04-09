import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Brain, Target, TrendingUp, Clock, DollarSign, MapPin, Building, Star, ArrowRight, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Settings, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

const API_BASE_URL = import.meta.env.VITE_API_URL || ''

interface AIRecommendation {
    id: string
    title: string
    company: string
    location: string
    description: string
    salary?: string
    postedAt: string
    applyLink?: string
    source: string
    matchScore: number
    aiAnalysis?: {
        reasoning: string
        keyMatches: string[]
        potentialConcerns: string[]
    }
    highlights?: any[]
    thumbnail?: string
    recommendedAt: string
}

interface RecommendationsResponse {
    success: boolean
    recommendations: AIRecommendation[]
    metadata: {
        userId: string
        generatedAt: string
        totalJobsFound: number
        jobsAnalyzed: number
        jobsRecommended: number
        averageScore: number
    }
}

export default function AIJobSearch({ children }: { children?: React.ReactNode }) {
    const navigate = useNavigate()
    const { t } = useTranslation()
    const [user, setUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>({
        skills: [t('jobSearch.ai.generalSkills', 'General Skills')],
        career_vision: { target_roles: [t('jobSearch.ai.professional', 'Professional')] },
        preferences: { ideal_work: { industry: t('jobSearch.ai.technology', 'Technology'), geographic_location: [t('jobSearch.ai.remote', 'Remote')] } }
    })
    const [profileLoading, setProfileLoading] = useState(true)
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [metadata, setMetadata] = useState<any>(null)
    const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())
    const [editingRole, setEditingRole] = useState(false)
    const [editingLocation, setEditingLocation] = useState(false)
    const [roleInput, setRoleInput] = useState('')
    const [locationInput, setLocationInput] = useState('')

    useEffect(() => {
        checkUser()
        checkForSavedRecommendations()
    }, [])

    const checkForSavedRecommendations = () => {
        const savedData = loadRecommendationsFromStorage()
        if (savedData) {
            console.log('🔄 Restoring saved recommendations...')
            setRecommendations(savedData.recommendations)
            setMetadata(savedData.metadata)
        }
    }

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser(user)
            loadUserProfile(user.id)
        }
    }

    const loadUserProfile = async (userId: string) => {
        setProfileLoading(true)
        try {
            // Get career vision data
            const { data: careerVision } = await supabase
                .from('career_vision_profiles')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            // Get user resume with skills
            const { data: resume } = await supabase
                .from('user_resumes')
                .select('id, areas_of_excellence, profile_summary, full_name')
                .eq('user_id', userId)
                .eq('is_master', true)
                .maybeSingle()

            // Get work experience to extract job titles
            let jobTitles: string[] = []
            if (resume?.id) {
                const { data: workExperience } = await supabase
                    .from('work_experience')
                    .select('job_title, company_name')
                    .eq('resume_id', resume.id)
                    .order('start_date', { ascending: false })
                    .limit(3)

                if (workExperience && workExperience.length > 0) {
                    jobTitles = workExperience.map(we => we.job_title).filter(Boolean)
                }
            }

            // Get work preferences
            const { data: preferences } = await supabase
                .from('ideal_work_preferences')
                .select('*')
                .eq('user_id', userId)
                .maybeSingle()

            // Build profile with actual data or smart defaults
            const targetRoles = jobTitles.length > 0
                ? jobTitles
                : (careerVision?.career_vision_statement
                    ? [careerVision.career_vision_statement.split(' ').slice(0, 4).join(' ')]
                    : ['Software Engineer'])

            const profile = {
                skills: resume?.areas_of_excellence || ['Software Development'],
                career_vision: {
                    target_roles: targetRoles
                },
                preferences: {
                    ideal_work: {
                        industry: preferences?.industry_preference || 'Technology',
                        geographic_location: [preferences?.geographic_preference || 'Remote']
                    }
                }
            }

            setUserProfile(profile)
        } catch (error) {
            console.error('Error loading user profile:', error)
        } finally {
            setProfileLoading(false)
        }
    }

    const generateRecommendations = async () => {
        if (!user || !userProfile) {
            setError('User profile not loaded')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const { data: { session } } = await supabase.auth.getSession()

            if (!session) {
                setError('Authentication required')
                setLoading(false)
                return
            }

            const response = await fetch(`${API_BASE_URL}/api/jobs/recommendations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                },
                body: JSON.stringify({
                    userId: user.id,
                    userProfile,
                    limit: 15
                })
            })

            const data: RecommendationsResponse = await response.json()

            if (!response.ok) {
                throw new Error((data as any).details || 'Failed to generate recommendations')
            }

            setRecommendations(data.recommendations)
            setMetadata(data.metadata)
            saveRecommendationsToStorage(data.recommendations, data.metadata)
        } catch (error: any) {
            console.error('❌ AI Recommendations error:', error)
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    const toggleJobExpansion = (jobId: string) => {
        setExpandedJobs(prev => {
            const newSet = new Set(prev)
            if (newSet.has(jobId)) {
                newSet.delete(jobId)
            } else {
                newSet.add(jobId)
            }
            return newSet
        })
    }

    const getMatchScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800'
        if (score >= 60) return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800'
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
    }

    const getMatchScoreLabel = (score: number) => {
        if (score >= 80) return t('jobSearch.ai.excellentMatch', 'Excellent Match')
        if (score >= 60) return t('jobSearch.ai.goodMatch', 'Good Match')
        return t('jobSearch.ai.potentialMatch', 'Potential Match')
    }

    const saveRecommendationsToStorage = (recommendations: AIRecommendation[], metadata: any) => {
        try {
            const dataToSave = {
                recommendations,
                metadata,
                timestamp: new Date().toISOString()
            }
            localStorage.setItem('ai-recommendations-data', JSON.stringify(dataToSave))
        } catch (error) {
            console.error('Error saving recommendations:', error)
        }
    }

    const loadRecommendationsFromStorage = () => {
        try {
            const savedData = localStorage.getItem('ai-recommendations-data')
            if (savedData) {
                const parsedData = JSON.parse(savedData)
                const timestamp = new Date(parsedData.timestamp)
                const now = new Date()
                const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60)

                if (diffMinutes < 30) {
                    return parsedData
                } else {
                    localStorage.removeItem('ai-recommendations-data')
                }
            }
        } catch (error) {
            console.error('Error loading recommendations:', error)
        }
        return null
    }

    const clearSavedRecommendations = () => {
        localStorage.removeItem('ai-recommendations-data')
        setRecommendations([])
        setMetadata(null)
        setError(null)
    }

    const handleJobAnalysis = (job: AIRecommendation) => {
        // Build the most complete description possible by combining all available data
        const parts: string[] = []

        // 1. Add highlights (structured sections like Qualifications, Responsibilities)
        if (job.highlights && job.highlights.length > 0) {
            job.highlights.forEach((h: any) => {
                if (typeof h === 'string') {
                    parts.push(h)
                } else if (h.title && h.items) {
                    parts.push(`${h.title}:\n${h.items.map((item: string) => `• ${item}`).join('\n')}`)
                } else if (h.items) {
                    parts.push(h.items.map((item: string) => `• ${item}`).join('\n'))
                }
            })
        }

        // 2. Add raw description if different from highlights content
        if (job.description && job.description.trim()) {
            parts.push(job.description.trim())
        }

        // 3. If still nothing, use AI analysis as structured JD
        if (parts.length === 0 && job.aiAnalysis) {
            if (job.aiAnalysis.reasoning) parts.push(job.aiAnalysis.reasoning)
            if (job.aiAnalysis.keyMatches?.length > 0) {
                parts.push(`Key Requirements:\n${job.aiAnalysis.keyMatches.map((m: string) => `• ${m}`).join('\n')}`)
            }
        }

        const description = parts.join('\n\n').trim()

        const jobData = {
            title: job.title,
            company: job.company,
            description,
            location: job.location,
            salary: job.salary,
            aiAnalysis: job.aiAnalysis
        }
        localStorage.setItem('jd-analyzer-job-data', JSON.stringify(jobData))
        navigate('/dashboard/resume-builder/jd-analyzer')
    }

    if (profileLoading) {
        return (
            <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500">{t('jobSearch.ai.loadingProfile', 'Loading profile data...')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Search Bar - Always visible */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 transition-colors duration-200 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0 bg-primary-100 dark:bg-primary-900/30 w-10 h-10 rounded-full flex items-center justify-center">
                        <Search className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                        <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                            <h2 className="text-base font-bold text-gray-900 dark:text-white">{t('jobSearch.hub.aiMatchingTitle', 'AI-Powered Job Matching')}</h2>
                            {userProfile && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* Role field */}
                                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
                                        {editingRole ? (
                                            <input
                                                autoFocus
                                                value={roleInput}
                                                onChange={e => setRoleInput(e.target.value)}
                                                onBlur={() => {
                                                    if (roleInput.trim()) {
                                                        setUserProfile((p: any) => ({ ...p, career_vision: { ...p.career_vision, target_roles: [roleInput.trim()] } }))
                                                    }
                                                    setEditingRole(false)
                                                }}
                                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                                className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none w-32"
                                                placeholder="e.g. Data Analyst"
                                            />
                                        ) : (
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {userProfile.career_vision.target_roles.slice(0, 1).join(', ')}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => { setRoleInput(userProfile.career_vision.target_roles[0] || ''); setEditingRole(true) }}
                                            className="text-gray-400 hover:text-primary-600 transition-colors text-xs"
                                            title="Edit role"
                                        >✏️</button>
                                    </div>

                                    {/* Location field */}
                                    <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-0.5 rounded-full border border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-500 dark:text-gray-400">in</span>
                                        {editingLocation ? (
                                            <input
                                                autoFocus
                                                value={locationInput}
                                                onChange={e => setLocationInput(e.target.value)}
                                                onBlur={() => {
                                                    if (locationInput.trim()) {
                                                        setUserProfile((p: any) => ({ ...p, preferences: { ...p.preferences, ideal_work: { ...p.preferences.ideal_work, geographic_location: [locationInput.trim()] } } }))
                                                    }
                                                    setEditingLocation(false)
                                                }}
                                                onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
                                                className="text-xs font-medium text-gray-700 dark:text-gray-300 bg-transparent border-none outline-none w-24"
                                                placeholder="e.g. Remote"
                                            />
                                        ) : (
                                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                                {userProfile.preferences.ideal_work.geographic_location[0]}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => { setLocationInput(userProfile.preferences.ideal_work.geographic_location[0] || ''); setEditingLocation(true) }}
                                            className="text-gray-400 hover:text-primary-600 transition-colors text-xs"
                                            title="Edit location"
                                        >✏️</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 hidden md:block mt-0.5">
                            {t('jobSearch.hub.aiMatchingDesc', 'Auto-search Google Jobs via SerpAPI based on your profile skills & preferences.')}
                        </p>
                    </div>
                </div>

                <button
                    onClick={generateRecommendations}
                    disabled={loading}
                    className="flex-shrink-0 px-5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm transition-all shadow-sm hover:shadow"
                >
                    {loading ? (
                        <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            {t('jobSearch.ai.analyzing', 'Analyzing...')}
                        </>
                    ) : (
                        <>
                            <Target className="w-4 h-4" />
                            {t('jobSearch.hub.findMyJob', 'Find My Job')}
                        </>
                    )}
                </button>
            </div>

            {/* Modules Grid Slot */}
            {children}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800">
                        <AlertCircle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                </div>
            )}

            {metadata && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('jobSearch.ai.foundJobs', 'Found {{count}} Jobs', { count: metadata.totalJobsFound })}</h3>
                            <p className="text-sm text-gray-500"> {t('jobSearch.ai.aiCuratedTop', 'AI Curated Top {{count}} Matches (Avg Score: {{score}}%)', { count: metadata.jobsRecommended, score: metadata.averageScore })}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={generateRecommendations}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                {t('jobSearch.ai.refresh', 'Refresh')}
                            </button>
                            <button
                                onClick={clearSavedRecommendations}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                            >
                                {t('jobSearch.ai.clearResults', 'Clear Results')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {recommendations.length > 0 && (
                <div className="grid grid-cols-1 gap-6">
                    {recommendations.map((job) => (
                        <div key={job.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
                            <div className="p-6">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400" onClick={() => toggleJobExpansion(job.id)}>
                                                {job.title}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getMatchScoreColor(job.matchScore)}`}>
                                                {t('jobSearch.ai.matchPercent', '{{score}}% Match', { score: job.matchScore })}
                                            </span>
                                            {job.source === 'Demo' && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">{t('jobSearch.ai.demo', 'Demo')}</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-x-4 gap-y-2 flex-wrap text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-1">
                                                <Building className="w-4 h-4 text-gray-400" />
                                                {job.company}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                {job.location}
                                            </div>
                                            {job.salary && (
                                                <div className="flex items-center gap-1 font-medium text-green-600 dark:text-green-400">
                                                    <DollarSign className="w-4 h-4" />
                                                    {job.salary}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1 text-gray-400">
                                                <Clock className="w-4 h-4" />
                                                {job.postedAt}
                                            </div>
                                        </div>
                                    </div>
                                    {job.thumbnail && (
                                        <img src={job.thumbnail} alt={job.company} className="w-12 h-12 rounded-lg object-contain bg-white border border-gray-100 p-1 ml-4" />
                                    )}
                                </div>

                                {job.aiAnalysis && (
                                    <div className="bg-gradient-to-r from-primary-50 to-primary-50 dark:from-primary-900/20 dark:to-primary-900/20 rounded-lg p-4 mb-4 border border-primary-100 dark:border-primary-800/50">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <Brain className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-primary-900 dark:text-primary-200 mb-2">{job.aiAnalysis.reasoning}</p>
                                                {job.aiAnalysis.keyMatches.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.aiAnalysis.keyMatches.slice(0, 3).map((match, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/60 dark:bg-black/20 text-primary-700 dark:text-primary-300 rounded-md">
                                                                <CheckCircle className="w-3 h-3" /> {match}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        onClick={() => toggleJobExpansion(job.id)}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 font-medium text-sm px-3 py-2"
                                    >
                                        {expandedJobs.has(job.id) ? t('jobSearch.ai.lessDetails', 'Less Details') : t('jobSearch.ai.moreDetails', 'More Details')}
                                    </button>

                                    <button
                                        onClick={() => handleJobAnalysis(job)}
                                        className="px-4 py-2 bg-primary-100 text-primary-700 hover:bg-primary-200 dark:bg-primary-900/40 dark:text-primary-300 dark:hover:bg-primary-900/60 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        {t('jobSearch.ai.analyzeJD', 'Analyze JD')}
                                    </button>

                                    {job.applyLink && (
                                        <a
                                            href={job.applyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                                        >
                                            {t('jobSearch.ai.applyNow', 'Apply Now')}
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {expandedJobs.has(job.id) && (
                                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-6">
                                    {/* Structured highlights (Qualifications, Responsibilities, etc.) */}
                                    {job.highlights && job.highlights.length > 0 ? (
                                        <div className="space-y-4">
                                            {job.highlights.map((section: any, i: number) => (
                                                <div key={i}>
                                                    {section.title && (
                                                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm uppercase tracking-wide">
                                                            {section.title}
                                                        </h4>
                                                    )}
                                                    {section.items && (
                                                        <ul className="space-y-1">
                                                            {section.items.map((item: string, j: number) => (
                                                                <li key={j} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                                    <span className="text-primary-500 mt-0.5 flex-shrink-0">•</span>
                                                                    <span>{item}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                            {/* Also show raw description if available */}
                                            {job.description && (
                                                <div>
                                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-2 text-sm uppercase tracking-wide">{t('jobSearch.ai.description', 'Description')}</h4>
                                                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{job.description}</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : job.description ? (
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">{t('jobSearch.ai.fullDescription', 'Full Description')}</h4>
                                            <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
                                                {job.description.split('\n').map((paragraph: string, index: number) => (
                                                    <p key={index} className="mb-3 leading-relaxed">{paragraph}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                                            {t('jobSearch.ai.noDescription', 'No description available. Click "Analyze JD" to proceed with AI-generated insights.')}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
