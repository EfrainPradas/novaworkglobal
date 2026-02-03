import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Brain, Calendar, TrendingUp, Heart, Target, MessageCircle, Star, Save, Sparkles, BarChart, ChevronRight, AlertCircle, CheckCircle, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface WeeklyReflection {
  id?: string
  user_id: string
  week_start_date: string
  accomplishments: string
  challenges: string
  lessons_learned: string
  mood_rating: number
  satisfaction_score: number
  completed_at?: string
  created_at?: string
}

interface WeeklyGoal {
  primary_goal: string
  secondary_goals: string[]
  focus_areas: string[]
  weekly_commitments: string[]
}

interface UserStats {
  current_streak: number
  total_weeks: number
  completion_rate: number
  recent_badges: any[]
}

const RATING_EMOJIS = {
  1: { emoji: '😔', label: 'Very Difficult', color: 'text-red-600' },
  2: { emoji: '😟', label: 'Difficult', color: 'text-red-500' },
  3: { emoji: '😕', label: 'Challenging', color: 'text-orange-600' },
  4: { emoji: '😐', label: 'Below Average', color: 'text-orange-500' },
  5: { emoji: '😑', label: 'Average', color: 'text-yellow-600' },
  6: { emoji: '😊', label: 'Good', color: 'text-green-500' },
  7: { emoji: '😃', label: 'Very Good', color: 'text-green-500' },
  8: { emoji: '😄', label: 'Great', color: 'text-green-600' },
  9: { emoji: '😁', label: 'Excellent', color: 'text-green-600' },
  10: { emoji: '🤩', label: 'Amazing', color: 'text-purple-600' }
}

const REFLECTION_PROMPTS = {
  accomplishments: [
    "What went really well this week?",
    "What are you most proud of accomplishing?",
    "Where did you exceed your expectations?",
    "What progress made you feel energized?"
  ],
  challenges: [
    "What obstacles did you face this week?",
    "What didn't go as planned?",
    "What drained your energy or motivation?",
    "Where did you feel stuck or frustrated?"
  ],
  lessons: [
    "What did you learn about yourself this week?",
    "What insights will change your approach next week?",
    "What patterns did you notice in your work/energy?",
    "What would you do differently next time?"
  ]
}

export default function FridayRitual() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentWeekGoals, setCurrentWeekGoals] = useState<WeeklyGoal | null>(null)
  const [currentReflection, setCurrentReflection] = useState<WeeklyReflection | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [randomPrompt, setRandomPrompt] = useState('')

  // Form state
  const [accomplishments, setAccomplishments] = useState('')
  const [challenges, setChallenges] = useState('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [moodRating, setMoodRating] = useState(7)
  const [satisfactionScore, setSatisfactionScore] = useState(7)

  useEffect(() => {
    checkUser()
    setRandomPrompts()
  }, [])

  const setRandomPrompts = () => {
    const randomAccomplishment = REFLECTION_PROMPTS.accomplishments[Math.floor(Math.random() * REFLECTION_PROMPTS.accomplishments.length)]
    setRandomPrompt(randomAccomplishment)
  }

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await loadCurrentWeekData(user.id)
      await loadUserStats(user.id)
    }
    setLoading(false)
  }

  const loadCurrentWeekData = async (userId: string) => {
    try {
      const monday = getMondayOfWeek()

      // Load current week goals
      const { data: goals, error: goalsError } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', monday)
        .single()

      if (goals && !goalsError) {
        setCurrentWeekGoals({
          primary_goal: goals.primary_goal,
          secondary_goals: goals.secondary_goals || [],
          focus_areas: goals.focus_areas || [],
          weekly_commitments: goals.weekly_commitments || []
        })
      }

      // Load existing reflection
      const { data: reflection, error: reflectionError } = await supabase
        .from('weekly_reflections')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', monday)
        .single()

      if (reflection && !reflectionError) {
        setCurrentReflection(reflection)
        setAccomplishments(reflection.accomplishments)
        setChallenges(reflection.challenges)
        setLessonsLearned(reflection.lessons_learned)
        setMoodRating(reflection.mood_rating)
        setSatisfactionScore(reflection.satisfaction_score)
      }
    } catch (error) {
      console.error('Error loading current week data:', error)
    }
  }

  const loadUserStats = async (userId: string) => {
    try {
      const response = await fetch(`/api/weekly-reinvention/user-stats`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      if (response.ok) {
        const stats = await response.json()
        setUserStats(stats)
      }
    } catch (error) {
      console.error('Error loading user stats:', error)
    }
  }

  const getMondayOfWeek = () => {
    const today = new Date()
    const monday = new Date(today)
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    monday.setDate(diff)
    return monday.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !accomplishments.trim() || !challenges.trim() || !lessonsLearned.trim()) {
      setMessage({ type: 'error', text: 'Please complete all reflection fields' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const weekStartDate = getMondayOfWeek()
      const token = (await supabase.auth.getSession()).data.session?.access_token

      const payload = {
        accomplishments: accomplishments.trim(),
        challenges: challenges.trim(),
        lessons_learned: lessonsLearned.trim(),
        mood_rating: moodRating,
        satisfaction_score: satisfactionScore,
        week_start_date: weekStartDate
      }

      const response = await fetch('/api/weekly-reinvention/friday-ritual/reflection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Your weekly reflection has been saved successfully!' })
        setCurrentReflection(result.data)

        // Show any badges earned
        if (result.badges_earned && result.badges_earned.length > 0) {
          setTimeout(() => {
            setMessage({
              type: 'success',
              text: `🎉 Badges earned: ${result.badges_earned.map((b: any) => b.name).join(', ')}`
            })
          }, 2000)
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save your reflection' })
      }
    } catch (error) {
      console.error('Error saving reflection:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving your reflection' })
    } finally {
      setSaving(false)
    }
  }

  const regeneratePrompt = () => {
    const allPrompts = [
      ...REFLECTION_PROMPTS.accomplishments,
      ...REFLECTION_PROMPTS.challenges,
      ...REFLECTION_PROMPTS.lessons
    ]
    const randomPrompt = allPrompts[Math.floor(Math.random() * allPrompts.length)]
    setRandomPrompt(randomPrompt)
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
          Please sign in to access the Weekly Reinvention features.
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your Friday Reflection...</p>
      </div>
    )
  }

  const isFriday = new Date().getDay() === 5
  const hasCompletedThisWeek = currentReflection !== null

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </button>
        </div>

        <div className="text-center">
          <div className="text-3xl mb-3">🧠</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Friday Reflection
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Reflect on your week and celebrate your progress
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Week of {new Date(getMondayOfWeek()).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* User Stats Banner */}
      {userStats && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {userStats.current_streak}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Week Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {userStats.total_weeks}
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Total Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                  {Math.round(userStats.completion_rate)}%
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400">Completion Rate</div>
              </div>
            </div>
            {userStats.recent_badges && userStats.recent_badges.length > 0 && (
              <div className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  {userStats.recent_badges.length} badges earned
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current Goals Summary */}
      {currentWeekGoals && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <Target className="h-5 w-5" />
            This Week's Goals
          </h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Primary Goal:</span>
              <p className="text-sm text-blue-600 dark:text-blue-400">{currentWeekGoals.primary_goal}</p>
            </div>
            {currentWeekGoals.weekly_commitments.length > 0 && (
              <div>
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Commitments:</span>
                <ul className="text-sm text-blue-600 dark:text-blue-400 list-disc list-inside">
                  {currentWeekGoals.weekly_commitments.map((commitment, index) => (
                    <li key={index}>{commitment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status */}
      {hasCompletedThisWeek && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Reflection Complete!</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've already completed your reflection for this week. You can update it if needed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-300'
            : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-300'
        }`}>
          <div className="flex items-center gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Inspiration Card */}
      <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h4 className="font-medium text-purple-900 dark:text-purple-200 mb-2">Reflection Prompt</h4>
            <p className="text-purple-700 dark:text-purple-300 mb-3">{randomPrompt}</p>
            <button
              onClick={regeneratePrompt}
              className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
            >
              🔄 Get another prompt
            </button>
          </div>
        </div>
      </div>

      {/* Friday Reflection Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Accomplishments */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              <Star className="inline h-5 w-5 mr-2 text-yellow-600" />
              Accomplishments & Wins
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              What went well this week? What are you proud of?
            </p>
            <textarea
              value={accomplishments}
              onChange={(e) => setAccomplishments(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              placeholder="Celebrate your progress, big or small..."
              required
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              <MessageCircle className="inline h-5 w-5 mr-2 text-orange-600" />
              Challenges & Obstacles
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              What difficulties did you face? What didn't go as planned?
            </p>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              placeholder="Be honest about the challenges - this helps you grow..."
              required
            />
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              <Brain className="inline h-5 w-5 mr-2 text-blue-600" />
              Lessons Learned
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              What insights did you gain? What will you do differently next week?
            </p>
            <textarea
              value={lessonsLearned}
              onChange={(e) => setLessonsLearned(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={4}
              placeholder="Extract the wisdom from your week's experiences..."
              required
            />
          </div>

          {/* Mood & Satisfaction Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mood Rating */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                <Heart className="inline h-5 w-5 mr-2 text-pink-600" />
                How did you feel this week?
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Mood Rating</span>
                  <span className={`text-sm font-medium ${RATING_EMOJIS[moodRating].color}`}>
                    {RATING_EMOJIS[moodRating].emoji} {RATING_EMOJIS[moodRating].label}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodRating}
                  onChange={(e) => setMoodRating(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>😔 Difficult</span>
                  <span>😊 Good</span>
                  <span>🤩 Amazing</span>
                </div>
              </div>
            </div>

            {/* Satisfaction Score */}
            <div>
              <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
                <TrendingUp className="inline h-5 w-5 mr-2 text-green-600" />
                How satisfied are you with your progress?
              </label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Satisfaction Score</span>
                  <span className={`text-sm font-medium ${RATING_EMOJIS[satisfactionScore].color}`}>
                    {RATING_EMOJIS[satisfactionScore].emoji} {RATING_EMOJIS[satisfactionScore].label}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={satisfactionScore}
                  onChange={(e) => setSatisfactionScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>😔 Not satisfied</span>
                  <span>😊 Satisfied</span>
                  <span>🤩 Very satisfied</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span>Complete Reflection</span>
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Navigation */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/weekly-reinvention/monday-ritual')}
            className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
          >
            ← Monday Ritual
          </button>
          <button
            onClick={() => navigate('/weekly-reinvention/progress')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Progress Dashboard →
          </button>
        </div>
      </div>

      {isFriday && !hasCompletedThisWeek && (
        <div className="text-center text-sm text-purple-600 dark:text-purple-400">
          🎉 Happy Friday! Perfect time to reflect on your week and celebrate your progress.
        </div>
      )}
    </div>
  )
}