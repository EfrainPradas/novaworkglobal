/**
 * GuidedModeToggle — Switch to enable/disable guided mode.
 * Placed in the right panel.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useGuidedPath } from '../../contexts/GuidedPathContext'

export default function GuidedModeToggle() {
  const { isGuidedMode, enable, disable, isLoading } = useGuidedPath()
  const [confirming, setConfirming] = useState(false)

  const handleToggle = async () => {
    if (isGuidedMode) {
      // Show confirmation before disabling
      setConfirming(true)
      return
    }
    await enable()
  }

  const handleConfirmDisable = async () => {
    setConfirming(false)
    await disable()
  }

  return (
    <div
      style={{
        padding: '14px 16px',
        borderRadius: 12,
        background: isGuidedMode
          ? 'linear-gradient(135deg, #EFF6FF 0%, #F0F9FF 100%)'
          : '#F9FAFB',
        border: isGuidedMode ? '1px solid #BFDBFE' : '1px solid #E5E7EB',
        marginBottom: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={18} style={{ color: isGuidedMode ? '#1F5BAA' : '#9CA3AF' }} />
          <div>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'Montserrat, sans-serif',
              color: isGuidedMode ? '#1F5BAA' : '#374151',
            }}>
              Smart Guide
            </div>
            <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.3 }}>
              {isGuidedMode ? 'Step-by-step resume builder' : 'Get guided through your resume'}
            </div>
          </div>
        </div>

        {/* Toggle switch */}
        <button
          onClick={handleToggle}
          disabled={isLoading}
          aria-label={isGuidedMode ? 'Disable Smart Guide' : 'Enable Smart Guide'}
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            border: 'none',
            cursor: isLoading ? 'wait' : 'pointer',
            background: isGuidedMode ? '#1F5BAA' : '#D1D5DB',
            position: 'relative',
            transition: 'background 0.2s',
            flexShrink: 0,
          }}
        >
          <motion.div
            animate={{ x: isGuidedMode ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            style={{
              width: 20,
              height: 20,
              borderRadius: '50%',
              background: '#fff',
              position: 'absolute',
              top: 2,
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </button>
      </div>

      {/* Disable confirmation */}
      {confirming && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          style={{ marginTop: 12, overflow: 'hidden' }}
        >
          <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 8, lineHeight: 1.4 }}>
            Your progress is saved. You can re-enable the guide anytime to continue where you left off.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleConfirmDisable}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: '1px solid #D1D5DB',
                background: '#fff',
                color: '#374151',
                cursor: 'pointer',
              }}
            >
              Turn Off
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                flex: 1,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 500,
                borderRadius: 6,
                border: 'none',
                background: '#1F5BAA',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              Keep On
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
