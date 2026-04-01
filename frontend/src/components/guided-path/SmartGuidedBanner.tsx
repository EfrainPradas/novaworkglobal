/**
 * SmartGuidedBanner — "Continue where you left off" banner.
 * Shown at the top of the dashboard when guided mode is active.
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, X, Sparkles } from 'lucide-react'
import { useGuidedPath } from '../../contexts/GuidedPathContext'
import { STEP_DISPLAY_CONFIG, STEP_ROUTE_MAP } from '../../constants/guidedPath'
import type { GuidedStepKey } from '../../types/guidedPath'

export default function SmartGuidedBanner() {
  const { isGuidedMode, nextStep, overallCompletionPct, isPathComplete } = useGuidedPath()
  const navigate = useNavigate()
  const [dismissed, setDismissed] = useState(false)

  if (!isGuidedMode || isPathComplete || !nextStep?.step_key || dismissed) return null

  const stepKey = nextStep.step_key as GuidedStepKey
  const config = STEP_DISPLAY_CONFIG[stepKey]
  const route = STEP_ROUTE_MAP[stepKey] || nextStep.route_path
  const Icon = config?.icon

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -20, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        style={{
          background: 'linear-gradient(135deg, #1F5BAA 0%, #2563EB 50%, #4DA8DA 100%)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 16,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background accent */}
        <div style={{
          position: 'absolute',
          top: -30,
          right: -30,
          width: 120,
          height: 120,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              {Icon ? <Icon size={20} color="#fff" /> : <Sparkles size={20} color="#fff" />}
            </div>

            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.75)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: 2,
              }}>
                Continue your resume
              </div>
              <div style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#fff',
                fontFamily: 'Montserrat, sans-serif',
              }}>
                {config?.title || nextStep.display_name}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mini progress */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
                {overallCompletionPct}%
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)' }}>
                complete
              </div>
            </div>

            <button
              onClick={() => route && navigate(route)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#fff',
                color: '#1F5BAA',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Continue
              <ArrowRight size={14} />
            </button>

            <button
              onClick={() => setDismissed(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255,255,255,0.5)',
                cursor: 'pointer',
                padding: 4,
              }}
              aria-label="Dismiss banner"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Micro progress bar */}
        <div style={{
          height: 3,
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 2,
          marginTop: 12,
          overflow: 'hidden',
        }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${overallCompletionPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{ height: '100%', background: 'rgba(255,255,255,0.6)', borderRadius: 2 }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
