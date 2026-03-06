import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface SplashScreenProps {
    onFinished: () => void
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
    const [fadeOut, setFadeOut] = useState(false)
    useEffect(() => {
        // Since there is no video ending, we just wait for 3.5 seconds to fade out naturally
        const timer = setTimeout(() => {
            setFadeOut(true)
            setTimeout(onFinished, 800)
        }, 3500)

        return () => clearTimeout(timer)
    }, [onFinished])

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
            style={{ background: '#000000' }}
        >
            {/* Animated Logo Splash */}
            <div className="flex flex-col items-center gap-6">
                <div className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center relative overflow-hidden shadow-inner flex-shrink-0">
                    {/* Pulsing background glow */}
                    <div className="absolute inset-0 bg-blue-500/10 animate-pulse rounded-full" />

                    {/* Fast spinning outer ring */}
                    <Loader2 className="absolute inset-0 w-full h-full text-blue-500/30 animate-spin-slow object-cover p-2" strokeWidth={1} />

                    {/* Static Branding Logo inside */}
                    <img
                        src="/pwa-192x192.png"
                        alt="NovaWork Global"
                        className="w-1/2 h-1/2 object-contain relative z-10"
                    />
                </div>
            </div>
        </div>
    )
}
