import React, { useState } from 'react'
import { WorkExperience } from '../../types/resume'
import { useTranslation } from 'react-i18next'
import { COUNTRIES, US_STATES } from '../../constants/locations'

interface WorkExperienceFormProps {
  onSubmit: (experience: WorkExperience) => Promise<void>
  onCancel: () => void
  initialData?: WorkExperience
}

export const WorkExperienceForm: React.FC<WorkExperienceFormProps> = ({
  onSubmit,
  onCancel,
  initialData
}) => {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<WorkExperience>>({
    company_name: initialData?.company_name || '',
    company_description: initialData?.company_description || '',
    location_city: initialData?.location_city || '',
    location_country: initialData?.location_country || '',
    job_title: initialData?.job_title || '',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    is_current: initialData?.is_current || false,
    scope_description: initialData?.scope_description || '',
    budget: initialData?.budget || '',
    headcount: initialData?.headcount || '',
    geographies: initialData?.geographies || [],
    vendors: initialData?.vendors || [],
    tools_systems: initialData?.tools_systems || [],
    order_index: initialData?.order_index || 0
  })

  const [geoInput, setGeoInput] = useState('')
  const [vendorInput, setVendorInput] = useState('')
  const [toolInput, setToolInput] = useState('')
  const [usState, setUsState] = useState('')

  // Parse US state from location_city on mount if initialData exists
  React.useEffect(() => {
    if (initialData?.location_country === 'USA' && initialData?.location_city) {
      const cityParts = initialData.location_city.split(',').map(s => s.trim())
      if (cityParts.length > 1) {
        const possibleState = cityParts[cityParts.length - 1]
        if (US_STATES.some(state => state.value === possibleState)) {
          setUsState(possibleState)
        }
      }
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.company_name?.trim()) {
      setError(t('resumeBuilder.workExperience.company') + ' is required')
      return
    }

    if (!formData.job_title?.trim()) {
      setError(t('resumeBuilder.workExperience.jobTitle') + ' is required')
      return
    }

    if (!formData.start_date?.trim()) {
      setError(t('resumeBuilder.workExperience.startDate') + ' is required')
      return
    }

    // Format location_city with state if USA
    const updatedFormData = { ...formData }
    if (formData.location_country === 'USA' && usState && formData.location_city) {
      const cityOnly = formData.location_city.split(',')[0].trim()
      updatedFormData.location_city = `${cityOnly}, ${usState}`
    }

    setSaving(true)
    try {
      await onSubmit(updatedFormData as WorkExperience)
    } catch (err: any) {
      setError(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const addItem = (type: 'geo' | 'vendor' | 'tool') => {
    const input = type === 'geo' ? geoInput : type === 'vendor' ? vendorInput : toolInput
    if (!input.trim()) return

    const field = type === 'geo' ? 'geographies' : type === 'vendor' ? 'vendors' : 'tools_systems'
    const current = formData[field] || []

    if (!current.includes(input.trim())) {
      setFormData({ ...formData, [field]: [...current, input.trim()] })
    }

    if (type === 'geo') setGeoInput('')
    else if (type === 'vendor') setVendorInput('')
    else setToolInput('')
  }

  const removeItem = (type: 'geo' | 'vendor' | 'tool', item: string) => {
    const field = type === 'geo' ? 'geographies' : type === 'vendor' ? 'vendors' : 'tools_systems'
    const current = formData[field] || []
    setFormData({ ...formData, [field]: current.filter(i => i !== item) })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('resumeBuilder.workExperience.company')} *
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Google, Microsoft, etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('resumeBuilder.workExperience.companyDesc')}
          </label>
          <input
            type="text"
            value={formData.company_description}
            onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder={t('resumeBuilder.workExperience.companyDescPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
          <select
            value={formData.location_country}
            onChange={(e) => {
              setFormData({ ...formData, location_country: e.target.value })
              // Clear state if switching from USA to another country
              if (e.target.value !== 'USA') {
                setUsState('')
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            {COUNTRIES.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {formData.location_country === 'USA' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <select
              value={usState}
              onChange={(e) => setUsState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              {US_STATES.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.label}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
          <input
            type="text"
            value={formData.location_city ? formData.location_city.split(',')[0].trim() : ''}
            onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder={formData.location_country === 'USA' ? 'San Francisco' : 'Enter city name'}
          />
        </div>
      </div>

      {/* Role Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('resumeBuilder.workExperience.jobTitle')} *
          </label>
          <input
            type="text"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Senior Product Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('resumeBuilder.workExperience.startDate')} * (YYYY or MM/YYYY)
          </label>
          <input
            type="text"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="01/2020 or 2020"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('resumeBuilder.workExperience.endDate')} (YYYY or MM/YYYY)
          </label>
          <input
            type="text"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.is_current}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100"
            placeholder="12/2023 or 2023"
          />
        </div>

        <div className="md:col-span-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.is_current}
              onChange={(e) => setFormData({
                ...formData,
                is_current: e.target.checked,
                end_date: e.target.checked ? '' : formData.end_date
              })}
              className="w-4 h-4 text-primary-600"
            />
            <span className="text-sm text-gray-700">{t('resumeBuilder.workExperience.current')}</span>
          </label>
        </div>
      </div>

      {/* Scope */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('resumeBuilder.workExperience.scope')}
        </label>
        <p className="text-xs text-gray-500 mb-2">{t('resumeBuilder.workExperience.scopeHelp')}</p>
        <textarea
          value={formData.scope_description}
          onChange={(e) => setFormData({ ...formData, scope_description: e.target.value })}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          placeholder={t('resumeBuilder.workExperience.scopePlaceholder')}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Budget</label>
          <input
            type="text"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="$5M, €2M, etc."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Headcount</label>
          <input
            type="text"
            value={formData.headcount}
            onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="12, 50+, etc."
          />
        </div>
      </div>

      {/* Geographies */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Geographies</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={geoInput}
            onChange={(e) => setGeoInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('geo'))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="LATAM, EMEA, North America, etc."
          />
          <button
            type="button"
            onClick={() => addItem('geo')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        {formData.geographies && formData.geographies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.geographies.map((geo, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {geo}
                <button type="button" onClick={() => removeItem('geo', geo)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Tools/Systems */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">{t('resumeBuilder.workExperience.tools')}</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={toolInput}
            onChange={(e) => setToolInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('tool'))}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Salesforce, Jira, SQL, etc."
          />
          <button
            type="button"
            onClick={() => addItem('tool')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Add
          </button>
        </div>
        {formData.tools_systems && formData.tools_systems.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tools_systems.map((tool, i) => (
              <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {tool}
                <button type="button" onClick={() => removeItem('tool', tool)}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
        >
          {saving ? t('common.saving') : t('common.save')}
        </button>
      </div>
    </form>
  )
}
