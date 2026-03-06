import { useRef, useEffect } from 'react'
import { Loader2, Sparkles } from 'lucide-react'

interface PhoenixLoaderProps {
    /** Optional message to display below the video */
    message?: string
    /** Size class for the video: 'sm' | 'md' | 'lg' */
    size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-64 h-64',
}

export default function PhoenixLoader({ message, size = 'md' }: PhoenixLoaderProps) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        // Ensure the video loops
        const video = videoRef.current
        if (video) {
            video.play().catch(() => { })
        }
    }, [])

    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className="relative">
                <div className={`${sizeClasses[size]} rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden relative shadow-inner`}>
                    <div className="absolute inset-0 bg-indigo-500/10 animate-pulse rounded-full" />
                    <Sparkles className="w-1/3 h-1/3 text-indigo-400 absolute" />
                    <Loader2 className="w-2/3 h-2/3 text-indigo-600 animate-spin" />
                </div>
            </div>
            {message && (
                <p className="text-sm text-gray-500 dark:text-gray-400 animate-pulse text-center">
                    {message}
                </p>
            )}
        </div>
    )
}
