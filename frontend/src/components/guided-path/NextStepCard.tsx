/**
 * NextStepCard — "Next Best Action" card for the dashboard.
 * Shows the recommended next step with a CTA.
 */

import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, SkipForward } from 'lucide-react'
import { useGuidedPath } from '../../contexts/GuidedPathContext'
import { STEP_DISPLAY_CONFIG, STEP_ROUTE_MAP } from '../../constants/guidedPath'
import type { GuidedStepKey } from '../../types/guidedPath'

const REASON_LABELS: Record<string, string> = {
  first_step: 'Let\'s start building your resume',
  next_in_sequence: 'Next step in your journey',
  incomplete_prior: 'Pick up where you left off',
  path_complete: 'Almost there!',
}

export default function NextStepCard() {
  const { isGuidedMode, nextStep, isPathComplete, skipStepAndAdvance } = useGuidedPath()
  const navigate = useNavigate()

  if (!isGuidedMode || isPathComplete || !nextStep?.step_key) return null

  const stepKey = nextStep.step_key as GuidedStepKey
  const config = STEP_DISPLAY_CONFIG[stepKey]
  const route = STEP_ROUTE_MAP[stepKey] || nextStep.route_path
  const Icon = config?.icon
  const reason = REASON_LABELS[nextStep.reason] || 'Recommended next'

  const handleSkip = async () => {
    const result = await skipStepAndAdvance(stepKey, 'user_skipped_from_dashboard')
    if (result.next_step_route) {
      navigate(result.next_step_route)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      style={{
        background: '#fff',
        borderRadius: 14,
        border: '1px solid #E5E7EB',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Reason label */}
      <div style={{
        fontSize: 11,
        fontWeight: 600,
        color: '#1F5BAA',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: 14,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
      }}>
        <div style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: '#1F5BAA',
        }} />
        {reason}
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Icon */}
        {Icon && (
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: config.bgColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Icon size={24} style={{ color: config.color }} />
          </div>
        )}

        <div style={{ flex: 1 }}>
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            fontFamily: 'Montserrat, sans-serif',
            color: '#111827',
            margin: 0,
            marginBottom: 4,
          }}>
            {config?.title || nextStep.display_name}
          </h3>
          <p style={{
            fontSize: 13,
            color: '#6B7280',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {config?.description}
          </p>

          {/* Tips */}
          {config?.tips && config.tips.length > 0 && (
            <ul style={{
              margin: '10px 0 0',
              padding: '0 0 0 18px',
              fontSize: 12,
              color: '#9CA3AF',
              lineHeight: 1.6,
            }}>
              {config.tips.slice(0, 2).map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 14,
        borderTop: '1px solid #F3F4F6',
      }}>
        <button
          onClick={handleSkip}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: 'transparent',
            border: 'none',
            color: '#9CA3AF',
            fontSize: 12,
            cursor: 'pointer',
            padding: '4px 0',
          }}
        >
          <SkipForward size={12} />
          Skip this step
        </button>

        <button
          onClick={() => route && navigate(route)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 8,
            border: 'none',
            background: '#1F5BAA',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {nextStep.reason === 'incomplete_prior' ? 'Continue' : 'Start'}
          <ArrowRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}
