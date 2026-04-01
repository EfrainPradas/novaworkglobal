/**
 * StepStatusIndicator — Visual status badge for a guided path step.
 *
 * States: completed (green check), in_progress (blue pulse), available (gray),
 *         blocked (lock), skipped (skip), not_started (empty circle)
 */

import { motion } from 'framer-motion'
import { Check, Lock, SkipForward } from 'lucide-react'
import type { GuidedStepStatus } from '../../types/guidedPath'

interface StepStatusIndicatorProps {
  status: GuidedStepStatus | null
  size?: 'sm' | 'md' | 'lg'
}

const SIZES = { sm: 16, md: 24, lg: 32 }
const ICON_SIZES = { sm: 10, md: 14, lg: 18 }

export default function StepStatusIndicator({ status, size = 'md' }: StepStatusIndicatorProps) {
  const px = SIZES[size]
  const iconPx = ICON_SIZES[size]

  const base: React.CSSProperties = {
    width: px,
    height: px,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }

  if (status === 'completed') {
    return (
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        style={{ ...base, background: '#10B981', color: '#fff' }}
      >
        <Check size={iconPx} strokeWidth={3} />
      </motion.div>
    )
  }

  if (status === 'in_progress') {
    return (
      <motion.div
        animate={{ boxShadow: ['0 0 0 0 rgba(31,91,170,0.4)', '0 0 0 6px rgba(31,91,170,0)', '0 0 0 0 rgba(31,91,170,0)'] }}
        transition={{ duration: 2, repeat: Infinity }}
        style={{ ...base, background: '#1F5BAA', border: '2px solid #1F5BAA' }}
      >
        <div style={{ width: iconPx * 0.5, height: iconPx * 0.5, borderRadius: '50%', background: '#fff' }} />
      </motion.div>
    )
  }

  if (status === 'blocked') {
    return (
      <div style={{ ...base, background: '#E5E7EB', color: '#9CA3AF' }}>
        <Lock size={iconPx} strokeWidth={2.5} />
      </div>
    )
  }

  if (status === 'skipped') {
    return (
      <div style={{ ...base, background: '#FEF3C7', color: '#D97706' }}>
        <SkipForward size={iconPx} strokeWidth={2.5} />
      </div>
    )
  }

  if (status === 'available') {
    return (
      <div style={{ ...base, background: '#fff', border: '2px solid #D1D5DB' }}>
        <div style={{ width: iconPx * 0.4, height: iconPx * 0.4, borderRadius: '50%', background: '#D1D5DB' }} />
      </div>
    )
  }

  // not_started or null
  return (
    <div style={{ ...base, background: '#F3F4F6', border: '2px solid #E5E7EB' }} />
  )
}
