import { useState } from 'react'
import { Play, Maximize2 } from 'lucide-react'

interface VideoPlayerProps {
  videoSrc: string
  title: string
  description?: string
  className?: string
}

export default function VideoPlayer({ videoSrc, title, description, className = '' }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  const handlePlay = () => {
    setIsPlaying(true)
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Video Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-indigo-100">{description}</p>
        )}
      </div>

      {/* Video Container */}
      <div className="relative bg-black" style={{ paddingBottom: '56.25%' }}>
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 to-black z-10">
            <button
              onClick={handlePlay}
              className="flex items-center gap-3 px-8 py-4 bg-white/90 hover:bg-white rounded-full shadow-2xl transition-all transform hover:scale-105 group"
            >
              <Play className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" fill="currentColor" />
              <span className="font-semibold text-gray-900">Watch Video</span>
            </button>
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

      {/* Video Footer */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Maximize2 className="w-4 h-4" />
          <span>Click fullscreen for best viewing experience</span>
        </div>
      </div>
    </div>
  )
}
