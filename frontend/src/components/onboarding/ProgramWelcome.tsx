
import React from 'react'
import { Play, ArrowRight, BookOpen, Target, Map } from 'lucide-react'

interface ProgramWelcomeProps {
  onNext: () => void
}

export default function ProgramWelcome({ onNext }: ProgramWelcomeProps) {
  return (
    <div className="max-w-3xl mx-auto">
      {/* Video Section */}
      <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden mb-8 shadow-lg group cursor-pointer">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-medium text-lg">Introduction to NovaWork Global</p>
          <p className="text-gray-300 text-sm">Discover how to navigate your career journey</p>
        </div>
        {/* Placeholder for actual video embed */}
        <img
          src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
          alt="Program Introduction"
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      <div className="space-y-6 text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome to Your Career Transformation
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We've redesigned the career discovery process to put <strong>Context Before Action</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 bg-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-shadow cursor-pointer">
          <Target className="w-8 h-8 text-blue-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Build Resume</h3>
          <p className="text-sm text-gray-600 mb-4">
            Focus on building a strong resume foundation.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Resume Builder Access</li>
            <li>• 0 Free Consultations</li>
          </ul>
        </div>

        <div className="p-6 bg-purple-50 rounded-xl border border-purple-100 hover:shadow-md transition-shadow cursor-pointer">
          <BookOpen className="w-8 h-8 text-purple-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Reinvention</h3>
          <p className="text-sm text-gray-600 mb-4">
            For career changers and comprehensive job search.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Resume Tracker & Job Search</li>
            <li>• 0 Free Consultations (Paid options available)</li>
          </ul>
        </div>

        <div className="p-6 bg-teal-50 rounded-xl border border-teal-100 hover:shadow-md transition-shadow cursor-pointer">
          <Map className="w-8 h-8 text-teal-600 mb-4" />
          <h3 className="font-semibold text-gray-900 mb-2">Recién Graduados</h3>
          <p className="text-sm text-gray-600 mb-4">
            Launch your career with full executive support.
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• All Options Included</li>
            <li>• 1 Free Consultation (45 min)</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-center">
        <button
          onClick={onNext}
          className="px-8 py-4 bg-primary-600 text-white text-lg font-semibold rounded-xl hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl flex items-center gap-3"
        >
          Start My Career Journey
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
