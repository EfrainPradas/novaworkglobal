import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getBillingStatus } from '../../services/billing.service'

interface ProtectedRouteProps {
    requiredLevel?: 'esenciales' | 'momentum' | 'vanguard'
    /**
     * Routes that should be accessible to authenticated users even without
     * an active subscription (e.g. /dashboard/billing so they can pay).
     */
    bypassBillingPaths?: string[]
}

const TIER_LEVELS: Record<string, number> = {
    esenciales: 1,
    momentum: 2,
    vanguard: 3,
}

export default function ProtectedRoute({
    requiredLevel = 'esenciales',
    bypassBillingPaths = ['/dashboard/billing'],
}: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [redirectToBilling, setRedirectToBilling] = useState(false)
    const location = useLocation()

    useEffect(() => {
        checkAccess()
    }, [location.pathname])

    const checkAccess = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                setIsAuthenticated(false)
                setLoading(false)
                return
            }

            setIsAuthenticated(true)

            // Allow billing page without active subscription so users can pay
            const isBillingBypass = bypassBillingPaths.some(p =>
                location.pathname.startsWith(p)
            )

            if (isBillingBypass) {
                setHasAccess(true)
                setLoading(false)
                return
            }

            // Check billing_access (authoritative Stripe-synced table)
            let billingIsActive = false
            let billingTier: string | null = null

            try {
                const billing = await getBillingStatus()
                billingIsActive = billing.is_active
                billingTier = billing.membership_code
            } catch {
                // If billing endpoint fails, fall back to checking the table directly
                const { data: access } = await supabase
                    .from('billing_access')
                    .select('is_active, membership_code')
                    .eq('user_id', user.id)
                    .maybeSingle()

                billingIsActive = access?.is_active ?? false
                billingTier = access?.membership_code ?? null
            }

            // No active subscription → redirect to billing to pay
            if (!billingIsActive) {
                setRedirectToBilling(true)
                setHasAccess(false)
                setLoading(false)
                return
            }

            // Check tier level
            const userScore = TIER_LEVELS[billingTier || 'esenciales'] || 1
            const requiredScore = TIER_LEVELS[requiredLevel] || 1

            if (userScore >= requiredScore) {
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

    // No active subscription → send to billing page to pay
    if (redirectToBilling) {
        return <Navigate to="/dashboard/billing" replace />
    }

    if (!hasAccess) {
        return <Navigate to="/dashboard/billing" replace />
    }

    return <Outlet />
}
