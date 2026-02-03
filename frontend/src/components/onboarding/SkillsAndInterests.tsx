import { useState, useMemo } from 'react'
import { ArrowRight, ArrowLeft, Lightbulb, Target, Plus, X, Sparkles } from 'lucide-react'

interface SkillsAndInterestsProps {
    onNext: (data: { skills: string[], interests: string[] }) => void
    onBack: () => void
    initialData?: { skills: string[], interests: string[] }
}

// Skills grouped by category for contextual suggestions
const SKILL_CATEGORIES: Record<string, string[]> = {
    'Technical': ['Python', 'JavaScript', 'SQL', 'Data Analysis', 'Machine Learning', 'Cloud Computing', 'API Development'],
    'Management': ['Project Management', 'Agile Methodologies', 'Team Leadership', 'Stakeholder Management', 'Strategic Planning', 'Budgeting'],
    'Communication': ['Technical Writing', 'Presentation Skills', 'Client Relations', 'Negotiation', 'Public Speaking'],
    'Analytical': ['Data Analysis', 'Problem Solving', 'Critical Thinking', 'Research', 'Financial Analysis', 'Process Improvement'],
    'Creative': ['Design Thinking', 'UX Design', 'Content Creation', 'Brand Strategy', 'Innovation'],
    'Soft Skills': ['Communication', 'Leadership', 'Team Collaboration', 'Time Management', 'Adaptability', 'Emotional Intelligence']
}

// Interests grouped by category
const INTEREST_CATEGORIES: Record<string, string[]> = {
    'Technology': ['AI & Machine Learning', 'Web Development', 'Cybersecurity', 'Blockchain', 'IoT', 'Data Science'],
    'Business': ['Entrepreneurship', 'Consulting', 'Finance', 'Marketing', 'Sales', 'Operations'],
    'People': ['People Development', 'Coaching', 'Education', 'HR', 'Team Building', 'Community Building'],
    'Impact': ['Sustainability', 'Social Impact', 'Healthcare', 'Non-profit', 'Environment', 'DEI'],
    'Creative': ['Design', 'Content Creation', 'Innovation', 'Arts', 'Media', 'Storytelling'],
    'Strategy': ['Strategic Planning', 'Product Strategy', 'Market Research', 'Competitive Analysis', 'Growth']
}

// Get contextual suggestions based on what's already selected
function getContextualSuggestions(selected: string[], categories: Record<string, string[]>): string[] {
    if (selected.length === 0) {
        // Return diverse initial suggestions from different categories
        const categoryNames = Object.keys(categories)
        return categoryNames.flatMap(cat => categories[cat].slice(0, 2)).slice(0, 8)
    }

    // Find which categories the selected items belong to
    const selectedCategories = new Set<string>()
    const selectedLower = selected.map(s => s.toLowerCase())

    Object.entries(categories).forEach(([category, items]) => {
        items.forEach(item => {
            if (selectedLower.some(s => item.toLowerCase().includes(s) || s.includes(item.toLowerCase()))) {
                selectedCategories.add(category)
            }
        })
    })

    // Prioritize items from related categories
    const suggestions: string[] = []

    // First: add items from the same categories as selected
    selectedCategories.forEach(category => {
        const categoryItems = categories[category].filter(item =>
            !selected.some(s => s.toLowerCase() === item.toLowerCase())
        )
        suggestions.push(...categoryItems.slice(0, 3))
    })

    // Then: add diverse items from other categories
    Object.entries(categories).forEach(([category, items]) => {
        if (!selectedCategories.has(category)) {
            const categoryItems = items.filter(item =>
                !selected.some(s => s.toLowerCase() === item.toLowerCase())
            )
            suggestions.push(...categoryItems.slice(0, 1))
        }
    })

    // Remove duplicates and already selected items
    return [...new Set(suggestions)].filter(s =>
        !selected.some(sel => sel.toLowerCase() === s.toLowerCase())
    ).slice(0, 8)
}

export default function SkillsAndInterests({ onNext, onBack, initialData }: SkillsAndInterestsProps) {
    const [skills, setSkills] = useState<string[]>(initialData?.skills || [])
    const [interests, setInterests] = useState<string[]>(initialData?.interests || [])
    const [skillInput, setSkillInput] = useState('')
    const [interestInput, setInterestInput] = useState('')
    const [showAISuggestions, setShowAISuggestions] = useState(true) // Show by default

    // Compute contextual suggestions based on current selections
    const skillSuggestions = useMemo(() =>
        getContextualSuggestions(skills, SKILL_CATEGORIES), [skills])

    const interestSuggestions = useMemo(() =>
        getContextualSuggestions(interests, INTEREST_CATEGORIES), [interests])

    const handleAddSkill = (skill: string) => {
        const trimmed = skill.trim()
        if (trimmed && !skills.includes(trimmed)) {
            setSkills([...skills, trimmed])
            setSkillInput('')
        }
    }

    const handleAddInterest = (interest: string) => {
        const trimmed = interest.trim()
        if (trimmed && !interests.includes(trimmed)) {
            setInterests([...interests, trimmed])
            setInterestInput('')
        }
    }

    const handleRemoveSkill = (skill: string) => {
        setSkills(skills.filter(s => s !== skill))
    }

    const handleRemoveInterest = (interest: string) => {
        setInterests(interests.filter(i => i !== interest))
    }

    const handleSubmit = () => {
        if (skills.length >= 3 && interests.length >= 3) {
            onNext({ skills, interests })
        }
    }

    const getIntersection = () => {
        // Simple matching: look for common words
        const skillWords = skills.join(' ').toLowerCase().split(' ')
        const interestWords = interests.join(' ').toLowerCase().split(' ')
        return skillWords.filter(word => interestWords.includes(word) && word.length > 3)
    }

    const intersection = getIntersection()
    const canProceed = skills.length >= 3 && interests.length >= 3

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Your Skills & Interests</h2>
                <p className="text-gray-600">Let's discover where your abilities meet your passions</p>
            </div>

            {/* AI Suggestion Toggle */}
            <div className="mb-6 text-center">
                <button
                    onClick={() => setShowAISuggestions(!showAISuggestions)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                >
                    <Sparkles className="w-4 h-4" />
                    {showAISuggestions ? 'Hide' : 'Show'} AI Suggestions
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
                {/* Skills Circle */}
                <div className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Target className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">Skills & Knowledge</h3>
                            <p className="text-sm text-gray-600">What are you good at?</p>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(skillInput)}
                                placeholder="Type a skill and press Enter"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <button
                                onClick={() => handleAddSkill(skillInput)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    {showAISuggestions && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Suggestions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {skillSuggestions.slice(0, 6).map((skill: string) => (
                                    <button
                                        key={skill}
                                        onClick={() => handleAddSkill(skill)}
                                        className="px-3 py-1 bg-white text-blue-700 text-xs rounded-full border border-blue-200 hover:bg-blue-50 transition-colors"
                                    >
                                        + {skill}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Skills */}
                    <div className="flex flex-wrap gap-2">
                        {skills.map(skill => (
                            <span
                                key={skill}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-full text-sm"
                            >
                                {skill}
                                <button onClick={() => handleRemoveSkill(skill)} className="hover:bg-blue-700 rounded-full p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-4">Added: {skills.length} / Min: 3</p>
                </div>

                {/* Interests Circle */}
                <div className="bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <Lightbulb className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900">Interests & Passions</h3>
                            <p className="text-sm text-gray-600">What excites you?</p>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="mb-4">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={interestInput}
                                onChange={(e) => setInterestInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleAddInterest(interestInput)}
                                placeholder="Type an interest and press Enter"
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                            />
                            <button
                                onClick={() => handleAddInterest(interestInput)}
                                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* AI Suggestions */}
                    {showAISuggestions && (
                        <div className="mb-4">
                            <p className="text-xs text-gray-600 mb-2 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                AI Suggestions:
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {interestSuggestions.slice(0, 6).map((interest: string) => (
                                    <button
                                        key={interest}
                                        onClick={() => handleAddInterest(interest)}
                                        className="px-3 py-1 bg-white text-emerald-700 text-xs rounded-full border border-emerald-200 hover:bg-emerald-50 transition-colors"
                                    >
                                        + {interest}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Selected Interests */}
                    <div className="flex flex-wrap gap-2">
                        {interests.map(interest => (
                            <span
                                key={interest}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-600 text-white rounded-full text-sm"
                            >
                                {interest}
                                <button onClick={() => handleRemoveInterest(interest)} className="hover:bg-emerald-700 rounded-full p-0.5">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>

                    <p className="text-xs text-gray-500 mt-4">Added: {interests.length} / Min: 3</p>
                </div>
            </div>

            {/* Intersection Highlight */}
            {intersection.length > 0 && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-8 border border-purple-200">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-xl">❤️</span>
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900">Your Sweet Spot</h4>
                            <p className="text-sm text-gray-600">Where your skills meet your interests</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {intersection.map(word => (
                            <span key={word} className="px-3 py-1 bg-white text-purple-700 rounded-full text-sm font-medium border border-purple-200">
                                {word}
                            </span>
                        ))}
                    </div>
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
                    Continue to Values
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>
        </div>
    )
}
