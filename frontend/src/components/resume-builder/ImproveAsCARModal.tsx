import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, ChevronRight, ChevronLeft, Sparkles, Edit3, Check, AlertCircle, Loader2 } from 'lucide-react'
import type { CARStory, ImproveAsCARResult, Accomplishment } from '../../types/resume'
import { supabase } from '../../lib/supabase'

type Step = 'context' | 'actions' | 'results' | 'generating' | 'output'

interface ImproveAsCARModalProps {
  isOpen: boolean
  onClose: () => void
  accomplishment: Accomplishment & { par_story_id?: string | null }
  workExperience?: { job_title: string; company_name: string; scope_description?: string }
  existingCAR?: CARStory | null
  onCARSaved: (carStory: CARStory) => void
  onBulletsSaved: (bullets: string[]) => void
}

export default function ImproveAsCARModal({
  isOpen,
  onClose,
  accomplishment,
  workExperience,
  existingCAR,
  onCARSaved,
  onBulletsSaved,
}: ImproveAsCARModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<Step>('context')
  const [contextChallenge, setContextChallenge] = useState('')
  const [isEditingContext, setIsEditingContext] = useState(false)
  const [contextSource, setContextSource] = useState<'car' | 'inferred'>('inferred')
  const [actions, setActions] = useState(['', '', ''])
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generatedResult, setGeneratedResult] = useState<ImproveAsCARResult | null>(null)
  const [selectedBullets, setSelectedBullets] = useState<Set<number>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [savedCAR, setSavedCAR] = useState(false)
  const [savedBullets, setSavedBullets] = useState(false)

  // Infer context/challenge from existing data
  useEffect(() => {
    if (!isOpen) return

    if (existingCAR?.problem_challenge) {
      setContextChallenge(existingCAR.problem_challenge)
      setContextSource('car')
      if (existingCAR.actions?.length) {
        const filled = existingCAR.actions.filter(a => a?.trim())
        setActions([...filled, '', '', ''].slice(0, 3))
      }
      if (existingCAR.result) {
        setResult(existingCAR.result)
      }
    } else {
      const parts = [
        accomplishment.bullet_text,
        workExperience?.job_title ? `As ${workExperience.job_title}` : '',
        workExperience?.company_name ? `at ${workExperience.company_name}` : '',
        workExperience?.scope_description ? `— ${workExperience.scope_description}` : '',
      ].filter(Boolean)
      setContextChallenge(parts.join(' '))
      setContextSource('inferred')
      setActions(['', '', ''])
      setResult('')
    }

    setStep('context')
    setGeneratedResult(null)
    setSelectedBullets(new Set())
    setSavedCAR(false)
    setSavedBullets(false)
    setError(null)
  }, [isOpen, existingCAR, accomplishment.bullet_text, workExperience])

  const handleGenerate = async () => {
    setIsGenerating(true)
    setError(null)
    setStep('generating')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const apiUrl = import.meta.env.VITE_API_URL || ''
      const res = await fetch(`${apiUrl}/api/ai/improve-as-car`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          source_accomplishment_id: accomplishment.id,
          context_challenge: contextChallenge,
          actions: actions.filter(a => a.trim()),
          result,
          role_title: workExperience?.job_title,
          company_name: workExperience?.company_name,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || err.details || 'Generation failed')
      }

      const data = await res.json()
      setGeneratedResult(data.improved)
      setStep('output')
    } catch (err: any) {
      setError(err.message || t('improveAsCAR.errorGenerating'))
      setStep('results')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSaveCAR = async () => {
    if (!generatedResult) return
    setIsSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const carData = {
        user_id: session.user.id,
        problem_challenge: generatedResult.improved_challenge,
        actions: generatedResult.improved_actions,
        result: generatedResult.improved_result,
        role_title: workExperience?.job_title || '',
        company_name: workExperience?.company_name || '',
        source_accomplishment_id: accomplishment.id,
        version_number: (existingCAR?.version_number || 0) + 1,
        improved_car_data: generatedResult,
        will_do_again: true,
        competencies: [],
        metrics: [],
      }

      let savedStory: any
      if (existingCAR?.id) {
        const { data, error } = await supabase
          .from('par_stories')
          .update(carData)
          .eq('id', existingCAR.id)
          .select()
          .single()
        if (error) throw error
        savedStory = data
      } else {
        const { data, error } = await supabase
          .from('par_stories')
          .insert(carData)
          .select()
          .single()
        if (error) throw error
        savedStory = data

        // Link accomplishment to new CAR story
        if (accomplishment.id) {
          await supabase
            .from('accomplishments')
            .update({ par_story_id: savedStory.id })
            .eq('id', accomplishment.id)
        }
      }

      onCARSaved(savedStory as CARStory)
      setSavedCAR(true)
    } catch (err: any) {
      setError(err.message || 'Failed to save CAR story')
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveBullets = async () => {
    if (!generatedResult || selectedBullets.size === 0) return
    setIsSaving(true)

    try {
      const bullets = generatedResult.generated_bullets
        .filter((_, i) => selectedBullets.has(i))

      onBulletsSaved(bullets)
      setSavedBullets(true)
    } finally {
      setIsSaving(false)
    }
  }

  const toggleBullet = (index: number) => {
    setSelectedBullets(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  if (!isOpen) return null

  const stepLabels = [
    { key: 'context', label: t('improveAsCAR.contextCard') },
    { key: 'actions', label: t('improveAsCAR.stepActions') },
    { key: 'results', label: t('improveAsCAR.stepResults') },
    { key: 'output', label: t('improveAsCAR.stepImprovedCAR') },
  ]

  const currentStepIndex = stepLabels.findIndex(s => s.key === step) || 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[var(--ascendia-primary)] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{t('improveAsCAR.title')}</h2>
              <p className="text-xs text-gray-500">{t('improveAsCAR.introText').substring(0, 60)}...</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Progress */}
        <div className="px-6 py-3 border-b bg-gray-50">
          <div className="flex items-center gap-2">
            {stepLabels.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  i < currentStepIndex ? 'bg-green-500 text-white' :
                  i === currentStepIndex ? 'bg-primary-600 text-white' :
                  'bg-gray-200 text-gray-500'
                }`}>
                  {i < currentStepIndex ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-xs hidden sm:inline ${
                  i === currentStepIndex ? 'text-primary-700 font-semibold' : 'text-gray-400'
                }`}>{s.label}</span>
                {i < stepLabels.length - 1 && <div className="w-4 h-px bg-gray-300 mx-1" />}
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-6">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Step: Context */}
          {step === 'context' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700">{t('improveAsCAR.contextCard')}</h3>
                <button
                  onClick={() => setIsEditingContext(!isEditingContext)}
                  className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {t('improveAsCAR.contextEdit')}
                </button>
              </div>
              <p className="text-xs text-gray-400 italic">
                {contextSource === 'car' ? t('improveAsCAR.contextFromCAR') : t('improveAsCAR.contextInferred')}
              </p>
              {isEditingContext ? (
                <textarea
                  value={contextChallenge}
                  onChange={e => setContextChallenge(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm text-gray-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
                  rows={4}
                />
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800">{contextChallenge || '(No context inferred)'}</p>
                </div>
              )}
              <button
                onClick={() => setStep('actions')}
                disabled={!contextChallenge.trim()}
                className="w-full py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {t('improveAsCAR.stepActions')} <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step: Actions */}
          {step === 'actions' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">{t('improveAsCAR.step1Title')}</h3>
              <p className="text-xs text-gray-500">{t('improveAsCAR.step1Help')}</p>
              {actions.map((action, i) => (
                <input
                  key={i}
                  type="text"
                  value={action}
                  onChange={e => {
                    const next = [...actions]
                    next[i] = e.target.value
                    setActions(next)
                  }}
                  placeholder={t(`improveAsCAR.actionPlaceholder${i + 1}` as any)}
                  className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              ))}
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('context')}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('improveAsCAR.contextCard')}
                </button>
                <button
                  onClick={() => setStep('results')}
                  className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 flex items-center justify-center gap-2"
                >
                  {t('improveAsCAR.stepResults')} <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step: Results */}
          {step === 'results' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">{t('improveAsCAR.step2Title')}</h3>
              <p className="text-xs text-gray-500">{t('improveAsCAR.step2Help')}</p>
              {!result.trim() && (
                <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg">{t('improveAsCAR.metricSuggestion')}</p>
              )}
              <textarea
                value={result}
                onChange={e => setResult(e.target.value)}
                placeholder={t('improveAsCAR.resultPlaceholder')}
                className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 min-h-[100px]"
                rows={4}
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStep('actions')}
                  className="px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" /> {t('improveAsCAR.stepActions')}
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="flex-1 py-3 bg-gradient-to-r from-primary-600 to-[var(--ascendia-primary)] text-white rounded-lg font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> {t('improveAsCAR.generating')}</>
                  ) : (
                    <><Sparkles className="w-4 h-4" /> {generatedResult ? t('improveAsCAR.regenerate') : t('improveAsCAR.generate')}</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Generating */}
          {step === 'generating' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
              </div>
              <p className="text-sm text-gray-500">{t('improveAsCAR.generating')}</p>
            </div>
          )}

          {/* Output */}
          {step === 'output' && generatedResult && (
            <div className="space-y-6">
              {/* A. Improved CAR */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('improveAsCAR.improvedCAR')}</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs font-semibold text-blue-700 mb-1">{t('improveAsCAR.contextCard')}</p>
                    <p className="text-sm text-gray-800">{generatedResult.improved_challenge}</p>
                  </div>
                  <div className="p-3 bg-primary-50 border border-primary-200 rounded-lg">
                    <p className="text-xs font-semibold text-primary-700 mb-1">{t('improveAsCAR.stepActions')}</p>
                    <ul className="text-sm text-gray-800 space-y-1">
                      {generatedResult.improved_actions.map((a, i) => <li key={i}>• {a}</li>)}
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-xs font-semibold text-green-700 mb-1">{t('improveAsCAR.stepResults')}</p>
                    <p className="text-sm text-gray-800">{generatedResult.improved_result}</p>
                  </div>
                </div>
              </div>

              {/* B. Resume Bullets */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('improveAsCAR.resumeBullets')}</h3>
                <div className="space-y-2">
                  {generatedResult.generated_bullets.map((bullet, i) => (
                    <label key={i} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedBullets.has(i)}
                        onChange={() => toggleBullet(i)}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-800">{bullet}</span>
                    </label>
                  ))}
                </div>
                {selectedBullets.size > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t('improveAsCAR.bulletsSelected', { count: selectedBullets.size })}
                  </p>
                )}
              </div>

              {/* C. Analysis */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{t('improveAsCAR.analysis')}</h3>
                {generatedResult.analysis?.strengths?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-green-700 mb-1">{t('improveAsCAR.strengths')}</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {generatedResult.analysis.strengths.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {generatedResult.analysis?.metric_suggestions?.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">{t('improveAsCAR.metricSuggestions')}</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {generatedResult.analysis.metric_suggestions.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                )}
                {generatedResult.key_improvements?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-blue-700 mb-1">{t('improveAsCAR.keyImprovements')}</p>
                    <ul className="text-sm text-gray-700 space-y-1">
                      {generatedResult.key_improvements.map((s, i) => <li key={i}>• {s}</li>)}
                    </ul>
                  </div>
                )}
              </div>

              {/* D. Save Options */}
              <div className="border-t pt-4 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSaveCAR}
                    disabled={isSaving || savedCAR}
                    className={`flex-1 py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 ${
                      savedCAR ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-primary-600 text-white hover:bg-primary-700'
                    }`}
                  >
                    {savedCAR ? <><Check className="w-4 h-4" /> {t('improveAsCAR.saved')}</> : isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('improveAsCAR.saving')}</> : t('improveAsCAR.saveCAR')}
                  </button>
                  <button
                    onClick={handleSaveBullets}
                    disabled={isSaving || savedBullets || selectedBullets.size === 0}
                    className="flex-1 py-3 border border-primary-300 text-primary-700 rounded-lg font-semibold text-sm hover:bg-primary-50 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {savedBullets ? <><Check className="w-4 h-4" /> {t('improveAsCAR.saved')}</> : isSaving ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('improveAsCAR.saving')}</> : t('improveAsCAR.saveBullets')}
                  </button>
                </div>
                <button
                  onClick={handleGenerate}
                  className="w-full py-2 text-sm text-gray-500 hover:text-primary-600 flex items-center justify-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {t('improveAsCAR.regenerate')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}