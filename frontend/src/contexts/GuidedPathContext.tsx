/**
 * Smart Guided Path — React Context + Provider
 *
 * Wraps the dashboard layout to provide guided path state to all children.
 * Only fetches state when user is authenticated. Persists a localStorage flag
 * for fast UI checks before the API returns.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import type {
  GuidedPathFullState,
  GuidedStepKey,
  NextStepRecommendation,
  GuidedStepStatus,
} from '../types/guidedPath'
import {
  getGuidedPathState,
  getNextRecommendedStep,
  enableGuidedMode as apiEnable,
  disableGuidedMode as apiDisable,
  pauseGuidedPath as apiPause,
  resumeGuidedPath as apiResume,
  markStepViewed as apiMarkViewed,
  completeStep as apiCompleteStep,
  skipStep as apiSkipStep,
  logGuidedEvent,
} from '../services/guidedPath.service'
import { GUIDED_PATH_STORAGE_KEY } from '../constants/guidedPath'

// ---------- Types ----------

interface StepStatusInfo {
  status: GuidedStepStatus
  is_complete: boolean
  completion_pct: number
  is_locked: boolean
  missing_fields?: string[]
}

interface GuidedPathContextValue {
  // State
  state: GuidedPathFullState | null
  nextStep: (NextStepRecommendation & { has_active_run: boolean }) | null
  stepStatuses: Record<string, StepStatusInfo>
  isGuidedMode: boolean
  isLoading: boolean
  overallCompletionPct: number
  isPathComplete: boolean

  // Actions
  enable: () => Promise<void>
  disable: () => Promise<void>
  pause: () => Promise<void>
  resume: () => Promise<void>
  refreshState: () => Promise<void>
  markViewed: (stepKey: GuidedStepKey, sourcePage?: string) => void
  completeStepAndAdvance: (stepKey: GuidedStepKey) => Promise<{ next_step: GuidedStepKey | null; next_step_route: string | null }>
  skipStepAndAdvance: (stepKey: GuidedStepKey, reason?: string) => Promise<{ next_step: GuidedStepKey | null; next_step_route: string | null }>
}

const GuidedPathContext = createContext<GuidedPathContextValue | null>(null)

// ---------- Provider ----------

interface GuidedPathProviderProps {
  user: User | null
  children: React.ReactNode
}

export function GuidedPathProvider({ user, children }: GuidedPathProviderProps) {
  const [state, setState] = useState<GuidedPathFullState | null>(null)
  const [nextStep, setNextStep] = useState<(NextStepRecommendation & { has_active_run: boolean }) | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGuidedMode, setIsGuidedMode] = useState(() => {
    return localStorage.getItem(GUIDED_PATH_STORAGE_KEY) === 'true'
  })
  const mountedRef = useRef(true)

  // Fetch full state
  const refreshState = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const [fullState, next] = await Promise.all([
        getGuidedPathState(),
        getNextRecommendedStep().catch(() => null),
      ])

      if (!mountedRef.current) return

      setState(fullState)
      setNextStep(next)

      // Sync localStorage with actual run state
      const hasActive = fullState.has_active_run && fullState.run?.guidance_enabled
      setIsGuidedMode(!!hasActive)
      localStorage.setItem(GUIDED_PATH_STORAGE_KEY, hasActive ? 'true' : 'false')
    } catch (err) {
      console.warn('[GuidedPath] Failed to fetch state:', err)
      // If fetch fails, respect localStorage for UI
      const stored = localStorage.getItem(GUIDED_PATH_STORAGE_KEY) === 'true'
      if (mountedRef.current) setIsGuidedMode(stored)
    } finally {
      if (mountedRef.current) setIsLoading(false)
    }
  }, [user])

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true
    if (user) {
      refreshState()
    }
    return () => { mountedRef.current = false }
  }, [user, refreshState])

  // Compute step statuses from nextStep response
  const stepStatuses: Record<string, StepStatusInfo> = {}
  if (nextStep?.step_statuses) {
    for (const [key, status] of Object.entries(nextStep.step_statuses)) {
      if (typeof status === 'object' && status !== null) {
        stepStatuses[key] = status as StepStatusInfo
      } else {
        // Simple status string from the API
        stepStatuses[key] = {
          status: status as GuidedStepStatus,
          is_complete: status === 'completed',
          completion_pct: status === 'completed' ? 100 : 0,
          is_locked: status === 'blocked',
        }
      }
    }
  }

  // Overall completion
  const overallCompletionPct = state?.steps
    ? Math.round(
        state.steps
          .filter(s => !s.is_terminal)
          .reduce((sum, s) => sum + (s.state?.completion_pct || 0), 0) /
        Math.max(1, state.steps.filter(s => !s.is_terminal).length)
      )
    : 0

  const isPathComplete = nextStep?.is_path_complete ?? false

  // ---------- Actions ----------

  const enable = useCallback(async () => {
    // Optimistic: set UI state immediately
    setIsGuidedMode(true)
    localStorage.setItem(GUIDED_PATH_STORAGE_KEY, 'true')
    try {
      await apiEnable()
      logGuidedEvent({ event_type: 'guided_mode_enabled', triggered_by: 'user_action' })
      await refreshState()
    } catch (err) {
      console.warn('[GuidedPath] Enable API failed, keeping local state:', err)
      // Keep optimistic state — user still sees guided mode UI
    }
  }, [refreshState])

  const disable = useCallback(async () => {
    // Optimistic: set UI state immediately
    setIsGuidedMode(false)
    localStorage.setItem(GUIDED_PATH_STORAGE_KEY, 'false')
    try {
      await apiDisable()
      logGuidedEvent({ event_type: 'guided_mode_disabled', triggered_by: 'user_action' })
      await refreshState()
    } catch (err) {
      console.warn('[GuidedPath] Disable API failed, keeping local state:', err)
    }
  }, [refreshState])

  const pause = useCallback(async () => {
    await apiPause()
    logGuidedEvent({ event_type: 'guided_path_paused', triggered_by: 'user_action' })
    await refreshState()
  }, [refreshState])

  const resumePath = useCallback(async () => {
    await apiResume()
    logGuidedEvent({ event_type: 'guided_path_resumed', triggered_by: 'user_action' })
    await refreshState()
  }, [refreshState])

  const markViewed = useCallback((stepKey: GuidedStepKey, sourcePage?: string) => {
    apiMarkViewed(stepKey, sourcePage).catch(() => {})
  }, [])

  const completeStepAndAdvance = useCallback(async (stepKey: GuidedStepKey) => {
    const result = await apiCompleteStep(stepKey)
    logGuidedEvent({ event_type: 'step_completed', step_key: stepKey, triggered_by: 'user_action' })
    await refreshState()
    return result
  }, [refreshState])

  const skipStepAndAdvance = useCallback(async (stepKey: GuidedStepKey, reason?: string) => {
    const result = await apiSkipStep(stepKey, reason)
    logGuidedEvent({ event_type: 'step_skipped', step_key: stepKey, triggered_by: 'user_action' })
    await refreshState()
    return result
  }, [refreshState])

  const value: GuidedPathContextValue = {
    state,
    nextStep,
    stepStatuses,
    isGuidedMode,
    isLoading,
    overallCompletionPct,
    isPathComplete,
    enable,
    disable,
    pause,
    resume: resumePath,
    refreshState,
    markViewed,
    completeStepAndAdvance,
    skipStepAndAdvance,
  }

  return (
    <GuidedPathContext.Provider value={value}>
      {children}
    </GuidedPathContext.Provider>
  )
}

// ---------- Hook ----------

export function useGuidedPath(): GuidedPathContextValue {
  const ctx = useContext(GuidedPathContext)
  if (!ctx) {
    throw new Error('useGuidedPath must be used within a GuidedPathProvider')
  }
  return ctx
}

export default GuidedPathContext
