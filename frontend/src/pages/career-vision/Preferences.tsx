/**
 * Ideal Work Preferences Page
 * Sprint 4: 11-category questionnaire with priority weighting
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../lib/supabase'
import { Save, Sparkles, CheckCircle } from 'lucide-react'

export interface WorkPreferences {
  industry_preference: string
  industry_weight: string
  geographic_preference: string
  geographic_weight: string
  compensation_preference: string
  compensation_weight: string
  benefits_preference: string
  benefits_weight: string
  company_profile_preference: string
  company_profile_weight: string
  position_goals_preference: string
  position_goals_weight: string
  promotion_basis_preference: string
  promotion_basis_weight: string
  company_culture_preference: string
  company_culture_weight: string
  lifestyle_preference: string
  lifestyle_weight: string
  boss_type_preference: string
  boss_type_weight: string
  other_preference: string
  other_weight: string
}

const WEIGHT_OPTIONS = [
  { value: 'M', label: 'Must-have', color: 'text-red-600 font-bold' },
  { value: '10', label: '10 - Extremely Important', color: 'text-orange-600' },
  { value: '9', label: '9', color: 'text-orange-500' },
  { value: '8', label: '8', color: 'text-yellow-600' },
  { value: '7', label: '7', color: 'text-yellow-500' },
  { value: '6', label: '6', color: 'text-green-600' },
  { value: '5', label: '5 - Moderately Important', color: 'text-green-500' },
  { value: '4', label: '4', color: 'text-blue-600' },
  { value: '3', label: '3', color: 'text-blue-500' },
  { value: '2', label: '2', color: 'text-gray-600' },
  { value: '1', label: '1 - Least Important', color: 'text-gray-500' }
]

interface PreferencesProps {
  embedded?: boolean
  initialData?: WorkPreferences
}

export default function Preferences({ embedded = false, initialData }: PreferencesProps) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(!initialData)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [viewMode, setViewMode] = useState<'edit' | 'dashboard'>(initialData ? 'dashboard' : 'edit')

  const [preferences, setPreferences] = useState<WorkPreferences>({
    industry_preference: initialData?.industry_preference || '',
    industry_weight: initialData?.industry_weight || '5',
    geographic_preference: initialData?.geographic_preference || '',
    geographic_weight: initialData?.geographic_weight || '5',
    compensation_preference: initialData?.compensation_preference || '',
    compensation_weight: initialData?.compensation_weight || '5',
    benefits_preference: initialData?.benefits_preference || '',
    benefits_weight: initialData?.benefits_weight || '5',
    company_profile_preference: initialData?.company_profile_preference || '',
    company_profile_weight: initialData?.company_profile_weight || '5',
    position_goals_preference: initialData?.position_goals_preference || '',
    position_goals_weight: initialData?.position_goals_weight || '5',
    promotion_basis_preference: initialData?.promotion_basis_preference || '',
    promotion_basis_weight: initialData?.promotion_basis_weight || '5',
    company_culture_preference: initialData?.company_culture_preference || '',
    company_culture_weight: initialData?.company_culture_weight || '5',
    lifestyle_preference: initialData?.lifestyle_preference || '',
    lifestyle_weight: initialData?.lifestyle_weight || '5',
    boss_type_preference: initialData?.boss_type_preference || '',
    boss_type_weight: initialData?.boss_type_weight || '5',
    other_preference: initialData?.other_preference || '',
    other_weight: initialData?.other_weight || '5'
  })

  useEffect(() => {
    if (!initialData) {
      loadPreferences()
    }
  }, [initialData])

  const loadPreferences = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        if (!embedded) navigate('/signin')
        return
      }

      const { data, error } = await supabase
        .from('ideal_work_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        console.log('✅ Loaded existing preferences')
        setPreferences({
          industry_preference: data.industry_preference || '',
          industry_weight: data.industry_weight || '5',
          geographic_preference: data.geographic_preference || '',
          geographic_weight: data.geographic_weight || '5',
          compensation_preference: data.compensation_preference || '',
          compensation_weight: data.compensation_weight || '5',
          benefits_preference: data.benefits_preference || '',
          benefits_weight: data.benefits_weight || '5',
          company_profile_preference: data.company_profile_preference || '',
          company_profile_weight: data.company_profile_weight || '5',
          position_goals_preference: data.position_goals_preference || '',
          position_goals_weight: data.position_goals_weight || '5',
          promotion_basis_preference: data.promotion_basis_preference || '',
          promotion_basis_weight: data.promotion_basis_weight || '5',
          company_culture_preference: data.company_culture_preference || '',
          company_culture_weight: data.company_culture_weight || '5',
          lifestyle_preference: data.lifestyle_preference || '',
          lifestyle_weight: data.lifestyle_weight || '5',
          boss_type_preference: data.boss_type_preference || '',
          boss_type_weight: data.boss_type_weight || '5',
          other_preference: data.other_preference || '',
          other_weight: data.other_weight || '5'
        })
        if (!initialData) setViewMode('dashboard')
      }
    } catch (error) {
      console.error('Error loading preferences:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      // Check if preferences exist
      const { data: existing } = await supabase
        .from('ideal_work_preferences')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (existing) {
        // Update
        const { error } = await supabase
          .from('ideal_work_preferences')
          .update({
            ...preferences,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) throw error
        console.log('✅ Preferences updated')
      } else {
        // Insert
        const { error } = await supabase
          .from('ideal_work_preferences')
          .insert({
            user_id: user.id,
            ...preferences
          })

        if (error) throw error
        console.log('✅ Preferences created')
      }

      setSaved(true)

      // Mark Career Vision as completed if all sections done
      await supabase
        .from('user_profiles')
        .update({
          career_vision_completed: true
        })
        .eq('user_id', user.id)

      // Navigate to next section (Job History)
      setTimeout(() => {
        navigate('/career-vision/job-history')
      }, 1500)

    } catch (error) {
      console.error('Error saving preferences:', error)
      alert('Failed to save preferences. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updatePreference = (field: keyof WorkPreferences, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const categories = [
    {
      id: 'industry',
      title: 'Industry Preferences',
      icon: '🏢',
      description: 'What industries or sectors are you targeting? (e.g., Technology, Healthcare, Finance)',
      preferenceField: 'industry_preference' as keyof WorkPreferences,
      weightField: 'industry_weight' as keyof WorkPreferences,
      placeholder: 'Describe your ideal industry or sectors...'
    },
    {
      id: 'geographic',
      title: 'Geographic Location',
      icon: '🌎',
      description: 'Where do you want to work? Consider cities, regions, remote options.',
      preferenceField: 'geographic_preference' as keyof WorkPreferences,
      weightField: 'geographic_weight' as keyof WorkPreferences,
      placeholder: 'Describe your location preferences...'
    },
    {
      id: 'compensation',
      title: 'Compensation Package',
      icon: '💰',
      description: 'What are your salary and compensation expectations?',
      preferenceField: 'compensation_preference' as keyof WorkPreferences,
      weightField: 'compensation_weight' as keyof WorkPreferences,
      placeholder: 'Describe your compensation expectations...'
    },
    {
      id: 'benefits',
      title: 'Benefits & Perks',
      icon: '🎁',
      description: 'What benefits matter most? (health insurance, retirement, PTO, etc.)',
      preferenceField: 'benefits_preference' as keyof WorkPreferences,
      weightField: 'benefits_weight' as keyof WorkPreferences,
      placeholder: 'Describe your must-have benefits...'
    },
    {
      id: 'company_profile',
      title: 'Company Profile',
      icon: '🏛️',
      description: 'What size and type of company? (startup, enterprise, non-profit, etc.)',
      preferenceField: 'company_profile_preference' as keyof WorkPreferences,
      weightField: 'company_profile_weight' as keyof WorkPreferences,
      placeholder: 'Describe your ideal company profile...'
    },
    {
      id: 'position_goals',
      title: 'Position & Career Goals',
      icon: '🎯',
      description: 'What role and growth opportunities are you seeking?',
      preferenceField: 'position_goals_preference' as keyof WorkPreferences,
      weightField: 'position_goals_weight' as keyof WorkPreferences,
      placeholder: 'Describe your position and career goals...'
    },
    {
      id: 'promotion_basis',
      title: 'Basis of Promotion',
      icon: '📈',
      description: 'How do you want to be evaluated for advancement? (merit, tenure, performance)',
      preferenceField: 'promotion_basis_preference' as keyof WorkPreferences,
      weightField: 'promotion_basis_weight' as keyof WorkPreferences,
      placeholder: 'Describe your ideal promotion system...'
    },
    {
      id: 'company_culture',
      title: 'Company Culture',
      icon: '🤝',
      description: 'What kind of workplace culture thrives you? (collaborative, competitive, innovative)',
      preferenceField: 'company_culture_preference' as keyof WorkPreferences,
      weightField: 'company_culture_weight' as keyof WorkPreferences,
      placeholder: 'Describe your ideal company culture...'
    },
    {
      id: 'lifestyle',
      title: 'Work Style & Lifestyle',
      icon: '⚖️',
      description: 'What work-life balance and flexibility do you need? (remote, hybrid, hours)',
      preferenceField: 'lifestyle_preference' as keyof WorkPreferences,
      weightField: 'lifestyle_weight' as keyof WorkPreferences,
      placeholder: 'Describe your ideal work style and lifestyle...'
    },
    {
      id: 'boss_type',
      title: 'Type of Boss',
      icon: '👔',
      description: 'What management style works best for you? (hands-on, autonomy, coaching)',
      preferenceField: 'boss_type_preference' as keyof WorkPreferences,
      weightField: 'boss_type_weight' as keyof WorkPreferences,
      placeholder: 'Describe your ideal manager and their style...'
    },
    {
      id: 'other',
      title: 'Other Considerations',
      icon: '✨',
      description: 'Any other factors important to your decision? (mission, diversity, innovation)',
      preferenceField: 'other_preference' as keyof WorkPreferences,
      weightField: 'other_weight' as keyof WorkPreferences,
      placeholder: 'Describe any other important considerations...'
    }
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your preferences...</p>
        </div>
      </div>
    )
  }

  // Dashboard View
  if (viewMode === 'dashboard') {
    return (
      <div className={`${embedded ? '' : 'min-h-screen bg-gray-50 dark:bg-gray-900 py-8'} transition-colors duration-200`}>
        <div className={`${embedded ? '' : 'max-w-6xl mx-auto px-4'}`}>
          {!embedded && (
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  My Ideal Work Dashboard
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Your prioritized criteria for your next career move.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/career-vision')}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Back to Menu
                </button>
                <button
                  onClick={() => setViewMode('edit')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 shadow-md flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Edit Preferences
                </button>
              </div>
            </div>
          )}

          {embedded && (
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              Ideal Work Preferences
            </h2>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Must Haves */}
            <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/30">
              <h2 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                <span className="text-xl">🔥</span> Must Haves (Non-negotiables)
              </h2>
              <div className="space-y-4">
                {categories.filter(c => preferences[c.weightField] === 'M').map(c => (
                  <div key={c.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-red-500">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{c.icon}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{preferences[c.preferenceField] || 'Not specified'}</p>
                  </div>
                ))}
                {categories.filter(c => preferences[c.weightField] === 'M').length === 0 && (
                  <p className="text-sm text-gray-400 italic">No non-negotiables defined yet.</p>
                )}
              </div>
            </div>

            {/* High Priority */}
            <div className="bg-orange-50 dark:bg-orange-900/10 rounded-xl p-6 border border-orange-100 dark:border-orange-900/30">
              <h2 className="text-lg font-bold text-orange-700 dark:text-orange-400 mb-4 flex items-center gap-2">
                <span className="text-xl">⭐</span> High Priority (8-10)
              </h2>
              <div className="space-y-4">
                {categories.filter(c => {
                  const w = parseInt(preferences[c.weightField])
                  return !isNaN(w) && w >= 8
                }).map(c => (
                  <div key={c.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-orange-400">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{c.icon}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                      <span className="ml-auto text-xs font-bold bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 px-2 py-1 rounded">
                        {preferences[c.weightField]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{preferences[c.preferenceField]}</p>
                  </div>
                ))}
                {categories.filter(c => { const w = parseInt(preferences[c.weightField]); return !isNaN(w) && w >= 8 }).length === 0 && (
                  <p className="text-sm text-gray-400 italic">No high priorities defined.</p>
                )}
              </div>
            </div>

            {/* Medium/Low Priority */}
            <div className="bg-blue-50 dark:bg-blue-900/10 rounded-xl p-6 border border-blue-100 dark:border-blue-900/30">
              <h2 className="text-lg font-bold text-blue-700 dark:text-blue-400 mb-4 flex items-center gap-2">
                <span className="text-xl">📝</span> Nice to Have (1-7)
              </h2>
              <div className="space-y-4">
                {categories.filter(c => {
                  const w = parseInt(preferences[c.weightField])
                  // Include 'M' case check just in case, but M is string
                  return !isNaN(w) && w < 8
                }).sort((a, b) => parseInt(preferences[b.weightField]) - parseInt(preferences[a.weightField])).map(c => (
                  <div key={c.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-blue-300">
                    <div className="flex items-center gap-2 mb-2">
                      <span>{c.icon}</span>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{c.title}</h3>
                      <span className="ml-auto text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                        {preferences[c.weightField]}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{preferences[c.preferenceField]}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/career-vision/dashboard')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mb-4"
          >
            ← {t('common.back', 'Back to Career Vision')}
          </button>
          <div className="flex justify-between items-start">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              ⚙️ Ideal Work Preferences
            </h1>
            {/* View Dashboard Button */}
            <button
              onClick={() => setViewMode('dashboard')}
              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 text-sm font-semibold underline"
            >
              View Dashboard
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Define your priorities across 11 key categories. Rate each from Must-have (M) to 1 (least important).
          </p>

          {/* Weight Legend */}
          <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 transition-colors">
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              <strong>Priority Scale:</strong>
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border border-red-200 dark:border-red-900 text-gray-700 dark:text-gray-300">
                <strong className="text-red-600 dark:text-red-400">M</strong> = Must-have
              </span>
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <strong className="text-orange-600 dark:text-orange-400">10</strong> = Extremely Important
              </span>
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <strong className="text-green-600 dark:text-green-400">5</strong> = Moderately Important
              </span>
              <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded border dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <strong className="text-gray-600 dark:text-gray-400">1</strong> = Least Important
              </span>
            </div>
          </div>
        </div>

        {/* Categories Form */}
        <div className="space-y-6 mb-8">
          {categories.map((category, index) => (
            <div key={category.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
              <div className="flex items-start gap-4">
                <div className="text-4xl">{category.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                    {index + 1}. {category.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{category.description}</p>

                  {/* Preference Input */}
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Your Preference:
                    </label>
                    <textarea
                      value={preferences[category.preferenceField]}
                      onChange={(e) => updatePreference(category.preferenceField, e.target.value)}
                      placeholder={category.placeholder}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none placeholder-gray-400 dark:placeholder-gray-500"
                    />
                  </div>

                  {/* Weight Selector */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Priority Weight:
                    </label>
                    <select
                      value={preferences[category.weightField]}
                      onChange={(e) => updatePreference(category.weightField, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {WEIGHT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value} className="dark:bg-gray-800">
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Save Button */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                Ready to save your preferences?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your preferences will help us match you with ideal job opportunities
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${saved
                ? 'bg-green-600 text-white'
                : saving
                  ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
            >
              {saved ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Saved!
                </>
              ) : saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save Preferences
                </>
              )}
            </button>
          </div>
        </div>

        {/* Integration Note */}
        <div className="mt-6 bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-900/30 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            <Sparkles className="inline w-4 h-4 text-purple-600 dark:text-purple-400 mr-1" />
            <strong>Coming Soon:</strong> These preferences will automatically score and filter jobs in Fast-Track Job Search!
          </p>
        </div>
      </div>
    </div>
  )
}
