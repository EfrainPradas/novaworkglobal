import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Target, Calendar, TrendingUp, Award, Plus, X, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface WeeklyGoal {
  id?: string
  primary_goal: string
  secondary_goals: string[]
  focus_areas: string[]
  weekly_commitments: string[]
  week_start_date: string
  status: string
}

interface UserStats {
  current_streak: number
  total_weeks: number
  completion_rate: number
  recent_badges: any[]
}

const focusAreaOptions = [
  'Career Growth', 'Health & Wellness', 'Relationships', 'Learning & Development',
  'Financial Goals', 'Personal Projects', 'Networking', 'Work-Life Balance'
]

export default function MondayRitual() {
  const navigate = useNavigate()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [currentWeekGoals, setCurrentWeekGoals] = useState<WeeklyGoal | null>(null)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  // Form state
  const [primaryGoal, setPrimaryGoal] = useState('')
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>([''])
  const [focusAreas, setFocusAreas] = useState<string[]>([''])
  const [weeklyCommitments, setWeeklyCommitments] = useState<string[]>([''])

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await loadCurrentWeekGoals(user.id)
      await loadUserStats(user.id)
    }
    setLoading(false)
  }

  const loadCurrentWeekGoals = async (userId: string) => {
    try {
      const monday = getMondayOfWeek()
      const { data, error } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('week_start_date', monday)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading current week goals:', error)
        return
      }

      if (data) {
        setCurrentWeekGoals(data)
        setPrimaryGoal(data.primary_goal)
        setSecondaryGoals(data.secondary_goals.length > 0 ? data.secondary_goals : [''])
        setFocusAreas(data.focus_areas.length > 0 ? data.focus_areas : [''])
        setWeeklyCommitments(data.weekly_commitments.length > 0 ? data.weekly_commitments : [''])
      }
    } catch (error) {
      console.error('Error loading current week goals:', error)
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

  const addField = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[]) => {
    setter([...array, ''])
  }

  const removeField = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[], index: number) => {
    if (array.length > 1) {
      const newArray = array.filter((_, i) => i !== index)
      setter(newArray)
    }
  }

  const updateField = (setter: React.Dispatch<React.SetStateAction<string[]>>, array: string[], index: number, value: string) => {
    const newArray = [...array]
    newArray[index] = value
    setter(newArray)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !primaryGoal.trim()) {
      setMessage({ type: 'error', text: 'Please enter a primary goal for the week' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const weekStartDate = getMondayOfWeek()
      const token = (await supabase.auth.getSession()).data.session?.access_token

      const payload = {
        primary_goal: primaryGoal.trim(),
        secondary_goals: secondaryGoals.filter(goal => goal.trim()).map(goal => goal.trim()),
        focus_areas: focusAreas.filter(area => area.trim()).map(area => area.trim()),
        weekly_commitments: weeklyCommitments.filter(commitment => commitment.trim()).map(commitment => commitment.trim()),
        week_start_date: weekStartDate
      }

      const response = await fetch('/api/weekly-reinvention/monday-ritual/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const result = await response.json()

      if (response.ok) {
        setMessage({ type: 'success', text: 'Your weekly goals have been set successfully!' })
        setCurrentWeekGoals(result.data)

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
        setMessage({ type: 'error', text: result.error || 'Failed to save your goals' })
      }
    } catch (error) {
      console.error('Error saving goals:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving your goals' })
    } finally {
      setSaving(false)
    }
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading your Monday Ritual...</p>
      </div>
    )
  }

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
          <div className="text-3xl mb-3">🎯</div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Monday Ritual
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Set your intentions and goals for the week ahead
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Week of {new Date(getMondayOfWeek()).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* User Stats Banner */}
      {userStats && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 rounded-lg border border-emerald-200 dark:border-emerald-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {userStats.current_streak}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Week Streak</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {userStats.total_weeks}
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Total Weeks</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {Math.round(userStats.completion_rate)}%
                </div>
                <div className="text-xs text-emerald-600 dark:text-emerald-400">Completion Rate</div>
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

      {/* Current Status */}
      {currentWeekGoals && currentWeekGoals.status === 'completed' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-4 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">This Week's Goals are Complete!</h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                You've already set your goals for this week. You can update them if needed.
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

      {/* Monday Ritual Form */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Primary Goal */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              <Target className="inline h-5 w-5 mr-2 text-emerald-600" />
              Primary Goal for the Week
            </label>
            <textarea
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={3}
              placeholder="What is your main focus for this week? Be specific and actionable..."
              required
            />
          </div>

          {/* Secondary Goals */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              Secondary Goals
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Additional objectives you want to accomplish this week
            </p>
            {secondaryGoals.map((goal, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={goal}
                  onChange={(e) => updateField(setSecondaryGoals, secondaryGoals, index, e.target.value)}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter a secondary goal..."
                />
                {secondaryGoals.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(setSecondaryGoals, secondaryGoals, index)}
                    className="p-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addField(setSecondaryGoals, secondaryGoals)}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Secondary Goal
            </button>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              Focus Areas
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Select or enter areas of life you want to focus on this week
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {focusAreaOptions.map((area) => (
                <label key={area} className="flex items-center gap-2 p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={focusAreas.includes(area)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFocusAreas([...focusAreas.filter(a => a.trim()), area])
                      } else {
                        setFocusAreas(focusAreas.filter(a => a !== area))
                      }
                    }}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{area}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add custom focus area..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => {
                if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                  setFocusAreas([...focusAreas, e.currentTarget.value])
                  e.currentTarget.value = ''
                }
              }}
            />
          </div>

          {/* Weekly Commitments */}
          <div>
            <label className="block text-base font-semibold text-gray-900 dark:text-white mb-3">
              Weekly Commitments
            </label>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Specific actions you commit to taking this week
            </p>
            {weeklyCommitments.map((commitment, index) => (
              <div key={index} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={commitment}
                  onChange={(e) => updateField(setWeeklyCommitments, weeklyCommitments, index, e.target.value)}
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Enter a specific commitment..."
                />
                {weeklyCommitments.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeField(setWeeklyCommitments, weeklyCommitments, index)}
                    className="p-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => addField(setWeeklyCommitments, weeklyCommitments)}
              className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
            >
              <Plus className="h-4 w-4" />
              Add Commitment
            </button>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span>Set Weekly Goals</span>
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
            onClick={() => navigate('/weekly-reinvention/friday-ritual')}
            className="flex items-center gap-2 text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium"
          >
            Friday Reflection →
          </button>
          <button
            onClick={() => navigate('/weekly-reinvention/progress')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Progress Dashboard →
          </button>
        </div>
      </div>
    </div>
  )
}