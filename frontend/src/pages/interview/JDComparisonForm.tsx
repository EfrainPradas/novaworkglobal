import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { InterviewPreparation } from '../../types/interview'

interface JDComparison {
  id?: string
  responsibility: string
  my_experience_par_id?: string
  my_experience_text?: string
  match_level: 'perfect' | 'good' | 'partial' | 'gap'
  gap_notes?: string
  how_to_address?: string
  order_index: number
}

interface PARStory {
  id: string
  role_company: string
  problem_challenge: string
  actions: any  // JSONB in database
  result: string
}

export default function JDComparisonForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const [interview, setInterview] = useState<InterviewPreparation | null>(null)
  const [comparisons, setComparisons] = useState<JDComparison[]>([])
  const [parStories, setParStories] = useState<PARStory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newRequirement, setNewRequirement] = useState('')

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

      // Load existing comparisons
      const { data: comparisonsData, error: comparisonsError } = await supabase
        .from('jd_comparison_analysis')
        .select('*')
        .eq('interview_prep_id', id)
        .order('order_index', { ascending: true })

      if (comparisonsError) {
        console.error('Error loading comparisons:', comparisonsError)
        // Don't throw, just set empty array
      }
      setComparisons(comparisonsData || [])

      // Load user's PAR stories
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: storiesData, error: storiesError } = await supabase
          .from('par_stories')
          .select('id, role_company, problem_challenge, actions, result')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (storiesError) throw storiesError
        setParStories(storiesData || [])
      }
    } catch (error) {
      console.error('Error loading JD comparison data:', error)
      alert(`Error loading data: ${error instanceof Error ? error.message : 'Unknown error'}`)
      // Don't navigate away - let user see the error
    } finally {
      setLoading(false)
    }
  }

  const addRequirement = () => {
    if (!newRequirement.trim()) return

    const newComparison: JDComparison = {
      responsibility: newRequirement.trim(),
      match_level: 'gap',
      order_index: comparisons.length
    }

    setComparisons([...comparisons, newComparison])
    setNewRequirement('')
  }

  const updateComparison = (index: number, updates: Partial<JDComparison>) => {
    const updated = [...comparisons]
    updated[index] = { ...updated[index], ...updates }
    setComparisons(updated)
  }

  const deleteComparison = (index: number) => {
    const updated = comparisons.filter((_, i) => i !== index)
    setComparisons(updated.map((c, i) => ({ ...c, order_index: i })))
  }

  const saveComparisons = async () => {
    if (!interview) return

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Delete existing comparisons
      await supabase
        .from('jd_comparison_analysis')
        .delete()
        .eq('interview_prep_id', id)

      // Insert new comparisons (only if there are any)
      if (comparisons.length > 0) {
        const comparisonsToInsert = comparisons.map(c => {
          const data: any = {
            interview_prep_id: id,
            responsibility: c.responsibility,
            match_level: c.match_level,
            order_index: c.order_index
          }

          // Add optional fields only if they exist
          if (c.my_experience_par_id) data.my_experience_par_id = c.my_experience_par_id
          if (c.my_experience_text) data.my_experience_text = c.my_experience_text
          if (c.gap_notes) data.gap_notes = c.gap_notes
          if (c.how_to_address) data.how_to_address = c.how_to_address

          return data
        })

        const { error } = await supabase
          .from('jd_comparison_analysis')
          .insert(comparisonsToInsert)

        if (error) throw error
      }

      alert('JD comparison saved successfully!')
    } catch (error: any) {
      console.error('Error saving comparisons:', error)
      const errorMessage = error?.message || error?.error_description || 'Failed to save comparisons'
      alert(`Failed to save comparisons: ${errorMessage}`)
    } finally {
      setSaving(false)
    }
  }

  const getMatchStats = () => {
    const stats = {
      perfect: comparisons.filter(c => c.match_level === 'perfect').length,
      good: comparisons.filter(c => c.match_level === 'good').length,
      partial: comparisons.filter(c => c.match_level === 'partial').length,
      gap: comparisons.filter(c => c.match_level === 'gap').length,
      total: comparisons.length
    }
    return stats
  }

  const getMatchColor = (level: string) => {
    switch (level) {
      case 'perfect': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'partial': return 'bg-yellow-500'
      case 'gap': return 'bg-red-500'
      default: return 'bg-gray-500'
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

  const stats = getMatchStats()

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
            📝 Content Preparation - JD Comparison
          </h1>
          <p className="text-gray-600">
            Map job requirements to your experience and identify gaps
          </p>
        </div>

        {/* Job Description */}
        {interview.job_description && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-3">Job Description</h2>
            <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {interview.job_description}
              </p>
            </div>
          </div>
        )}

        {/* Gap Analysis Stats */}
        {comparisons.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Gap Analysis</h2>

            {/* Visual bar */}
            <div className="flex rounded-full overflow-hidden h-8 mb-4">
              {stats.perfect > 0 && (
                <div
                  className="bg-green-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(stats.perfect / stats.total) * 100}%` }}
                >
                  {stats.perfect > 0 && stats.perfect}
                </div>
              )}
              {stats.good > 0 && (
                <div
                  className="bg-blue-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(stats.good / stats.total) * 100}%` }}
                >
                  {stats.good > 0 && stats.good}
                </div>
              )}
              {stats.partial > 0 && (
                <div
                  className="bg-yellow-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(stats.partial / stats.total) * 100}%` }}
                >
                  {stats.partial > 0 && stats.partial}
                </div>
              )}
              {stats.gap > 0 && (
                <div
                  className="bg-red-500 flex items-center justify-center text-white text-sm font-medium"
                  style={{ width: `${(stats.gap / stats.total) * 100}%` }}
                >
                  {stats.gap > 0 && stats.gap}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span className="text-sm text-gray-700">
                  {stats.perfect} Perfect Match
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded"></div>
                <span className="text-sm text-gray-700">
                  {stats.good} Good Match
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                <span className="text-sm text-gray-700">
                  {stats.partial} Partial Match
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span className="text-sm text-gray-700">
                  {stats.gap} Gap
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Add New Requirement */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Add Requirement from JD</h2>

          <div className="flex gap-3">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="e.g., 5+ years Python experience"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && addRequirement()}
            />
            <button
              onClick={addRequirement}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
            >
              Add
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            💡 Tip: Break down the JD into individual requirements. Each skill, qualification, or responsibility should be a separate item.
          </p>
        </div>

        {/* Requirements List */}
        <div className="space-y-4">
          {comparisons.map((comparison, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${getMatchColor(comparison.match_level)}`}></div>
                    <span className="text-sm text-gray-600">
                      {comparison.match_level.charAt(0).toUpperCase() + comparison.match_level.slice(1)} Match
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {comparison.responsibility}
                  </h3>
                </div>
                <button
                  onClick={() => deleteComparison(index)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Delete
                </button>
              </div>

              {/* Match Level */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Match Level:
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {(['perfect', 'good', 'partial', 'gap'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateComparison(index, { match_level: level })}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                        comparison.match_level === level
                          ? `${getMatchColor(level)} text-white`
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Link to PAR Story or Write Experience */}
              {(comparison.match_level === 'perfect' || comparison.match_level === 'good' || comparison.match_level === 'partial') && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    My Experience:
                  </label>

                  {/* PAR Story Selector */}
                  <select
                    value={comparison.my_experience_par_id || ''}
                    onChange={(e) => updateComparison(index, {
                      my_experience_par_id: e.target.value || undefined,
                      my_experience_text: undefined
                    })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
                  >
                    <option value="">Select a PAR Story (or write below)</option>
                    {parStories.map((story) => (
                      <option key={story.id} value={story.id}>
                        {story.role_company}
                      </option>
                    ))}
                  </select>

                  {/* Show selected PAR story preview */}
                  {comparison.my_experience_par_id && (
                    <div className="bg-blue-50 rounded-lg p-3 mb-2">
                      {parStories.find(s => s.id === comparison.my_experience_par_id) && (
                        <div className="text-sm text-gray-700">
                          <div className="font-semibold mb-1">
                            {parStories.find(s => s.id === comparison.my_experience_par_id)!.role_company}
                          </div>
                          <div className="line-clamp-2">
                            {parStories.find(s => s.id === comparison.my_experience_par_id)!.problem_challenge}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Or write experience */}
                  <div>
                    <label className="text-xs text-gray-600 mb-1 block">Or write your experience:</label>
                    <textarea
                      value={comparison.my_experience_text || ''}
                      onChange={(e) => updateComparison(index, {
                        my_experience_text: e.target.value,
                        my_experience_par_id: undefined
                      })}
                      placeholder="Describe your relevant experience..."
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Gap Strategy */}
              {comparison.match_level === 'gap' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gap Notes (Why you don't have this):
                    </label>
                    <textarea
                      value={comparison.gap_notes || ''}
                      onChange={(e) => updateComparison(index, { gap_notes: e.target.value })}
                      placeholder="e.g., Haven't used this specific tool, but have similar experience..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      How to Address in Interview:
                    </label>
                    <textarea
                      value={comparison.how_to_address || ''}
                      onChange={(e) => updateComparison(index, { how_to_address: e.target.value })}
                      placeholder="e.g., Emphasize quick learning ability, similar tools mastered..."
                      rows={2}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {comparisons.length === 0 && (
          <div className="bg-gray-50 rounded-xl p-12 text-center border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Requirements Added Yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding requirements from the job description above
            </p>
          </div>
        )}

        {/* Save Button */}
        {comparisons.length > 0 && (
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => navigate(`/interview/${id}`)}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveComparisons}
              disabled={saving}
              className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save JD Comparison'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
