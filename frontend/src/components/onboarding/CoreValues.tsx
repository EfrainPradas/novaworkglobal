import { useState } from 'react'
import { ArrowRight, ArrowLeft, Heart, CheckCircle, Play } from 'lucide-react'

interface CoreValuesProps {
    onNext: (data: { values: string[], reasoning: string }) => void
    onBack: () => void
    initialData?: { values: string[], reasoning: string }
}

const CORE_VALUES = [
    { id: 'autonomy', label: 'Autonomy', description: 'Freedom to make your own decisions' },
    { id: 'impact', label: 'Social Impact', description: 'Making a difference in the world' },
    { id: 'growth', label: 'Growth', description: 'Continuous learning and development' },
    { id: 'balance', label: 'Work-Life Balance', description: 'Time for personal life and family' },
    { id: 'security', label: 'Job Security', description: 'Stable and predictable employment' },
    { id: 'creativity', label: 'Creativity', description: 'Freedom to innovate and express ideas' },
    { id: 'collaboration', label: 'Collaboration', description: 'Working closely with others' },
    { id: 'recognition', label: 'Recognition', description: 'Being acknowledged for your work' },
    { id: 'compensation', label: 'Compensation', description: 'Competitive salary and benefits' },
    { id: 'purpose', label: 'Purpose', description: 'Work that aligns with your beliefs' },
    { id: 'challenge', label: 'Challenge', description: 'Solving complex problems' },
    { id: 'flexibility', label: 'Flexibility', description: 'Control over when and where you work' },
]

export default function CoreValues({ onNext, onBack, initialData }: CoreValuesProps) {
    const [selectedValues, setSelectedValues] = useState<string[]>(initialData?.values || [])
    const [showVideo, setShowVideo] = useState(false)
    const [reasoning, setReasoning] = useState(initialData?.reasoning || '')

    const toggleValue = (valueId: string) => {
        if (selectedValues.includes(valueId)) {
            setSelectedValues(selectedValues.filter(v => v !== valueId))
        } else if (selectedValues.length < 5) {
            setSelectedValues([...selectedValues, valueId])
        }
    }

    const handleSubmit = () => {
        if (selectedValues.length >= 3) {
            onNext({ values: selectedValues, reasoning })
        }
    }

    const canProceed = selectedValues.length >= 3

    return (
        <div className="max-w-4xl mx-auto">
            {!showVideo ? (
                <>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Core Values</h2>
                        <p className="text-gray-600 mb-4">What truly matters to you in your career?</p>

                        <button
                            onClick={() => setShowVideo(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                            <Play className="w-4 h-4" />
                            Watch: Why Values Matter (2 min)
                        </button>
                    </div>

                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 mb-8 border border-amber-200">
                        <div className="flex items-start gap-3">
                            <Heart className="w-6 h-6 text-amber-600 mt-1" />
                            <div>
                                <h3 className="font-semibold text-gray-900 mb-2">Why This Matters</h3>
                                <p className="text-sm text-gray-700">
                                    Your core values guide your career decisions. When your work aligns with your values,
                                    you experience greater satisfaction and avoid burnout. Select 3-5 values that are most important to you.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Values Grid */}
                    <div className="grid md:grid-cols-2 gap-4 mb-8">
                        {CORE_VALUES.map(value => {
                            const isSelected = selectedValues.includes(value.id)
                            return (
                                <button
                                    key={value.id}
                                    onClick={() => toggleValue(value.id)}
                                    disabled={!isSelected && selectedValues.length >= 5}
                                    className={`text-left p-4 rounded-xl border-2 transition-all ${isSelected
                                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                        } ${!isSelected && selectedValues.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <h4 className="font-semibold text-gray-900">{value.label}</h4>
                                        {isSelected && (
                                            <CheckCircle className="w-5 h-5 text-primary-600" />
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600">{value.description}</p>
                                </button>
                            )
                        })}
                    </div>

                    <p className="text-sm text-gray-600 mb-6 text-center">
                        Selected: <strong>{selectedValues.length}</strong> / Min: 3 / Max: 5
                    </p>

                    {/* Optional: Why these values? */}
                    {selectedValues.length >= 3 && (
                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Why are these values important to you? (Optional)
                            </label>
                            <textarea
                                value={reasoning}
                                onChange={(e) => setReasoning(e.target.value)}
                                placeholder="E.g., 'I value autonomy because I work best when I can make my own decisions...'"
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="flex justify-between">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-medium flex items-center gap-2"
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canProceed}
                            className={`px-8 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all ${canProceed
                                ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-lg'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Continue
                            <ArrowRight className="w-5 h-5" />
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center">
                    <div className="bg-gray-900 rounded-xl aspect-video mb-6 relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-white">
                                <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg">Video: Why Career Values Matter</p>
                                <p className="text-sm text-gray-400 mt-2">Duration: 2:15</p>
                            </div>
                        </div>
                        <img
                            src="https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
                            alt="Values"
                            className="w-full h-full object-cover opacity-40"
                        />
                    </div>
                    <button
                        onClick={() => setShowVideo(false)}
                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                    >
                        Continue to Selection
                    </button>
                </div>
            )}
        </div>
    )
}
