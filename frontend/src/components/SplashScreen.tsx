import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import phoenixVideo from '../assets/videos/novaworkglobal-flying.mp4'

interface SplashScreenProps {
    onFinished: () => void
}

export default function SplashScreen({ onFinished }: SplashScreenProps) {
    const [fadeOut, setFadeOut] = useState(false)
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handleEnded = () => {
            setFadeOut(true)
            setTimeout(() => {
                onFinished()
            }, 800)
        }

        const fallbackTimer = setTimeout(() => {
            setFadeOut(true)
            setTimeout(onFinished, 800)
        }, 6000)

        video.addEventListener('ended', handleEnded)

        return () => {
            video.removeEventListener('ended', handleEnded)
            clearTimeout(fallbackTimer)
        }
    }, [onFinished])

    return (
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'
                }`}
            style={{ background: '#000000' }}
        >
            {/* Phoenix Video */}
            <div className="flex flex-col items-center gap-6">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-64 h-64 object-contain"
                >
                    <source src={phoenixVideo} type="video/mp4" />
                </video>
            </div>
        </div>
    )
}
