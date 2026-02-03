
import React, { useState } from 'react'
import { Play, CheckCircle, Lock, ArrowRight, Video } from 'lucide-react'

interface OrientationVideosProps {
    onNext: () => void
}

const VIDEOS = [
    {
        id: 1,
        title: "The New World of Work",
        duration: "2:30",
        description: "Understanding how the job market has evolved and what it means for you.",
        thumbnail: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 2,
        title: "Career vs. Job",
        duration: "3:15",
        description: "Why building a career is different from just finding a job.",
        thumbnail: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80"
    },
    {
        id: 3,
        title: "Navigating the Platform",
        duration: "1:45",
        description: "A quick tour of the tools available to you in NovaWork Global.",
        thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80"
    }
]

export default function OrientationVideos({ onNext }: OrientationVideosProps) {
    const [activeVideo, setActiveVideo] = useState(0)
    const [completedVideos, setCompletedVideos] = useState<number[]>([])

    const handleVideoComplete = (index: number) => {
        if (!completedVideos.includes(index)) {
            setCompletedVideos([...completedVideos, index])
        }
    }

    // Auto-complete simulation for demo purposes
    const simulateVideoWatch = () => {
        handleVideoComplete(activeVideo)
        if (activeVideo < VIDEOS.length - 1) {
            setActiveVideo(activeVideo + 1)
        }
    }

    const allVideosCompleted = completedVideos.length === VIDEOS.length

    return (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Program Orientation</h2>
                <p className="text-gray-600">Please watch these short introductory videos to unlock the next step.</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Video Player Area */}
                <div className="lg:col-span-2">
                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative group">
                        {/* Playlist UI simulation */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                            <Video className="w-16 h-16 mb-4 opacity-50" />
                            <h3 className="text-xl font-medium mb-2">{VIDEOS[activeVideo].title}</h3>
                            <button
                                onClick={simulateVideoWatch}
                                className="px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center gap-2 transition-all border border-white/50"
                            >
                                <Play className="w-4 h-4 fill-white" />
                                Play Video
                            </button>
                        </div>
                        <div className="absolute bottom-4 right-4 bg-black/70 px-3 py-1 rounded text-white text-xs">
                            {VIDEOS[activeVideo].duration}
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-lg font-semibold text-gray-900">{VIDEOS[activeVideo].title}</h3>
                        <p className="text-gray-600 mt-1">{VIDEOS[activeVideo].description}</p>
                    </div>
                </div>

                {/* Playlist Sidebar */}
                <div className="space-y-4">
                    {VIDEOS.map((video, index) => {
                        const isActive = index === activeVideo
                        const isCompleted = completedVideos.includes(index)
                        const isLocked = !isCompleted && index !== activeVideo && index > Math.max(...completedVideos, -1) + 1

                        return (
                            <div
                                key={video.id}
                                onClick={() => {
                                    if (!isLocked) setActiveVideo(index)
                                }}
                                className={`p-4 rounded-xl border transition-all cursor-pointer ${isActive
                                    ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-500'
                                    : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                                    } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        Video {index + 1}
                                    </span>
                                    {isCompleted && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {isLocked && <Lock className="w-4 h-4 text-gray-400" />}
                                </div>
                                <h4 className={`font-medium mb-1 ${isActive ? 'text-primary-900' : 'text-gray-900'}`}>
                                    {video.title}
                                </h4>
                                <p className="text-xs text-gray-500">{video.duration}</p>
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="mt-12 flex justify-end">
                <button
                    onClick={onNext}
                    disabled={!allVideosCompleted}
                    className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${allVideosCompleted
                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    Continue to Orientation
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
