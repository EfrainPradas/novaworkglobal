import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Target, TrendingUp, Clock, DollarSign, MapPin, Building, Star, ArrowRight, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Settings, Search } from 'lucide-react'
import { supabase } from '../../lib/supabase'

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

export default function AIJobSearch() {
    const navigate = useNavigate()
    const [user, setUser] = useState<any>(null)
    const [userProfile, setUserProfile] = useState<any>({
        skills: ['General Skills'],
        career_vision: { target_roles: ['Professional'] },
        preferences: { ideal_work: { industry: 'Technology', geographic_location: ['Remote'] } }
    })
    const [profileLoading, setProfileLoading] = useState(true)
    const [recommendations, setRecommendations] = useState<AIRecommendation[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [metadata, setMetadata] = useState<any>(null)
    const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set())

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
            const response = await fetch('/api/jobs/recommendations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
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
        if (score >= 80) return 'Excellent Match'
        if (score >= 60) return 'Good Match'
        return 'Potential Match'
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
        const jobData = {
            title: job.title,
            company: job.company,
            description: job.description,
            location: job.location,
            salary: job.salary,
            aiAnalysis: job.aiAnalysis
        }
        localStorage.setItem('jd-analyzer-job-data', JSON.stringify(jobData))
        navigate('/resume/jd-analyzer')
    }

    if (profileLoading) {
        return (
            <div className="py-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading profile data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {!recommendations.length && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 text-center transition-colors duration-200">
                    <div className="bg-purple-100 dark:bg-purple-900/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Job Matching</h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-lg mx-auto">
                        We'll search Google Jobs via SerpAPI using your profile (Skills, Target Roles, Location) to find the best opportunities for you.
                    </p>
                    <button
                        onClick={generateRecommendations}
                        disabled={loading}
                        className="px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto active:scale-95 transition-all"
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Analyzing & Searching...
                            </>
                        ) : (
                            <>
                                <Target className="w-4 h-4" />
                                Find My Dream Jobs
                            </>
                        )}
                    </button>

                    {userProfile && (
                        <div className="mt-6 text-sm text-gray-500">
                            Searching for: <span className="font-medium text-gray-700 dark:text-gray-300">{userProfile.career_vision.target_roles.slice(0, 2).join(', ')}</span>
                            {userProfile.preferences.ideal_work.geographic_location[0] && (
                                <span> in <span className="font-medium text-gray-700 dark:text-gray-300">{userProfile.preferences.ideal_work.geographic_location[0]}</span></span>
                            )}
                        </div>
                    )}
                </div>
            )}

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
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Found {metadata.totalJobsFound} Jobs</h3>
                            <p className="text-sm text-gray-500"> AI Curated Top {metadata.jobsRecommended} Matches (Avg Score: {metadata.averageScore}%)</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={generateRecommendations}
                                disabled={loading}
                                className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center gap-2"
                            >
                                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                            <button
                                onClick={clearSavedRecommendations}
                                className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
                            >
                                Clear Results
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
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400" onClick={() => toggleJobExpansion(job.id)}>
                                                {job.title}
                                            </h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getMatchScoreColor(job.matchScore)}`}>
                                                {job.matchScore}% Match
                                            </span>
                                            {job.source === 'Demo' && (
                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">Demo</span>
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
                                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-4 mb-4 border border-indigo-100 dark:border-indigo-800/50">
                                        <div className="flex items-start gap-3">
                                            <div className="mt-1">
                                                <Brain className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-indigo-900 dark:text-indigo-200 mb-2">{job.aiAnalysis.reasoning}</p>
                                                {job.aiAnalysis.keyMatches.length > 0 && (
                                                    <div className="flex flex-wrap gap-2">
                                                        {job.aiAnalysis.keyMatches.slice(0, 3).map((match, i) => (
                                                            <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white/60 dark:bg-black/20 text-indigo-700 dark:text-indigo-300 rounded-md">
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
                                        {expandedJobs.has(job.id) ? 'Less Details' : 'More Details'}
                                    </button>

                                    <button
                                        onClick={() => handleJobAnalysis(job)}
                                        className="px-4 py-2 bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:hover:bg-purple-900/60 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors"
                                    >
                                        <Settings className="w-4 h-4" />
                                        Analyze JD
                                    </button>

                                    {job.applyLink && (
                                        <a
                                            href={job.applyLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium text-sm flex items-center gap-2 transition-colors shadow-sm hover:shadow"
                                        >
                                            Apply Now
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            </div>

                            {expandedJobs.has(job.id) && (
                                <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 p-6">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">Full Description</h4>
                                    <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-300">
                                        {job.description?.split('\n').map((paragraph, index) => (
                                            <p key={index} className="mb-3 leading-relaxed">{paragraph}</p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
