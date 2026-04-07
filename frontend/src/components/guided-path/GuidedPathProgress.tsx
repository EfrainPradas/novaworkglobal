/**
 * GuidedPathProgress — Vertical journey/milestone map.
 *
 * Compact mode: for right panel (icons + names only).
 * Full mode: includes descriptions + completion details.
 */

import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { useGuidedPath } from '../../contexts/GuidedPathContext'
import { STEP_DISPLAY_CONFIG, STEP_ROUTE_MAP } from '../../constants/guidedPath'
import StepStatusIndicator from './StepStatusIndicator'
import type { GuidedStepKey, GuidedStepStatus } from '../../types/guidedPath'

interface GuidedPathProgressProps {
  compact?: boolean
}

export default function GuidedPathProgress({ compact = false }: GuidedPathProgressProps) {
  const { state, stepStatuses, nextStep, isGuidedMode } = useGuidedPath()
  const navigate = useNavigate()
  const { t } = useTranslation()

  if (!isGuidedMode || !state?.steps) return null

  const steps = state.steps.filter(s => !s.is_terminal)
  const activeStepKey = nextStep?.step_key

  return (
    <div style={{ padding: compact ? '0' : '8px 0' }}>
      {!compact && (
        <h4 style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: 'Montserrat, sans-serif',
          color: '#374151',
          margin: '0 0 14px',
        }}>
          Your Progress
        </h4>
      )}

      <div style={{ position: 'relative' }}>
        {steps.map((step, i) => {
          const stepKey = step.step_key as GuidedStepKey
          const config = STEP_DISPLAY_CONFIG[stepKey]
          const statusInfo = stepStatuses[stepKey]
          const status: GuidedStepStatus = statusInfo?.status || step.state?.status || 'not_started'
          const isActive = stepKey === activeStepKey
          const isComplete = statusInfo?.is_complete || status === 'completed'
          const isLocked = statusInfo?.is_locked || status === 'blocked'
          const completionPct = statusInfo?.completion_pct ?? step.state?.completion_pct ?? 0
          const route = STEP_ROUTE_MAP[stepKey]
          const isLast = i === steps.length - 1
          const Icon = config?.icon

          return (
            <div key={stepKey} style={{ display: 'flex', gap: compact ? 10 : 14, minHeight: compact ? 36 : 52 }}>
              {/* Connector line + indicator */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: compact ? 20 : 28,
                flexShrink: 0,
              }}>
                <StepStatusIndicator
                  status={status}
                  size={compact ? 'sm' : 'md'}
                />
                {!isLast && (
                  <div style={{
                    flex: 1,
                    width: 2,
                    minHeight: compact ? 12 : 16,
                    background: isComplete ? '#10B981' : '#E5E7EB',
                    borderStyle: isComplete ? 'solid' : 'dashed',
                    marginTop: 4,
                    marginBottom: 4,
                  }} />
                )}
              </div>

              {/* Step content */}
              <motion.div
                whileHover={!isLocked ? { x: 2 } : undefined}
                onClick={() => !isLocked && route && navigate(route)}
                style={{
                  flex: 1,
                  cursor: isLocked ? 'default' : 'pointer',
                  opacity: isLocked ? 0.5 : 1,
                  paddingBottom: compact ? 4 : 8,
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  {/* Step name */}
                  <span style={{
                    fontSize: compact ? 12 : 13,
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#1F5BAA' : isComplete ? '#10B981' : '#374151',
                    fontFamily: 'DM Sans, sans-serif',
                    lineHeight: 1.3,
                    flex: 1,
                  }}>
                    {config?.titleKey ? t(config.titleKey, config.title) : (config?.title || step.display_name)}
                  </span>

                  {/* Completion badge */}
                  {!compact && completionPct > 0 && completionPct < 100 && (
                    <span style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#1F5BAA',
                      background: '#EFF6FF',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}>
                      {completionPct}%
                    </span>
                  )}
                </div>

                {/* Description (full mode only) */}
                {!compact && config?.description && (
                  <p style={{
                    fontSize: 11,
                    color: '#9CA3AF',
                    margin: '2px 0 0',
                    lineHeight: 1.4,
                  }}>
                    {config.description}
                  </p>
                )}

                {/* Active indicator glow */}
                {isActive && !compact && (
                  <div style={{
                    marginTop: 6,
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#1F5BAA',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <div style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: '#1F5BAA',
                    }} />
                    Recommended next
                  </div>
                )}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
