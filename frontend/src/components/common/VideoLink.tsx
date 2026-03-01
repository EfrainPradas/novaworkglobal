import { PlayCircle } from 'lucide-react'
import { useState } from 'react'

interface VideoLinkProps {
  videoSrc: string
  title: string
  description: string
  className?: string
}

export default function VideoLink({ videoSrc, title, description, className = '' }: VideoLinkProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsOpen(true)
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 ${className}`}
      >
        <PlayCircle className="w-6 h-6 flex-shrink-0" />
        <div className="text-left">
          <div className="font-bold text-sm">{title}</div>
          <div className="text-xs opacity-90">{description}</div>
        </div>
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          onClick={(e) => {
            e.stopPropagation()
            setIsOpen(false)
          }}
        >
          {/* Dark Overlay */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>

          {/* Modal Content */}
          <div
            className="relative w-full max-w-5xl bg-black rounded-2xl overflow-hidden shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setIsOpen(false)
              }}
              className="absolute top-4 right-4 z-20 p-2 bg-black/40 text-white rounded-full hover:bg-black/60 transition-colors"
              aria-label="Close video"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Video Player */}
            <div className="w-full aspect-video bg-black flex items-center justify-center relative">
              <video
                src={videoSrc.startsWith('/') && !videoSrc.startsWith(import.meta.env.BASE_URL) ? `${import.meta.env.BASE_URL}${videoSrc.slice(1)}` : videoSrc}
                className="w-full h-full outline-none"
                controls
                controlsList="nodownload"
                autoPlay
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
