import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'

export interface GuideStep {
    target?: string // CSS selector to highlight (optional)
    title: string
    content: string
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
}

interface VisualGuideProps {
    steps: GuideStep[]
    isVisible: boolean
    onClose: () => void
    guideId: string // Unique ID to track if user has seen it
}

export default function VisualGuide({ steps, isVisible, onClose, guideId }: VisualGuideProps) {
    const [currentStep, setCurrentStep] = useState(0)

    // Reset step when opened
    useEffect(() => {
        if (isVisible) {
            setCurrentStep(0)
        }
    }, [isVisible])

    if (!isVisible) return null

    const step = steps[currentStep]
    const isLastStep = currentStep === steps.length - 1

    const handleNext = () => {
        if (isLastStep) {
            // Save completion to local storage (simple persistence)
            localStorage.setItem(`guide_seen_${guideId}`, 'true')
            onClose()
        } else {
            setCurrentStep(prev => prev + 1)
        }
    }

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(prev => prev - 1)
        }
    }

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity" onClick={onClose} />

            {/* Guide Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 pointer-events-auto mx-4 animate-in fade-in zoom-in duration-200">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Progress Dots */}
                <div className="flex gap-2 mb-6 justify-center">
                    {steps.map((_, idx) => (
                        <div
                            key={idx}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-indigo-600' : 'w-2 bg-gray-200'
                                }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold text-lg">{currentStep + 1}</span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                        {step.content}
                    </p>
                    {step.target && (
                        <div className="mt-4 text-xs font-mono text-gray-400 bg-gray-50 p-2 rounded border border-gray-100 inline-block">
                            Target: {step.target}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between mt-auto">
                    <button
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                        className={`flex items-center gap-1 text-sm font-medium ${currentStep === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:text-gray-900'
                            }`}
                    >
                        <ChevronLeft className="w-4 h-4" /> Back
                    </button>

                    <button
                        onClick={handleNext}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                    >
                        {isLastStep ? 'Finish' : 'Next Step'}
                        {!isLastStep && <ChevronRight className="w-4 h-4" />}
                    </button>
                </div>
            </div>
        </div>
    )
}
