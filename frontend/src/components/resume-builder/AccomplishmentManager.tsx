import React, { useState } from 'react'
import { Accomplishment, CARStory } from '../../types/resume'
import { useTranslation } from 'react-i18next'

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
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCARLink, setShowCARLink] = useState(false)
  const [newBullet, setNewBullet] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [saving, setSaving] = useState(false)

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
    if (!confirm('Delete this accomplishment?')) return

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
        <h4 className="font-semibold text-gray-900">
          {t('resumeBuilder.workExperience.accomplishments')}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCARLink(!showCARLink)}
            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
          >
            {t('resumeBuilder.workExperience.linkPARStory')}
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1 text-sm bg-primary-100 text-primary-700 rounded-lg hover:bg-primary-200"
          >
            + {t('resumeBuilder.workExperience.addBullet')}
          </button>
        </div>
      </div>

      {/* Link CAR Story */}
      {showCARLink && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h5 className="font-medium text-purple-900 mb-2">Select a CAR Story to Convert</h5>
          {carStories.length === 0 ? (
            <p className="text-sm text-purple-700">
              No unconverted CAR stories available. Create more in the CAR Story Builder.
            </p>
          ) : (
            <div className="space-y-2">
              {carStories.map((story) => (
                <div
                  key={story.id}
                  className="bg-white p-3 rounded border border-purple-200 hover:border-purple-400 cursor-pointer"
                  onClick={() => handleLinkCAR(story.id!)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{story.role_company}</p>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {story.problem_challenge}
                      </p>
                    </div>
                    <button
                      disabled={saving}
                      className="ml-2 px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
                    >
                      Convert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowCARLink(false)}
            className="mt-2 text-sm text-purple-700 hover:text-purple-900"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Add Manual Bullet */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Add Accomplishment Bullet</h5>
          <p className="text-xs text-blue-700 mb-2">
            Use: <strong>Verb</strong> + <strong>Scope</strong> + <strong>Action</strong> + <strong>Metric</strong>
          </p>
          <textarea
            value={newBullet}
            onChange={(e) => setNewBullet(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="e.g., Led team of 12 engineers to deliver new payment system, reducing transaction time by 40% and saving $2M annually"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAddManual}
              disabled={saving || !newBullet.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Adding...' : 'Add Bullet'}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewBullet('')
              }}
              className="px-4 py-2 border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Accomplishments List */}
      {sortedAccomplishments.length === 0 ? (
        <div className="text-center py-6 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">No accomplishments yet</p>
          <p className="text-xs text-gray-500 mt-1">
            {t('resumeBuilder.workExperience.accomplishmentsHelp')}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {sortedAccomplishments.map((acc, index) => (
            <li
              key={acc.id}
              className="flex items-start gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
            >
              <span className="flex-shrink-0 w-6 h-6 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              {editingId === acc.id ? (
                <div className="flex-1">
                  <textarea
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 mb-2"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveEdit}
                      disabled={saving}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-sm text-gray-800 leading-relaxed">
                    {acc.bullet_text}
                    {acc.par_story_id && (
                      <span className="ml-2 inline-block px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">
                        From CAR Story
                      </span>
                    )}
                  </p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleStartEdit(acc)}
                      className="p-1 text-gray-500 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id!)}
                      className="p-1 text-gray-500 hover:text-red-600"
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

      {sortedAccomplishments.length > 0 && (
        <p className="text-xs text-xs text-gray-500 mt-2">
          {/* Optional: Descriptive text or nothing */}
        </p>
      )}
    </div>
  )
}
