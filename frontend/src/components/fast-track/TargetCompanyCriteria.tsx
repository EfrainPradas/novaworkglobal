import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Save, Loader2, CheckCircle2 } from 'lucide-react'

interface CriteriaData {
  industry: string
  role_function: string
  geography: string
  company_size: string
  sector: string
  revenue_range: string
  employee_count_range: string
  salary_range: string
  notes: string
}

interface Props {
  onComplete?: () => void
}

export default function TargetCompanyCriteria({ onComplete }: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showCustomIndustry, setShowCustomIndustry] = useState(false)
  const [showCustomRole, setShowCustomRole] = useState(false)
  const [criteria, setCriteria] = useState<CriteriaData>({
    industry: '',
    role_function: '',
    geography: '',
    company_size: '',
    sector: '',
    revenue_range: '',
    employee_count_range: '',
    salary_range: '',
    notes: ''
  })

  // Common industries that work well with job search APIs
  const commonIndustries = [
    'Software/Technology',
    'FinTech',
    'SaaS',
    'E-commerce',
    'HealthTech',
    'EdTech',
    'AI/Machine Learning',
    'Cybersecurity',
    'Data Analytics',
    'Cloud Computing',
    'Mobile Apps',
    'Enterprise Software',
    'Marketing Technology',
    'Real Estate Tech',
    'Supply Chain/Logistics',
    'Consulting',
    'Finance/Banking',
    'Healthcare',
    'Education',
    'Manufacturing',
    'Other (Custom)'
  ]

  // Common roles that work well with job search APIs
  const commonRoles = [
    'Software Engineer',
    'Senior Software Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Product Manager',
    'Product Designer',
    'UX/UI Designer',
    'Data Scientist',
    'Data Analyst',
    'Data Engineer',
    'Machine Learning Engineer',
    'DevOps Engineer',
    'QA Engineer',
    'Engineering Manager',
    'Technical Program Manager',
    'Business Analyst',
    'Marketing Manager',
    'Sales Engineer',
    'Account Executive',
    'Customer Success Manager',
    'HR Manager',
    'Recruiter',
    'Financial Analyst',
    'Project Manager',
    'Scrum Master',
    'Security Engineer',
    'Systems Administrator',
    'Other (Custom)'
  ]

  useEffect(() => {
    loadCriteria()
  }, [])

  const loadCriteria = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('target_company_criteria')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading criteria:', error)
        return
      }

      if (data) {
        const industry = data.industry || ''
        const roleFunction = data.role_function || ''

        // Check if industry is in the dropdown list
        const isCustomIndustry = industry && !commonIndustries.includes(industry) && industry !== 'Other (Custom)'
        const isCustomRole = roleFunction && !commonRoles.includes(roleFunction) && roleFunction !== 'Other (Custom)'

        setCriteria({
          industry: isCustomIndustry ? 'Other (Custom)' : industry,
          role_function: isCustomRole ? 'Other (Custom)' : roleFunction,
          geography: data.geography || '',
          company_size: data.company_size || '',
          sector: data.sector || '',
          revenue_range: data.revenue_range || '',
          employee_count_range: data.employee_count_range || '',
          salary_range: data.salary_range || '',
          notes: data.notes || ''
        })

        // If custom, show the input fields and set the custom values
        if (isCustomIndustry) {
          setShowCustomIndustry(true)
          setTimeout(() => {
            setCriteria(prev => ({ ...prev, industry: industry }))
          }, 0)
        }

        if (isCustomRole) {
          setShowCustomRole(true)
          setTimeout(() => {
            setCriteria(prev => ({ ...prev, role_function: roleFunction }))
          }, 0)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if criteria already exists
      const { data: existing } = await supabase
        .from('target_company_criteria')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('target_company_criteria')
          .update({
            ...criteria,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Insert new
        const { error } = await supabase
          .from('target_company_criteria')
          .insert({
            user_id: user.id,
            ...criteria
          })

        if (error) throw error
      }

      setSaved(true)
      if (onComplete) onComplete()

      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving criteria:', error)
      alert('Error saving criteria. Please try again.')
    } finally {
      setSaving(false)
    }
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
        <h3 className="font-semibold text-blue-900 mb-2">Quick guide:</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Be specific but not too narrow - you want 10-15 target companies</li>
          <li>Think about where you'd thrive, not just any job</li>
          <li>Consider company culture, growth stage, and values</li>
          <li>You can always refine this later as you learn more</li>
        </ul>
      </div>

      {/* Form Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Industry */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Industry/Industries *
          </label>
          <select
            value={showCustomIndustry ? 'Other (Custom)' : criteria.industry}
            onChange={(e) => {
              const value = e.target.value
              if (value === 'Other (Custom)') {
                setShowCustomIndustry(true)
                setCriteria({ ...criteria, industry: '' })
              } else {
                setShowCustomIndustry(false)
                setCriteria({ ...criteria, industry: value })
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select industry...</option>
            {commonIndustries.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </select>

          {showCustomIndustry && (
            <input
              type="text"
              value={criteria.industry}
              onChange={(e) => setCriteria({ ...criteria, industry: e.target.value })}
              placeholder="Enter your custom industry..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mt-2"
              autoFocus
            />
          )}

          <p className="text-xs text-gray-500 mt-1">
            {showCustomIndustry
              ? 'Enter a custom industry (e.g., "Aerospace", "Biotech")'
              : 'Select from common industries or choose "Other" for custom'}
          </p>
        </div>

        {/* Role/Function */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Role/Function *
          </label>
          <select
            value={showCustomRole ? 'Other (Custom)' : criteria.role_function}
            onChange={(e) => {
              const value = e.target.value
              if (value === 'Other (Custom)') {
                setShowCustomRole(true)
                setCriteria({ ...criteria, role_function: '' })
              } else {
                setShowCustomRole(false)
                setCriteria({ ...criteria, role_function: value })
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select role...</option>
            {commonRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>

          {showCustomRole && (
            <input
              type="text"
              value={criteria.role_function}
              onChange={(e) => setCriteria({ ...criteria, role_function: e.target.value })}
              placeholder="Enter your custom role..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent mt-2"
              autoFocus
            />
          )}

          <p className="text-xs text-gray-500 mt-1">
            {showCustomRole
              ? 'Enter a custom role (e.g., "Growth Hacker", "Solution Architect")'
              : 'Select from common roles or choose "Other" for custom'}
          </p>
        </div>

        {/* Geography */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Geography *
          </label>
          <input
            type="text"
            value={criteria.geography}
            onChange={(e) => setCriteria({ ...criteria, geography: e.target.value })}
            placeholder="e.g., Remote, Bay Area, NYC, US-based"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <p className="text-xs text-gray-500 mt-1">Where do you want to work?</p>
        </div>

        {/* Company Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Size
          </label>
          <select
            value={criteria.company_size}
            onChange={(e) => setCriteria({ ...criteria, company_size: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select...</option>
            <option value="startup">Startup (1-50)</option>
            <option value="small">Small (51-200)</option>
            <option value="medium">Medium (201-1000)</option>
            <option value="large">Large (1001-5000)</option>
            <option value="enterprise">Enterprise (5000+)</option>
            <option value="any">Any size</option>
          </select>
        </div>

        {/* Sector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sector
          </label>
          <input
            type="text"
            value={criteria.sector}
            onChange={(e) => setCriteria({ ...criteria, sector: e.target.value })}
            placeholder="e.g., B2B, B2C, Enterprise, Consumer"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Revenue Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Revenue Range
          </label>
          <input
            type="text"
            value={criteria.revenue_range}
            onChange={(e) => setCriteria({ ...criteria, revenue_range: e.target.value })}
            placeholder="e.g., $10M-$100M ARR"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Employee Count Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Employee Count Range
          </label>
          <input
            type="text"
            value={criteria.employee_count_range}
            onChange={(e) => setCriteria({ ...criteria, employee_count_range: e.target.value })}
            placeholder="e.g., 100-500 employees"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
        </div>

        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Salary Range
          </label>
          <input
            type="text"
            value={criteria.salary_range}
            onChange={(e) => setCriteria({ ...criteria, salary_range: e.target.value })}
            placeholder="e.g., $120K-$180K"
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
          value={criteria.notes}
          onChange={(e) => setCriteria({ ...criteria, notes: e.target.value })}
          placeholder="Any other criteria? Company culture preferences? Values? Growth stage? Funding status?"
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-sm font-medium">Saved successfully!</span>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={saving || !criteria.industry || !criteria.role_function || !criteria.geography}
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
              Save Criteria
            </>
          )}
        </button>
      </div>
    </div>
  )
}
