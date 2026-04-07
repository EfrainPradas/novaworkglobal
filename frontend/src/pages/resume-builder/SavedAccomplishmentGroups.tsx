import React, { useState, useEffect } from 'react'
import { Plus, Search, FolderOpen, Tag, Calendar, ChevronRight, ChevronDown, List, Trash2, Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useTranslation } from 'react-i18next'
import { format } from 'date-fns'

interface SavedGroup {
    id: string;
    user_id: string;
    name: string;
    grouped_data: {
        theme: string;
        storyIds: string[];
        accomplishments: { id?: string, text: string }[];
    }[];
    created_at: string;
}

export default function SavedAccomplishmentGroups({ isNested = false }: { isNested?: boolean }) {
    const { t } = useTranslation()
    const [groups, setGroups] = useState<SavedGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedGroupId, setExpandedGroupId] = useState<string | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        loadSavedGroups()
    }, [])

    const loadSavedGroups = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('saved_accomplishment_groups')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            setGroups(data || [])
        } catch (error) {
            console.error('Error loading saved groups:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent row expansion
        if (!window.confirm("Are you sure you want to delete this saved group? This cannot be undone.")) return;

        try {
            const { error } = await supabase
                .from('saved_accomplishment_groups')
                .delete()
                .eq('id', id)

            if (error) throw error

            setGroups(prev => prev.filter(g => g.id !== id))
            if (expandedGroupId === id) setExpandedGroupId(null)

        } catch (error) {
            console.error('Error deleting group:', error)
            alert("Failed to delete the group. Please try again.")
        }
    }

    const toggleExpand = (id: string) => {
        setExpandedGroupId(prev => prev === id ? null : id)
    }

    // Count total accomplishments across all themes in a group
    const getTotalAccomplishments = (groupData: SavedGroup['grouped_data']) => {
        if (!groupData || !Array.isArray(groupData)) return 0;
        return groupData.reduce((total, theme) => {
            // Handle backwards compatibility if storyIds length doesn't match items
            const count = theme.accomplishments?.length || theme.storyIds?.length || 0;
            return total + count;
        }, 0);
    }

    const filteredGroups = groups.filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return (
        <div className={`${isNested ? 'pb-8 md:pb-16' : 'min-h-screen py-8'} bg-transparent px-4 sm:px-6 lg:px-8`}>
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <span className="p-2 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 rounded-lg">
                                <FolderOpen size={24} />
                            </span>
                            Saved Accomplishment Groups
                        </h2>
                        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xl">
                            Access your previously generated AI groupings to quickly reference different formats of your career achievements.
                        </p>
                    </div>
                </div>

                {/* Filters / Search Toolbar */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4 z-10 flex gap-4 items-center">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search saved groups..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-primary-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white transition-colors"
                        />
                    </div>
                </div>

                {/* Content Area */}
                {loading ? (
                    <div className="flex justify-center items-center py-20 text-gray-500 dark:text-gray-400 space-x-2">
                        <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
                        <span>Loading your saved groups...</span>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 mt-6 shadow-sm">
                        <div className="bg-primary-50 dark:bg-primary-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-primary-400 dark:text-primary-500">
                            <FolderOpen size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No saved groups yet</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-6 text-sm">
                            You haven't saved any AI groupings yet. Go to the Accomplishment Bank, use the "Area of Expertise Grouping" tool, and click "Save Group" to build your collection.
                        </p>
                    </div>
                ) : filteredGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                        No groups found matching "{searchQuery}"
                    </div>
                ) : (
                    <div className="space-y-4">
                        {filteredGroups.map(group => {
                            const isExpanded = expandedGroupId === group.id;
                            const totalAccomplishments = getTotalAccomplishments(group.grouped_data);

                            return (
                                <div
                                    key={group.id}
                                    className={`bg-white dark:bg-gray-800 border transition-all duration-200 rounded-xl overflow-hidden ${isExpanded
                                            ? 'border-primary-300 dark:border-primary-700 shadow-md ring-1 ring-primary-500/10'
                                            : 'border-gray-200 dark:border-gray-700 shadow-sm hover:border-primary-300 dark:hover:border-primary-600 cursor-pointer'
                                        }`}
                                >
                                    {/* Group Header (Clickable) */}
                                    <div
                                        onClick={() => toggleExpand(group.id)}
                                        className={`p-5 flex items-center justify-between ${isExpanded ? 'bg-gray-50/50 dark:bg-gray-800/80 border-b border-gray-100 dark:border-gray-700/50' : ''}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-2.5 rounded-lg transition-colors ${isExpanded ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/40 dark:text-primary-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                                                <List size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{group.name}</h3>
                                                <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar size={12} />
                                                        {format(new Date(group.created_at), 'MMM d, yyyy')}
                                                    </span>
                                                    <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                                                        <Tag size={10} />
                                                        {group.grouped_data?.length || 0} Categories
                                                    </span>
                                                    <span className="flex items-center gap-1 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full">
                                                        <List size={10} />
                                                        {totalAccomplishments} Items
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={(e) => handleDelete(group.id, e)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete Group"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="p-1.5 text-gray-400">
                                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded Content View (The Snapshot) */}
                                    {isExpanded && (
                                        <div className="p-6 bg-gray-50 dark:bg-gray-900/30">
                                            <div className="space-y-6">
                                                {group.grouped_data?.map((themeGroup, idx) => (
                                                    <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

                                                        {/* Category Header */}
                                                        <div className="bg-gradient-to-r from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800 px-5 py-3 flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50">
                                                            <h5 className="font-bold text-primary-700 dark:text-primary-400 text-sm flex items-center gap-2">
                                                                <Tag className="w-4 h-4" /> {themeGroup.theme}
                                                            </h5>
                                                            <span className="text-xs bg-white dark:bg-gray-900 text-gray-500 font-bold px-2.5 py-1 rounded-full border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                {themeGroup.accomplishments?.length || themeGroup.storyIds?.length || 0} items
                                                            </span>
                                                        </div>

                                                        {/* Bullets List */}
                                                        <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                            {themeGroup.accomplishments && themeGroup.accomplishments.length > 0 ? (
                                                                // Render from the stored snapshot text
                                                                themeGroup.accomplishments.map((acc, aIdx) => (
                                                                    <div key={aIdx} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mr-3 align-middle bg-glow"></span>
                                                                            {acc.text}
                                                                        </p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                // Backwards compatibility or error state
                                                                <div className="px-5 py-4 text-sm text-gray-500 italic">No accomplishment text saved for this category.</div>
                                                            )}
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
