import React from 'react'
import { useTranslation } from 'react-i18next'
import { Globe, Loader2, CheckCircle2 } from 'lucide-react'
import type { ResumeLanguage } from '../../services/resumeTranslator'

interface SelectResumeLanguageProps {
  open: boolean
  onClose: () => void
  onConfirm: (language: ResumeLanguage) => void
  detectedLanguage: ResumeLanguage
  isTranslating: boolean
}

export default function SelectResumeLanguage({
  open,
  onClose,
  onConfirm,
  detectedLanguage,
  isTranslating,
}: SelectResumeLanguageProps) {
  const { t } = useTranslation()
  const [selected, setSelected] = React.useState<ResumeLanguage | null>(null)

  if (!open) return null

  const languageLabel = (lang: ResumeLanguage) =>
    lang === 'en' ? t('resumeBuilder.languageSelection.english', 'English') : t('resumeBuilder.languageSelection.spanish', 'Spanish')

  const detectedLabel = languageLabel(detectedLanguage)

  const handleConfirm = () => {
    if (!selected) return
    onConfirm(selected)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full p-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-4 flex items-center justify-center w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900/30">
            <Globe className="w-7 h-7 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('resumeBuilder.languageSelection.title', 'Choose Resume Language')}
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            {t('resumeBuilder.languageSelection.subtitle', 'Select the language for this generated resume. Your original data will remain unchanged.')}
          </p>
        </div>

        {/* Detected language hint */}
        <div className="mb-5 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl text-center">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {t('resumeBuilder.languageSelection.detectedLanguage', 'Your resume appears to be in {{language}}').replace('{{language}}', detectedLabel)}
          </p>
        </div>

        {/* Language cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* English */}
          <button
            onClick={() => setSelected('en')}
            disabled={isTranslating}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
              selected === 'en'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-[1.02]'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
          >
            {selected === 'en' && (
              <div className="absolute top-3 right-3 text-primary-600 dark:text-primary-400">
                <CheckCircle2 className="w-5 h-5 fill-primary-100 dark:fill-primary-900/40" />
              </div>
            )}
            <span className="text-3xl mb-2">🇺🇸</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {t('resumeBuilder.languageSelection.english', 'English')}
            </span>
            {detectedLanguage === 'en' && selected === 'en' && (
              <span className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                {t('resumeBuilder.languageSelection.sameLanguage', 'No translation needed')}
              </span>
            )}
          </button>

          {/* Spanish */}
          <button
            onClick={() => setSelected('es')}
            disabled={isTranslating}
            className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-200 ${
              selected === 'es'
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-lg scale-[1.02]'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 dark:hover:border-primary-600'
            }`}
          >
            {selected === 'es' && (
              <div className="absolute top-3 right-3 text-primary-600 dark:text-primary-400">
                <CheckCircle2 className="w-5 h-5 fill-primary-100 dark:fill-primary-900/40" />
              </div>
            )}
            <span className="text-3xl mb-2">🇪🇸</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {t('resumeBuilder.languageSelection.spanish', 'Spanish')}
            </span>
            {detectedLanguage === 'es' && selected === 'es' && (
              <span className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                {t('resumeBuilder.languageSelection.sameLanguage', 'No translation needed')}
              </span>
            )}
          </button>
        </div>

        {/* Translating state */}
        {isTranslating && (
          <div className="mb-5 flex items-center justify-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
            <span className="text-sm text-amber-700 dark:text-amber-300 font-medium">
              {t('resumeBuilder.languageSelection.translating', 'Translating your resume...')}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isTranslating}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium text-sm disabled:opacity-50"
          >
            {t('resumeBuilder.languageSelection.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selected || isTranslating}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition-colors font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isTranslating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('resumeBuilder.languageSelection.translating', 'Translating...')}
              </>
            ) : (
              t('resumeBuilder.languageSelection.continueButton', 'Continue')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}