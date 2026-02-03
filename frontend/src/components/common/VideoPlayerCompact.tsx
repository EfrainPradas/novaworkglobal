import { useState } from 'react'
import { Play } from 'lucide-react'

interface VideoPlayerCompactProps {
  videoSrc: string
  title: string
  className?: string
}

export default function VideoPlayerCompact({ videoSrc, title, className = '' }: VideoPlayerCompactProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-black rounded-lg overflow-hidden shadow-md ${className}`}>
      {/* Compact Video Container - Smaller aspect ratio */}
      <div className="relative bg-black" style={{ paddingBottom: '40%' }}>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black z-10">
            <div className="text-center">
              <button
                onClick={handlePlay}
                className="flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white rounded-full shadow-xl transition-all transform hover:scale-105 group mb-2"
              >
                <Play className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" fill="currentColor" />
                <span className="text-sm font-semibold text-gray-900">Watch Methodology</span>
              </button>
              <p className="text-xs text-gray-400 px-4">{title}</p>
            </div>
          </div>
        )}

        <video
          className="absolute inset-0 w-full h-full"
          controls
          onPlay={handlePlay}
          preload="metadata"
        >
          <source src={videoSrc} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  )
}
