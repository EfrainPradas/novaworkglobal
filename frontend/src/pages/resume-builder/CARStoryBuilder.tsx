import React, { useState, useEffect } from 'react'
import { CARStory } from '../../types/resume'
import { CARStoryForm } from '../../components/resume-builder/CARStoryForm'
import { CARStoryList } from '../../components/resume-builder/CARStoryList'
import { BackButton } from '../../components/common/BackButton'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'

const CARStoryBuilder: React.FC = () => {
    const { t } = useTranslation()
    const [stories, setStories] = useState<CARStory[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingStory, setEditingStory] = useState<CARStory | undefined>()
    const [userId, setUserId] = useState<string | null>(null)

    useEffect(() => {
        checkUser()
    }, [])

    const checkUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUserId(user.id)
            loadStories(user.id)
        } else {
            setLoading(false)
        }
    }

    const loadStories = async (uid: string) => {
        try {
            const { data, error } = await supabase
                .from('par_stories') // Keeping DB table name for now
                .select('*')
                .eq('user_id', uid)
                .order('created_at', { ascending: false })

            if (error) throw error

            setStories(data || [])
        } catch (error) {
            console.error('Error loading CAR stories:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (carStory: CARStory) => {
        if (!userId) return

        try {
            if (editingStory?.id) {
                // Update existing
                const { data, error } = await supabase
                    .from('par_stories')
                    .update({
                        role_company: carStory.role_company,
                        year: carStory.year,
                        problem_challenge: carStory.problem_challenge,
                        actions: carStory.actions,
                        result: carStory.result,
                        metrics: carStory.metrics,
                        will_do_again: carStory.will_do_again,
                        competencies: carStory.competencies
                    })
                    .eq('id', editingStory.id)
                    .select()
                    .single()

                if (error) throw error

                setStories(stories.map(s => s.id === editingStory.id ? data : s))
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('par_stories')
                    .insert({
                        user_id: userId,
                        role_company: carStory.role_company,
                        year: carStory.year,
                        problem_challenge: carStory.problem_challenge,
                        actions: carStory.actions,
                        result: carStory.result,
                        metrics: carStory.metrics,
                        will_do_again: carStory.will_do_again,
                        competencies: carStory.competencies,
                        converted_to_bullet: false
                    })
                    .select()
                    .single()

                if (error) throw error

                setStories([data, ...stories])
            }

            setShowForm(false)
            setEditingStory(undefined)
        } catch (error) {
            console.error('Error saving CAR story:', error)
            throw error
        }
    }

    const handleEdit = (story: CARStory) => {
        setEditingStory(story)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!userId) return

        try {
            const { error } = await supabase
                .from('par_stories')
                .delete()
                .eq('id', id)
                .eq('user_id', userId)

            if (error) throw error

            setStories(stories.filter(s => s.id !== id))
        } catch (error) {
            console.error('Error deleting CAR story:', error)
        }
    }

    const handleConvertToBullet = async (story: CARStory) => {
        if (!userId || !story.id) return

        try {
            // Generate bullet text from CAR story
            const actions = story.actions.join('; ')
            const metrics = story.metrics.length > 0 ? ` - ${story.metrics.join(', ')}` : ''
            const bulletText = `${story.result}${metrics}. ${actions}`

            // Update the story with the generated bullet and mark as converted
            const { error } = await supabase
                .from('par_stories')
                .update({
                    bullet_text: bulletText,
                    converted_to_bullet: true
                })
                .eq('id', story.id)

            if (error) throw error

            // Reload stories to show updated status
            await loadStories(userId)

            alert('CAR story converted to bullet point! You can now link this to a work experience.')
        } catch (error) {
            console.error('Error converting CAR story:', error)
            alert('Failed to convert CAR story. Please try again.')
        }
    }

    const handleCancel = () => {
        setShowForm(false)
        setEditingStory(undefined)
    }

    const handleNewStory = () => {
        setEditingStory(undefined)
        setShowForm(true)
    }

    if (!userId) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                    {t('common.pleaseSignIn')}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md transition-colors duration-200">
                <div className="flex items-center justify-between mb-4">
                    <BackButton to="/resume-builder" label="Back to Resume Builder" className="pl-0" />
                </div>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            {t('resumeBuilder.par.title')}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">
                            {t('resumeBuilder.par.description')}
                        </p>
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-orange-500 rounded-full"></span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Challenge</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Actions</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 bg-green-500 rounded-full"></span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Result</span>
                            </div>
                        </div>
                    </div>
                    {!showForm && (
                        <button
                            onClick={handleNewStory}
                            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium shadow-sm hover:shadow-md"
                        >
                            + {t('resumeBuilder.par.addNew')}
                        </button>
                    )}
                </div>
            </div>

            {/* Form or List */}
            {showForm ? (
                <CARStoryForm
                    onSubmit={handleSave}
                    onCancel={handleCancel}
                    initialData={editingStory}
                />
            ) : (
                <CARStoryList
                    stories={stories}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onConvertToBullet={handleConvertToBullet}
                    loading={loading}
                />
            )}
        </div>
    )
}

export default CARStoryBuilder
