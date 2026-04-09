
import React from 'react'
import { Eye } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

interface ResumePreviewProps {
    userId: string | null
}

export default function ResumePreview({ userId }: ResumePreviewProps) {
    const { t } = useTranslation()
    const navigate = useNavigate()

    if (!userId) return null

    return (
        <button
            id="resume-preview-btn"
            onClick={() => navigate('/dashboard/resume/type-selection?mode=standalone')}
            className="fixed bottom-8 left-8 z-50 flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-700 transition-all hover:scale-105"
            title="Preview Resume"
        >
            <Eye className="w-5 h-5" />
            <span className="font-medium">Preview Resume</span>
        </button>
    )
}
