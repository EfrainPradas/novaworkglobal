import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { getBillingStatus } from '../../services/billing.service'
import { isContactInfoComplete } from '../../services/contactProfile.service'

interface ProtectedRouteProps {
    requiredLevel?: 'core' | 'advance' | 'apex'
    bypassBillingPaths?: string[]
}

const TIER_LEVELS: Record<string, number> = {
    core: 1,
    advance: 2,
    apex: 3,
    // Legacy NovaWork codes
    esenciales: 1,
    momentum: 2,
    vanguard: 3,
}

const CONTACT_INFO_BYPASS_PATHS = ['/dashboard/resume/contact-info', '/dashboard/billing']

export default function ProtectedRoute({
    requiredLevel = 'core',
    bypassBillingPaths = ['/dashboard/billing'],
}: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true)
    const [hasAccess, setHasAccess] = useState(false)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [redirectToBilling, setRedirectToBilling] = useState(false)
    const [redirectToContactInfo, setRedirectToContactInfo] = useState(false)
    const location = useLocation()

    useEffect(() => {
        let cancelled = false
        let timeoutId: ReturnType<typeof setTimeout>

        async function checkAccess() {
            try {
                // First try onAuthStateChange (most reliable for session recovery)
                const session = await new Promise<any>((resolve) => {
                    let resolved = false

                    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
                        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
                            if (!resolved) {
                                resolved = true
                                subscription.unsubscribe()
                                resolve(session)
                            }
                        }
                    })

                    // Fallback: if onAuthStateChange doesn't fire within 3s, try getSession
                    timeoutId = setTimeout(() => {
                        if (!resolved) {
                            resolved = true
                            subscription.unsubscribe()
                            supabase.auth.getSession().then(({ data: { session } }) => {
                                resolve(session)
                            })
                        }
                    }, 3000)
                })

                if (cancelled) return

                const user = session?.user ?? null

                if (!user) {
                    setIsAuthenticated(false)
                    setLoading(false)
                    return
                }

                setIsAuthenticated(true)

                // Allow contact-info page without any checks
                const isContactInfoBypass = CONTACT_INFO_BYPASS_PATHS.some(p =>
                    location.pathname.startsWith(p)
                )

                if (isContactInfoBypass) {
                    setHasAccess(true)
                    setLoading(false)
                    return
                }

                // Check contact info completeness FIRST
                const contactComplete = await isContactInfoComplete()
                if (!contactComplete) {
                    setRedirectToContactInfo(true)
                    setHasAccess(false)
                    setLoading(false)
                    return
                }

                // Allow billing page without active subscription
                const isBillingBypass = bypassBillingPaths.some(p =>
                    location.pathname.startsWith(p)
                )

                if (isBillingBypass) {
                    setHasAccess(true)
                    setLoading(false)
                    return
                }

                // Check billing_access
                let billingIsActive = false
                let billingTier: string | null = null

                try {
                    const billing = await getBillingStatus()
                    billingIsActive = billing.is_active
                    billingTier = billing.membership_code
                } catch {
                    const { data: access } = await supabase
                        .from('billing_access')
                        .select('is_active, membership_code')
                        .eq('user_id', user.id)
                        .maybeSingle()

                    billingIsActive = access?.is_active ?? false
                    billingTier = access?.membership_code ?? null
                }

                if (!billingIsActive) {
                    setRedirectToBilling(true)
                    setHasAccess(false)
                    setLoading(false)
                    return
                }

                const userScore = TIER_LEVELS[billingTier || 'core'] || 1
                const requiredScore = TIER_LEVELS[requiredLevel] || 1
                setHasAccess(userScore >= requiredScore)
            } catch (error) {
                console.error('Error checking access:', error)
                setHasAccess(false)
            } finally {
                setLoading(false)
            }
        }

        checkAccess()

        return () => {
            cancelled = true
            if (timeoutId) clearTimeout(timeoutId)
        }
    }, [location.pathname])

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

    if (redirectToContactInfo) {
        return <Navigate to="/dashboard/resume/contact-info" replace />
    }

    if (redirectToBilling) {
        return <Navigate to="/dashboard/billing" replace />
    }

    if (!hasAccess) {
        return <Navigate to="/dashboard/billing" replace />
    }

    return <Outlet />
}