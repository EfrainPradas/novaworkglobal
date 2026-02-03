
import React, { useState } from 'react'
import { ArrowRight, Briefcase, Map, Compass, Layers } from 'lucide-react'

interface CareerOrientationProps {
    onNext: () => void
}

export default function CareerOrientation({ onNext }: CareerOrientationProps) {
    return (
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Understanding Your Career Ecosystem</h2>
                <p className="text-xl text-gray-600">Before we dive into your profile, let's clarify the playing field.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
                <div className="bg-white border-l-4 border-blue-500 shadow-sm rounded-r-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Briefcase className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">The Role</h3>
                            <p className="text-gray-600 mb-4">
                                What you do day-to-day. The specific tasks, responsibilities, and skills required to solve problems.
                            </p>
                            <div className="text-sm bg-gray-50 p-3 rounded text-gray-700">
                                <strong>Example:</strong> Product Manager, Software Engineer, Data Analyst
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-xl p-6">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-indigo-100 rounded-lg">
                            <Layers className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">The Industry</h3>
                            <p className="text-gray-600 mb-4">
                                The context in which you work. The problems you are solving and the market dynamics.
                            </p>
                            <div className="text-sm bg-gray-50 p-3 rounded text-gray-700">
                                <strong>Example:</strong> FinTech, HealthCare, E-commerce
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white border-l-4 border-purple-500 shadow-sm rounded-r-xl p-6 md:col-span-2">
                    <div className="flex items-start gap-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Compass className="w-6 h-6 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">The Trajectory (Career Path)</h3>
                            <p className="text-gray-600 mb-4">
                                The direction you are heading. Are you becoming a specialist? A leader? An entrepreneur? This is about growth over time.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl p-8 mb-10">
                <div className="flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-xl font-bold mb-2">Ready to define yours?</h3>
                        <p className="text-gray-300">
                            In the next steps, we will build your unique profile by analyzing your Skills, Interests, and Values.
                        </p>
                    </div>
                    <button
                        onClick={onNext}
                        className="px-8 py-3 bg-white text-gray-900 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                        Build My Profile
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    )
}
