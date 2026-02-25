import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { AccomplishmentBankItem } from '../../types/resume'
import { useTranslation } from 'react-i18next'
import { Search, Check, X, Star, Briefcase } from 'lucide-react'

interface AccomplishmentBankSelectorProps {
    userId: string
    isOpen: boolean
    onClose: () => void
    onSelect: (items: AccomplishmentBankItem[]) => void
}

export const AccomplishmentBankSelector: React.FC<AccomplishmentBankSelectorProps> = ({
    userId,
    isOpen,
    onClose,
    onSelect
}) => {
    const { t } = useTranslation()
    const [bankItems, setBankItems] = useState<AccomplishmentBankItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    useEffect(() => {
        if (isOpen) {
            loadBankItems()
            setSelectedIds(new Set())
        }
    }, [isOpen])

    const loadBankItems = async () => {
        setLoading(true)
        try {
            const { data, error } = await supabase
                .from('accomplishment_bank')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })

            if (error) throw error
            setBankItems(data || [])
        } catch (error) {
            console.error('Error loading bank items:', error)
        } finally {
            setLoading(false)
        }
    }

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds)
        if (newSelected.has(id)) {
            newSelected.delete(id)
        } else {
            newSelected.add(id)
        }
        setSelectedIds(newSelected)
    }

    const handleConfirm = () => {
        const selectedItems = bankItems.filter(item => selectedIds.has(item.id!))
        onSelect(selectedItems)
        onClose()
    }

    const filteredItems = bankItems.filter(item =>
        item.bullet_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.role_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {t('resumeBuilder.workExperience.selectAccomplishments')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Search */}
                <div className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t('common.search')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-8 text-gray-500">{t('common.loading')}</div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            {bankItems.length === 0 ? t('resumeBuilder.workExperience.noBankItems') : t('common.noResults')}
                        </div>
                    ) : (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                onClick={() => toggleSelection(item.id!)}
                                className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${selectedIds.has(item.id!)
                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                        : 'border-transparent bg-gray-50 dark:bg-gray-700 hover:border-gray-200 dark:hover:border-gray-600'
                                    }`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-1 w-5 h-5 rounded flex items-center justify-center border ${selectedIds.has(item.id!)
                                            ? 'bg-primary-500 border-primary-500 text-white'
                                            : 'border-gray-300 dark:border-gray-500'
                                        }`}>
                                        {selectedIds.has(item.id!) && <Check className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900 dark:text-white leading-relaxed">
                                            {item.bullet_text}
                                        </p>
                                        {(item.role_title || item.company_name) && (
                                            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Briefcase className="w-3 h-3" />
                                                <span>{item.role_title} {item.company_name && `at ${item.company_name}`}</span>
                                                {item.is_starred && <Star className="w-3 h-3 text-yellow-500 fill-yellow-500 ml-auto" />}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={selectedIds.size === 0}
                        className={`px-6 py-2 rounded-lg font-medium transition ${selectedIds.size === 0
                                ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-not-allowed'
                                : 'bg-primary-600 dark:bg-primary-500 text-white hover:bg-primary-700 dark:hover:bg-primary-600'
                            }`}
                    >
                        {t('resumeBuilder.workExperience.addSelected', { count: selectedIds.size })}
                    </button>
                </div>
            </div>
        </div>
    )
}
