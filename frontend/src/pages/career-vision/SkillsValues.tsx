/**
 * Skills & Interests Page (Career Vision)
 * Clean 2-circle version with INTERACTIVE hover tooltips
 * Shows skills/interests data when hovering over circles
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { X, Plus, Sparkles, Save, Loader2, ArrowLeft } from 'lucide-react'

export default function SkillsValues() {
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Form data (only 2 categories)
  const [skills, setSkills] = useState<string[]>([])
  const [interests, setInterests] = useState<string[]>([])

  // Input fields
  const [skillInput, setSkillInput] = useState('')
  const [interestInput, setInterestInput] = useState('')

  // AI Suggestions
  const [aiSuggestions, setAiSuggestions] = useState<{
    skills: string[]
    interests: string[]
  }>({
    skills: [],
    interests: []
  })

  // Load existing data from onboarding
  useEffect(() => {
    loadExistingData()
  }, [])

  const loadExistingData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      // Load skills from user_skills table (from onboarding)
      const { data: skillsData, error: skillsError } = await supabase
        .from('user_skills')
        .select('skill_name')
        .eq('user_id', user.id)

      if (skillsError) console.error('Error loading skills:', skillsError)

      // Load interests from user_interests table (from onboarding)
      const { data: interestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select('interest_name')
        .eq('user_id', user.id)

      if (interestsError) console.error('Error loading interests:', interestsError)

      // Pre-populate with onboarding data
      if (skillsData && skillsData.length > 0) {
        setSkills(skillsData.map(s => s.skill_name))
      }

      if (interestsData && interestsData.length > 0) {
        setInterests(interestsData.map(i => i.interest_name))
      }

      console.log('✅ Loaded from onboarding:', {
        skills: skillsData?.length || 0,
        interests: interestsData?.length || 0
      })
    } catch (error) {
      console.error('Error loading career vision data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Add item handlers
  const addSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()])
      setSkillInput('')
    }
  }

  const addInterest = () => {
    if (interestInput.trim() && !interests.includes(interestInput.trim())) {
      setInterests([...interests, interestInput.trim()])
      setInterestInput('')
    }
  }

  // Remove item handlers
  const removeSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill))
  }

  const removeInterest = (interest: string) => {
    setInterests(interests.filter(i => i !== interest))
  }

  // Add from AI suggestions
  const addFromSuggestion = (type: 'skills' | 'interests', item: string) => {
    if (type === 'skills' && !skills.includes(item)) {
      setSkills([...skills, item])
      setAiSuggestions({
        ...aiSuggestions,
        skills: aiSuggestions.skills.filter(s => s !== item)
      })
    } else if (type === 'interests' && !interests.includes(item)) {
      setInterests([...interests, item])
      setAiSuggestions({
        ...aiSuggestions,
        interests: aiSuggestions.interests.filter(i => i !== item)
      })
    }
  }

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setGenerating(true)
    try {
      // Use fallback static suggestions for now
      setAiSuggestions({
        skills: ['Problem Solving', 'Communication', 'Leadership', 'Strategic Thinking', 'Data Analysis', 'Project Management'].filter(s => !skills.includes(s)),
        interests: ['Technology', 'Learning', 'Mentoring', 'Process Improvement', 'Creative Solutions', 'Innovation'].filter(i => !interests.includes(i))
      })
    } catch (error) {
      console.error('Error generating AI suggestions:', error)
    } finally {
      setGenerating(false)
    }
  }

  // Calculate "Sweet Spot" - intersection of skills and interests
  const calculateSweetSpot = (): string[] => {
    const skillWords = skills.flatMap(s =>
      s.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    )
    const interestWords = interests.flatMap(i =>
      i.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    )

    const intersection = skillWords.filter(word =>
      interestWords.includes(word)
    )

    return [...new Set(intersection)] // Remove duplicates
  }

  // Save to database
  const handleSave = async () => {
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/signin')
        return
      }

      // Delete existing skills/interests
      await supabase.from('user_skills').delete().eq('user_id', user.id)
      await supabase.from('user_interests').delete().eq('user_id', user.id)

      // Insert new skills
      if (skills.length > 0) {
        const skillsData = skills.map(skill => ({
          user_id: user.id,
          skill_name: skill,
          source: 'career_vision'
        }))

        const { error: skillsError } = await supabase
          .from('user_skills')
          .insert(skillsData)

        if (skillsError) throw skillsError
      }

      // Insert new interests
      if (interests.length > 0) {
        const interestsData = interests.map(interest => ({
          user_id: user.id,
          interest_name: interest,
          source: 'career_vision'
        }))

        const { error: interestsError } = await supabase
          .from('user_interests')
          .insert(interestsData)

        if (interestsError) throw interestsError
      }

      alert('✅ Your skills and interests have been saved!')
      navigate('/career-vision/preferences')
    } catch (error) {
      console.error('Error saving career vision data:', error)
      alert('❌ Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // Key press handlers
  const handleSkillKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  const handleInterestKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addInterest()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  const isComplete = skills.length >= 3 && interests.length >= 3
  const sweetSpot = calculateSweetSpot()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/career-vision/dashboard')}
            className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium mb-4 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Career Vision
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 Skills & Interests
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Identify what you're good at and what excites you
          </p>
        </div>

        {/* Main Content Grid - 2 Columns */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Skills Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400 mb-3">
              💪 Skills & Knowledge
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              What are you really good at? What expertise do you have?
            </p>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={handleSkillKeyPress}
                placeholder="e.g., Project Management"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 options-none"
              />
              <button
                onClick={addSkill}
                disabled={!skillInput.trim()}
                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[150px]">
              {skills.map((skill, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-200 dark:border-blue-800"
                >
                  {skill}
                  <button
                    onClick={() => removeSkill(skill)}
                    className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Count */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {skills.length} skill{skills.length !== 1 ? 's' : ''} added (min. 3 recommended)
            </p>
          </div>

          {/* Interests Section */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 transition-colors">
            <h2 className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-3">
              ❤️ Interests & Passions
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              What genuinely excites you? What could you do for hours?
            </p>

            {/* Input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                onKeyPress={handleInterestKeyPress}
                placeholder="e.g., Data Visualization"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 outline-none"
              />
              <button
                onClick={addInterest}
                disabled={!interestInput.trim()}
                className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4 min-h-[150px]">
              {interests.map((interest, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium border border-purple-200 dark:border-purple-800"
                >
                  {interest}
                  <button
                    onClick={() => removeInterest(interest)}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Count */}
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {interests.length} interest{interests.length !== 1 ? 's' : ''} added (min. 3 recommended)
            </p>
          </div>
        </div>

        {/* AI Suggestions Section */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl shadow-lg p-6 mb-8 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                AI-Powered Suggestions
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get personalized suggestions to expand your profile
              </p>
            </div>
            <button
              onClick={generateAISuggestions}
              disabled={generating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Suggestions
                </>
              )}
            </button>
          </div>

          {/* AI Suggestions Display */}
          {(aiSuggestions.skills.length > 0 || aiSuggestions.interests.length > 0) && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Skills Suggestions */}
              {aiSuggestions.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-2">💡 SKILLS SUGGESTIONS</p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.skills.map((skill, index) => (
                      <button
                        key={index}
                        onClick={() => addFromSuggestion('skills', skill)}
                        className="px-3 py-1 bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:border-blue-400 transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Interests Suggestions */}
              {aiSuggestions.interests.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mb-2">💡 INTERESTS SUGGESTIONS</p>
                  <div className="flex flex-wrap gap-2">
                    {aiSuggestions.interests.map((interest, index) => (
                      <button
                        key={index}
                        onClick={() => addFromSuggestion('interests', interest)}
                        className="px-3 py-1 bg-white dark:bg-gray-800 border-2 border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 rounded-full text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:border-purple-400 transition-colors"
                      >
                        + {interest}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive 2-Circle Venn Diagram with Hover Tooltips */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-8 relative border border-gray-100 dark:border-gray-700 transition-colors">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Your Career Sweet Spot
          </h3>

          <div className="flex items-center justify-center mb-6">
            <div className="relative w-full max-w-lg">
              <div className="relative" style={{ paddingBottom: '66.67%' }}>
                <svg viewBox="0 0 400 300" className="absolute inset-0 w-full h-full">
                  <defs>
                    {/* Premium Gradients */}
                    <linearGradient id="skillsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#3B82F6', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#60A5FA', stopOpacity: 0.3 }} />
                    </linearGradient>
                    <linearGradient id="interestsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#A855F7', stopOpacity: 0.2 }} />
                      <stop offset="100%" style={{ stopColor: '#C084FC', stopOpacity: 0.3 }} />
                    </linearGradient>
                    <linearGradient id="sweetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{ stopColor: '#22C55E', stopOpacity: 0.4 }} />
                      <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 0.5 }} />
                    </linearGradient>
                  </defs>

                  {/* Skills Circle (Left) - Interactive Group */}
                  <g className="group cursor-pointer transition-all duration-300">
                    <circle
                      cx="140"
                      cy="150"
                      r="110"
                      fill="url(#skillsGrad)"
                      stroke="#3B82F6"
                      strokeWidth="3"
                      className="transition-all duration-300 group-hover:stroke-[5]"
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(59, 130, 246, 0.2))' }}
                    />
                    <text x="85" y="115" fill="#3B82F6" fontSize="16" fontWeight="bold" className="pointer-events-none">
                      Skills
                    </text>
                    <text x="95" y="138" fill="#3B82F6" fontSize="14" className="pointer-events-none">
                      ({skills.length})
                    </text>

                    {/* Tooltip - Skills */}
                    <foreignObject x="20" y="170" width="160" height="140" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-2xl p-2 border-2 border-blue-400">
                        <p className="text-[10px] font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                          <span>💪</span> Skills:
                        </p>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {skills.slice(0, 5).map((skill, idx) => (
                            <div key={idx} className="text-[9px] text-gray-700 dark:text-gray-200 flex items-center gap-1">
                              <span className="w-1 h-1 bg-blue-500 rounded-full flex-shrink-0"></span>
                              <span className="line-clamp-1">{skill}</span>
                            </div>
                          ))}
                          {skills.length > 5 && (
                            <p className="text-[9px] text-blue-600 dark:text-blue-400 font-bold mt-1">+{skills.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    </foreignObject>
                  </g>

                  {/* Interests Circle (Right) - Interactive Group */}
                  <g className="group cursor-pointer transition-all duration-300">
                    <circle
                      cx="260"
                      cy="150"
                      r="110"
                      fill="url(#interestsGrad)"
                      stroke="#A855F7"
                      strokeWidth="3"
                      className="transition-all duration-300 group-hover:stroke-[5]"
                      style={{ filter: 'drop-shadow(0 4px 6px rgba(168, 85, 247, 0.2))' }}
                    />
                    <text x="230" y="115" fill="#A855F7" fontSize="16" fontWeight="bold" className="pointer-events-none">
                      Interests
                    </text>
                    <text x="245" y="138" fill="#A855F7" fontSize="14" className="pointer-events-none">
                      ({interests.length})
                    </text>

                    {/* Tooltip - Interests */}
                    <foreignObject x="220" y="170" width="160" height="140" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="bg-white dark:bg-gray-700 rounded-lg shadow-2xl p-2 border-2 border-purple-400">
                        <p className="text-[10px] font-bold text-purple-700 dark:text-purple-300 mb-1 flex items-center gap-1">
                          <span>❤️</span> Interests:
                        </p>
                        <div className="max-h-24 overflow-y-auto space-y-1">
                          {interests.slice(0, 5).map((interest, idx) => (
                            <div key={idx} className="text-[9px] text-gray-700 dark:text-gray-200 flex items-center gap-1">
                              <span className="w-1 h-1 bg-purple-500 rounded-full flex-shrink-0"></span>
                              <span className="line-clamp-1">{interest}</span>
                            </div>
                          ))}
                          {interests.length > 5 && (
                            <p className="text-[9px] text-purple-600 dark:text-purple-400 font-bold mt-1">+{interests.length - 5} more</p>
                          )}
                        </div>
                      </div>
                    </foreignObject>
                  </g>

                  {/* Center Sweet Spot - Interactive  */}
                  {isComplete && sweetSpot.length > 0 && (
                    <g className="group cursor-pointer">
                      <ellipse
                        cx="200"
                        cy="150"
                        rx="50"
                        ry="60"
                        fill="url(#sweetGrad)"
                        stroke="#22C55E"
                        strokeWidth="4"
                        className="transition-all duration-300 group-hover:stroke-[6] animate-pulse"
                        style={{ filter: 'drop-shadow(0 6px 12px rgba(34, 197, 94, 0.3))' }}
                      />
                      <text x="200" y="157" fill="#16A34A" fontSize="28" textAnchor="middle" fontWeight="bold" className="pointer-events-none">
                        ❤️
                      </text>

                      {/* Tooltip - Sweet Spot */}
                      <foreignObject x="120" y="60" width="160" height="80" className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/80 dark:to-emerald-900/80 rounded-lg shadow-2xl p-2 border-2 border-green-500">
                          <p className="text-[10px] font-bold text-green-700 dark:text-green-300 mb-1 flex items-center gap-1">
                            <span>✨</span> Sweet Spot:
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {sweetSpot.slice(0, 4).map((word, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 rounded-full text-[9px] font-bold border border-green-400 dark:border-green-700">
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  )}
                </svg>
              </div>
            </div>
          </div>

          {/* Sweet Spot Words Section - Enhanced */}
          {sweetSpot.length > 0 && (
            <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 border-2 border-green-300 dark:border-green-800 rounded-lg p-3 mb-3 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✨</span>
                <p className="text-sm font-bold text-green-700 dark:text-green-400">Sweet Spot:</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {sweetSpot.map((word, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 rounded-full text-xs font-bold border border-green-400 dark:border-green-700 hover:shadow-md hover:scale-105 transition-all duration-200 cursor-default"
                  >
                    {word}
                  </span>
                ))}
              </div>
              <p className="text-xs text-green-600 dark:text-green-500 mt-2 italic">
                💡 Careers here are most fulfilling!
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span className="font-semibold">🖱️ Hover over each circle</span> to see your detailed data
            </p>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {isComplete ? (
                <span className="text-green-600 dark:text-green-400 font-semibold flex items-center justify-center gap-2">
                  <span className="text-xl">🎉</span>
                  Great! You've identified where your skills and interests overlap!
                </span>
              ) : (
                <span>
                  Add at least 3 items to each category to discover where they intersect.
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/career-vision/dashboard')}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={saving || !isComplete}
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save & Continue
              </>
            )}
          </button>
        </div>

        {!isComplete && (
          <p className="text-center text-sm text-orange-600 dark:text-orange-400 mt-4">
            ⚠️ Please add at least 3 items to each category before saving
          </p>
        )}
      </div>
    </div>
  )
}
