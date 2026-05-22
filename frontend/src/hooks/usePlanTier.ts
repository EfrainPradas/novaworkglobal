import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { canAccess, tierLevel, type Feature } from '../lib/planAccess'

/**
 * Lightweight hook that reads the user's membership_code from billing_access
 * and exposes plan tier helpers. Avoids re-fetching if the session is already
 * available from the Supabase client.
 */
export function usePlanTier() {
  const [membershipCode, setMembershipCode] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session?.user?.id) { setLoading(false); return }
        const { data } = await supabase
          .from('billing_access')
          .select('membership_code')
          .eq('user_id', session.user.id)
          .single()
        if (!cancelled) setMembershipCode(data?.membership_code ?? null)
      } catch {
        // billing_access row may not exist for new/free users
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  return {
    /** Raw membership code from billing_access (e.g. 'core', 'advance', 'apex', null) */
    membershipCode,
    /** Numeric tier level (0 = no plan, 1 = core, 2 = advance, 3 = apex) */
    tier: tierLevel(membershipCode),
    /** Whether the user can access a specific feature */
    can: (feature: Feature) => canAccess(membershipCode, feature),
    /** Still loading billing status */
    loading,
  }
}