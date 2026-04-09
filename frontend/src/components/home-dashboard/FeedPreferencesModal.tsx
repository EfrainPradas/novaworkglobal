import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Check, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { getUserFeedPreferences, saveUserFeedPreferences } from '../../services/careerFeed.service'
import type { CareerGoal } from '../../types/career-feed'

interface FeedPreferencesModalProps {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

// ─── Options ────────────────────────────────────────────────

const ROLE_OPTIONS = [
  'software_engineer', 'data_scientist', 'product_manager', 'project_manager',
  'ux_designer', 'devops_engineer', 'business_analyst', 'marketing_manager',
  'financial_analyst', 'sales_manager', 'hr_manager', 'operations_manager',
  'compliance_officer', 'healthcare_admin', 'consultant', 'vanguard',
]

const INDUSTRY_OPTIONS = [
  'technology', 'finance', 'healthcare', 'manufacturing',
  'energy', 'consulting', 'government', 'nonprofit',
  'education', 'retail', 'media', 'professional_services',
]

const GEO_OPTIONS = [
  'US', 'Canada', 'EU', 'UK', 'LATAM', 'Colombia', 'Brazil', 'Mexico',
  'Asia', 'remote', 'global',
]

const CAREER_GOALS: { value: CareerGoal; labelKey: string; color: string }[] = [
  { value: 'transition', labelKey: 'transition', color: '#1565C0' },
  { value: 'reinvention', labelKey: 'reinvention', color: '#7B1FA2' },
  { value: 'alignment', labelKey: 'alignment', color: '#2E7D32' },
]

// ─── Component ──────────────────────────────────────────────

export default function FeedPreferencesModal({ open, onClose, onSaved }: FeedPreferencesModalProps) {
  const { t } = useTranslation()
  const tf = (key: string) => t(`dashboard.careerFeed.preferences.${key}`)

  const [roles, setRoles] = useState<string[]>([])
  const [industries, setIndustries] = useState<string[]>([])
  const [geographies, setGeographies] = useState<string[]>([])
  const [careerGoal, setCareerGoal] = useState<CareerGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Load existing preferences or pre-populate from onboarding
  const loadPreferences = useCallback(async () => {
    setLoading(true)
    try {
      const prefs = await getUserFeedPreferences()

      if (prefs && (prefs.target_roles?.length || prefs.target_industries?.length || prefs.career_goal)) {
        // User has existing preferences
        setRoles(prefs.target_roles ?? [])
        setIndustries(prefs.target_industries ?? [])
        setGeographies(prefs.target_geographies ?? [])
        setCareerGoal(prefs.career_goal ?? null)
      } else {
        // Try to pre-populate from onboarding data
        await prepopulateFromOnboarding()
      }
    } catch {
      // Silent — just start empty
    } finally {
      setLoading(false)
    }
  }, [])

  async function prepopulateFromOnboarding() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Check onboarding profile for target job title
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('target_job_title, location_country, location_state')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profile?.target_job_title) {
        // Try to match to a known role
        const titleLower = profile.target_job_title.toLowerCase()
        const matchedRole = ROLE_OPTIONS.find(r =>
          titleLower.includes(r.replace(/_/g, ' '))
        )
        if (matchedRole) setRoles([matchedRole])
      }

      // Check ideal work preferences for industry
      const { data: workPrefs } = await supabase
        .from('ideal_work_preferences')
        .select('industry_preference, geographic_preference')
        .eq('user_id', user.id)
        .maybeSingle()

      if (workPrefs?.industry_preference) {
        const indLower = workPrefs.industry_preference.toLowerCase()
        const matchedIndustries = INDUSTRY_OPTIONS.filter(i =>
          indLower.includes(i.replace(/_/g, ' '))
        )
        if (matchedIndustries.length) setIndustries(matchedIndustries)
      }

      // Geography from profile
      if (profile?.location_country) {
        const country = profile.location_country.toLowerCase()
        if (country.includes('united states') || country.includes('usa') || country === 'us') setGeographies(['US'])
        else if (country.includes('colombia')) setGeographies(['Colombia', 'LATAM'])
        else if (country.includes('brazil')) setGeographies(['Brazil', 'LATAM'])
        else if (country.includes('mexico')) setGeographies(['Mexico', 'LATAM'])
        else if (country.includes('canada')) setGeographies(['Canada'])
        else if (country.includes('united kingdom') || country === 'uk') setGeographies(['UK'])
      }
    } catch {
      // Silent
    }
  }

  useEffect(() => {
    if (open) loadPreferences()
  }, [open, loadPreferences])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      await saveUserFeedPreferences({
        targetRoles: roles,
        targetIndustries: industries,
        targetGeographies: geographies,
        careerGoal,
      })
      setSaved(true)
      setTimeout(() => {
        onSaved()
        onClose()
      }, 800)
    } catch (err) {
      console.error('[FeedPreferences] save error:', err)
    } finally {
      setSaving(false)
    }
  }

  const toggleItem = (list: string[], item: string, setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter(i => i !== item) : [...list, item])
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto mx-4"
        style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-slate-800">{tf('title')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{tf('subtitle')}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-slate-300" />
          </div>
        ) : (
          <div className="px-5 py-4 space-y-5">

            {/* Career Goal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">{tf('careerGoal')}</label>
              <div className="flex gap-2">
                {CAREER_GOALS.map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setCareerGoal(careerGoal === g.value ? null : g.value)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all border"
                    style={{
                      background: careerGoal === g.value ? g.color : '#fff',
                      color: careerGoal === g.value ? '#fff' : '#64748B',
                      borderColor: careerGoal === g.value ? g.color : '#E2E8F0',
                    }}
                  >
                    {tf(g.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Roles */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {tf('targetRoles')} <span className="font-normal text-slate-400">({roles.length})</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ROLE_OPTIONS.map((role) => (
                  <button
                    key={role}
                    onClick={() => toggleItem(roles, role, setRoles)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border"
                    style={{
                      background: roles.includes(role) ? '#E3F2FD' : '#fff',
                      color: roles.includes(role) ? '#1565C0' : '#94A3B8',
                      borderColor: roles.includes(role) ? '#90CAF9' : '#E2E8F0',
                    }}
                  >
                    {role.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Industries */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {tf('targetIndustries')} <span className="font-normal text-slate-400">({industries.length})</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {INDUSTRY_OPTIONS.map((ind) => (
                  <button
                    key={ind}
                    onClick={() => toggleItem(industries, ind, setIndustries)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border"
                    style={{
                      background: industries.includes(ind) ? '#E8F5E9' : '#fff',
                      color: industries.includes(ind) ? '#2E7D32' : '#94A3B8',
                      borderColor: industries.includes(ind) ? '#A5D6A7' : '#E2E8F0',
                    }}
                  >
                    {ind.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Geographies */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                {tf('geographies')} <span className="font-normal text-slate-400">({geographies.length})</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {GEO_OPTIONS.map((geo) => (
                  <button
                    key={geo}
                    onClick={() => toggleItem(geographies, geo, setGeographies)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border"
                    style={{
                      background: geographies.includes(geo) ? '#FFF3E0' : '#fff',
                      color: geographies.includes(geo) ? '#E65100' : '#94A3B8',
                      borderColor: geographies.includes(geo) ? '#FFCC80' : '#E2E8F0',
                    }}
                  >
                    {geo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-100 sticky bottom-0 bg-white rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: saved ? '#2E7D32' : '#1976D2' }}
          >
            {saving ? (
              <><Loader2 size={13} className="animate-spin" /> {tf('saving')}</>
            ) : saved ? (
              <><Check size={13} /> {tf('saved')}</>
            ) : (
              tf('save')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
