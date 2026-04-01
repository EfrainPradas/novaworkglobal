/**
 * Smart Guided Path — Per-Step Hook
 *
 * Used inside each step page (ContactInfoPage, WorkExperienceBuilder, etc.)
 * to integrate with the guided path system. Auto-fires a view event on mount.
 */

import { useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { GuidedStepKey, GuidedStepStatus } from '../types/guidedPath'
import { useGuidedPath } from '../contexts/GuidedPathContext'
import { STEP_DISPLAY_CONFIG, STEP_ROUTE_MAP } from '../constants/guidedPath'

interface UseGuidedStepReturn {
  isGuidedMode: boolean
  stepStatus: GuidedStepStatus | null
  completionPct: number
  missingFields: string[] | undefined
  isStepComplete: boolean
  nextStepKey: GuidedStepKey | null
  nextStepName: string | null
  nextStepRoute: string | null
  completeAndAdvance: () => Promise<void>
  skipAndAdvance: (reason?: string) => Promise<void>
}

export function useGuidedStep(stepKey: GuidedStepKey): UseGuidedStepReturn {
  const navigate = useNavigate()
  const {
    isGuidedMode,
    stepStatuses,
    nextStep,
    markViewed,
    completeStepAndAdvance,
    skipStepAndAdvance,
  } = useGuidedPath()

  const hasViewedRef = useRef(false)

  // Fire view event once on mount (fire-and-forget)
  useEffect(() => {
    if (isGuidedMode && !hasViewedRef.current) {
      hasViewedRef.current = true
      markViewed(stepKey, window.location.pathname)
    }
  }, [isGuidedMode, stepKey, markViewed])

  const stepInfo = stepStatuses[stepKey]
  const stepStatus = stepInfo?.status ?? null
  const completionPct = stepInfo?.completion_pct ?? 0
  const missingFields = stepInfo?.missing_fields
  const isStepComplete = stepInfo?.is_complete ?? false

  // Determine next step from routing engine
  const nextStepKey = nextStep?.step_key !== stepKey ? (nextStep?.step_key ?? null) : null
  const nextStepConfig = nextStepKey ? STEP_DISPLAY_CONFIG[nextStepKey] : null
  const nextStepName = nextStepConfig?.title ?? nextStep?.display_name ?? null
  const nextStepRoute = nextStepKey ? (STEP_ROUTE_MAP[nextStepKey] ?? nextStep?.route_path ?? null) : null

  const completeAndAdvance = useCallback(async () => {
    const result = await completeStepAndAdvance(stepKey)
    if (result.next_step_route) {
      navigate(result.next_step_route)
    }
  }, [stepKey, completeStepAndAdvance, navigate])

  const skipAndAdvance = useCallback(async (reason?: string) => {
    const result = await skipStepAndAdvance(stepKey, reason)
    if (result.next_step_route) {
      navigate(result.next_step_route)
    }
  }, [stepKey, skipStepAndAdvance, navigate])

  return {
    isGuidedMode,
    stepStatus,
    completionPct,
    missingFields,
    isStepComplete,
    nextStepKey,
    nextStepName,
    nextStepRoute,
    completeAndAdvance,
    skipAndAdvance,
  }
}
