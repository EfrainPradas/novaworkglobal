import React, { useState } from 'react'
import { CARStory } from '../../types/resume'
import { useTranslation } from 'react-i18next'

interface CARStoryListProps {
    stories: CARStory[]
    onEdit: (story: CARStory) => void
    onDelete: (id: string) => void
    onConvertToBullet: (story: CARStory) => void
    loading?: boolean
}

export const CARStoryList: React.FC<CARStoryListProps> = ({
    stories,
    onEdit,
    onDelete,
    onConvertToBullet,
    loading = false
}) => {
    const { t } = useTranslation()
    const [filterCompetency, setFilterCompetency] = useState<string>('')
    const [filterWillDoAgain, setFilterWillDoAgain] = useState<boolean | null>(null)
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

    // Get unique competencies from all stories
    const allCompetencies = Array.from(
        new Set(stories.flatMap(story => story.competencies))
    ).sort()

    // Filter stories
    const filteredStories = stories.filter(story => {
        if (filterCompetency && !story.competencies.includes(filterCompetency)) {
            return false
        }
        if (filterWillDoAgain !== null && story.will_do_again !== filterWillDoAgain) {
            return false
        }
        return true
    })

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (stories.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">{t('resumeBuilder.par.noStories')}</h3>
                <p className="mt-1 text-sm text-gray-500">{t('resumeBuilder.par.noStoriesHelp')}</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Filters & View Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors duration-200">
                <div className="flex flex-wrap items-center gap-4">
                    {/* Competency Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                            {t('resumeBuilder.par.filterByCompetency')}:
                        </label>
                        <select
                            value={filterCompetency}
                            onChange={(e) => setFilterCompetency(e.target.value)}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">{t('common.all')}</option>
                            {allCompetencies.map(comp => (
                                <option key={comp} value={comp}>{comp}</option>
                            ))}
                        </select>
                    </div>

                    {/* Will Do Again Filter */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                            {t('resumeBuilder.par.filterByWillDoAgain')}:
                        </label>
                        <select
                            value={filterWillDoAgain === null ? '' : filterWillDoAgain.toString()}
                            onChange={(e) => {
                                if (e.target.value === '') {
                                    setFilterWillDoAgain(null)
                                } else {
                                    setFilterWillDoAgain(e.target.value === 'true')
                                }
                            }}
                            className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm dark:bg-gray-700 dark:text-white"
                        >
                            <option value="">{t('common.all')}</option>
                            <option value="true">{t('common.yes')}</option>
                            <option value="false">{t('common.no')}</option>
                        </select>
                    </div>

                    {/* Results Count */}
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        {filteredStories.length} {t('resumeBuilder.par.storiesFound')}
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                        title="Grid view"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                        title="List view"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* Stories Grid/List */}
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                {filteredStories.map(story => (
                    <CARStoryCard
                        key={story.id}
                        story={story}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onConvertToBullet={onConvertToBullet}
                        viewMode={viewMode}
                    />
                ))}
            </div>
        </div>
    )
}

interface CARStoryCardProps {
    story: CARStory
    onEdit: (story: CARStory) => void
    onDelete: (id: string) => void
    onConvertToBullet: (story: CARStory) => void
    viewMode: 'grid' | 'list'
}

const CARStoryCard: React.FC<CARStoryCardProps> = ({
    story,
    onEdit,
    onDelete,
    onConvertToBullet,
    viewMode
}) => {
    const { t } = useTranslation()
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    const handleDelete = () => {
        if (story.id) {
            onDelete(story.id)
        }
    }

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white">{story.role_company}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{story.year}</p>
                </div>
                <div className="flex gap-2">
                    {story.will_do_again && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✓ {t('resumeBuilder.par.wouldDoAgain')}
                        </span>
                    )}
                    {story.converted_to_bullet && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            ✓ {t('resumeBuilder.par.converted')}
                        </span>
                    )}
                </div>
            </div>

            {/* CAR Content */}
            <div className="space-y-2 mb-3">
                <div>
                    <span className="text-xs font-semibold text-orange-600 uppercase">Challenge:</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{story.problem_challenge}</p>
                </div>
                <div>
                    <span className="text-xs font-semibold text-blue-600 uppercase">Actions:</span>
                    <ul className="text-sm text-gray-700 dark:text-gray-300 mt-1 list-disc list-inside">
                        {story.actions.map((action, idx) => (
                            <li key={idx}>{action}</li>
                        ))}
                    </ul>
                </div>
                <div>
                    <span className="text-xs font-semibold text-green-600 uppercase">Result:</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{story.result}</p>
                </div>
            </div>

            {/* Metrics */}
            {story.metrics.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {story.metrics.map((metric, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-primary-100 text-primary-800">
                            {metric}
                        </span>
                    ))}
                </div>
            )}

            {/* Competencies */}
            {story.competencies.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                    {story.competencies.map(comp => (
                        <span key={comp} className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700">
                            {comp}
                        </span>
                    ))}
                </div>
            )}

            {/* Bullet Preview */}
            {story.converted_to_bullet && story.bullet_text && (
                <div className="bg-blue-50 border border-blue-200 rounded p-2 mb-3">
                    <span className="text-xs font-semibold text-blue-800 uppercase">Bullet:</span>
                    <p className="text-sm text-blue-900 mt-1">• {story.bullet_text}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t">
                {!story.converted_to_bullet && (
                    <button
                        onClick={() => onConvertToBullet(story)}
                        className="flex-1 px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition text-sm font-medium"
                    >
                        {t('resumeBuilder.par.convertToBullet')}
                    </button>
                )}
                <button
                    onClick={() => onEdit(story)}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm"
                >
                    {t('common.edit')}
                </button>
                {!showDeleteConfirm ? (
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="px-3 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition text-sm"
                    >
                        {t('common.delete')}
                    </button>
                ) : (
                    <button
                        onClick={handleDelete}
                        className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm font-medium"
                    >
                        {t('common.confirmDelete')}?
                    </button>
                )}
            </div>
        </div>
    )
}
