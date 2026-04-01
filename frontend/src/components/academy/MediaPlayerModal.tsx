import React, { useState, useEffect } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Headphones, FileText } from 'lucide-react'
import type { Resource } from '../../types/academy'

interface MediaPlayerModalProps {
  resource: Resource | null
  onClose: () => void
}

const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ resource, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    if (resource) {
      setIsPlaying(false)
      setCurrentTime(0)
      setProgress(0)
    }
  }, [resource])

  if (!resource) return null

  const handlePlay = () => setIsPlaying(!isPlaying)
  const handleMute = () => setIsMuted(!isMuted)

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget
    setCurrentTime(video.currentTime)
    setProgress((video.currentTime / video.duration) * 100)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = document.getElementById('academy-media-player') as HTMLVideoElement
    if (video) {
      const newTime = (parseFloat(e.target.value) / 100) * video.duration
      video.currentTime = newTime
      setProgress(parseFloat(e.target.value))
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleFullscreen = () => {
    const container = document.getElementById('academy-media-container')
    if (container && container.requestFullscreen) {
      container.requestFullscreen()
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setProgress(100)
  }

  const isVideo = resource.type === 'video'
  const isAudio = resource.type === 'audio'

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      
      <div 
        className="relative w-full max-w-4xl mx-4 bg-slate-900 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isVideo ? 'bg-red-500/20' : isAudio ? 'bg-purple-500/20' : 'bg-blue-500/20'
            }`}>
              {isVideo && <Play size={18} className="text-red-400" />}
              {isAudio && <Headphones size={18} className="text-purple-400" />}
              {resource.type === 'article' && <FileText size={18} className="text-blue-400" />}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg leading-tight">{resource.title}</h3>
              <p className="text-slate-400 text-sm">{resource.description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Media Container */}
        <div 
          id="academy-media-container"
          className={`relative bg-black ${isVideo ? 'aspect-video' : 'aspect-square max-h-64'}`}
        >
          {(isVideo || isAudio) ? (
            <>
              {/* Video/Audio Player */}
              <video
                id="academy-media-player"
                src={resource.url}
                className={`w-full h-full ${isAudio ? 'hidden' : ''}`}
                controls={false}
                autoPlay={isPlaying}
                muted={isMuted}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                onEnded={handleEnded}
              />

              {/* Audio Visualization for Audio */}
              {isAudio && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                  <div className="text-center">
                    <div className="w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 mx-auto animate-pulse">
                      <Headphones size={48} className="text-purple-400" />
                    </div>
                    <p className="text-white font-medium text-lg">{resource.title}</p>
                    <p className="text-slate-400 text-sm mt-1">{formatTime(currentTime)} / {formatTime(duration)}</p>
                  </div>
                </div>
              )}

              {/* Custom Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full h-1 mb-3 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #10B981 ${progress}%, #475569 ${progress}%)`
                  }}
                />

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Play/Pause */}
                    <button
                      onClick={handlePlay}
                      className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>

                    {/* Mute */}
                    <button
                      onClick={handleMute}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    {/* Time */}
                    <span className="text-white/80 text-sm font-medium ml-2">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Fullscreen */}
                    <button
                      onClick={handleFullscreen}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      <Maximize2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Article View */
            <div className="h-full overflow-y-auto p-8 bg-white">
              <article className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{resource.title}</h2>
                <div className="prose prose-slate">
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {resource.description || 'Contenido del artículo...'}
                  </p>
                </div>
                {resource.url && (
                  <a
                    href={resource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 mt-6 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <FileText size={16} />
                    Ver artículo completo
                  </a>
                )}
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MediaPlayerModal
