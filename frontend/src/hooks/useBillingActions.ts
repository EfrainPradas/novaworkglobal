/**
 * useBillingActions — React hook for billing operations
 *
 * Provides functions to start checkout, open portal, etc.
 * Each action redirects the user to the Stripe-hosted page.
 */

import { useState, useCallback } from 'react'
import {
  createCheckoutSession,
  createAddonSession,
  createPortalSession,
} from '../services/billing.service'

interface UseBillingActionsReturn {
  /** Start a membership checkout — redirects to Stripe */
  startCheckout: (priceId: string) => Promise<void>
  /** Start a one-time addon checkout — redirects to Stripe */
  startAddonCheckout: (priceId: string) => Promise<void>
  /** Open the Stripe Customer Portal — redirects */
  openPortal: () => Promise<void>
  /** True while any action is in progress */
  loading: boolean
  /** Error from the last action */
  error: string | null
}

export function useBillingActions(): UseBillingActionsReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const startCheckout = useCallback(async (priceId: string) => {
    try {
      setLoading(true)
      setError(null)
      const { url } = await createCheckoutSession(priceId)
      window.location.replace(url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [])

  const startAddonCheckout = useCallback(async (priceId: string) => {
    try {
      setLoading(true)
      setError(null)
      const { url } = await createAddonSession(priceId)
      window.location.replace(url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [])

  const openPortal = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { url } = await createPortalSession()
      window.location.replace(url)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }, [])

  return {
    startCheckout,
    startAddonCheckout,
    openPortal,
    loading,
    error,
  }
}
