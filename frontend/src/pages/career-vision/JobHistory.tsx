/**
 * Job History Analysis Page
 * Analyze last 4 jobs to identify patterns
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Plus, Edit2, Trash2, Save, X, Loader2, Sparkles, TrendingUp, TrendingDown } from 'lucide-react'

interface JobHistory {
  id?: string
  job_title: string
  company_name: string
  duration: string
  job_order: number
  company_liked: string
  company_liked_why: string
  company_disliked: string
  company_disliked_why: string
  position_liked: string
  position_liked_why: string
  position_disliked: string
  position_disliked_why: string
  manager_liked: string
  manager_liked_why: string
  manager_disliked: string
  manager_disliked_why: string
}

interface AIInsights {
  satisfiers: string[]
  dissatisfiers: string[]
  patterns: string
  recommendations: string
}

export default function JobHistory() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<JobHistory[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingJob, setEditingJob] = useState<JobHistory | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null)

  // Form state
  const [formData, setFormData] = useState<JobHistory>({
    job_title: '',
    company_name: '',
    duration: '',
    job_order: 1,
    company_liked: '',
    company_liked_why: '',
    company_disliked: '',
    company_disliked_why: '',
    position_liked: '',
    position_liked_why: '',
    position_disliked: '',
    position_disliked_why: '',
    manager_liked: '',
    manager_liked_why: '',
    manager_disliked: '',
    manager_disliked_why: ''
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      const { data, error } = await supabase
        .from('job_history_analysis')
        .select('*')
        .eq('user_id', user.id)
        .order('job_order', { ascending: true })

      if (error) throw error

      setJobs(data || [])

      // Load cached insights if they exist
      if (data && data.length >= 2) {
        const { data: profile } = await supabase
          .from('career_vision_profiles')
          .select('job_history_insights')
          .eq('user_id', user.id)
          .maybeSingle()

        if (profile?.job_history_insights) {
          console.log('✅ Loaded cached insights')
          setAiInsights(profile.job_history_insights)
        }
      }
    } catch (error) {
      console.error('Error loading job history:', error)
    } finally {
      setLoading(false)
    }
  }

  const openAddModal = () => {
    const nextOrder = jobs.length + 1
    if (nextOrder > 4) {
      alert('You can only add up to 4 jobs. Please delete one first.')
      return
    }
    setFormData({
      job_title: '',
      company_name: '',
      duration: '',
      job_order: nextOrder,
      company_liked: '',
      company_liked_why: '',
      company_disliked: '',
      company_disliked_why: '',
      position_liked: '',
      position_liked_why: '',
      position_disliked: '',
      position_disliked_why: '',
      manager_liked: '',
      manager_liked_why: '',
      manager_disliked: '',
      manager_disliked_why: ''
    })
    setEditingJob(null)
    setCurrentStep(1)
    setShowModal(true)
  }

  const openEditModal = (job: JobHistory) => {
    setFormData(job)
    setEditingJob(job)
    setCurrentStep(1)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingJob(null)
    setCurrentStep(1)
  }

  const handleSave = async () => {
    // Validate basic info
    if (!formData.job_title || !formData.company_name || !formData.duration) {
      alert('Please fill in Job Title, Company, and Duration')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      if (editingJob && editingJob.id) {
        // Update existing job
        const { error } = await supabase
          .from('job_history_analysis')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingJob.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Create new job
        const { error } = await supabase
          .from('job_history_analysis')
          .insert({
            user_id: user.id,
            ...formData
          })

        if (error) throw error
      }

      await loadJobs()
      closeModal()
      alert('✅ Job history saved!')
    } catch (error) {
      console.error('Error saving job:', error)
      alert('❌ Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job entry?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('job_history_analysis')
        .delete()
        .eq('id', jobId)
        .eq('user_id', user.id)

      if (error) throw error

      await loadJobs()
      alert('✅ Job deleted')
    } catch (error) {
      console.error('Error deleting job:', error)
      alert('❌ Failed to delete')
    }
  }

  const generateAIInsights = async () => {
    if (jobs.length < 2) {
      alert('Please add at least 2 jobs to generate AI insights')
      return
    }

    setGenerating(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Call AI endpoint
      const response = await fetch('/api/career-vision/analyze-job-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ jobs })
      })

      if (!response.ok) throw new Error('Failed to generate insights')

      const data = await response.json()
      const insights = data.insights || data

      // Save insights to DB for caching
      // First check if profile exists
      const { data: existingProfile } = await supabase
        .from('career_vision_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existingProfile) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('career_vision_profiles')
          .update({
            job_history_insights: insights,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (updateError) {
          console.error('Error updating insights:', updateError)
          throw updateError
        }
        console.log('✅ Insights updated in existing profile')
      } else {
        // Create new profile with insights
        const { error: insertError } = await supabase
          .from('career_vision_profiles')
          .insert({
            user_id: user.id,
            job_history_insights: insights,
            skills_knowledge: [],
            core_values: [],
            interests: []
          })

        if (insertError) {
          console.error('Error inserting insights:', insertError)
          throw insertError
        }
        console.log('✅ Insights saved in new profile')
      }

      setAiInsights(insights)
    } catch (error) {
      console.error('Error generating insights:', error)
      // Fallback insights
      const fallbackInsights = {
        satisfiers: ['Collaborative team environment', 'Opportunities for growth', 'Supportive management'],
        dissatisfiers: ['Micromanagement', 'Lack of work-life balance', 'Limited autonomy'],
        patterns: 'You thrive in environments with autonomy and supportive leadership. You value growth opportunities and collaborative cultures.',
        recommendations: 'Look for roles with flat organizational structures, emphasis on professional development, and managers who trust their teams.'
      }
      setAiInsights(fallbackInsights)
    } finally {
      setGenerating(false)
    }
  }

  const nextStep = () => {
    if (currentStep < 4) setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1)
  }

  const updateFormData = (field: keyof JobHistory, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/career-vision/dashboard')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mb-4 flex items-center gap-2"
          >
            ← Back to Career Vision
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📋 Job History Analysis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Reflect on your last 4 jobs to identify what you loved and what you didn't. Discover patterns in your career satisfaction.
          </p>
        </div>

        {/* Jobs Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {[1, 2, 3, 4].map((order) => {
            const job = jobs.find(j => j.job_order === order)

            if (!job) {
              return (
                <div
                  key={order}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-dashed border-gray-300 dark:border-gray-600 flex flex-col items-center justify-center min-h-[200px] cursor-pointer hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  onClick={openAddModal}
                >
                  <div className="text-6xl text-gray-300 dark:text-gray-600 mb-4">+</div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Add Job #{order}</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {order === 1 ? '(Most Recent)' : order === 4 ? '(Oldest)' : ''}
                  </p>
                </div>
              )
            }

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border-2 border-green-200 dark:border-green-800 relative transition-colors"
              >
                {/* Job Order Badge */}
                <div className="absolute top-4 right-4 bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold">
                  {order}
                </div>

                {/* Job Info */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 pr-12">
                  {job.job_title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-1">{job.company_name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{job.duration}</p>

                {/* Analysis Summary */}
                <div className="space-y-3 mb-4">
                  {job.company_liked && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Company:</strong> {job.company_liked}</p>
                    </div>
                  )}
                  {job.position_liked && (
                    <div className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Position:</strong> {job.position_liked}</p>
                    </div>
                  )}
                  {job.company_disliked && (
                    <div className="flex items-start gap-2">
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 dark:text-gray-300"><strong>Disliked:</strong> {job.company_disliked}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => openEditModal(job)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => job.id && handleDelete(job.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Add Job Button (if less than 4) */}
        {jobs.length < 4 && (
          <div className="flex justify-center mb-8">
            <button
              onClick={openAddModal}
              className="bg-primary-600 text-white px-8 py-4 rounded-lg font-semibold shadow-lg hover:bg-primary-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Job Entry
            </button>
          </div>
        )}

        {/* AI Insights Section */}
        {jobs.length >= 2 && (
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/10 dark:to-blue-900/10 rounded-xl shadow-lg p-8 mb-8 border border-purple-100 dark:border-purple-900/30 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-2">
                  <Sparkles className="w-6 h-6 text-yellow-500" />
                  AI-Powered Pattern Recognition
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Discover insights from your job history to guide your next career move
                </p>
              </div>
              <button
                onClick={generateAIInsights}
                disabled={generating}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 flex items-center gap-2 whitespace-nowrap shadow-md"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    {aiInsights ? 'Regenerate Insights' : 'Generate Insights'}
                  </>
                )}
              </button>
            </div>

            {aiInsights && (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Satisfiers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                  <h3 className="text-lg font-bold text-green-700 dark:text-green-400 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Your Career Satisfiers
                  </h3>
                  <ul className="space-y-2">
                    {aiInsights.satisfiers.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-green-600 mt-1">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Dissatisfiers */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
                  <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                    <TrendingDown className="w-5 h-5" />
                    Your Career Dissatisfiers
                  </h3>
                  <ul className="space-y-2">
                    {aiInsights.dissatisfiers.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-red-600 mt-1">✗</span>
                        <span className="text-gray-700 dark:text-gray-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Patterns */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 md:col-span-2 border border-gray-100 dark:border-gray-700 transition-colors">
                  <h3 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4">📊 Patterns Identified</h3>
                  <p className="text-gray-700 dark:text-gray-300 mb-4">{aiInsights.patterns}</p>

                  <h3 className="text-lg font-bold text-purple-700 dark:text-purple-400 mb-4">💡 Recommendations</h3>
                  <p className="text-gray-700 dark:text-gray-300">{aiInsights.recommendations}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center">
          <button
            onClick={() => navigate('/career-vision/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            ← Back to Career Vision Dashboard
          </button>
        </div>
      </div>

      {/* Add/Edit Job Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full my-8 border border-gray-200 dark:border-gray-700 transition-colors">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingJob ? 'Edit Job Entry' : 'Add Job Entry'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Step {currentStep} of 4
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-900/50">
              {['Basic Info', 'Company', 'Position', 'Manager'].map((step, index) => (
                <div key={step} className="flex items-center flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${currentStep > index + 1
                        ? 'bg-green-600 text-white'
                        : currentStep === index + 1
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                  >
                    {currentStep > index + 1 ? '✓' : index + 1}
                  </div>
                  <span className={`ml-2 text-sm font-medium ${currentStep === index + 1 ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-500'}`}>
                    {step}
                  </span>
                  {index < 3 && (
                    <div className={`flex-1 h-1 mx-2 ${currentStep > index + 1 ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-700'}`}></div>
                  )}
                </div>
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {/* Step 1: Basic Info */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Job Title *
                    </label>
                    <input
                      type="text"
                      value={formData.job_title}
                      onChange={(e) => updateFormData('job_title', e.target.value)}
                      placeholder="e.g., Senior Software Engineer"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) => updateFormData('company_name', e.target.value)}
                      placeholder="e.g., Acme Corp"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Duration *
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => updateFormData('duration', e.target.value)}
                      placeholder="e.g., 2 years, 6 months"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Company Analysis */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Company Analysis</h3>

                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                      What did you LIKE about the company?
                    </label>
                    <input
                      type="text"
                      value={formData.company_liked}
                      onChange={(e) => updateFormData('company_liked', e.target.value)}
                      placeholder="e.g., Great culture, innovative products"
                      className="w-full px-4 py-2 border border-green-200 dark:border-green-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                      Why?
                    </label>
                    <textarea
                      value={formData.company_liked_why}
                      onChange={(e) => updateFormData('company_liked_why', e.target.value)}
                      placeholder="Explain why this was important to you..."
                      rows={3}
                      className="w-full px-4 py-2 border border-green-200 dark:border-green-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                    <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                      What did you DISLIKE about the company?
                    </label>
                    <input
                      type="text"
                      value={formData.company_disliked}
                      onChange={(e) => updateFormData('company_disliked', e.target.value)}
                      placeholder="e.g., Poor communication, bureaucracy"
                      className="w-full px-4 py-2 border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                      Why?
                    </label>
                    <textarea
                      value={formData.company_disliked_why}
                      onChange={(e) => updateFormData('company_disliked_why', e.target.value)}
                      placeholder="Explain why this was frustrating..."
                      rows={3}
                      className="w-full px-4 py-2 border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Position Analysis */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Position Analysis</h3>

                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                      What did you LIKE about the position?
                    </label>
                    <input
                      type="text"
                      value={formData.position_liked}
                      onChange={(e) => updateFormData('position_liked', e.target.value)}
                      placeholder="e.g., Challenging projects, autonomy"
                      className="w-full px-4 py-2 border border-green-200 dark:border-green-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                      Why?
                    </label>
                    <textarea
                      value={formData.position_liked_why}
                      onChange={(e) => updateFormData('position_liked_why', e.target.value)}
                      placeholder="Explain why this was fulfilling..."
                      rows={3}
                      className="w-full px-4 py-2 border border-green-200 dark:border-green-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                    <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                      What did you DISLIKE about the position?
                    </label>
                    <input
                      type="text"
                      value={formData.position_disliked}
                      onChange={(e) => updateFormData('position_disliked', e.target.value)}
                      placeholder="e.g., Repetitive tasks, lack of growth"
                      className="w-full px-4 py-2 border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                      Why?
                    </label>
                    <textarea
                      value={formData.position_disliked_why}
                      onChange={(e) => updateFormData('position_disliked_why', e.target.value)}
                      placeholder="Explain why this was limiting..."
                      rows={3}
                      className="w-full px-4 py-2 border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Manager Analysis */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Manager Analysis</h3>

                  <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-4 border border-green-100 dark:border-green-900/30">
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                      What did you LIKE about your manager?
                    </label>
                    <input
                      type="text"
                      value={formData.manager_liked}
                      onChange={(e) => updateFormData('manager_liked', e.target.value)}
                      placeholder="e.g., Supportive, clear communicator"
                      className="w-full px-4 py-2 border border-green-200 dark:border-green-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <label className="block text-sm font-semibold text-green-900 dark:text-green-300 mb-2">
                      Why?
                    </label>
                    <textarea
                      value={formData.manager_liked_why}
                      onChange={(e) => updateFormData('manager_liked_why', e.target.value)}
                      placeholder="Explain why this management style worked for you..."
                      rows={3}
                      className="w-full px-4 py-2 border border-green-200 dark:border-green-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-green-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-4 border border-red-100 dark:border-red-900/30">
                    <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                      What did you DISLIKE about your manager?
                    </label>
                    <input
                      type="text"
                      value={formData.manager_disliked}
                      onChange={(e) => updateFormData('manager_disliked', e.target.value)}
                      placeholder="e.g., Micromanagement, unclear expectations"
                      className="w-full px-4 py-2 border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 mb-3 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                    <label className="block text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                      Why?
                    </label>
                    <textarea
                      value={formData.manager_disliked_why}
                      onChange={(e) => updateFormData('manager_disliked_why', e.target.value)}
                      placeholder="Explain why this was challenging..."
                      rows={3}
                      className="w-full px-4 py-2 border border-red-200 dark:border-red-800 dark:bg-gray-800 dark:text-white rounded-lg focus:ring-2 focus:ring-red-500 placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>

              <div className="flex gap-3">
                <button
                  onClick={closeModal}
                  className="px-6 py-2 text-gray-600 dark:text-gray-400 font-semibold hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={nextStep}
                    className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        Save Job
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
