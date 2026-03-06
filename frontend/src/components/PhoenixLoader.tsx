import { Loader2 } from 'lucide-react'

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
            <div className="relative">
                <div className={`${sizeClasses[size]} rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center overflow-hidden relative shadow-inner`}>
                    {/* Pulsing background */}
                    <div className="absolute inset-0 bg-indigo-500/10 animate-pulse rounded-full" />

                    {/* Spinning ring */}
                    <Loader2 className="absolute inset-0 w-full h-full text-indigo-400/50 animate-spin-slow object-cover p-1" strokeWidth={1} />

                    {/* Static Branding Logo inside */}
                    <img
                        src="/NovaWork Global Icon.png"
                        alt="NovaWork Global"
                        className="w-1/2 h-1/2 object-contain relative z-10"
                    />
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
