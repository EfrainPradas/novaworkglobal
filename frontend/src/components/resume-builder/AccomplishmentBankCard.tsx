import React, { useState } from 'react'
import { AccomplishmentBankItem } from '../../types/resume'
import { Star, MoreVertical, Edit2, Trash2, Check, X, Tag, GripVertical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface AccomplishmentBankCardProps {
    item: AccomplishmentBankItem
    onUpdate: (id: string, updates: Partial<AccomplishmentBankItem>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export const AccomplishmentBankCard: React.FC<AccomplishmentBankCardProps> = ({ item, onUpdate, onDelete }) => {
    const { t } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(item.bullet_text)
    const [editRole, setEditRole] = useState(item.role_title || '')
    const [editCompany, setEditCompany] = useState(item.company_name || '')
    const [editStart, setEditStart] = useState(item.start_date || '')
    const [editEnd, setEditEnd] = useState(item.end_date || '')
    const [showMenu, setShowMenu] = useState(false)

    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id! })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    }

    const handleSave = async () => {
        const edits: Partial<AccomplishmentBankItem> = {}
        if (editText.trim() !== item.bullet_text) edits.bullet_text = editText.trim()
        if (editRole.trim() !== (item.role_title || '')) edits.role_title = editRole.trim()
        if (editCompany.trim() !== (item.company_name || '')) edits.company_name = editCompany.trim()
        if (editStart.trim() !== (item.start_date || '')) edits.start_date = editStart.trim()
        if (editEnd.trim() !== (item.end_date || '')) edits.end_date = editEnd.trim()

        if (Object.keys(edits).length > 0) {
            await onUpdate(item.id!, edits)
        }
        setIsEditing(false)
    }

    const toggleStar = async (e: React.MouseEvent) => {
        e.stopPropagation()
        await onUpdate(item.id!, { is_starred: !item.is_starred })
    }

    const getSourceLabel = (source: string) => {
        switch (source) {
            case 'car_story': return t('accomplishmentLibrary.sourceCarStory', 'CAR Story')
            case 'ai_generated': return t('accomplishmentLibrary.sourceAI', 'AI Generated')
            case 'imported': return t('accomplishmentLibrary.sourceImported', 'Imported')
            default: return t('accomplishmentLibrary.sourceManual', 'Manual')
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white dark:bg-gray-800 border rounded-lg p-4 transition-all hover:shadow-md ${item.is_starred ? 'border-amber-200 dark:border-amber-700/50 bg-amber-50/30 dark:bg-amber-900/10' : 'border-gray-200 dark:border-gray-700'} ${isDragging ? 'shadow-xl border-primary-500' : ''}`}
        >
            <div className="flex justify-between items-start gap-4">
                {/* Drag Handle */}
                {!isEditing && (
                    <div
                        {...attributes}
                        {...listeners}
                        className="mt-1 cursor-grab text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400 opacity-50 hover:opacity-100 flex-shrink-0 active:cursor-grabbing"
                        title={t('accomplishmentCard.dragToReorder', 'Drag to reorder')}
                    >
                        <GripVertical size={18} />
                    </div>
                )}

                <div className="flex-1 space-y-2">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-2 text-sm text-gray-800 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700 focus:border-primary-500 focus:outline-none focus:ring-0 min-h-[60px] resize-y bg-gray-50/50 dark:bg-gray-900/50"
                                autoFocus
                            />
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.role', 'Role')}</label>
                                    <input
                                        type="text"
                                        value={editRole}
                                        onChange={e => setEditRole(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder={t('accomplishmentCard.rolePlaceholder', 'e.g. Sales Manager')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.company', 'Company')}</label>
                                    <input
                                        type="text"
                                        value={editCompany}
                                        onChange={e => setEditCompany(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder={t('accomplishmentCard.companyPlaceholder', 'e.g. Modere')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.startDate', 'Start Date')}</label>
                                    <input
                                        type="text"
                                        value={editStart}
                                        onChange={e => setEditStart(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder={t('accomplishmentCard.startDatePlaceholder', 'e.g. Jan 2020')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">{t('common.endDate', 'End Date')}</label>
                                    <input
                                        type="text"
                                        value={editEnd}
                                        onChange={e => setEditEnd(e.target.value)}
                                        className="w-full text-xs p-1.5 border rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                                        placeholder={t('accomplishmentCard.endDatePlaceholder', 'e.g. Present')}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-1 px-3 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="p-1 px-3 text-sm bg-primary-600 text-white hover:bg-primary-700 rounded flex items-center gap-1"
                                >
                                    <Check size={14} /> {t('common.save', 'Save')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{item.bullet_text}</p>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {/* Role/Company Badge */}
                                {(item.role_title || item.company_name) && (
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                        {[item.role_title, item.company_name].filter(Boolean).join(' • ')}
                                    </span>
                                )}

                                {/* Dates Badge */}
                                {(item.start_date || item.end_date) && (
                                    <span className="text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-0.5 rounded">
                                        {item.start_date || t('accomplishmentCard.unknown', 'Unknown')} - {item.end_date || t('accomplishmentCard.present', 'Present')}
                                    </span>
                                )}

                                {/* Source Badge */}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.source === 'ai_generated' ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-primary-100 dark:border-primary-800/50' :
                                    item.source === 'car_story' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800/50' :
                                        'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700'
                                    }`}>
                                    {getSourceLabel(item.source)}
                                </span>

                                {/* Times Used */}
                                {item.times_used > 0 && (
                                    <span className="text-[10px] text-gray-400">
                                        {t('accomplishmentLibrary.timesUsed', { count: item.times_used, defaultValue: `Used {{count}} times` })}
                                    </span>
                                )}
                            </div>

                            {/* Skills Tags */}
                            {item.skills && item.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.skills.map((skill, i) => (
                                        <span key={i} className="text-[10px] text-primary-600 flex items-center gap-0.5">
                                            <Tag size={10} /> {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <button
                        onClick={toggleStar}
                        className={`p-1.5 rounded-full transition-colors ${item.is_starred ? 'text-amber-400 hover:bg-amber-50' : 'text-gray-300 hover:text-amber-400 hover:bg-gray-50'}`}
                    >
                        <Star size={16} fill={item.is_starred ? "currentColor" : "none"} />
                    </button>

                    <div className="relative">
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-10 py-1">
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false) }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> {t('common.edit', 'Edit')}
                                </button>
                                <button
                                    onClick={() => { onDelete(item.id!); setShowMenu(false) }}
                                    className="w-full text-left px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                >
                                    <Trash2 size={14} /> {t('common.delete', 'Delete')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
