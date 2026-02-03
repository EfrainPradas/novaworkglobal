import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

interface ProtectedRouteProps {
    requiredLevel?: 'basic' | 'pro' | 'executive'
}

export default function ProtectedRoute({ requiredLevel = 'basic' }: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const location = useLocation()

    useEffect(() => {
        checkAccess()
    }, [])

    const checkAccess = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setIsAuthenticated(false)
                setLoading(false)
                return
            }

            setIsAuthenticated(true)

            // If only basic auth is required, we are done
            if (requiredLevel === 'basic') {
                setHasAccess(true)
                setLoading(false)
                return
            }

            // Check subscription tier
            const { data: userData } = await supabase
                .from('users')
                .select('subscription_tier')
                .eq('id', user.id)
                .single()

            const userTier = userData?.subscription_tier || 'basic'
            const levels = { basic: 1, pro: 2, executive: 3 }

            const userLevelScore = levels[userTier as keyof typeof levels] || 1
            const requiredScore = levels[requiredLevel]

            if (userLevelScore >= requiredScore) {
                setHasAccess(true)
            } else {
                setHasAccess(false)
            }

        } catch (error) {
            console.error('Error checking access:', error)
            setHasAccess(false)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    if (!isAuthenticated) {
        return <Navigate to="/signin" state={{ from: location }} replace />
    }

    if (!hasAccess) {
        // Redirect to upgrade page or dashboard with unauthorized message
        // For now, redirect to dashboard which might show upgrade options
        // Or we could have an /unauthorized page
        return <Navigate to="/dashboard" replace />
    }

    return <Outlet />
}
