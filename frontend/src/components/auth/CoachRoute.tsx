import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

/**
 * CoachRoute — Protected route guard for coach-only pages.
 * Checks if the current user has is_coach = true in the users table.
 * Non-coaches are redirected to /dashboard.
 */
export default function CoachRoute() {
  const [loading, setLoading] = useState(true)
  const [isCoach, setIsCoach] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const location = useLocation()

  useEffect(() => {
    checkCoachAccess()
  }, [])

  const checkCoachAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsAuthenticated(false)
        setLoading(false)
        return
      }

      setIsAuthenticated(true)

      // Check if user is a coach
      const { data: userData } = await supabase
        .from('users')
        .select('is_coach')
        .eq('id', user.id)
        .single()

      setIsCoach(userData?.is_coach === true)
    } catch (error) {
      console.error('Error checking coach access:', error)
      setIsCoach(false)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />
  }

  if (!isCoach) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
