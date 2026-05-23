import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Accomplishment, CARStory, AccomplishmentBankItem } from '../../types/resume'
import { useTranslation } from 'react-i18next'
import { AccomplishmentBankSelector } from './AccomplishmentBankSelector'
import ImproveAsCARModal from './ImproveAsCARModal'
import { supabase } from '../../lib/supabase'
import {
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit2,
  Check,
  X,
  AlertTriangle,
  Plus,
  Sparkles,
  Database,
  Zap,
  FileText
} from 'lucide-react'

interface WorkExperienceData {
  job_title: string
  company_name: string
  start_date: string
  end_date?: string | null
  is_current: boolean
}

interface AccomplishmentManagerProps {
  workExperienceId: string
  workExperienceData?: WorkExperienceData
  accomplishments: Accomplishment[]
  carStories: CARStory[]
  roleIndex: number
  onAddAccomplishment: (bullet: string, carStoryId?: string) => Promise<void>
  onUpdateAccomplishment: (id: string, bullet: string) => Promise<void>
  onDeleteAccomplishment: (id: string) => Promise<void>
  onConvertCARStory: (carStoryId: string) => Promise<void>
  onToggleVisibility?: (id: string, isVisible: boolean) => Promise<void>
  onReorderAccomplishments?: (reorderedAccs: Accomplishment[]) => Promise<void>
  onRefresh?: () => void
}

export const AccomplishmentManager: React.FC<AccomplishmentManagerProps> = ({
  workExperienceId,
  workExperienceData,
  accomplishments,
  carStories,
  roleIndex,
  onAddAccomplishment,
  onUpdateAccomplishment,
  onDeleteAccomplishment,
  onConvertCARStory,
  onToggleVisibility,
  onReorderAccomplishments,
  onRefresh
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [userId, setUserId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCARLink, setShowCARLink] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [showImproveAsCAR, setShowImproveAsCAR] = useState(false)
  const [selectedAccForCAR, setSelectedAccForCAR] = useState<Accomplishment | null>(null)
  const [newBullet, setNewBullet] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [saving, setSaving] = useState(false)

  const unconvertedCarStories = carStories.filter(s => !s.converted_to_bullet)

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)
    }
    getUser()
  }, [])

  const handleAddManual = async () => {
    if (!newBullet.trim()) return

    setSaving(true)
    try {
      await onAddAccomplishment(newBullet)
      setNewBullet('')
      setShowAddForm(false)
    } catch (error) {
      console.error('Error adding bullet:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleBankSelect = async (selectedItems: AccomplishmentBankItem[]) => {
    setSaving(true)
    try {
      for (const item of selectedItems) {
        await onAddAccomplishment(item.bullet_text)
      }
    } catch (error) {
      console.error('Error adding from bank:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLinkCAR = async (carStoryId: string) => {
    setSaving(true)
    try {
      await onConvertCARStory(carStoryId)
      setShowCARLink(false)
    } catch (error) {
      console.error('Error linking CAR story:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleOpenCARBuilder = (acc: Accomplishment) => {
    if (acc.par_story_id) {
      // Navigate to edit existing CAR story
      navigate(`/dashboard/resume/story-cards?editCarId=${acc.par_story_id}`)
    } else {
      // Navigate to create new CAR story prefilled with this accomplishment
      const params = new URLSearchParams({
        createFromAccomp: '1',
        workExpId: workExperienceId,
        challenge: acc.bullet_text,
        roleTitle: workExperienceData?.job_title || '',
        companyName: workExperienceData?.company_name || '',
        startDate: workExperienceData?.start_date || '',
        endDate: workExperienceData?.is_current ? 'Present' : (workExperienceData?.end_date || '')
      })
      navigate(`/dashboard/resume/story-cards?${params.toString()}`)
    }
  }

  const handleStartEdit = (acc: Accomplishment) => {
    setEditingId(acc.id!)
    setEditingText(acc.bullet_text)
  }

  const handleSaveEdit = async () => {
    if (!editingId || !editingText.trim()) return

    setSaving(true)
    try {
      await onUpdateAccomplishment(editingId, editingText)
      setEditingId(null)
      setEditingText('')
    } catch (error) {
      console.error('Error updating bullet:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingText('')
  }

  const handleDelete = async (id: string) => {
    if (!confirm(t('common.deleteConfirm', 'Are you sure you want to remove this accomplishment bullet? This will only remove it from this resume, preserving the master copy.'))) return

    setSaving(true)
    try {
      await onDeleteAccomplishment(id)
    } catch (error) {
      console.error('Error deleting bullet:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleVisible = async (acc: Accomplishment) => {
    if (!acc.id || !onToggleVisibility) return
    const nextVisibility = acc.is_visible === false ? true : false

    setSaving(true)
    try {
      await onToggleVisibility(acc.id, nextVisibility)
    } catch (error) {
      console.error('Error toggling visibility:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0 || !onReorderAccomplishments) return
    const reordered = [...sortedAccomplishments]
    // Swap items
    const temp = reordered[index]
    reordered[index] = reordered[index - 1]
    reordered[index - 1] = temp

    setSaving(true)
    try {
      await onReorderAccomplishments(reordered)
    } catch (error) {
      console.error('Error moving accomplishment up:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleMoveDown = async (index: number) => {
    if (index === sortedAccomplishments.length - 1 || !onReorderAccomplishments) return
    const reordered = [...sortedAccomplishments]
    // Swap items
    const temp = reordered[index]
    reordered[index] = reordered[index + 1]
    reordered[index + 1] = temp

    setSaving(true)
    try {
      await onReorderAccomplishments(reordered)
    } catch (error) {
      console.error('Error moving accomplishment down:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedAccomplishments = [...accomplishments].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  )

  const visibleCount = sortedAccomplishments.filter(a => a.is_visible !== false).length

  // Warning limits: Current/first role (index 0) limit is 6, previous (index 1) is 5, older (index >= 2) is 3
  const recommendationLimit = roleIndex === 0 ? 6 : roleIndex === 1 ? 5 : 3
  const isOverLimit = visibleCount > recommendationLimit

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-700/60 pb-3">
        <div>
          <h4 className="font-bold text-gray-900 dark:text-white text-base">
            ✨ {t('resumeBuilder.workExperience.accomplishments', 'Role Accomplishments')}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t('resumeBuilder.workExperience.accomplishmentsDesc', 'Select and polish bullet points for this specific resume.')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {userId && (
            <button
              onClick={() => setShowBankSelector(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/50 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors shadow-sm"
            >
              <Database className="w-3.5 h-3.5" />
              {t('resumeBuilder.workExperience.pickFromBank', 'Pick From Bank')}
            </button>
          )}
          <button
            onClick={() => setShowCARLink(!showCARLink)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t('resumeBuilder.workExperience.linkPARStory', 'Link CAR Story')}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            {t('resumeBuilder.workExperience.addBullet', 'Add Manual')}
          </button>
        </div>
      </div>

      {/* Recommended Bullet Count Warning Banner */}
      {isOverLimit && (
        <div className="flex gap-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-3.5 rounded-xl text-amber-800 dark:text-amber-300 text-sm shadow-sm transition-all duration-300">
          <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <p className="font-semibold text-xs uppercase tracking-wide text-amber-700 dark:text-amber-400">
              {t('resumeBuilder.workExperience.limitWarningTitle', 'Accomplishment Count Warning')}
            </p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              {roleIndex === 0
                ? t('resumeBuilder.workExperience.limitWarningCurrent', `We recommend a maximum of 6 achievements (currently ${visibleCount}) for your current or most recent role to keep it readable and high-impact.`)
                : roleIndex === 1
                ? t('resumeBuilder.workExperience.limitWarningPrevious', `We recommend a maximum of 5 achievements (currently ${visibleCount}) for this previous role to maintain a balanced layout.`)
                : t('resumeBuilder.workExperience.limitWarningOlder', `We recommend a maximum of 3 achievements (currently ${visibleCount}) for older roles to emphasize your more recent, higher-impact accomplishments.`)}
            </p>
          </div>
        </div>
      )}

      {/* Accomplishment Bank Selector Modal */}
      {userId && (
        <AccomplishmentBankSelector
          userId={userId}
          isOpen={showBankSelector}
          onClose={() => setShowBankSelector(false)}
          onSelect={handleBankSelect}
        />
      )}

      {/* Link CAR Story */}
      {showCARLink && (
        <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200/60 dark:border-purple-900/40 rounded-xl p-4 transition-all shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h5 className="font-semibold text-purple-900 dark:text-purple-300 text-sm">
              ⭐ {t('resumeBuilder.workExperience.selectCARStory', 'Convert Accomplishment Story to Bullet')}
            </h5>
            <button
              onClick={() => setShowCARLink(false)}
              className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {unconvertedCarStories.length === 0 ? (
            <p className="text-xs text-purple-700 dark:text-purple-400 italic">
              {t('resumeBuilder.workExperience.noUnconvertedStories', 'No unconverted accomplishment stories found. Build some in the CAR Builder to import them here!')}
            </p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {unconvertedCarStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-purple-200 dark:border-purple-900/60 hover:border-purple-400 dark:hover:border-purple-700 cursor-pointer transition-all shadow-sm flex justify-between items-center gap-3"
                  onClick={() => handleLinkCAR(story.id!)}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                      {story.role_title} {story.company_name ? `@ ${story.company_name}` : ''}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                      <strong>C:</strong> {story.problem_challenge} <br/>
                      <strong>R:</strong> {story.result}
                    </p>
                  </div>
                  <button
                    disabled={saving}
                    className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-sm disabled:opacity-50"
                  >
                    {t('resumeBuilder.workExperience.convert', 'Convert')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Manual Bullet */}
      {showAddForm && (
        <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-4 transition-all shadow-inner">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-semibold text-blue-900 dark:text-blue-300 text-sm">
              ✍️ {t('resumeBuilder.workExperience.addBulletTitle', 'Add Custom Accomplishment')}
            </h5>
            <button
              onClick={() => { setShowAddForm(false); setNewBullet('') }}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-3 leading-relaxed">
            {t('resumeBuilder.workExperience.bulletHelp', 'State your impact clearly. Use the format: Action Verb + Project + Quantified Metric/Business Result (e.g., "Led team of 4 to deliver Stripe payments in 2 days, boosting sales conversion by 18%").')}
          </p>
          <textarea
            value={newBullet}
            onChange={(e) => setNewBullet(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm dark:text-white transition-all"
            placeholder={t('resumeBuilder.workExperience.bulletPlaceholder', 'e.g., Speaheaded cloud migration project, reducing infrastructure costs by 22% ($45k/yr) while improving system uptime to 99.99%')}
          />
          <div className="flex gap-2 mt-3 justify-end">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewBullet('')
              }}
              className="px-3.5 py-1.5 text-xs font-semibold border border-blue-200 dark:border-gray-700 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-colors"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              onClick={handleAddManual}
              disabled={saving || !newBullet.trim()}
              className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {saving ? t('resumeBuilder.workExperience.adding', 'Adding...') : t('resumeBuilder.workExperience.addBullet', 'Add Bullet')}
            </button>
          </div>
        </div>
      )}

      {/* Accomplishments List */}
      {sortedAccomplishments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50/50 dark:bg-gray-800/20 rounded-xl border border-dashed border-gray-200 dark:border-gray-700/80 transition-all">
          <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">{t('resumeBuilder.workExperience.noAccomplishments', 'No accomplishments active for this role.')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 max-w-md mx-auto leading-relaxed">
            {t('resumeBuilder.workExperience.accomplishmentsHelp', 'Use the buttons above to link your high-impact CAR stories, pick items from your accomplishment bank, or write a custom bullet.')}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sortedAccomplishments.map((acc, index) => {
            const isVisible = acc.is_visible !== false
            return (
              <li
                key={acc.id}
                className={`group flex items-start gap-3 bg-white dark:bg-gray-800 p-3.5 rounded-xl border transition-all duration-200 shadow-sm ${
                  isVisible
                    ? 'border-gray-200 dark:border-gray-700/80 hover:border-gray-300 dark:hover:border-gray-600'
                    : 'border-dashed border-gray-200 dark:border-gray-700/50 bg-gray-50/40 dark:bg-gray-800/40 opacity-60 hover:opacity-75'
                }`}
              >
                <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  isVisible
                    ? 'bg-primary-100 dark:bg-primary-950/30 text-primary-700 dark:text-primary-400'
                    : 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400'
                }`}>
                  {index + 1}
                </span>

                {editingId === acc.id ? (
                  <div className="flex-1 min-w-0">
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm dark:text-white"
                    />
                    <div className="flex gap-2 mt-2 justify-end">
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        {t('common.cancel', 'Cancel')}
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={saving}
                        className="px-3.5 py-1.5 text-xs bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                      >
                        {t('common.save', 'Save')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-relaxed dark:text-gray-200 ${
                        isVisible ? 'text-gray-800' : 'text-gray-500 line-through decoration-gray-400/50'
                      }`}>
                        {acc.bullet_text}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-1.5">
                        {acc.par_story_id && (
                          <button
                            onClick={() => handleOpenCARBuilder(acc)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold bg-purple-50 dark:bg-purple-950/20 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
                            title={t('resumeBuilder.workExperience.editCARStory', 'Edit CAR Story')}
                          >
                            <FileText className="w-3 h-3" />
                            {t('resumeBuilder.workExperience.fromCARStory', 'CAR Story')}
                          </button>
                        )}
                        {!isVisible && (
                          <span className="inline-flex items-center text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded">
                            🚫 {t('resumeBuilder.workExperience.hidden', 'Hidden from PDF/Word')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 pl-2">
                      {/* Reordering Controls */}
                      {onReorderAccomplishments && (
                        <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800">
                          <button
                            disabled={index === 0 || saving}
                            onClick={() => handleMoveUp(index)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent"
                            title={t('common.moveUp', 'Move up')}
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <div className="w-[1px] h-3.5 bg-gray-200 dark:bg-gray-700" />
                          <button
                            disabled={index === sortedAccomplishments.length - 1 || saving}
                            onClick={() => handleMoveDown(index)}
                            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 disabled:opacity-30 disabled:hover:bg-transparent"
                            title={t('common.moveDown', 'Move down')}
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}

                      {/* Visibility Toggle */}
                      {onToggleVisibility && (
                        <button
                          onClick={() => handleToggleVisible(acc)}
                          disabled={saving}
                          className={`p-1.5 border rounded-lg transition-all ${
                            isVisible
                              ? 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                              : 'border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100/50'
                          }`}
                          title={isVisible ? t('common.hide', 'Hide from print') : t('common.show', 'Show in print')}
                        >
                          {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Create/Edit CAR Story */}
                      <button
                        onClick={() => handleOpenCARBuilder(acc)}
                        disabled={saving}
                        className={`p-1.5 border rounded-lg transition-all ${
                          acc.par_story_id
                            ? 'border-purple-200 dark:border-purple-900 bg-purple-50/50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/40'
                            : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        title={acc.par_story_id
                          ? t('resumeBuilder.workExperience.editCARStory', 'Edit CAR Story')
                          : t('resumeBuilder.workExperience.createCARStory', 'Create CAR Story')
                        }
                      >
                        {acc.par_story_id
                          ? <FileText className="w-3.5 h-3.5" />
                          : <Zap className="w-3.5 h-3.5" />
                        }
                      </button>

                      {/* Improve as CAR */}
                      <button
                        onClick={() => {
                          setSelectedAccForCAR(acc)
                          setShowImproveAsCAR(true)
                        }}
                        disabled={saving}
                        className="p-1.5 border border-primary-200 dark:border-primary-900 bg-primary-50/50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 rounded-lg transition-all"
                        title={t('improveAsCAR.buttonLabel')}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>

                      {/* Direct Edit */}
                      <button
                        onClick={() => handleStartEdit(acc)}
                        disabled={saving}
                        className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        title={t('common.edit', 'Edit text')}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(acc.id!)}
                        disabled={saving}
                        className="p-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                        title={t('common.delete', 'Delete')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {/* Improve as CAR Modal */}
      {selectedAccForCAR && (
        <ImproveAsCARModal
          isOpen={showImproveAsCAR}
          onClose={() => { setShowImproveAsCAR(false); setSelectedAccForCAR(null) }}
          accomplishment={selectedAccForCAR}
          workExperience={workExperienceData ? {
            job_title: workExperienceData.job_title,
            company_name: workExperienceData.company_name,
            scope_description: undefined,
          } : undefined}
          existingCAR={selectedAccForCAR.par_story_id
            ? carStories.find(s => s.id === selectedAccForCAR.par_story_id) || null
            : null
          }
          onCARSaved={(carStory) => {
            // Refresh accomplishments list and stay on work experience page
            if (onRefresh) onRefresh()
            setShowImproveAsCAR(false)
            setSelectedAccForCAR(null)
          }}
          onBulletsSaved={(bullets) => {
            // Add each bullet as a new accomplishment alongside the original
            bullets.forEach((text) => {
              onAddAccomplishment(text)
            })
            setShowImproveAsCAR(false)
            setSelectedAccForCAR(null)
          }}
        />
      )}
    </div>
  )
}