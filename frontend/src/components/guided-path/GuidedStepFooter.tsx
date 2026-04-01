/**
 * GuidedStepFooter — Subtle "Continue to Next Step" bar.
 * Appears at the bottom of step pages when the step is complete and guided mode is active.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, SkipForward } from 'lucide-react'
import { STEP_DISPLAY_CONFIG } from '../../constants/guidedPath'
import type { GuidedStepKey } from '../../types/guidedPath'

interface GuidedStepFooterProps {
  isVisible: boolean
  nextStepName: string | null
  nextStepKey: GuidedStepKey | null
  onContinue: () => void
  onSkip?: () => void
}

export default function GuidedStepFooter({
  isVisible,
  nextStepName,
  nextStepKey,
  onContinue,
  onSkip,
}: GuidedStepFooterProps) {
  const config = nextStepKey ? STEP_DISPLAY_CONFIG[nextStepKey] : null

  return (
    <AnimatePresence>
      {isVisible && nextStepName && (
        <motion.div
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'sticky',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: 'linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))',
            paddingTop: 24,
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            background: '#fff',
            borderTop: '1px solid #E5E7EB',
            borderRadius: '14px 14px 0 0',
            boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#10B981',
              }} />
              <span style={{
                fontSize: 13,
                color: '#6B7280',
                fontFamily: 'DM Sans, sans-serif',
              }}>
                Next: <strong style={{ color: '#374151' }}>{nextStepName}</strong>
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {onSkip && (
                <button
                  onClick={onSkip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: 'transparent',
                    color: '#9CA3AF',
                    fontSize: 12,
                    cursor: 'pointer',
                  }}
                >
                  <SkipForward size={12} />
                  Skip
                </button>
              )}
              <button
                onClick={onContinue}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#1F5BAA',
                  color: '#fff',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Continue
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
