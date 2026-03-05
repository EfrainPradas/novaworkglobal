import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, AlertCircle, RefreshCw, Languages, Search, ChevronRight, Download } from 'lucide-react'

// Adjust this URL for dev/prod accordingly
const API_BASE_URL = import.meta.env.VITE_API_URL || ''
const SUPPORTED_LANGS = ['en', 'es', 'fr', 'it', 'pt']
const LANG_LABELS: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French', it: 'Italian', pt: 'Portuguese' }

export default function TranslationEditor() {
    const [screens, setScreens] = useState<Record<string, Record<string, Record<string, string>>>>({})
    const [selectedScreen, setSelectedScreen] = useState<string>('')
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(true)
    const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({})
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchTranslations()
    }, [])

    const fetchTranslations = async () => {
        try {
            setLoading(true)
            setError(null)
            const response = await fetch(`${API_BASE_URL}/api/translations`)
            if (!response.ok) throw new Error('Failed to fetch translations')

            const data = await response.json()
            setScreens(data.screens || {})

            // Auto-select first screen if available
            if (data.screens && Object.keys(data.screens).length > 0) {
                setSelectedScreen(Object.keys(data.screens)[0])
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async (lang: string, keyPath: string, newValue: string) => {
        // keyPath is already the full dot-path (e.g. "hero.title"), send it directly
        setSavingKeys(prev => ({ ...prev, [`${lang}-${keyPath}`]: true }))

        try {
            const response = await fetch(`${API_BASE_URL}/api/translations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lang, key: keyPath, value: newValue })
            })

            if (!response.ok) throw new Error(`Failed to save ${lang}`)

            // Update local state to reflect the change
            setScreens(prev => {
                const updated = { ...prev }
                if (!updated[selectedScreen]) updated[selectedScreen] = {}
                if (!updated[selectedScreen][keyPath]) updated[selectedScreen][keyPath] = {}
                updated[selectedScreen][keyPath][lang] = newValue
                return updated
            })

        } catch (err: any) {
            console.error(err)
            alert(err.message)
        } finally {
            setSavingKeys(prev => ({ ...prev, [`${lang}-${keyPath}`]: false }))
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
            </div>
        )
    }

    const currentScreenKeys = screens[selectedScreen] || {}
    const filteredKeys = Object.keys(currentScreenKeys).filter(key =>
        key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        Object.values(currentScreenKeys[key]).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
    )

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 text-gray-900 dark:text-white transition-colors">
            <div className="max-w-[1600px] mx-auto px-4">

                {/* Header elements */}
                <div className="mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg">
                            <Languages className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold">i18n Translation Editor</h1>
                            <p className="text-gray-500 dark:text-gray-400">Directly modify locale JSON files by screen.</p>
                        </div>
                        <button
                            onClick={async () => {
                                for (const lang of SUPPORTED_LANGS) {
                                    try {
                                        const res = await fetch(`${API_BASE_URL}/api/translations/download/${lang}`)
                                        const blob = await res.blob()
                                        const url = URL.createObjectURL(blob)
                                        const a = document.createElement('a')
                                        a.href = url
                                        a.download = `${lang}.json`
                                        a.click()
                                        URL.revokeObjectURL(url)
                                    } catch (err) { console.error(err) }
                                }
                            }}
                            className="ml-auto px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download All JSONs
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Sidebar: Screen Categories */}
                    <div className="w-full lg:w-64 flex-shrink-0 space-y-2">
                        <h3 className="font-semibold px-3 mb-2 uppercase tracking-wider text-xs text-gray-500">Screens / Namespaces</h3>
                        {Object.keys(screens).sort().map(screen => (
                            <button
                                key={screen}
                                onClick={() => setSelectedScreen(screen)}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all ${selectedScreen === screen
                                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-medium border border-purple-200 dark:border-purple-800'
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border border-transparent'
                                    }`}
                            >
                                <span className="truncate">{screen}</span>
                                {selectedScreen === screen && <ChevronRight className="w-4 h-4" />}
                            </button>
                        ))}
                    </div>

                    {/* Main Content Area: Translation Grid */}
                    <div className="flex-1 w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">

                        {/* Toolbar */}
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-4 items-center">
                            <div className="relative flex-1 max-w-md">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search key or text..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                />
                            </div>
                            <div className="text-sm text-gray-500">
                                {filteredKeys.length} keys found
                            </div>
                        </div>

                        {/* Translation Headers */}
                        <div className="grid grid-cols-[300px_repeat(5,1fr)] gap-4 p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900 text-xs font-semibold uppercase tracking-wider text-gray-500">
                            <div>Key</div>
                            <div>English (en)</div>
                            <div>Spanish (es)</div>
                            <div>French (fr)</div>
                            <div>Italian (it)</div>
                            <div>Portuguese (pt)</div>
                        </div>

                        {/* Translation Rows */}
                        <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[70vh] overflow-y-auto">
                            {filteredKeys.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No translations found for this search.</div>
                            ) : (
                                filteredKeys.sort().map(keyPath => (
                                    <div key={keyPath} className="grid grid-cols-[300px_repeat(5,1fr)] gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">

                                        {/* Key Path Name */}
                                        <div className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all pr-4">
                                            {keyPath}
                                        </div>

                                        {/* Edit areas per language */}
                                        {SUPPORTED_LANGS.map(lang => {
                                            const val = screens[selectedScreen][keyPath][lang] || ''
                                            const isSaving = savingKeys[`${lang}-${keyPath}`]
                                            return (
                                                <div key={`${lang}-${keyPath}`} className="relative group">
                                                    <textarea
                                                        className="w-full h-full min-h-[80px] p-2 text-sm bg-white dark:bg-gray-900 border border-transparent focus:border-purple-300 dark:focus:border-purple-700 hover:border-gray-300 dark:hover:border-gray-600 rounded resize-y outline-none transition-colors"
                                                        defaultValue={val}
                                                        onBlur={(e) => {
                                                            if (e.target.value !== val) {
                                                                handleSave(lang, keyPath, e.target.value)
                                                            }
                                                        }}
                                                    />
                                                    {isSaving && (
                                                        <div className="absolute top-2 right-2 p-1 bg-purple-100 dark:bg-purple-900 rounded-full">
                                                            <RefreshCw className="w-3 h-3 text-purple-600 dark:text-purple-300 animate-spin" />
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}
