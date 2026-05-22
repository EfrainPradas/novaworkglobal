/**
 * useSubscription — React hook for billing status
 *
 * Returns the current user's billing state from the backend.
 * Re-fetches on mount and when refetch() is called.
 */

import { useState, useEffect, useCallback } from 'react'
import { getBillingStatus, type BillingStatus } from '../services/billing.service'

interface UseSubscriptionReturn {
  /** The full billing status object */
  billing: BillingStatus | null
  /** True while the initial fetch is in progress */
  loading: boolean
  /** Error message if the fetch failed */
  error: string | null
  /** Manually re-fetch billing status */
  refetch: () => Promise<void>
  /** Convenience: is there an active membership? */
  isActive: boolean
  /** Convenience: current membership tier code */
  tier: BillingStatus['membership_code']
  /** Check if user has at least the given tier */
  hasMinTier: (minTier: 'core' | 'advance' | 'apex') => boolean
}

const TIER_LEVELS: Record<string, number> = {
  core: 1,
  advance: 2,
  apex: 3,
  // Legacy NovaWork codes — mapped to Ascendia equivalents
  esenciales: 1,
  essentials: 1,
  momentum: 2,
  vanguard: 3,
  executive: 3,
}

export function useSubscription(): UseSubscriptionReturn {
  const [billing, setBilling] = useState<BillingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBilling = useCallback(async () => {
    try {
      setError(null)
      const data = await getBillingStatus()
      setBilling(data)
    } catch (err: any) {
      setError(err.message)
      setBilling(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBilling()
  }, [fetchBilling])

  const isActive = billing?.is_active ?? false
  const tier = billing?.membership_code ?? null

  const hasMinTier = useCallback(
    (minTier: 'core' | 'advance' | 'apex') => {
      if (!isActive || !tier) return false
      return (TIER_LEVELS[tier] || 0) >= (TIER_LEVELS[minTier] || 0)
    },
    [isActive, tier]
  )

  return {
    billing,
    loading,
    error,
    refetch: fetchBilling,
    isActive,
    tier,
    hasMinTier,
  }
}
