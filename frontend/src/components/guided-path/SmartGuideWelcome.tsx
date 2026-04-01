/**
 * SmartGuideWelcome — First-time modal asking the user if they want
 * to activate the Smart Guide. Shows once per user (persisted in localStorage).
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ArrowRight, X, CheckCircle, MapPin, Star } from 'lucide-react'
import { useGuidedPath } from '../../contexts/GuidedPathContext'
import { enableGuidedMode as apiEnableDirect } from '../../services/guidedPath.service'
import { STEP_ROUTE_MAP, GUIDED_PATH_STORAGE_KEY } from '../../constants/guidedPath'

const WELCOME_DISMISSED_KEY = 'smart_guide_welcome_dismissed'

interface SmartGuideWelcomeProps {
  userId: string | null
}

export default function SmartGuideWelcome({ userId }: SmartGuideWelcomeProps) {
  const navigate = useNavigate()
  const { isGuidedMode, state, isLoading, refreshState } = useGuidedPath()
  const [visible, setVisible] = useState(false)
  const [activating, setActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Show modal when userId becomes available and not previously dismissed
  useEffect(() => {
    if (!userId || isLoading) return
    // Don't show if guided mode is already active
    if (isGuidedMode || (state?.has_active_run && state?.run?.guidance_enabled)) return
    const dismissed = localStorage.getItem(`${WELCOME_DISMISSED_KEY}_${userId}`)
    if (!dismissed) {
      setVisible(true)
    }
  }, [userId, isLoading, isGuidedMode, state])

  if (!visible) return null

  const handleEnable = async () => {
    setActivating(true)
    setError(null)
    try {
      await apiEnableDirect()
      localStorage.setItem(GUIDED_PATH_STORAGE_KEY, 'true')
      localStorage.setItem(`${WELCOME_DISMISSED_KEY}_${userId}`, 'true')
      navigate(STEP_ROUTE_MAP.profile_basic_info)
      setVisible(false)
      refreshState().catch(() => {})
    } catch (err: any) {
      console.error('[SmartGuideWelcome] Failed to enable:', err)
      setError(err?.message || 'Failed to activate Smart Guide. Please try again.')
      setActivating(false)
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(`${WELCOME_DISMISSED_KEY}_${userId}`, 'true')
    setVisible(false)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              background: '#fff',
              borderRadius: 20,
              maxWidth: 480,
              width: '92%',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
            }}
          >
            {/* Header gradient */}
            <div style={{
              background: 'linear-gradient(135deg, #1F5BAA 0%, #2563EB 50%, #4DA8DA 100%)',
              padding: '32px 28px 24px',
              position: 'relative',
            }}>
              {/* Close button */}
              <button
                onClick={handleDismiss}
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'rgba(255,255,255,0.7)',
                }}
                aria-label="Close"
              >
                <X size={16} />
              </button>

              <div style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}>
                <Sparkles size={26} color="#fff" />
              </div>

              <h2 style={{
                fontSize: 22,
                fontWeight: 700,
                fontFamily: 'Montserrat, sans-serif',
                color: '#fff',
                margin: 0,
                marginBottom: 6,
              }}>
                Welcome to Smart Guide
              </h2>
              <p style={{
                fontSize: 14,
                color: 'rgba(255,255,255,0.8)',
                margin: 0,
                lineHeight: 1.5,
              }}>
                Build your professional resume step by step with our intelligent assistant.
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '24px 28px' }}>
              {/* Benefits */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <MapPin size={18} style={{ color: '#1F5BAA' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      Guided step-by-step process
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                      We'll walk you through each section so nothing gets missed.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <CheckCircle size={18} style={{ color: '#10B981' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      Smart progress tracking
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                      See what's done, what's next, and pick up where you left off.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Star size={18} style={{ color: '#EF4444' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                      Flexible — go at your own pace
                    </div>
                    <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.4 }}>
                      Skip steps, jump around, or follow the recommended order. It's up to you.
                    </div>
                  </div>
                </div>
              </div>

              {/* Error message */}
              {error && (
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: 13,
                  marginBottom: 16,
                  lineHeight: 1.4,
                }}>
                  {error}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <button
                  onClick={handleEnable}
                  disabled={activating}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '13px 20px',
                    borderRadius: 12,
                    border: 'none',
                    background: '#1F5BAA',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                    cursor: activating ? 'wait' : 'pointer',
                    opacity: activating ? 0.7 : 1,
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  {activating ? (
                    <>Activating...</>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Start Smart Guide
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                <button
                  onClick={handleDismiss}
                  style={{
                    width: '100%',
                    padding: '11px 20px',
                    borderRadius: 12,
                    border: '1px solid #E5E7EB',
                    background: '#fff',
                    color: '#6B7280',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                  }}
                >
                  I'll explore on my own
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
