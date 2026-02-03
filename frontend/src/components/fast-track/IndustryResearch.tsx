import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Plus, Save, Trash2, Loader2, CheckCircle2, TrendingUp } from 'lucide-react'

interface IndustryResearchData {
  id?: string
  industry_name: string
  key_trends: string
  major_players: string
  growth_outlook: string
  salary_ranges: string
  job_demand: string
  skills_needed: string
  pros: string
  cons: string
  notes: string
}

interface Props {
  onComplete?: () => void
}

export default function IndustryResearch({ onComplete }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [industries, setIndustries] = useState<IndustryResearchData[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<IndustryResearchData>({
    industry_name: '',
    key_trends: '',
    major_players: '',
    growth_outlook: '',
    salary_ranges: '',
    job_demand: '',
    skills_needed: '',
    pros: '',
    cons: '',
    notes: ''
  })

  useEffect(() => {
    loadIndustries()
  }, [])

  const loadIndustries = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        console.log('IndustryResearch: No user found')
        return
      }

      console.log('IndustryResearch: Loading industries for user:', user.id)

      const { data, error } = await supabase
        .from('industry_research')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('IndustryResearch: Error loading:', error)
        throw error
      }

      console.log('IndustryResearch: Loaded data:', data)
      console.log('IndustryResearch: Count:', data?.length || 0)

      setIndustries(data || [])
    } catch (error: any) {
      console.error('Error loading industries:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!formData.industry_name.trim()) {
      alert('Please enter an industry name')
      return
    }

    setSaving(true)
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      if (editingId) {
        // Update existing
        const { error } = await supabase
          .from('industry_research')
          .update({
            ...formData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingId)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('industry_research')
          .insert({
            user_id: user.id,
            ...formData
          })

        if (error) throw error
      }

      setSaved(true)
      setEditingId(null)
      setFormData({
        industry_name: '',
        key_trends: '',
        major_players: '',
        growth_outlook: '',
        salary_ranges: '',
        job_demand: '',
        skills_needed: '',
        pros: '',
        cons: '',
        notes: ''
      })

      await loadIndustries()

      if (onComplete) onComplete()

      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Error saving industry research:', error)
      console.error('Error details:', {
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code
      })
      alert(`Error saving: ${error?.message || 'Unknown error'}. Check console for details.`)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (industry: IndustryResearchData) => {
    setFormData(industry)
    setEditingId(industry.id || null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this industry research?')) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('industry_research')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadIndustries()
    } catch (error) {
      console.error('Error deleting:', error)
      alert('Error deleting. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData({
      industry_name: '',
      key_trends: '',
      major_players: '',
      growth_outlook: '',
      salary_ranges: '',
      job_demand: '',
      skills_needed: '',
      pros: '',
      cons: '',
      notes: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Why research industries?</h3>
        <p className="text-sm text-blue-800 mb-2">
          Deep industry knowledge helps you:
        </p>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Speak intelligently in interviews about trends and challenges</li>
          <li>Target companies in high-growth sectors</li>
          <li>Identify which skills to highlight on your resume</li>
          <li>Research 2-3 industries to keep your search focused</li>
        </ul>
      </div>

      {/* Industry Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">
            {industries.length} {industries.length === 1 ? 'Industry' : 'Industries'} Researched
          </span>
          <span className="text-sm text-gray-500">(Target: 2-3)</span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingId ? 'Edit Industry Research' : 'Add New Industry'}
          </h3>
          {editingId && (
            <button
              onClick={handleCancel}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Industry Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry Name *
          </label>
          <input
            type="text"
            value={formData.industry_name}
            onChange={(e) => setFormData({ ...formData, industry_name: e.target.value })}
            placeholder="e.g., SaaS, FinTech, HealthTech"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Trends */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Trends
            </label>
            <textarea
              value={formData.key_trends}
              onChange={(e) => setFormData({ ...formData, key_trends: e.target.value })}
              placeholder="What's happening in this industry right now?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Major Players */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Major Players
            </label>
            <textarea
              value={formData.major_players}
              onChange={(e) => setFormData({ ...formData, major_players: e.target.value })}
              placeholder="Top companies in this space"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Growth Outlook */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Growth Outlook
            </label>
            <textarea
              value={formData.growth_outlook}
              onChange={(e) => setFormData({ ...formData, growth_outlook: e.target.value })}
              placeholder="Is this industry growing or declining?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Job Demand */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Job Demand
            </label>
            <textarea
              value={formData.job_demand}
              onChange={(e) => setFormData({ ...formData, job_demand: e.target.value })}
              placeholder="Are companies hiring? Which roles?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Salary Ranges */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Typical Salary Ranges
            </label>
            <input
              type="text"
              value={formData.salary_ranges}
              onChange={(e) => setFormData({ ...formData, salary_ranges: e.target.value })}
              placeholder="e.g., $120K-$180K for mid-level"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Skills Needed */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Skills Needed
            </label>
            <input
              type="text"
              value={formData.skills_needed}
              onChange={(e) => setFormData({ ...formData, skills_needed: e.target.value })}
              placeholder="Key skills for this industry"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Pros */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pros
            </label>
            <textarea
              value={formData.pros}
              onChange={(e) => setFormData({ ...formData, pros: e.target.value })}
              placeholder="Why work in this industry?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Cons */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cons
            </label>
            <textarea
              value={formData.cons}
              onChange={(e) => setFormData({ ...formData, cons: e.target.value })}
              placeholder="Challenges in this industry?"
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Any other observations?"
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
          {saved && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-medium">Saved!</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !formData.industry_name.trim()}
            className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {editingId ? 'Update' : 'Add'} Industry
              </>
            )}
          </button>
        </div>
      </div>

      {/* List of Industries */}
      {industries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Your Industry Research</h3>
          {industries.map((industry) => (
            <div
              key={industry.id}
              className="bg-white border border-gray-200 rounded-lg p-6 space-y-3"
            >
              <div className="flex items-start justify-between">
                <h4 className="text-xl font-bold text-gray-900">{industry.industry_name}</h4>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(industry)}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(industry.id!)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {industry.key_trends && (
                  <div>
                    <span className="font-semibold text-gray-700">Key Trends:</span>
                    <p className="text-gray-600 mt-1">{industry.key_trends}</p>
                  </div>
                )}
                {industry.major_players && (
                  <div>
                    <span className="font-semibold text-gray-700">Major Players:</span>
                    <p className="text-gray-600 mt-1">{industry.major_players}</p>
                  </div>
                )}
                {industry.growth_outlook && (
                  <div>
                    <span className="font-semibold text-gray-700">Growth Outlook:</span>
                    <p className="text-gray-600 mt-1">{industry.growth_outlook}</p>
                  </div>
                )}
                {industry.job_demand && (
                  <div>
                    <span className="font-semibold text-gray-700">Job Demand:</span>
                    <p className="text-gray-600 mt-1">{industry.job_demand}</p>
                  </div>
                )}
                {industry.salary_ranges && (
                  <div>
                    <span className="font-semibold text-gray-700">Salary Ranges:</span>
                    <p className="text-gray-600 mt-1">{industry.salary_ranges}</p>
                  </div>
                )}
                {industry.skills_needed && (
                  <div>
                    <span className="font-semibold text-gray-700">Skills Needed:</span>
                    <p className="text-gray-600 mt-1">{industry.skills_needed}</p>
                  </div>
                )}
              </div>

              {(industry.pros || industry.cons) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                  {industry.pros && (
                    <div>
                      <span className="font-semibold text-green-700">Pros:</span>
                      <p className="text-gray-600 text-sm mt-1">{industry.pros}</p>
                    </div>
                  )}
                  {industry.cons && (
                    <div>
                      <span className="font-semibold text-red-700">Cons:</span>
                      <p className="text-gray-600 text-sm mt-1">{industry.cons}</p>
                    </div>
                  )}
                </div>
              )}

              {industry.notes && (
                <div className="pt-3 border-t border-gray-200">
                  <span className="font-semibold text-gray-700 text-sm">Notes:</span>
                  <p className="text-gray-600 text-sm mt-1">{industry.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
