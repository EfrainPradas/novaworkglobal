/**
 * New Interview Preparation Form
 * Create a new interview preparation with company, role, and interview details
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import {
  INTERVIEW_TYPE_WHO,
  INTERVIEW_TYPE_HOW,
  INTERVIEW_TYPE_WHEN,
  INTERVIEW_TYPE_HOW_MANY,
  INTERVIEW_TYPE_DESCRIPTIONS
} from '../../types/interview'

interface TrackedApplication {
  id: string
  job_title: string
  company_name: string
  match_score?: number
  application_status?: string
  sent_at?: string
  // Include other fields that actually exist
  tailored_profile?: string
  [key: string]: any // Allow additional fields
}

export default function NewInterview() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<TrackedApplication[]>([])
  const [selectedApplication, setSelectedApplication] = useState<TrackedApplication | null>(null)
  const [showApplicationSelector, setShowApplicationSelector] = useState(true)
  const [formData, setFormData] = useState({
    company_name: '',
    position_title: '',
    job_description: '',
    jd_url: '',
    interview_date: '',
    interview_location: '',
    interview_type_who: '',
    interview_type_how: '',
    interview_type_when: '',
    interview_type_how_many: ''
  })

  // Load user's sent applications
  useEffect(() => {
    loadApplications()
  }, [])

  const loadApplications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      // First, let's try a simpler query to see what fields exist
      console.log('🔍 Querying tailored_resumes for sent applications...')

      const { data, error } = await supabase
        .from('tailored_resumes')
        .select('*')  // Get all fields to see what's available
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10) // Limit to first 10 to test

      // Filter for sent applications manually if needed
      const sentApplications = data?.filter(app =>
        app.application_status === 'sent' || app.status === 'sent'
      ) || []

      if (error) throw error
      setApplications(sentApplications)
    } catch (err: any) {
      console.error('Error loading applications:', err)
      setError('Failed to load applications')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectApplication = (application: TrackedApplication) => {
    setSelectedApplication(application)

    // Try to load job description from job_description_analysis table
    loadJobDescription(application.company_name, application.job_title, application)

    setFormData({
      company_name: application.company_name,
      position_title: application.job_title,
      job_description: 'Loading...', // Will be updated from loadJobDescription
      jd_url: '', // Not available - user will fill this
      interview_date: '',
      interview_location: '',
      interview_type_who: '',
      interview_type_how: '',
      interview_type_when: '',
      interview_type_how_many: ''
    })
    setShowApplicationSelector(false)
  }

  // Load job description from job_description_analysis table
  const loadJobDescription = async (companyName: string, jobTitle: string, application: TrackedApplication) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Search for job description in job_description_analysis table
      const { data: jdData, error: jdError } = await supabase
        .from('job_description_analysis')
        .select('job_description_text')
        .eq('user_id', user.id)
        .eq('company_name', companyName)
        .eq('job_title', jobTitle)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!jdError && jdData && jdData.job_description_text) {
        // Found job description - update form
        setFormData(prev => ({
          ...prev,
          job_description: jdData.job_description_text
        }))
        console.log('✅ Job description loaded successfully')
      } else {
        console.log('⚠️ Job description not found, user will need to paste it')
        // Keep 'Loading...' text or change to empty string
        setTimeout(() => {
          setFormData(prev => ({
            ...prev,
            job_description: ''
          }))
        }, 1000)
      }
    } catch (error) {
      console.error('Error loading job description:', error)
      setFormData(prev => ({
        ...prev,
        job_description: ''
      }))
    }
  }

  const handleCreateManual = () => {
    setShowApplicationSelector(false)
    setSelectedApplication(null)
  }

  const handleBackToApplications = () => {
    setShowApplicationSelector(true)
    setSelectedApplication(null)
    setFormData({
      company_name: '',
      position_title: '',
      job_description: '',
      jd_url: '',
      interview_date: '',
      interview_location: '',
      interview_type_who: '',
      interview_type_how: '',
      interview_type_when: '',
      interview_type_how_many: ''
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.company_name.trim() || !formData.position_title.trim()) {
      setError('Company name and position title are required')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      const { data, error } = await supabase
        .from('interview_preparations')
        .insert({
          user_id: user.id,
          company_name: formData.company_name,
          position_title: formData.position_title,
          job_description: formData.job_description || null,
          jd_url: formData.jd_url || null,
          interview_date: formData.interview_date || null,
          interview_location: formData.interview_location || null,
          interview_type_who: formData.interview_type_who || null,
          interview_type_how: formData.interview_type_how || null,
          interview_type_when: formData.interview_type_when || null,
          interview_type_how_many: formData.interview_type_how_many || null,
          status: 'preparing'
        })
        .select()
        .single()

      if (error) throw error

      navigate(`/interview/${data.id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to create interview preparation')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/interview')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4 flex items-center gap-2"
          >
            ← Back to Interviews
          </button>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 New Interview Preparation
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Start preparing for your upcoming interview
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : showApplicationSelector ? (
          /* Application Selector */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              📋 Choose an Application to Prepare For
            </h2>

            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No sent applications found.</p>
                <button
                  onClick={handleCreateManual}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Create Manual Interview Prep
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div
                    key={app.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                    onClick={() => handleSelectApplication(app)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {app.job_title}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">{app.company_name}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Applied: {new Date(app.sent_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="mb-2">
                          <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${app.match_score >= 80 ? 'bg-green-100 text-green-800' :
                              app.match_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                            }`}>
                            {app.match_score}% Match
                          </span>
                        </div>
                        <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                          Select →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={handleCreateManual}
                    className="text-gray-600 hover:text-gray-800 text-sm"
                  >
                    Or create manual interview prep
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Selected Application Header */
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6 transition-colors duration-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Preparing for:</p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formData.position_title} at {formData.company_name}
                </h3>
                {selectedApplication && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Match Score: <span className="font-medium">{selectedApplication.match_score}%</span>
                  </p>
                )}
              </div>
              <button
                onClick={handleBackToApplications}
                className="text-blue-600 hover:text-blue-700 text-sm"
              >
                ← Change Application
              </button>
            </div>
          </div>
        )}

        {!showApplicationSelector && !loading && (
          <>
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 border border-gray-100 dark:border-gray-700 transition-colors duration-200">
              {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Basic Information</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Google, Microsoft, etc."
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Position Title *
                      </label>
                      <input
                        type="text"
                        value={formData.position_title}
                        onChange={(e) => setFormData({ ...formData, position_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Senior Product Manager"
                        required
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Description
                    </label>
                    <textarea
                      value={formData.job_description}
                      onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
                      rows={6}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Paste the full job description here..."
                    />
                  </div>

                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Description URL
                    </label>
                    <input
                      type="url"
                      value={formData.jd_url}
                      onChange={(e) => setFormData({ ...formData, jd_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Interview Details */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Interview Details</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Interview Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.interview_date}
                        onChange={(e) => setFormData({ ...formData, interview_date: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.interview_location}
                        onChange={(e) => setFormData({ ...formData, interview_location: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder="Virtual, Office address, etc."
                      />
                    </div>
                  </div>
                </div>

                {/* Interview Type Classification */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Interview Type Classification</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    Help us tailor your preparation by identifying the interview type across 4 dimensions
                  </p>

                  {/* WHO */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WHO: Who will interview you?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {INTERVIEW_TYPE_WHO.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, interview_type_who: type })}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${formData.interview_type_who === type
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{type}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {INTERVIEW_TYPE_DESCRIPTIONS.WHO[type as keyof typeof INTERVIEW_TYPE_DESCRIPTIONS.WHO]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HOW */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      HOW: Interview format?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {INTERVIEW_TYPE_HOW.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, interview_type_how: type })}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${formData.interview_type_how === type
                              ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/30 dark:border-purple-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{type}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {INTERVIEW_TYPE_DESCRIPTIONS.HOW[type as keyof typeof INTERVIEW_TYPE_DESCRIPTIONS.HOW]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WHEN */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      WHEN: Stage in process?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {INTERVIEW_TYPE_WHEN.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, interview_type_when: type })}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${formData.interview_type_when === type
                              ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/30 dark:border-teal-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{type}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {INTERVIEW_TYPE_DESCRIPTIONS.WHEN[type as keyof typeof INTERVIEW_TYPE_DESCRIPTIONS.WHEN]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* HOW MANY */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      HOW MANY: Number of participants?
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {INTERVIEW_TYPE_HOW_MANY.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setFormData({ ...formData, interview_type_how_many: type })}
                          className={`p-4 border-2 rounded-lg text-left transition-all ${formData.interview_type_how_many === type
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/30 dark:border-orange-500'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
                            }`}
                        >
                          <div className="font-medium text-gray-900 dark:text-white mb-1">{type}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {INTERVIEW_TYPE_DESCRIPTIONS.HOW_MANY[type as keyof typeof INTERVIEW_TYPE_DESCRIPTIONS.HOW_MANY]}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
                  <button
                    type="button"
                    onClick={() => navigate('/interview')}
                    className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
                  >
                    {saving ? 'Creating...' : 'Create Interview Preparation'}
                  </button>
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
