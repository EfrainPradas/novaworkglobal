/**
 * ModuleCardEnhancement — Wrapper that adds guided path awareness
 * to ResumeBuilderMenu module cards.
 */

import { motion } from 'framer-motion'
import type { GuidedStepKey } from '../../types/guidedPath'
import { useGuidedPath } from '../../contexts/GuidedPathContext'

interface ModuleCardEnhancementProps {
  stepKey: GuidedStepKey
  children: React.ReactNode
}

export default function ModuleCardEnhancement({ stepKey, children }: ModuleCardEnhancementProps) {
  const { isGuidedMode, nextStep, stepStatuses } = useGuidedPath()

  if (!isGuidedMode) return <>{children}</>

  const isRecommended = nextStep?.step_key === stepKey
  const statusInfo = stepStatuses[stepKey]
  const completionPct = statusInfo?.completion_pct ?? 0

  return (
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Recommended badge */}
      {isRecommended && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            zIndex: 10,
            background: '#0E4B2B',
            color: '#fff',
            fontSize: 10,
            fontWeight: 600,
            padding: '3px 8px',
            borderRadius: 6,
            boxShadow: '0 2px 6px rgba(31,91,170,0.3)',
          }}
        >
          Next Step
        </motion.div>
      )}

      {/* Pulsing border for recommended card */}
      <motion.div
        animate={isRecommended ? {
          boxShadow: [
            '0 0 0 0 rgba(14,75,43,0)',
            '0 0 0 3px rgba(14,75,43,0.15)',
            '0 0 0 0 rgba(14,75,43,0)',
          ],
        } : {}}
        transition={isRecommended ? { duration: 2.5, repeat: Infinity } : {}}
        style={{
          borderRadius: 14,
          border: isRecommended ? '2px solid #0E4B2B' : undefined,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </motion.div>

      {/* Completion overlay */}
      {completionPct > 0 && completionPct < 100 && (
        <div style={{
          position: 'absolute',
          bottom: 8,
          left: 8,
          right: 8,
          height: 3,
          background: '#E5E7EB',
          borderRadius: 2,
          overflow: 'hidden',
          zIndex: 5,
        }}>
          <div style={{
            width: `${completionPct}%`,
            height: '100%',
            background: '#0E4B2B',
            borderRadius: 2,
            transition: 'width 0.5s ease',
          }} />
        </div>
      )}
    </div>
  )
}
