import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle, FileText, Zap, FolderOpen, Clock } from 'lucide-react'

interface ChecklistItem {
  labelKey: string
  descKey: string
  priority: 'high' | 'medium' | 'low'
}

interface Step {
  titleKey: string
  subtitleKey: string
  icon: React.ElementType
  color: string
  bgColor: string
  borderColor: string
  activeBg: string
  items: ChecklistItem[]
}

export default function ResumeTailoringChecklist() {
  const { t } = useTranslation()
  const [currentStep, setCurrentStep] = useState(0)
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const steps: Step[] = [
    {
      titleKey: 'resumeChecklist.sections.beforeStart.title',
      subtitleKey: 'resumeChecklist.sections.beforeStart.subtitle',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-300',
      activeBg: 'bg-yellow-50',
      items: [
        { labelKey: 'resumeChecklist.sections.beforeStart.item1', descKey: 'resumeChecklist.sections.beforeStart.item1Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.beforeStart.item2', descKey: 'resumeChecklist.sections.beforeStart.item2Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.beforeStart.item3', descKey: 'resumeChecklist.sections.beforeStart.item3Desc', priority: 'medium' },
      ]
    },
    {
      titleKey: 'resumeChecklist.sections.resumeOptimization.title',
      subtitleKey: 'resumeChecklist.sections.resumeOptimization.subtitle',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-300',
      activeBg: 'bg-blue-50',
      items: [
        { labelKey: 'resumeChecklist.sections.resumeOptimization.item1', descKey: 'resumeChecklist.sections.resumeOptimization.item1Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.resumeOptimization.item2', descKey: 'resumeChecklist.sections.resumeOptimization.item2Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.resumeOptimization.item3', descKey: 'resumeChecklist.sections.resumeOptimization.item3Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.resumeOptimization.item4', descKey: 'resumeChecklist.sections.resumeOptimization.item4Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.resumeOptimization.item5', descKey: 'resumeChecklist.sections.resumeOptimization.item5Desc', priority: 'medium' },
        { labelKey: 'resumeChecklist.sections.resumeOptimization.item6', descKey: 'resumeChecklist.sections.resumeOptimization.item6Desc', priority: 'low' },
      ]
    },
    {
      titleKey: 'resumeChecklist.sections.atsFormatting.title',
      subtitleKey: 'resumeChecklist.sections.atsFormatting.subtitle',
      icon: Zap,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-300',
      activeBg: 'bg-green-50',
      items: [
        { labelKey: 'resumeChecklist.sections.atsFormatting.item1', descKey: 'resumeChecklist.sections.atsFormatting.item1Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.atsFormatting.item2', descKey: 'resumeChecklist.sections.atsFormatting.item2Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.atsFormatting.item3', descKey: 'resumeChecklist.sections.atsFormatting.item3Desc', priority: 'medium' },
        { labelKey: 'resumeChecklist.sections.atsFormatting.item4', descKey: 'resumeChecklist.sections.atsFormatting.item4Desc', priority: 'medium' },
        { labelKey: 'resumeChecklist.sections.atsFormatting.item5', descKey: 'resumeChecklist.sections.atsFormatting.item5Desc', priority: 'low' },
      ]
    },
    {
      titleKey: 'resumeChecklist.sections.fileNaming.title',
      subtitleKey: 'resumeChecklist.sections.fileNaming.subtitle',
      icon: FolderOpen,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-300',
      activeBg: 'bg-purple-50',
      items: [
        { labelKey: 'resumeChecklist.sections.fileNaming.item1', descKey: 'resumeChecklist.sections.fileNaming.item1Desc', priority: 'high' },
        { labelKey: 'resumeChecklist.sections.fileNaming.item2', descKey: 'resumeChecklist.sections.fileNaming.item2Desc', priority: 'medium' },
        { labelKey: 'resumeChecklist.sections.fileNaming.item3', descKey: 'resumeChecklist.sections.fileNaming.item3Desc', priority: 'medium' },
      ]
    }
  ]

  const toggleItem = (stepIdx: number, itemIdx: number) => {
    const key = `${stepIdx}-${itemIdx}`
    setChecked(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const isChecked = (stepIdx: number, itemIdx: number) => !!checked[`${stepIdx}-${itemIdx}`]

  const stepCheckedCount = (stepIdx: number) =>
    steps[stepIdx].items.filter((_, i) => isChecked(stepIdx, i)).length

  const stepProgress = (stepIdx: number) =>
    Math.round((stepCheckedCount(stepIdx) / steps[stepIdx].items.length) * 100)

  const totalItems = steps.reduce((acc, s) => acc + s.items.length, 0)
  const totalChecked = Object.values(checked).filter(Boolean).length

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700">{t('resumeChecklist.priority.high')}</span>
      case 'medium':
        return <span className="shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">{t('resumeChecklist.priority.medium')}</span>
      case 'low':
        return <span className="shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">{t('resumeChecklist.priority.low')}</span>
    }
  }

  const step = steps[currentStep]
  const StepIcon = step.icon

  return (
    <div className="space-y-5">

      {/* ATS Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold text-red-800 text-sm">{t('resumeChecklist.bannerTitle')}</p>
          <p className="text-red-700 text-xs mt-0.5">{t('resumeChecklist.bannerDesc')}</p>
        </div>
      </div>

      {/* Step Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((s, idx) => {
          const Icon = s.icon
          const done = stepCheckedCount(idx)
          const isActive = idx === currentStep
          return (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                isActive
                  ? `${s.borderColor} ${s.activeBg}`
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                {t('resumeChecklist.stepLabel', { number: idx + 1 })}
              </p>
              <Icon className={`w-5 h-5 mb-2 ${isActive ? s.color : 'text-gray-400'}`} />
              <p className={`font-semibold text-sm leading-tight mb-1 ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {t(s.titleKey)}
              </p>
              <p className={`text-xs ${done === s.items.length ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                {done}/{s.items.length} {t('resumeChecklist.completedLabel')}
              </p>
            </button>
          )
        })}
      </div>

      {/* Step Content */}
      <div className={`rounded-xl border-2 ${step.borderColor} overflow-hidden`}>
        {/* Step Header */}
        <div className={`${step.bgColor} dark:bg-gray-800/80 px-6 py-5 flex items-start justify-between`}>
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm`}>
              <StepIcon className={`w-5 h-5 ${step.color}`} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                {t('resumeChecklist.etapaLabel', { current: currentStep + 1, total: steps.length })}
              </p>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t(step.titleKey)}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('resumeChecklist.stepInstructions')}</p>
            </div>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className={`text-3xl font-black ${stepProgress(currentStep) === 100 ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>
              {stepProgress(currentStep)}%
            </p>
            <p className="text-xs text-gray-400">{t('resumeChecklist.completedLabel')}</p>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
          {step.items.map((item, itemIdx) => {
            const done = isChecked(currentStep, itemIdx)
            return (
              <label
                key={itemIdx}
                className={`flex items-start gap-4 px-6 py-4 cursor-pointer transition-colors ${
                  done ? 'bg-green-50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => toggleItem(currentStep, itemIdx)}
                    className="hidden"
                  />
                  <div
                    onClick={() => toggleItem(currentStep, itemIdx)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                      done
                        ? 'bg-green-500 border-green-500'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                    }`}
                  >
                    {done && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                  </div>
                </div>
                <div className="flex-1 min-w-0" onClick={() => toggleItem(currentStep, itemIdx)}>
                  <p className={`font-semibold text-sm ${done ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                    {t(item.labelKey)}
                  </p>
                  <p className={`text-xs mt-0.5 leading-relaxed ${done ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                    {t(item.descKey)}
                  </p>
                </div>
                {getPriorityBadge(item.priority)}
              </label>
            )
          })}
        </div>

        {/* Step Footer Nav */}
        <div className={`${step.bgColor} dark:bg-gray-800/80 px-6 py-4 flex items-center justify-between border-t-2 ${step.borderColor}`}>
          <p className="text-sm text-gray-500">
            {t('resumeChecklist.etapaLabel', { current: currentStep + 1, total: steps.length })}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('resumeChecklist.prev')}
            </button>
            <button
              onClick={() => setCurrentStep(s => Math.min(steps.length - 1, s + 1))}
              disabled={currentStep === steps.length - 1}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                stepProgress(currentStep) === 100
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {t('resumeChecklist.next')} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Overall progress mini bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-primary-500 transition-all duration-500"
            style={{ width: `${Math.round((totalChecked / totalItems) * 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
          {totalChecked}/{totalItems} {t('resumeChecklist.completedLabel')}
        </p>
      </div>

      {/* Pro Tip */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1">{t('resumeChecklist.proTip.title')}</p>
            <p className="text-amber-800 dark:text-amber-300 text-xs leading-relaxed mb-2">{t('resumeChecklist.proTip.desc')}</p>
            <ul className="space-y-0.5 text-xs text-amber-800 dark:text-amber-300">
              <li>• {t('resumeChecklist.proTip.li1')}</li>
              <li>• {t('resumeChecklist.proTip.li2')}</li>
              <li>• {t('resumeChecklist.proTip.li3')}</li>
              <li>• {t('resumeChecklist.proTip.li4')}</li>
            </ul>
          </div>
        </div>
      </div>

    </div>
  )
}
