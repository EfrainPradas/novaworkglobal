/**
 * BillingGuard — Conditionally render children based on billing tier
 *
 * Usage:
 *   <BillingGuard minTier="advance" fallback={<UpgradePrompt />}>
 *     <AdvanceFeature />
 *   </BillingGuard>
 */

import { type ReactNode } from 'react'
import { useSubscription } from '../../hooks/useSubscription'

interface BillingGuardProps {
  /** Minimum tier required to see the children */
  minTier: 'core' | 'advance' | 'apex'
  /** What to show if the user doesn't have access */
  fallback?: ReactNode
  /** Content shown while loading billing status */
  loader?: ReactNode
  children: ReactNode
}

export default function BillingGuard({
  minTier,
  fallback = null,
  loader,
  children,
}: BillingGuardProps) {
  const { loading, hasMinTier } = useSubscription()

  if (loading) {
    return loader ? <>{loader}</> : null
  }

  if (!hasMinTier(minTier)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
