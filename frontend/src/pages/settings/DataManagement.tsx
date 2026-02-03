import { useState } from 'react'
import { Download, Trash2, Database, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { BackButton } from '../../components/common/BackButton'

export default function DataManagement() {
    const [loading, setLoading] = useState(false)
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

    const handleDownloadData = async () => {
        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch all user data
            const [resumes, applications, stories] = await Promise.all([
                supabase.from('tailored_resumes').select('*').eq('user_id', user.id),
                supabase.from('job_applications').select('*').eq('user_id', user.id),
                supabase.from('par_stories').select('*').eq('user_id', user.id)
            ])

            const fullData = {
                exportDate: new Date().toISOString(),
                userId: user.id,
                resumes: resumes.data || [],
                applications: applications.data || [],
                stories: stories.data || []
            }

            // Create blob and download link
            const blob = new Blob([JSON.stringify(fullData, null, 2)], { type: 'application/json' })
            const url = URL.createObjectURL(blob)
            setDownloadUrl(url)

            // Auto trigger download
            const a = document.createElement('a')
            a.href = url
            a.download = `career_data_backup_${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)

        } catch (error) {
            console.error('Export failed:', error)
            alert('Failed to export data')
        } finally {
            setLoading(false)
        }
    }

    const handleClearData = async (table: string, label: string) => {
        if (!window.confirm(`Are you sure you want to DELETE ALL ${label}? This cannot be undone.`)) return

        try {
            setLoading(true)
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { error } = await supabase
                .from(table)
                .delete()
                .eq('user_id', user.id)

            if (error) throw error
            alert(`Successfully cleared ${label}`)
        } catch (error) {
            console.error(`Failed to clear ${label}:`, error)
            alert(`Error clearing ${label}`)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <BackButton to="/dashboard" label="Back to Dashboard" className="mb-2 pl-0" />
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Database className="w-7 h-7 text-indigo-600" />
                        Data Management
                    </h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Export Section */}
                <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Download className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h2 className="text-lg font-bold text-gray-900 mb-1">Export Your Data</h2>
                            <p className="text-gray-600 text-sm mb-4">
                                Download a complete JSON backup of your tracked resumes, job applications, and CAR stories.
                            </p>
                            <button
                                onClick={handleDownloadData}
                                disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                            >
                                {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                Download Backup
                            </button>
                            {downloadUrl && (
                                <p className="mt-3 text-xs text-green-600 flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Export ready
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Danger Zone */}
                <section className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
                    <div className="p-4 bg-red-50 border-b border-red-200 flex items-center gap-2 text-red-800">
                        <AlertTriangle className="w-5 h-5" />
                        <h2 className="font-bold">Danger Zone: Clear Test Data</h2>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                            <div>
                                <h3 className="font-medium text-gray-900">Job Applications</h3>
                                <p className="text-sm text-gray-500">Delete all tracked applications</p>
                            </div>
                            <button
                                onClick={() => handleClearData('job_applications', 'Job Applications')}
                                disabled={loading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all text-sm font-medium flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Clear All
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                            <div>
                                <h3 className="font-medium text-gray-900">Tailored Resumes</h3>
                                <p className="text-sm text-gray-500">Delete all resume versions</p>
                            </div>
                            <button
                                onClick={() => handleClearData('tailored_resumes', 'Tailored Resumes')}
                                disabled={loading}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all text-sm font-medium flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" /> Clear All
                            </button>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    )
}
