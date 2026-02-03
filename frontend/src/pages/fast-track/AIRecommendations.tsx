import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Target, TrendingUp, Clock, DollarSign, MapPin, Building, Star, ArrowRight, RefreshCw, AlertCircle, CheckCircle, ExternalLink, Settings } from 'lucide-react'
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

export default function AIRecommendations() {
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

  // Auto-Apply State
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set())
  const [applying, setApplying] = useState(false)
  const [autoApplyConfig, setAutoApplyConfig] = useState({
    minSalary: '',
    workType: 'any',
    includeCoverLetter: true
  })

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
    if (!user) {
      navigate('/login')
      return
    }
    setUser(user)
    loadUserProfile(user.id)
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
          : ['Software Engineer']) // Default to common role

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

      console.log('📊 User profile loaded:', profile)
      console.log('🎯 Target roles for job search:', targetRoles)
      setUserProfile(profile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      // Keep the default profile that was set on initialization
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

      // Save to localStorage for persistence
      saveRecommendationsToStorage(data.recommendations, data.metadata)

      console.log('✅ AI Recommendations generated:', data.metadata)
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

        // Only restore if data is less than 30 minutes old
        const timestamp = new Date(parsedData.timestamp)
        const now = new Date()
        const diffMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60)

        if (diffMinutes < 30) {
          return parsedData
        } else {
          // Clear old data
          localStorage.removeItem('ai-recommendations-data')
        }
      }
    } catch (error) {
      console.error('Error loading recommendations:', error)
    }
    return null
  }

  const handleJobAnalysis = (job: AIRecommendation) => {
    // Store job data in localStorage for JD Analyzer to pick up
    const jobData = {
      title: job.title,
      company: job.company,
      description: job.description,
      location: job.location,
      salary: job.salary,
      aiAnalysis: job.aiAnalysis
    }

    localStorage.setItem('jd-analyzer-job-data', JSON.stringify(jobData))

    // Navigate to JD Analyzer
    navigate('/resume/jd-analyzer')
  }

  const clearSavedRecommendations = () => {
    localStorage.removeItem('ai-recommendations-data')
    setRecommendations([])
    setMetadata(null)
    setError(null)
    console.log('🗑️ Cleared saved recommendations')
  }

  // --- Auto-Apply Logic ---

  const handleToggleSelection = (jobId: string) => {
    setSelectedJobs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(jobId)) {
        newSet.delete(jobId)
      } else {
        newSet.add(jobId)
      }
      return newSet
    })
  }

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedJobs(new Set(recommendations.map(j => j.id)))
    } else {
      setSelectedJobs(new Set())
    }
  }

  const handleAutoApply = async () => {
    const jobsToApply = recommendations.filter(job => selectedJobs.has(job.id))

    if (jobsToApply.length === 0) {
      alert('Please select at least one job to apply.')
      return
    }

    const confirmed = window.confirm(`Ready to auto-apply to ${jobsToApply.length} jobs?\n\nDirectives:\n- Cover Letter: ${autoApplyConfig.includeCoverLetter ? 'Yes' : 'No'}\n- Remote: ${autoApplyConfig.workType === 'remote' ? 'Strict' : 'Flexible'}\n\nThis will simulate the application process.`)

    if (!confirmed) return

    setApplying(true)

    try {
      // Simulate batch processing
      for (const job of jobsToApply) {
        console.log(`🚀 Applying to ${job.title} at ${job.company}...`)

        if (autoApplyConfig.includeCoverLetter) {
          console.log(`   📝 Generating Cover Letter for ${job.company}...`)
          // In a real app, call the generator API here
        }

        // Determine status
        const applicationStatus = 'applied'

        // Save to database as "Applied"
        await supabase.from('tailored_resumes').insert({
          user_id: user.id,
          job_title: job.title,
          company_name: job.company,
          status: 'sent', // Mark as sent/applied directly
          match_score: job.matchScore,
          application_status: applicationStatus,
          sent_at: new Date().toISOString()
        })

        // Simulate network delay
        await new Promise(r => setTimeout(r, 800))
      }

      alert(`✅ Successfully auto-applied to ${jobsToApply.length} jobs! Check your Resume Tracker to track status.`)
      setSelectedJobs(new Set()) // Clear selection

    } catch (err: any) {
      console.error('Auto-apply error:', err)
      alert('Error during auto-apply sequence: ' + err.message)
    } finally {
      setApplying(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-6 transition-colors duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Job Recommendations</h1>
                <p className="text-gray-600 dark:text-gray-400">Personalized job matches based on your career vision and skills</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Generate Button */}
        {!recommendations.length && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8 mb-6 text-center transition-colors duration-200">
            <Brain className="w-16 h-16 text-purple-600 dark:text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">AI-Powered Job Matching</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Our AI analyzes your career vision, skills, and preferences to find the best job matches across multiple sources.
            </p>
            <button
              onClick={generateRecommendations}
              disabled={loading}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing your profile...
                </>
              ) : (
                <>
                  <Target className="w-4 h-4" />
                  Generate Recommendations
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 text-red-800">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Metadata Display */}
        {metadata && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{metadata.jobsRecommended}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Jobs Recommended</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{metadata.averageScore}%</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Average Match Score</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{metadata.jobsAnalyzed}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Jobs Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600 dark:text-gray-300">{metadata.totalJobsFound}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Jobs Found</div>
              </div>
            </div>
          </div>
        )}

        {/* Auto-Apply Control Panel - DISABLED FOR LAUNCH
        <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 mb-8">
           ... (Auto-Apply Panel code commented out) ...
        </div>
        */}

        {/* Recommendations List */}
        {recommendations.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Your AI Recommendations</h2>
                {metadata && (
                  <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                    Restored from cache
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={generateRecommendations}
                  disabled={loading}
                  className="px-4 py-2 text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
                <button
                  onClick={clearSavedRecommendations}
                  className="px-4 py-2 text-red-600 hover:text-red-700 font-medium text-sm"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {recommendations.map((job) => (
                <div key={job.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors duration-200">
                  <div className="p-6">
                    {/* Job Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-purple-600 dark:hover:text-purple-400" onClick={() => toggleJobExpansion(job.id)}>
                            {job.title}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getMatchScoreColor(job.matchScore)}`}>
                            {job.matchScore}% - {getMatchScoreLabel(job.matchScore)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4" />
                            {job.company}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {job.location}
                          </div>
                          {job.salary && (
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              {job.salary}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.postedAt}
                          </div>
                        </div>
                      </div>
                      {job.thumbnail && (
                        <img src={job.thumbnail} alt={job.company} className="w-12 h-12 rounded-lg object-cover ml-4" />
                      )}
                    </div>

                    {/* Job Description Preview */}
                    <p className="text-gray-700 dark:text-gray-300 mb-4 line-clamp-2">
                      {job.description?.slice(0, 200)}...
                    </p>

                    {/* AI Analysis */}
                    {job.aiAnalysis && (
                      <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          <span className="font-medium text-purple-900 dark:text-purple-200">AI Analysis</span>
                        </div>
                        <p className="text-sm text-purple-800 dark:text-purple-300 mb-3">{job.aiAnalysis.reasoning}</p>

                        {job.aiAnalysis.keyMatches.length > 0 && (
                          <div className="mb-2">
                            <span className="text-xs font-medium text-purple-700">Key Matches:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {job.aiAnalysis.keyMatches.map((match, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {match}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {job.aiAnalysis.potentialConcerns.length > 0 && (
                          <div>
                            <span className="text-xs font-medium text-orange-700">Consider:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {job.aiAnalysis.potentialConcerns.map((concern, index) => (
                                <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                  {concern}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Star className="w-4 h-4" />
                        Recommended {new Date(job.recommendedAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleJobExpansion(job.id)}
                          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                        >
                          {expandedJobs.has(job.id) ? 'Hide Details' : 'View Details'}
                        </button>
                        {job.applyLink && (
                          <a
                            href={job.applyLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-2"
                          >
                            Apply Now
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button
                          onClick={() => handleJobAnalysis(job)}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-sm flex items-center gap-2"
                        >
                          Analyze Job
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedJobs.has(job.id) && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-6 bg-gray-50 dark:bg-gray-900/50">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Full Job Description</h4>
                      <div className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300">
                        {job.description?.split('\n').map((paragraph, index) => (
                          <p key={index} className="mb-3">{paragraph}</p>
                        ))}
                      </div>
                      {job.highlights && Object.keys(job.highlights).length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Job Highlights</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {Object.entries(job.highlights).map(([key, items]) => {
                              // Handle different data structures safely
                              let displayContent = '';
                              if (Array.isArray(items)) {
                                displayContent = items.join(', ');
                              } else if (typeof items === 'object' && items !== null) {
                                // If it's an object with title/items structure
                                if (items.items && Array.isArray(items.items)) {
                                  displayContent = items.items.join(', ');
                                } else if (items.title) {
                                  displayContent = items.title;
                                } else {
                                  displayContent = JSON.stringify(items);
                                }
                              } else {
                                displayContent = String(items || '');
                              }

                              return (
                                <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-3">
                                  <div className="font-medium text-sm text-gray-900 dark:text-white mb-1 capitalize">
                                    {key.replace(/_/g, ' ')}
                                  </div>
                                  <div className="text-xs text-gray-600 dark:text-gray-400">
                                    {displayContent}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}