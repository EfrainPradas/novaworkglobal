import React from 'react'
import { getVideoUrl } from '@/config/videoUrls'

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
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-8">
            <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden shadow-xl bg-gray-900 flex items-center justify-center`}>
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover p-2 rounded-full"
                >
                    <source src={getVideoUrl('novaworkglobal-flying.mp4')} type="video/mp4" />
                </video>
            </div>
            {message && (
                <p className="text-sm font-semibold text-indigo-900 animate-pulse text-center">
                    {message}
                </p>
            )}
        </div>
    )
}
