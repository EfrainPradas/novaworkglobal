import React, { useState, useEffect, useRef, useCallback } from 'react'
import { X, Play, Pause, Volume2, VolumeX, Maximize2, Headphones, FileText, FileDown, Download, ExternalLink } from 'lucide-react'
import type { Resource } from '../../types/academy'

interface MediaPlayerModalProps {
  resource: Resource | null
  onClose: () => void
}

const MediaPlayerModal: React.FC<MediaPlayerModalProps> = ({ resource, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  const getMediaEl = useCallback(() => {
    if (!resource) return null
    return resource.type === 'audio' ? audioRef.current : videoRef.current
  }, [resource])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === ' ') {
        e.preventDefault()
        handlePlay()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, isPlaying])

  useEffect(() => {
    // Reset state when resource changes
    setIsPlaying(false)
    setCurrentTime(0)
    setProgress(0)
    setDuration(0)
  }, [resource])

  // Cleanup on unmount or resource change
  useEffect(() => {
    return () => {
      videoRef.current?.pause()
      audioRef.current?.pause()
    }
  }, [resource])

  if (!resource) return null

  const isVideo = resource.type === 'video'
  const isAudio = resource.type === 'audio'
  const isDocument = resource.type === 'document'
  const isPdf = resource.url?.toLowerCase().endsWith('.pdf')

  const handlePlay = () => {
    const el = getMediaEl()
    if (!el) return
    if (isPlaying) {
      el.pause()
      setIsPlaying(false)
    } else {
      el.play().then(() => setIsPlaying(true)).catch(console.error)
    }
  }

  const handleMute = () => {
    const el = getMediaEl()
    if (el) el.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    const el = e.currentTarget
    setCurrentTime(el.currentTime)
    if (el.duration) {
      setProgress((el.currentTime / el.duration) * 100)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const el = getMediaEl()
    if (el && el.duration) {
      const newTime = (parseFloat(e.target.value) / 100) * el.duration
      el.currentTime = newTime
      setProgress(parseFloat(e.target.value))
    }
  }

  const cleanTitle = (title: string) => {
    if (!title) return 'Untitled'
    return title.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00'
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

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement | HTMLAudioElement>) => {
    setDuration(e.currentTarget.duration)
  }

  const sharedMediaProps = {
    src: resource.url,
    muted: isMuted,
    onTimeUpdate: handleTimeUpdate,
    onLoadedMetadata: handleLoadedMetadata,
    onEnded: handleEnded,
    onPlay: () => setIsPlaying(true),
    onPause: () => setIsPlaying(false),
  }

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
              isVideo ? 'bg-red-500/20' : isAudio ? 'bg-purple-500/20' : isDocument ? 'bg-amber-500/20' : 'bg-blue-500/20'
            }`}>
              {isVideo && <Play size={18} className="text-red-400" />}
              {isAudio && <Headphones size={18} className="text-purple-400" />}
              {isDocument && <FileDown size={18} className="text-amber-400" />}
              {resource.type === 'article' && <FileText size={18} className="text-blue-400" />}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg leading-tight">{cleanTitle(resource.title)}</h3>
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
          className={`relative bg-black ${isVideo ? 'aspect-video' : isAudio ? '' : ''}`}
        >
          {isVideo && (
            <>
              <video
                ref={videoRef}
                {...sharedMediaProps}
                className="w-full h-full"
                playsInline
              />

              {/* Controls Overlay */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePlay}
                      className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                    </button>
                    <button
                      onClick={handleMute}
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <span className="text-white/80 text-sm font-medium ml-2">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  <button
                    onClick={handleFullscreen}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <Maximize2 size={18} />
                  </button>
                </div>
              </div>
            </>
          )}

          {isAudio && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-8">
              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                {...sharedMediaProps}
              />

              {/* Audio Visualization */}
              <div className="flex flex-col items-center py-6">
                <div
                  className={`w-24 h-24 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 ${isPlaying ? 'animate-pulse' : ''}`}
                >
                  <Headphones size={48} className="text-purple-400" />
                </div>
                <p className="text-white font-medium text-lg mb-1">{cleanTitle(resource.title)}</p>
                <p className="text-slate-400 text-sm mb-6">{formatTime(currentTime)} / {formatTime(duration)}</p>

                {/* Progress Bar */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  className="w-full max-w-md h-1 mb-4 bg-slate-600 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #A855F7 ${progress}%, #475569 ${progress}%)`
                  }}
                />

                {/* Controls */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePlay}
                    className="w-14 h-14 rounded-full bg-purple-500/20 hover:bg-purple-500/30 flex items-center justify-center text-white transition-colors"
                  >
                    {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-0.5" />}
                  </button>
                  <button
                    onClick={handleMute}
                    className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {isDocument && (
            <div className="bg-gradient-to-br from-slate-50 to-white">
              {isPdf ? (
                <iframe
                  src={resource.url}
                  className="w-full border-0"
                  style={{ height: '70vh' }}
                  title={cleanTitle(resource.title)}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 px-8">
                  <div className="w-20 h-20 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                    <FileDown size={40} className="text-amber-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{cleanTitle(resource.title)}</h3>
                  {resource.description && (
                    <p className="text-slate-500 text-sm mb-6 text-center max-w-md">{resource.description}</p>
                  )}
                  <div className="flex gap-3">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 text-white rounded-xl font-semibold hover:bg-amber-700 transition-colors"
                    >
                      <Download size={18} />
                      Download
                    </a>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-slate-200 text-slate-700 rounded-xl font-semibold hover:bg-slate-300 transition-colors"
                    >
                      <ExternalLink size={18} />
                      Open in new tab
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {resource.type === 'article' && (
            <div className="h-full overflow-y-auto p-8 bg-white">
              <article className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-900 mb-4">{cleanTitle(resource.title)}</h2>
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
