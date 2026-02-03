import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

interface BackButtonProps {
    to?: string
    label?: string
    className?: string
    variant?: 'light' | 'dark'
}

export const BackButton: React.FC<BackButtonProps> = ({
    to,
    label = 'Back',
    className = '',
    variant = 'light'
}) => {
    const navigate = useNavigate()

    const handleBack = () => {
        if (to) {
            navigate(to)
        } else {
            navigate(-1)
        }
    }

    const baseStyles = "flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm group shadow-sm border"

    // 'light' is for light backgrounds (dark text)
    // 'dark' is for dark backgrounds (light text)
    const variants = {
        light: "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md",
        dark: "bg-white/10 text-white border-white/10 hover:bg-white/20 hover:border-white/20 backdrop-blur-sm"
    }

    return (
        <button
            onClick={handleBack}
            className={`${baseStyles} ${variants[variant]} ${className}`}
            aria-label={`Go back to ${label}`}
        >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span>{label}</span>
        </button>
    )
}

export default BackButton
