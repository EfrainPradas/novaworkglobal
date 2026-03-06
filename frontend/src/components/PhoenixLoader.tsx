import { useRef, useEffect } from 'react'

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
                {/* Black circle background to match the video */}
                <div className={`${sizeClasses[size]} rounded-full bg-black flex items-center justify-center overflow-hidden`}>
                    <video
                        ref={videoRef}
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-contain"
                    >
                        <source src="/videos/novaworkglobal-flying.mp4?v=4" type="video/mp4" />
                    </video>
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
