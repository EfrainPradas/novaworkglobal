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

  // --- LOCAL AI QUESTIONNAIRE STATE ---
  const [showAiBuilder, setShowAiBuilder] = useState(false)
  const [generatingScope, setGeneratingScope] = useState(false)
  const [aiForm, setAiForm] = useState({
    core_mandate_verb: '',
    core_mandate_objective: '',
    core_mandate_trigger: '',
    core_mandate_success: '',
    fin_annual_spend: '',
    fin_revenue_impact: '',
    fin_pl_ownership: '',
    geo_scope: '',
    geo_countries_count: '',
    geo_business_units: '',
    lead_direct_reports: '',
    lead_total_team: '',
    lead_stakeholders: [] as string[],
    ecosystem_count: '',
    ecosystem_names: '',
    ecosystem_categories: '',
    ecosystem_brands: '',
    ecosystem_technologies: '',
    complexity_factors: [] as string[]
  })

  const COMPLEXITY_FACTORS = [
    'Matrix organization', 'Highly regulated', 'Transformation mandate',
    'M&A integration', 'High-growth scaling', 'Turnaround / crisis',
    'Digital modernization', 'Global standardization'
  ]

  const STAKEHOLDERS = [
    'Director', 'VP', 'C-Suite', 'Board', 'Cross-functional leadership'
  ]

  const VERBS = [
    'Led', 'Transformed', 'Built', 'Established', 'Centralized', 'Scaled',
    'Optimized', 'Modernized', 'Integrated', 'Drove', 'Repositioned',
    'Stabilized', 'Launched', 'Architected', 'Oversaw'
  ]

  const handleAiUpdate = (field: string, value: any) => {
    setAiForm(prev => ({ ...prev, [field]: value }))
  }

  const toggleAiArray = (field: 'lead_stakeholders' | 'complexity_factors', item: string) => {
    setAiForm(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }))
  }

  const handleGenerateScope = async () => {
    setGeneratingScope(true)
    setError(null)
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/work-experience/generate-scope`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('../../lib/supabase').then(m => m.supabase.auth.getSession())).data.session?.access_token}`
        },
        body: JSON.stringify({ aiForm, jobTitle: formData.job_title })
      })
      if (!resp.ok) throw new Error('Failed to generate scope')
      const result = await resp.json()
      setFormData(prev => ({ ...prev, scope_description: result.text }))
      setShowAiBuilder(false) // collapse on success
    } catch (e: any) {
      console.error(e)
      setError('AI generation failed: ' + e.message)
    } finally {
      setGeneratingScope(false)
    }
  }
  // ------------------------------------
  
  const [usState, setUsState] = useState('')
  const [scopeMode, setScopeMode] = useState<'ai' | 'manual' | null>(
    initialData?.scope_description ? 'manual' : null
  )

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: currentYear - 1959 }, (_, i) => (currentYear - i).toString())

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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.workExperience.company')} *
          </label>
          <input
            type="text"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Google, Microsoft, etc."
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.workExperience.companyDesc')}
          </label>
          <input
            type="text"
            value={formData.company_description}
            onChange={(e) => setFormData({ ...formData, company_description: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder={t('resumeBuilder.workExperience.companyDescPlaceholder')}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
          <select
            value={formData.location_country}
            onChange={(e) => {
              setFormData({ ...formData, location_country: e.target.value })
              // Clear state if switching from USA to another country
              if (e.target.value !== 'USA') {
                setUsState('')
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <select
              value={usState}
              onChange={(e) => setUsState(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
          <input
            type="text"
            value={formData.location_city ? formData.location_city.split(',')[0].trim() : ''}
            onChange={(e) => setFormData({ ...formData, location_city: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder={formData.location_country === 'USA' ? 'San Francisco' : 'Enter city name'}
          />
        </div>
      </div>

      {/* Role Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.workExperience.jobTitle')} *
          </label>
          <input
            type="text"
            value={formData.job_title}
            onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
            placeholder="Senior Product Manager"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.workExperience.startDate')} * (YYYY)
          </label>
          <select
            value={formData.start_date || ''}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="" disabled>Select Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('resumeBuilder.workExperience.endDate')} (YYYY)
          </label>
          <select
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
            disabled={formData.is_current}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 disabled:bg-gray-100 dark:disabled:bg-slate-700"
          >
            <option value="" disabled>Select Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
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
            <span className="text-sm text-gray-700 dark:text-gray-300">{t('resumeBuilder.workExperience.current')}</span>
          </label>
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Scope</label>
          <p className="text-xs text-gray-500 dark:text-gray-400">Choose how you want to define your role scope.</p>
        </div>

        {/* Scope Mode Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => { setShowAiBuilder(!showAiBuilder); setScopeMode('ai') }}
            className={`flex-1 px-5 py-3 font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
              scopeMode === 'ai'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white hover:opacity-90 hover:shadow-md'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            ✨ Build Scope with AI Questionnaire
          </button>
          <button
            type="button"
            onClick={() => { setScopeMode(scopeMode === 'manual' ? null : 'manual'); setShowAiBuilder(false) }}
            className={`flex-1 px-5 py-3 font-semibold rounded-xl text-sm shadow-sm transition-all flex items-center justify-center gap-2 ${
              scopeMode === 'manual'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            ✏️ Fill Manually
          </button>
        </div>

        {/* Manual textarea - only shows when manual is selected */}
        {scopeMode === 'manual' && (
          <div className="mt-2">
            <textarea
              value={formData.scope_description}
              onChange={(e) => setFormData({ ...formData, scope_description: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500"
              placeholder="e.g. Designed and implemented analytics-driven workflows..."
              autoFocus
            />
          </div>
        )}

        {/* If AI generated a scope, show it as a preview */}
        {scopeMode === 'ai' && formData.scope_description && !showAiBuilder && (
          <div className="mt-2 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-lg text-sm text-teal-900 dark:text-teal-200">
            <p className="font-medium mb-1 text-xs text-teal-600 dark:text-teal-400 uppercase tracking-wide">Generated Scope</p>
            {formData.scope_description}
          </div>
        )}
      </div>

      {showAiBuilder && (
        <div className="bg-gray-50 dark:bg-slate-800/50 p-6 rounded-xl border border-gray-200 dark:border-slate-700 space-y-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-slate-700 pb-2">Scope & Mandate Questionnaire</h4>
          <p className="text-sm text-gray-500">Fill out as much as you can. Our AI will draft a concise 3-line scope summary for you based on this specific role.</p>

          {/* Section 1 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800 dark:text-gray-200">1. Core Mandate</h5>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Primary Action Verb</label>
              <select value={aiForm.core_mandate_verb} onChange={e => handleAiUpdate('core_mandate_verb', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
                <option value="">Select a verb...</option>
                {VERBS.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <input placeholder="Objective of the role?" value={aiForm.core_mandate_objective} onChange={e => handleAiUpdate('core_mandate_objective', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Trigger for role creation/continuation?" value={aiForm.core_mandate_trigger} onChange={e => handleAiUpdate('core_mandate_trigger', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Definition of success (Outcomes)?" value={aiForm.core_mandate_success} onChange={e => handleAiUpdate('core_mandate_success', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>

          {/* Section 2 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800 dark:text-gray-200">2. Financial Scope</h5>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Annual budget managed (e.g. $5M)" value={aiForm.fin_annual_spend} onChange={e => handleAiUpdate('fin_annual_spend', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              <input placeholder="Revenue impact" value={aiForm.fin_revenue_impact} onChange={e => handleAiUpdate('fin_revenue_impact', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <select value={aiForm.fin_pl_ownership} onChange={e => handleAiUpdate('fin_pl_ownership', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="">P&L Ownership?</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Partial">Partial</option>
            </select>
          </div>

          {/* Section 3 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800 dark:text-gray-200">3. Geographic Scope</h5>
            <select value={aiForm.geo_scope} onChange={e => handleAiUpdate('geo_scope', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white">
              <option value="">Geographic Scope...</option>
              <option value="Local">Local</option>
              <option value="Regional">Regional</option>
              <option value="Global">Global</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Number of countries" value={aiForm.geo_countries_count} onChange={e => handleAiUpdate('geo_countries_count', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              <input placeholder="Number of BUs supported" value={aiForm.geo_business_units} onChange={e => handleAiUpdate('geo_business_units', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800 dark:text-gray-200">4. Leadership Scope</h5>
            <div className="grid grid-cols-2 gap-2">
              <input placeholder="Direct reports (number)" value={aiForm.lead_direct_reports} onChange={e => handleAiUpdate('lead_direct_reports', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
              <input placeholder="Total team size" value={aiForm.lead_total_team} onChange={e => handleAiUpdate('lead_total_team', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            </div>
            <p className="text-xs text-gray-500">Stakeholders engaged:</p>
            <div className="flex flex-wrap gap-2">
              {STAKEHOLDERS.map(s => (
                <button type="button" key={s} onClick={() => toggleAiArray('lead_stakeholders', s)} className={`px-2 py-1 text-xs rounded border ${aiForm.lead_stakeholders.includes(s) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-600'}`}>{s}</button>
              ))}
            </div>
          </div>

          {/* Section 5 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800 dark:text-gray-200">5. Ecosystem Complexity</h5>
            <input placeholder="Number of brands/clients/vendors" value={aiForm.ecosystem_count} onChange={e => handleAiUpdate('ecosystem_count', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Most important brands/clients" value={aiForm.ecosystem_names} onChange={e => handleAiUpdate('ecosystem_names', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Categories / product lines" value={aiForm.ecosystem_categories} onChange={e => handleAiUpdate('ecosystem_categories', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Managed brands names (if relevant)" value={aiForm.ecosystem_brands} onChange={e => handleAiUpdate('ecosystem_brands', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
            <input placeholder="Managed tech / methodologies" value={aiForm.ecosystem_technologies} onChange={e => handleAiUpdate('ecosystem_technologies', e.target.value)} className="w-full px-3 py-1.5 border rounded-md text-sm dark:bg-slate-700 dark:border-slate-600 dark:text-white" />
          </div>

          {/* Section 6 */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-800 dark:text-gray-200">6. Complexity Factors</h5>
            <div className="flex flex-wrap gap-2">
              {COMPLEXITY_FACTORS.map(c => (
                <button type="button" key={c} onClick={() => toggleAiArray('complexity_factors', c)} className={`px-2 py-1 text-xs rounded border ${aiForm.complexity_factors.includes(c) ? 'bg-primary-50 border-primary-500 text-primary-700' : 'bg-white border-gray-300 dark:bg-slate-800 dark:border-slate-600'}`}>{c}</button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerateScope}
            disabled={generatingScope}
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg text-sm shadow-sm hover:opacity-90 disabled:opacity-50"
          >
            {generatingScope ? 'Generating...' : '✨ Generate Scope with AI'}
          </button>
        </div>
      )}



      {/* Actions */}
      <div className="flex justify-between pt-4 border-t">
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800"
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
