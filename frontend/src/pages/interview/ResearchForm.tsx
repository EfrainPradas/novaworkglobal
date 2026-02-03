import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation } from '../../types/interview'

interface ResearchData {
  id?: string
  interviewer_name?: string
  interviewer_role?: string
  interviewer_linkedin_url?: string
  common_connections?: string
  interviewer_notes?: string  // Combined: background + interests
  company_news?: string
  company_financials?: string
  company_culture?: string  // NOT company_culture_notes
  industry_trends?: string
  competitors_analyzed?: string[]  // Array in database
  research_notes?: string  // Combined: challenges + market position + additional notes
  research_completed?: boolean
}

export default function ResearchForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [interview, setInterview] = useState<InterviewPreparation | null>(null)
  const [research, setResearch] = useState<ResearchData>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'interviewer' | 'company' | 'industry'>('interviewer')

  useEffect(() => {
    loadData()
  }, [id])

  const loadData = async () => {
    try {
      // Load interview
      const { data: interviewData, error: interviewError } = await supabase
        .from('interview_preparations')
        .select('*')
        .eq('id', id)
        .single()

      if (interviewError) throw interviewError
      setInterview(interviewData)

      // Load existing research
      const { data: researchData, error: researchError } = await supabase
        .from('interview_research')
        .select('*')
        .eq('interview_prep_id', id)
        .maybeSingle()

      if (researchError) throw researchError
      if (researchData) setResearch(researchData)
    } catch (error) {
      console.error('Error loading research data:', error)
      alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Don't navigate away - let user see the error
    } finally {
      setLoading(false)
    }
  }

  const updateResearch = (field: keyof ResearchData, value: string) => {
    setResearch({ ...research, [field]: value })
  }

  const saveResearch = async () => {
    if (!interview) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const researchData = {
        interview_prep_id: id,
        ...research
      }

      // Remove fields that shouldn't be saved
      delete researchData.id
      delete researchData.created_at
      delete researchData.user_id  // interview_research table doesn't have user_id

      if (research.id) {
        // Update existing
        const { error } = await supabase
          .from('interview_research')
          .update(researchData)
          .eq('id', research.id)

        if (error) throw error
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('interview_research')
          .insert(researchData)
          .select()
          .single()

        if (error) throw error
        setResearch(data)
      }

      alert('Research saved successfully!')
    } catch (error: any) {
      console.error('Error saving research:', error)
      const errorMessage = error?.message || error?.error_description || 'Failed to save research'
      alert(`Failed to save research: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!interview) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/interview/${id}`)}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Back to Interview
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔍 Research Thoroughly
          </h1>
          <p className="text-gray-600">
            Research the interviewer, company, and industry to show genuine interest
          </p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('interviewer')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'interviewer'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">👤</div>
              <div>Interviewer</div>
            </button>
            <button
              onClick={() => setActiveTab('company')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'company'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">🏢</div>
              <div>Company</div>
            </button>
            <button
              onClick={() => setActiveTab('industry')}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === 'industry'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <div className="text-2xl mb-1">📊</div>
              <div>Industry</div>
            </button>
          </div>

          <div className="p-6">
            {/* INTERVIEWER TAB */}
            {activeTab === 'interviewer' && (
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">💡 Research Tips:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Check their LinkedIn profile for education, experience, and interests</li>
                    <li>• Look for recent posts or articles they've shared</li>
                    <li>• Google their name to find publications or talks</li>
                    <li>• Check if you have common connections on LinkedIn</li>
                    <li>• Look for their hobbies, volunteer work, or side projects</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Interviewer Name(s)
                  </label>
                  <input
                    type="text"
                    value={research.interviewer_name || ''}
                    onChange={(e) => updateResearch('interviewer_name', e.target.value)}
                    placeholder="e.g., John Smith, Jane Doe"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Their Role/Title
                  </label>
                  <input
                    type="text"
                    value={research.interviewer_role || ''}
                    onChange={(e) => updateResearch('interviewer_role', e.target.value)}
                    placeholder="e.g., Engineering Manager, HR Director"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={research.interviewer_linkedin_url || ''}
                    onChange={(e) => updateResearch('interviewer_linkedin_url', e.target.value)}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Common Connections
                  </label>
                  <textarea
                    value={research.common_connections || ''}
                    onChange={(e) => updateResearch('common_connections', e.target.value)}
                    placeholder="Do you have any mutual connections on LinkedIn? Past colleagues?"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Background, Education & Interests
                  </label>
                  <textarea
                    value={research.interviewer_notes || ''}
                    onChange={(e) => updateResearch('interviewer_notes', e.target.value)}
                    placeholder="Education, previous companies, hobbies, volunteer work, publications, conference talks, side projects, interests..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* COMPANY TAB */}
            {activeTab === 'company' && (
              <div className="space-y-6">
                <div className="bg-green-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">💡 Research Tips:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Visit company website (About, News, Blog sections)</li>
                    <li>• Check LinkedIn Company Page for recent updates</li>
                    <li>• Google "Company Name + news" for recent articles</li>
                    <li>• Read Glassdoor reviews for culture insights</li>
                    <li>• Check Crunchbase for funding/growth info (startups)</li>
                    <li>• Review annual reports or investor presentations (public companies)</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recent Company News & Projects
                  </label>
                  <textarea
                    value={research.company_news || ''}
                    onChange={(e) => updateResearch('company_news', e.target.value)}
                    placeholder="Product launches, acquisitions, expansions, partnerships, awards, new products, features, markets, technology initiatives..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Financial Performance
                  </label>
                  <textarea
                    value={research.company_financials || ''}
                    onChange={(e) => updateResearch('company_financials', e.target.value)}
                    placeholder="Revenue growth, stock performance, funding rounds, profitability..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company Culture
                  </label>
                  <textarea
                    value={research.company_culture || ''}
                    onChange={(e) => updateResearch('company_culture', e.target.value)}
                    placeholder="Values, mission, work environment, employee testimonials, Glassdoor insights..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* INDUSTRY TAB */}
            {activeTab === 'industry' && (
              <div className="space-y-6">
                <div className="bg-purple-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">💡 Research Tips:</h3>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Google "Industry Name + trends 2024"</li>
                    <li>• Check industry publications and trade journals</li>
                    <li>• Review analyst reports (Gartner, Forrester, etc.)</li>
                    <li>• Look at competitor companies and their strategies</li>
                    <li>• Understand emerging technologies in the space</li>
                  </ul>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry Trends & News
                  </label>
                  <textarea
                    value={research.industry_trends || ''}
                    onChange={(e) => updateResearch('industry_trends', e.target.value)}
                    placeholder="What's happening in the industry? Growth areas? Disruptions? New technologies?"
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Competitors
                  </label>
                  <textarea
                    value={Array.isArray(research.competitors_analyzed) ? research.competitors_analyzed.join(', ') : (research.competitors_analyzed || '')}
                    onChange={(e) => {
                      // Convert comma-separated string to array
                      const competitorsArray = e.target.value.split(',').map(c => c.trim()).filter(c => c.length > 0)
                      setResearch({ ...research, competitors_analyzed: competitorsArray })
                    }}
                    placeholder="Competitor 1, Competitor 2, Competitor 3 (comma-separated)"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate competitors with commas</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Research Notes
                  </label>
                  <textarea
                    value={research.research_notes || ''}
                    onChange={(e) => updateResearch('research_notes', e.target.value)}
                    placeholder="Market position, company challenges, questions to ask, topics to mention, any other insights..."
                    rows={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(`/interview/${id}`)}
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={saveResearch}
            disabled={saving}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Research'}
          </button>
        </div>
      </div>
    </div>
  )
}
