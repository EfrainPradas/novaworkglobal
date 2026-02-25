import React, { useState } from 'react'
import { AccomplishmentBankItem } from '../../types/resume'
import { Star, MoreVertical, Edit2, Trash2, Check, X, Tag } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AccomplishmentBankCardProps {
    item: AccomplishmentBankItem
    onUpdate: (id: string, updates: Partial<AccomplishmentBankItem>) => Promise<void>
    onDelete: (id: string) => Promise<void>
}

export const AccomplishmentBankCard: React.FC<AccomplishmentBankCardProps> = ({ item, onUpdate, onDelete }) => {
    const { t } = useTranslation()
    const [isEditing, setIsEditing] = useState(false)
    const [editText, setEditText] = useState(item.bullet_text)
    const [showMenu, setShowMenu] = useState(false)

    const handleSave = async () => {
        if (editText.trim() !== item.bullet_text) {
            await onUpdate(item.id!, { bullet_text: editText })
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
        <div className={`group relative bg-white border rounded-lg p-4 transition-all hover:shadow-md ${item.is_starred ? 'border-amber-200 bg-amber-50/30' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-1 space-y-2">
                    {isEditing ? (
                        <div className="space-y-2">
                            <textarea
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-emerald-500 min-h-[80px]"
                                autoFocus
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="p-1 px-3 text-sm text-gray-600 hover:bg-gray-100 rounded"
                                >
                                    {t('common.cancel', 'Cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="p-1 px-3 text-sm bg-emerald-600 text-white hover:bg-emerald-700 rounded flex items-center gap-1"
                                >
                                    <Check size={14} /> {t('common.save', 'Save')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-gray-800 text-sm leading-relaxed">{item.bullet_text}</p>

                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {/* Role/Company Badge */}
                                {(item.role_title || item.company_name) && (
                                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                        {[item.role_title, item.company_name].filter(Boolean).join(' • ')}
                                    </span>
                                )}

                                {/* Source Badge */}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded border ${item.source === 'ai_generated' ? 'bg-purple-50 text-purple-600 border-purple-100' :
                                    item.source === 'car_story' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
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
                                        <span key={i} className="text-[10px] text-emerald-600 flex items-center gap-0.5">
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
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 z-10 py-1">
                                <button
                                    onClick={() => { setIsEditing(true); setShowMenu(false) }}
                                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <Edit2 size={14} /> {t('common.edit', 'Edit')}
                                </button>
                                <button
                                    onClick={() => { onDelete(item.id!); setShowMenu(false) }}
                                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
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
