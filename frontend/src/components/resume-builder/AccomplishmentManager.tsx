import React, { useState, useEffect } from 'react'
import { Accomplishment, CARStory, AccomplishmentBankItem } from '../../types/resume'
import { useTranslation } from 'react-i18next'
import { AccomplishmentBankSelector } from './AccomplishmentBankSelector'
import { supabase } from '../../lib/supabase'

interface AccomplishmentManagerProps {
  workExperienceId: string
  accomplishments: Accomplishment[]
  carStories: CARStory[]
  onAddAccomplishment: (bullet: string, carStoryId?: string) => Promise<void>
  onUpdateAccomplishment: (id: string, bullet: string) => Promise<void>
  onDeleteAccomplishment: (id: string) => Promise<void>
  onConvertCARStory: (carStoryId: string) => Promise<void>
}

export const AccomplishmentManager: React.FC<AccomplishmentManagerProps> = ({
  workExperienceId,
  accomplishments,
  carStories,
  onAddAccomplishment,
  onUpdateAccomplishment,
  onDeleteAccomplishment,
  onConvertCARStory
}) => {
  const { t } = useTranslation()
  const [userId, setUserId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCARLink, setShowCARLink] = useState(false)
  const [showBankSelector, setShowBankSelector] = useState(false)
  const [newBullet, setNewBullet] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [saving, setSaving] = useState(false)

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
    if (!confirm(t('common.deleteConfirm'))) return

    setSaving(true)
    try {
      await onDeleteAccomplishment(id)
    } catch (error) {
      console.error('Error deleting bullet:', error)
    } finally {
      setSaving(false)
    }
  }

  const sortedAccomplishments = [...accomplishments].sort(
    (a, b) => (a.order_index || 0) - (b.order_index || 0)
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-gray-900 dark:text-white">
          {t('resumeBuilder.workExperience.accomplishments')}
        </h4>
        <div className="flex flex-wrap gap-2">
          {userId && (
            <button
              onClick={() => setShowBankSelector(true)}
              className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
            >
              📊 {t('resumeBuilder.workExperience.pickFromBank')}
            </button>
          )}
          <button
            onClick={() => setShowCARLink(!showCARLink)}
            className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
          >
            ⭐ {t('resumeBuilder.workExperience.linkPARStory')}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
          >
            + {t('resumeBuilder.workExperience.addBullet')}
          </button>
        </div>
      </div>

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
        <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 dark:text-purple-300 mb-2">{t('resumeBuilder.workExperience.selectCARStory')}</h5>
          {carStories.length === 0 ? (
            <p className="text-sm text-purple-700 dark:text-purple-400">
              {t('resumeBuilder.workExperience.noUnconvertedStories')}
            </p>
          ) : (
            <div className="space-y-2">
              {carStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer"
                  onClick={() => handleLinkCAR(story.id!)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{story.role_company}</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                        {story.problem_challenge}
                      </p>
                    </div>
                    <button
                      disabled={saving}
                      className="ml-2 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      {t('resumeBuilder.workExperience.convert')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowCARLink(false)}
            className="mt-2 text-sm text-purple-700 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-200"
          >
            {t('common.cancel')}
          </button>
        </div>
      )}

      {/* Add Manual Bullet */}
      {showAddForm && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 dark:text-blue-300 mb-2">{t('resumeBuilder.workExperience.addBulletTitle')}</h5>
          <p className="text-xs text-blue-700 dark:text-blue-400 mb-2">
            {t('resumeBuilder.workExperience.bulletHelp')}
          </p>
          <textarea
            value={newBullet}
            onChange={(e) => setNewBullet(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-blue-300 dark:border-blue-800 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2 dark:text-white"
            placeholder={t('resumeBuilder.workExperience.bulletPlaceholder')}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddManual}
              disabled={saving || !newBullet.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? t('resumeBuilder.workExperience.adding') : t('resumeBuilder.workExperience.addBullet')}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewBullet('')
              }}
              className="px-4 py-2 border border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Accomplishments List */}
      {sortedAccomplishments.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">{t('resumeBuilder.workExperience.noExperience')}</p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {t('resumeBuilder.workExperience.accomplishmentsHelp')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sortedAccomplishments.map((acc, index) => (
            <li
              key={acc.id}
              className="flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              {editingId === acc.id ? (
                <div className="flex-1">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2 dark:text-white"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      {t('common.save')}
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                    {acc.bullet_text}
                    {acc.par_story_id && (
                      <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded">
                        {t('resumeBuilder.workExperience.fromCARStory')}
                      </span>
                    )}
                  </p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="p-1 text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id!)}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
