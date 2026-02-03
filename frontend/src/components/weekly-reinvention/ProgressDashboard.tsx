import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  BarChart3,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Flame,
  Star,
  Trophy,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

interface WeeklyProgress {
  week_start_date: string
  goals_completed: number
  goals_total: number
  completion_rate: number
  week_rating: number
  energy_avg: number
  motivation_avg: number
  reflection_completed: boolean
}

interface UserStreaks {
  current_goal_streak: number
  current_reflection_streak: number
  longest_goal_streak: number
  longest_reflection_streak: number
  total_weeks_completed: number
}

interface Badge {
  id: string
  badge_code: string
  badge_name: string
  badge_description: string
  badge_icon: string
  earned_at?: string
}

const COLORS = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899']

export default function ProgressDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('4weeks') // 4weeks, 8weeks, 12weeks
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress[]>([])
  const [streaks, setStreaks] = useState<UserStreaks | null>(null)
  const [badges, setBadges] = useState<{ earned: Badge[], available: Badge[] }>({ earned: [], available: [] })
  const [stats, setStats] = useState({
    totalGoals: 0,
    completedGoals: 0,
    averageCompletionRate: 0,
    averageWeekRating: 0,
    currentStreak: 0,
    totalBadges: 0
  })

  useEffect(() => {
    checkAuth()
  }, [timeRange])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUser(user)
      await loadProgressData(user.id)
      await loadStreaks(user.id)
      await loadBadges(user.id)
    }
    setLoading(false)
  }

  const loadProgressData = async (userId: string) => {
    try {
      const weeksToLoad = timeRange === '4weeks' ? 4 : timeRange === '8weeks' ? 8 : 12
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - (weeksToLoad * 7))

      // Get weekly goals and progress
      const { data: weeklyGoals, error: goalsError } = await supabase
        .from('weekly_goals')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start_date', startDate.toISOString().split('T')[0])
        .lte('week_start_date', endDate.toISOString().split('T')[0])
        .order('week_start_date', { ascending: true })

      if (goalsError) throw goalsError

      // Get Friday reflections
      const { data: reflections, error: reflectionsError } = await supabase
        .from('friday_reflections')
        .select('*')
        .eq('user_id', userId)
        .gte('week_start_date', startDate.toISOString().split('T')[0])
        .lte('week_start_date', endDate.toISOString().split('T')[0])
        .order('week_start_date', { ascending: true })

      if (reflectionsError) throw reflectionsError

      // Combine data
      const progressData: WeeklyProgress[] = weeklyGoals.map(week => {
        const weekReflections = reflections.find(r => r.week_start_date === week.week_start_date)

        // Count goals and completion
        const goals = []
        for (let i = 1; i <= 5; i++) {
          if (week[`goal_${i}`]) {
            goals.push({
              text: week[`goal_${i}`],
              priority: week[`goal_${i}_priority`],
              category: week[`goal_${i}_category`]
            })
          }
        }

        return {
          week_start_date: week.week_start_date,
          goals_completed: 0, // Would need progress tracking data
          goals_total: goals.length,
          completion_rate: 0, // Calculate from progress tracking
          week_rating: weekReflections?.overall_week_rating || 0,
          energy_avg: weekReflections?.energy_level || 0,
          motivation_avg: weekReflections?.motivation_level || 0,
          reflection_completed: !!weekReflections
        }
      })

      setWeeklyProgress(progressData)
      calculateStats(progressData)

    } catch (error) {
      console.error('Error loading progress data:', error)
    }
  }

  const loadStreaks = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) throw error
      setStreaks(data)

    } catch (error) {
      console.error('Error loading streaks:', error)
    }
  }

  const loadBadges = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/weekly-reinvention/badges`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setBadges(data.data)
      }

    } catch (error) {
      console.error('Error loading badges:', error)
    }
  }

  const calculateStats = (progressData: WeeklyProgress[]) => {
    const totalGoals = progressData.reduce((sum, week) => sum + week.goals_total, 0)
    const completedWeeks = progressData.filter(week => week.reflection_completed).length
    const averageRating = progressData
      .filter(week => week.week_rating > 0)
      .reduce((sum, week) => sum + week.week_rating, 0) / completedWeeks || 0

    setStats({
      totalGoals,
      completedGoals: 0, // Would need actual completion tracking
      averageCompletionRate: 0,
      averageWeekRating: averageRating,
      currentStreak: streaks?.current_goal_streak || 0,
      totalBadges: badges.earned.length
    })
  }

  const getWeekLabel = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getStreakColor = (streak: number) => {
    if (streak >= 12) return 'text-purple-600'
    if (streak >= 8) return 'text-blue-600'
    if (streak >= 4) return 'text-green-600'
    if (streak >= 1) return 'text-yellow-600'
    return 'text-gray-400'
  }

  const getStreakIcon = (streak: number) => {
    if (streak >= 12) return '🔥'
    if (streak >= 8) return '⚡'
    if (streak >= 4) return '✨'
    if (streak >= 1) return '🌟'
    return '💭'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your progress dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <BarChart3 className="h-8 w-8 text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Progress Dashboard</h1>
        </div>
        <p className="text-gray-600">
          Track your weekly progress, celebrate achievements, and maintain your streak
        </p>

        {/* Time Range Selector */}
        <div className="flex justify-center mt-6 space-x-2">
          {['4weeks', '8weeks', '12weeks'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range === '4weeks' ? '4 Weeks' : range === '8weeks' ? '8 Weeks' : '12 Weeks'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Streak */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-xl border border-orange-200">
          <div className="flex items-center justify-between mb-4">
            <Flame className="h-8 w-8 text-orange-600" />
            <span className="text-3xl">{getStreakIcon(stats.currentStreak)}</span>
          </div>
          <div className={`text-3xl font-bold ${getStreakColor(stats.currentStreak)} mb-1`}>
            {stats.currentStreak}
          </div>
          <div className="text-sm text-gray-600">Week Streak</div>
          <div className="text-xs text-gray-500 mt-2">
            Best: {streaks?.longest_goal_streak || 0} weeks
          </div>
        </div>

        {/* Total Goals */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between mb-4">
            <Target className="h-8 w-8 text-blue-600" />
            <CheckCircle className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-blue-900 mb-1">
            {stats.totalGoals}
          </div>
          <div className="text-sm text-gray-600">Goals Set</div>
          <div className="text-xs text-gray-500 mt-2">
            This period
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
          <div className="flex items-center justify-between mb-4">
            <Star className="h-8 w-8 text-green-600" />
            <TrendingUp className="h-6 w-6 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-green-900 mb-1">
            {stats.averageWeekRating.toFixed(1)}
          </div>
          <div className="text-sm text-gray-600">Avg Week Rating</div>
          <div className="text-xs text-gray-500 mt-2">
            Out of 10
          </div>
        </div>

        {/* Badges Earned */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="h-8 w-8 text-purple-600" />
            <Award className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold text-purple-900 mb-1">
            {badges.earned.length}
          </div>
          <div className="text-sm text-gray-600">Badges Earned</div>
          <div className="text-xs text-gray-500 mt-2">
            {badges.available.length} more available
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Week Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="h-5 w-5 text-blue-600 mr-2" />
            Weekly Performance
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="week_start_date"
                tickFormatter={getWeekLabel}
                tick={{ fontSize: 12 }}
              />
              <YAxis domain={[0, 10]} />
              <Tooltip
                labelFormatter={(value) => `Week of ${getWeekLabel(value)}`}
                formatter={(value: number, name: string) => [
                  value.toFixed(1),
                  name === 'week_rating' ? 'Week Rating' : 'Energy'
                ]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="week_rating"
                stroke="#8b5cf6"
                strokeWidth={2}
                name="Week Rating"
                dot={{ fill: '#8b5cf6' }}
              />
              <Line
                type="monotone"
                dataKey="energy_avg"
                stroke="#10b981"
                strokeWidth={2}
                name="Energy Level"
                dot={{ fill: '#10b981' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Goals by Category Chart */}
        <div className="bg-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Target className="h-5 w-5 text-orange-600 mr-2" />
            Goals by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: 'Job Search', value: 35 },
                  { name: 'Learning', value: 25 },
                  { name: 'Networking', value: 20 },
                  { name: 'Applications', value: 15 },
                  { name: 'Interviews', value: 5 }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {[
                  { name: 'Job Search', value: 35 },
                  { name: 'Learning', value: 25 },
                  { name: 'Networking', value: 20 },
                  { name: 'Applications', value: 15 },
                  { name: 'Interviews', value: 5 }
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Badges */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Award className="h-5 w-5 text-yellow-500 mr-2" />
          Recent Achievements
        </h3>

        {badges.earned.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {badges.earned.slice(0, 6).map((badge) => (
              <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="text-3xl mb-2">{badge.badge_icon}</div>
                <div className="text-sm font-medium text-gray-900">{badge.badge_name}</div>
                <div className="text-xs text-gray-600 mt-1">
                  {new Date(badge.earned_at || '').toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Trophy className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No badges earned yet. Complete weekly rituals to unlock achievements!</p>
          </div>
        )}
      </div>

      {/* Weekly History Table */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="h-5 w-5 text-blue-600 mr-2" />
          Weekly History
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Week</th>
                <th className="text-left py-2">Goals</th>
                <th className="text-left py-2">Rating</th>
                <th className="text-left py-2">Energy</th>
                <th className="text-left py-2">Motivation</th>
                <th className="text-left py-2">Reflection</th>
              </tr>
            </thead>
            <tbody>
              {weeklyProgress.slice().reverse().map((week, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="py-3">{getWeekLabel(week.week_start_date)}</td>
                  <td className="py-3">{week.goals_total}</td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <span className="mr-2">{week.week_rating > 0 ? '⭐' : '–'}</span>
                      {week.week_rating > 0 ? `${week.week_rating}/10` : 'N/A'}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <span className="mr-2">{week.energy_avg > 0 ? '⚡' : '–'}</span>
                      {week.energy_avg > 0 ? `${week.energy_avg}/10` : 'N/A'}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      <span className="mr-2">{week.motivation_avg > 0 ? '🔥' : '–'}</span>
                      {week.motivation_avg > 0 ? `${week.motivation_avg}/10` : 'N/A'}
                    </div>
                  </td>
                  <td className="py-3">
                    {week.reflection_completed ? (
                      <span className="text-green-600">✅ Complete</span>
                    ) : (
                      <span className="text-gray-400">⏳ Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}